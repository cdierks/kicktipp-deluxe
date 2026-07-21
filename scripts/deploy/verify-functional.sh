#!/usr/bin/env bash

set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] --release <path> [--email <email>] [--password <password>] [--admin-path <path>] [--tip-path <path>]

Run functional post-deploy verification:
- unauthenticated redirect
- credentials login and session creation
- authenticated dashboard, tip page and admin access
- one transactionally rolled-back production write
- sign-out and session teardown

Credentials must be provided through the options or VERIFY_LOGIN_EMAIL and
VERIFY_LOGIN_PASSWORD. The check never creates a production account.

$(usage_common)
EOF
}

login_email="${VERIFY_LOGIN_EMAIL:-}"
login_password="${VERIFY_LOGIN_PASSWORD:-}"
admin_path="/admin/benutzer"
tip_path="/tippen"
release_path=""

if ! parse_common_args "$@"; then
  usage
  exit 0
fi

if ((${#POSITIONAL_ARGS[@]})); then
  set -- "${POSITIONAL_ARGS[@]}"
else
  set --
fi

while (($# > 0)); do
  case "$1" in
    --email)
      require_option_value "$1" "$#" "${2:-}"
      login_email="$2"
      shift 2
      ;;
    --password)
      require_option_value "$1" "$#" "${2:-}"
      login_password="$2"
      shift 2
      ;;
    --admin-path)
      require_option_value "$1" "$#" "${2:-}"
      admin_path="$2"
      shift 2
      ;;
    --tip-path)
      require_option_value "$1" "$#" "${2:-}"
      tip_path="$2"
      shift 2
      ;;
    --release)
      require_option_value "$1" "$#" "${2:-}"
      release_path="$2"
      shift 2
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

[[ "${admin_path}" =~ ^/[A-Za-z0-9/_-]*$ ]] || fail "Invalid admin verification path"
[[ "${tip_path}" =~ ^/[A-Za-z0-9/_-]*$ ]] || fail "Invalid tip verification path"
require_release_path "${release_path}"
[[ -n "${login_email}" && -n "${login_password}" ]] \
  || fail "Provide VERIFY_LOGIN_EMAIL and VERIFY_LOGIN_PASSWORD or both CLI options"

require_cmd curl
require_cmd node
require_cmd ssh
require_cmd mktemp
require_cmd base64
require_cmd tr

cookie_jar="$(mktemp)"
body_file="$(mktemp)"
request_body_file="$(mktemp)"

cleanup() {
  rm -f "${cookie_jar}" "${body_file}" "${request_body_file}"
}
trap cleanup EXIT

write_urlencoded_form() {
  local output_file="$1"

  # Read NUL-separated key/value pairs from stdin so credentials never appear
  # in curl's process arguments. The temporary output is protected by umask.
  node -e '
    const fs = require("node:fs")
    const values = fs.readFileSync(0, "utf8").split("\0")
    if (values.at(-1) === "") values.pop()
    if (values.length % 2 !== 0) process.exit(1)
    const form = new URLSearchParams()
    for (let index = 0; index < values.length; index += 2) {
      form.append(values[index], values[index + 1])
    }
    process.stdout.write(form.toString())
  ' > "${output_file}"
}

parse_json_field() {
  local file="$1"
  local expr="$2"
  node -e "
    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const expr = process.argv[2];
    const value = expr.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), data);
    if (value === undefined) process.exit(1);
    process.stdout.write(String(value));
  " "${file}" "${expr}"
}

remote_mysql_raw() {
  local sql="$1"
  local sql_b64
  sql_b64="$(printf '%s' "${sql}" | base64 | tr -d '\n')"

  ssh "${SSH_TARGET}" \
    APP_DIR="${APP_DIR}" \
    RELEASE_PATH="${release_path}" \
    SQL_B64="${sql_b64}" \
    'bash -s' <<'REMOTE'
set -euo pipefail

rel="$(readlink -e "${APP_DIR}")"
expected="$(readlink -e "${RELEASE_PATH}")"
if [[ "${rel}" != "${expected}" ]]; then
  printf 'Active release changed during functional verification: expected %s, got %s\n' \
    "${expected}" "${rel}" >&2
  exit 1
fi
cd "${rel}"

/usr/bin/node <<'NODE'
const { readFileSync } = require('node:fs')
const { spawnSync } = require('node:child_process')
const { parse } = require('./.migration/node_modules/dotenv')

const values = parse(readFileSync('.env'))
if (!values.DATABASE_URL) throw new Error('DATABASE_URL missing in release .env')
const url = new URL(values.DATABASE_URL)
if (url.protocol !== 'mysql:' || !url.hostname || !url.username || url.pathname === '/') {
  throw new Error('DATABASE_URL is not a complete MySQL URL')
}

const sql = Buffer.from(process.env.SQL_B64, 'base64').toString('utf8')
const result = spawnSync('mysql', [
  '--batch',
  '--raw',
  '--skip-column-names',
  '-h', url.hostname,
  '-P', url.port || '3306',
  '-u', decodeURIComponent(url.username),
  decodeURIComponent(url.pathname.slice(1)),
  '-e', sql,
], {
  stdio: 'inherit',
  env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) },
})
if (result.error) throw result.error
process.exit(result.status ?? 1)
NODE
REMOTE
}

remote_mutate_app_data() {
  remote_mysql_raw "
SET @setting_key := 'deployFunctionalCheck';
SET @previous_setting := (SELECT value FROM \`AppSetting\` WHERE \`key\` = @setting_key LIMIT 1);
SET @previous_exists := EXISTS(SELECT 1 FROM \`AppSetting\` WHERE \`key\` = @setting_key);
SET @temporary_setting := DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%dT%H:%i:%sZ');

START TRANSACTION;
INSERT INTO \`AppSetting\` (\`key\`, value)
VALUES (@setting_key, @temporary_setting)
ON DUPLICATE KEY UPDATE value = VALUES(value);

SELECT
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM \`AppSetting\`
      WHERE \`key\` = @setting_key AND value = @temporary_setting
    ) THEN 'ok:appsetting-write'
    ELSE 'error:appsetting-write'
  END;
ROLLBACK;

SELECT CASE
  WHEN @previous_exists = 1 AND EXISTS (
    SELECT 1 FROM \`AppSetting\`
    WHERE \`key\` = @setting_key AND value = @previous_setting
  ) THEN 'ok:rollback'
  WHEN @previous_exists = 0 AND NOT EXISTS (
    SELECT 1 FROM \`AppSetting\` WHERE \`key\` = @setting_key
  ) THEN 'ok:rollback'
  ELSE 'error:rollback'
END;
"
}

fetch_csrf() {
  curl -sS --max-time 20 -c "${cookie_jar}" -b "${cookie_jar}" "${DOMAIN}/api/auth/csrf" > "${body_file}"
  parse_json_field "${body_file}" "csrfToken"
}

expect_status() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  [[ "${actual}" == "${expected}" ]] || fail "${label} expected HTTP ${expected}, got ${actual}"
}

info "Functional check: active release identity"
ssh_run "set -e
active=\$(readlink -e '${APP_DIR}')
expected=\$(readlink -e '${release_path}')
[ \"\${active}\" = \"\${expected}\" ] || {
  echo \"Active release mismatch: expected \${expected}, got \${active}\" >&2
  exit 1
}
"

info "Functional check: unauthenticated redirect"
unauth_dashboard_status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${DOMAIN}/dashboard")"
expect_status "Unauthenticated /dashboard" "${unauth_dashboard_status}" "307"

info "Functional check: credentials login"
csrf_token="$(fetch_csrf)"
printf '%s\0%s\0%s\0%s\0%s\0%s\0%s\0%s\0%s\0%s\0' \
  'csrfToken' "${csrf_token}" \
  'email' "${login_email}" \
  'password' "${login_password}" \
  'callbackUrl' "${DOMAIN}/dashboard" \
  'json' 'true' \
| write_urlencoded_form "${request_body_file}"
signin_status="$(
  curl -sS \
    -o "${body_file}" \
    -w '%{http_code}' \
    -c "${cookie_jar}" \
    -b "${cookie_jar}" \
    --max-time 20 \
    -X POST \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-binary "@${request_body_file}" \
    "${DOMAIN}/api/auth/callback/credentials"
)"
[[ "${signin_status}" == "200" || "${signin_status}" == "302" ]] || fail "Credentials sign-in failed with HTTP ${signin_status}"

info "Functional check: session creation"
session_status="$(curl -sS --max-time 20 -o "${body_file}" -w '%{http_code}' -b "${cookie_jar}" "${DOMAIN}/api/auth/session")"
expect_status "Session endpoint" "${session_status}" "200"
session_email="$(parse_json_field "${body_file}" "user.email" || true)"
session_email_normalized="$(printf '%s' "${session_email}" | tr '[:upper:]' '[:lower:]')"
login_email_normalized="$(printf '%s' "${login_email}" | tr '[:upper:]' '[:lower:]')"
[[ "${session_email_normalized}" == "${login_email_normalized}" ]] || fail "Authenticated session email mismatch: expected ${login_email}, got ${session_email:-<empty>}"
session_role="$(parse_json_field "${body_file}" "user.role" || true)"
[[ -n "${session_role}" ]] || fail "Authenticated session missing user.role"

info "Functional check: authenticated dashboard, tip page and admin"
dashboard_status="$(curl -sS -o /dev/null -w '%{http_code}' -b "${cookie_jar}" --max-time 20 "${DOMAIN}/dashboard")"
expect_status "Authenticated /dashboard" "${dashboard_status}" "200"
tip_status="$(curl -sS -o /dev/null -w '%{http_code}' -b "${cookie_jar}" --max-time 20 "${DOMAIN}${tip_path}")"
expect_status "Authenticated ${tip_path}" "${tip_status}" "200"
admin_status="$(curl -sS -o /dev/null -w '%{http_code}' -b "${cookie_jar}" --max-time 20 "${DOMAIN}${admin_path}")"
expect_status "Authenticated ${admin_path}" "${admin_status}" "200"

info "Functional check: rolled-back production write"
mutation_output="$(remote_mutate_app_data)"
printf '%s\n' "${mutation_output}" | grep -qx 'ok:appsetting-write'
printf '%s\n' "${mutation_output}" | grep -qx 'ok:rollback'

info "Functional check: sign out"
csrf_token="$(fetch_csrf)"
printf '%s\0%s\0%s\0%s\0' \
  'csrfToken' "${csrf_token}" \
  'callbackUrl' "${DOMAIN}/login" \
| write_urlencoded_form "${request_body_file}"
signout_status="$(
  curl -sS \
    -o /dev/null \
    -w '%{http_code}' \
    -c "${cookie_jar}" \
    -b "${cookie_jar}" \
    --max-time 20 \
    -X POST \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-binary "@${request_body_file}" \
    "${DOMAIN}/api/auth/signout"
)"
[[ "${signout_status}" == "200" || "${signout_status}" == "302" ]] || fail "Sign-out failed with HTTP ${signout_status}"

session_status="$(curl -sS --max-time 20 -o "${body_file}" -w '%{http_code}' -b "${cookie_jar}" "${DOMAIN}/api/auth/session")"
expect_status "Post sign-out session endpoint" "${session_status}" "200"
session_empty="$(node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
  process.stdout.write(data && Object.keys(data).length === 0 ? 'yes' : 'no');
" "${body_file}")"
[[ "${session_empty}" == "yes" ]] || fail "Session still present after sign-out"

info "Functional verification completed"
