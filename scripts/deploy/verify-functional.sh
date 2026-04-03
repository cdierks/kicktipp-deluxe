#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] [--email <email>] [--password <password>] [--admin-path <path>] [--tip-path <path>]

Run functional post-deploy verification:
- unauthenticated redirect
- credentials login and session creation
- authenticated dashboard, tip page and admin access
- one reversible production write on app data
- sign-out and session teardown

If no explicit verification credentials are provided, the script creates a
temporary admin user in production, logs in with it, performs the checks and
removes it again.

$(usage_common)
EOF
}

login_email="${VERIFY_LOGIN_EMAIL:-}"
login_password="${VERIFY_LOGIN_PASSWORD:-}"
admin_path="/admin/benutzer"
tip_path="/tippen"
temp_user_created=0
temp_user_id=""
temp_user_nickname=""

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
      login_email="$2"
      shift 2
      ;;
    --password)
      login_password="$2"
      shift 2
      ;;
    --admin-path)
      admin_path="$2"
      shift 2
      ;;
    --tip-path)
      tip_path="$2"
      shift 2
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

require_cmd curl
require_cmd node
require_cmd ssh
require_cmd mktemp
require_cmd python3
require_cmd base64

cookie_jar="$(mktemp)"
body_file="$(mktemp)"

cleanup() {
  if ((temp_user_created == 1)); then
    remote_delete_temp_user "${temp_user_id}" "${temp_user_nickname}" || true
  fi
  rm -f "${cookie_jar}" "${body_file}"
}
trap cleanup EXIT

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

sql_escape() {
  python3 - "$1" <<'PY'
import sys
print(sys.argv[1].replace("'", "''"))
PY
}

remote_mysql_raw() {
  local sql="$1"
  local sql_b64
  sql_b64="$(printf '%s' "${sql}" | base64)"

  ssh "${SSH_TARGET}" \
    APP_DIR="${APP_DIR}" \
    SQL_B64="${sql_b64}" \
    'bash -s' <<'REMOTE'
set -euo pipefail

rel="$(readlink -f "${APP_DIR}")"
cd "${rel}"

eval "$(
  python3 <<'PY'
from pathlib import Path
from urllib.parse import urlparse, unquote

env = {}
for raw in Path('.env').read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    key, value = line.split('=', 1)
    env[key] = value

db_url = env.get('DATABASE_URL')
if not db_url:
    raise SystemExit('DATABASE_URL missing in release .env')

parsed = urlparse(db_url)
host = parsed.hostname or '127.0.0.1'
port = parsed.port or 3306
user = unquote(parsed.username or '')
password = unquote(parsed.password or '')
database = parsed.path.lstrip('/')

print(f"DB_HOST={host!r}")
print(f"DB_PORT={port!r}")
print(f"DB_USER={user!r}")
print(f"DB_PASS={password!r}")
print(f"DB_NAME={database!r}")
PY
)"

sql="$(printf '%s' "${SQL_B64}" | base64 -d)"
MYSQL_PWD="${DB_PASS}" mysql \
  --batch \
  --raw \
  --skip-column-names \
  -h "${DB_HOST}" \
  -P "${DB_PORT}" \
  -u "${DB_USER}" \
  "${DB_NAME}" \
  -e "${sql}"
REMOTE
}

remote_delete_temp_user() {
  local user_id="$1"
  local nickname="$2"
  local escaped_user_id escaped_nickname
  escaped_user_id="$(sql_escape "${user_id}")"
  escaped_nickname="$(sql_escape "${nickname}")"

  remote_mysql_raw "
DELETE FROM \`Tip\` WHERE userId = '${escaped_user_id}';
DELETE FROM \`User\` WHERE id = '${escaped_user_id}' OR nickname = '${escaped_nickname}';
" >/dev/null
}

create_temp_verification_user() {
  local timestamp password password_hash user_id nickname email
  timestamp="$(date +%Y%m%d%H%M%S)"
  password="$(node -e "console.log(require('crypto').randomBytes(18).toString('base64url'))")"
  password_hash="$(node -e "const bcrypt=require('bcryptjs'); bcrypt.hash(process.argv[1], 12).then((hash)=>console.log(hash)).catch((error)=>{ console.error(error); process.exit(1) })" "${password}")"
  user_id="deploy-check-${timestamp}-$(node -e "console.log(require('crypto').randomBytes(4).toString('hex'))")"
  nickname="deploycheck${timestamp}"
  email="deploy-check+${timestamp}@local.invalid"

  local escaped_user_id escaped_email escaped_hash escaped_nickname
  escaped_user_id="$(sql_escape "${user_id}")"
  escaped_email="$(sql_escape "${email}")"
  escaped_hash="$(sql_escape "${password_hash}")"
  escaped_nickname="$(sql_escape "${nickname}")"

  remote_mysql_raw "
INSERT INTO \`User\` (id, email, passwordHash, name, nickname, role, createdAt, updatedAt)
VALUES (
  '${escaped_user_id}',
  '${escaped_email}',
  '${escaped_hash}',
  'Deploy Check',
  '${escaped_nickname}',
  'ADMIN',
  NOW(),
  NOW()
);
" >/dev/null

  login_email="${email}"
  login_password="${password}"
  temp_user_id="${user_id}"
  temp_user_nickname="${nickname}"
  temp_user_created=1
  info "Temporary verification user created: ${login_email}"
}

remote_mutate_app_data() {
  local escaped_email
  escaped_email="$(sql_escape "${login_email}")"

  remote_mysql_raw "
SET @user_id := (SELECT id FROM \`User\` WHERE email = '${escaped_email}' LIMIT 1);
SELECT IF(@user_id IS NULL, 'missing-user', CONCAT('user:', @user_id));
SET @match_id := (
  SELECT m.id
  FROM \`Match\` m
  INNER JOIN \`Matchday\` md ON md.id = m.matchdayId
  WHERE md.status = 'ACTIVE'
  ORDER BY m.matchDate ASC
  LIMIT 1
);
SELECT IF(@match_id IS NULL, 'fallback-appsetting', CONCAT('match:', @match_id));
SET @existing_tip_id := NULL;
SET @existing_home := NULL;
SET @existing_away := NULL;
SET @existing_joker := NULL;
SET @existing_points := NULL;
SELECT
  @existing_tip_id := id,
  @existing_home := homeScore,
  @existing_away := awayScore,
  @existing_joker := isJoker,
  @existing_points := points
FROM \`Tip\`
WHERE userId = @user_id AND matchId = @match_id
LIMIT 1;

INSERT INTO \`Tip\` (id, userId, matchId, homeScore, awayScore, isJoker, points)
SELECT
  CONCAT('deploy-tip-', REPLACE(UUID(), '-', '')),
  @user_id,
  @match_id,
  0,
  1,
  0,
  NULL
WHERE @user_id IS NOT NULL AND @match_id IS NOT NULL AND @existing_tip_id IS NULL;

UPDATE \`Tip\`
SET
  homeScore = 0,
  awayScore = IF(COALESCE(@existing_away, 0) = 98, 99, COALESCE(@existing_away, 0) + 1),
  isJoker = 0,
  points = NULL
WHERE userId = @user_id AND matchId = @match_id AND @user_id IS NOT NULL AND @match_id IS NOT NULL;

SELECT
  CASE
    WHEN @user_id IS NULL THEN 'error:missing-user'
    WHEN @match_id IS NULL THEN 'info:no-active-match'
    WHEN EXISTS (
      SELECT 1
      FROM \`Tip\`
      WHERE userId = @user_id
        AND matchId = @match_id
        AND homeScore = 0
        AND awayScore = IF(COALESCE(@existing_away, 0) = 98, 99, COALESCE(@existing_away, 0) + 1)
    ) THEN 'ok:tip'
    ELSE 'error:tip-write'
  END;

UPDATE \`Tip\`
SET
  homeScore = @existing_home,
  awayScore = @existing_away,
  isJoker = COALESCE(@existing_joker, 0),
  points = @existing_points
WHERE id = @existing_tip_id;

DELETE FROM \`Tip\`
WHERE userId = @user_id AND matchId = @match_id AND @existing_tip_id IS NULL;

SET @setting_key := 'deployFunctionalCheck';
SET @previous_setting := (SELECT value FROM \`AppSetting\` WHERE \`key\` = @setting_key LIMIT 1);
SET @temporary_setting := DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%dT%H:%i:%sZ');

INSERT INTO \`AppSetting\` (\`key\`, value)
VALUES (@setting_key, @temporary_setting)
ON DUPLICATE KEY UPDATE value = VALUES(value);

SELECT
  CASE
    WHEN @match_id IS NOT NULL THEN 'skip:appsetting'
    WHEN EXISTS (
      SELECT 1
      FROM \`AppSetting\`
      WHERE \`key\` = @setting_key AND value = @temporary_setting
    ) THEN 'ok:appsetting'
    ELSE 'error:appsetting-write'
  END;

UPDATE \`AppSetting\`
SET value = @previous_setting
WHERE \`key\` = @setting_key AND @previous_setting IS NOT NULL;

DELETE FROM \`AppSetting\`
WHERE \`key\` = @setting_key AND @previous_setting IS NULL;
"
}

fetch_csrf() {
  curl -sS -c "${cookie_jar}" -b "${cookie_jar}" "${DOMAIN}/api/auth/csrf" > "${body_file}"
  parse_json_field "${body_file}" "csrfToken"
}

expect_status() {
  local label="$1"
  local actual="$2"
  local expected="$3"
  [[ "${actual}" == "${expected}" ]] || fail "${label} expected HTTP ${expected}, got ${actual}"
}

if [[ -n "${login_email}" || -n "${login_password}" ]]; then
  [[ -n "${login_email}" && -n "${login_password}" ]] || fail "Provide both --email and --password, or neither to auto-create a temporary verification user"
else
  create_temp_verification_user
fi

info "Functional check: unauthenticated redirect"
unauth_dashboard_status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 "${DOMAIN}/dashboard")"
expect_status "Unauthenticated /dashboard" "${unauth_dashboard_status}" "307"

info "Functional check: credentials login"
csrf_token="$(fetch_csrf)"
signin_status="$(
  curl -sS \
    -o "${body_file}" \
    -w '%{http_code}' \
    -c "${cookie_jar}" \
    -b "${cookie_jar}" \
    -X POST \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=${csrf_token}" \
    --data-urlencode "email=${login_email}" \
    --data-urlencode "password=${login_password}" \
    --data-urlencode "callbackUrl=${DOMAIN}/dashboard" \
    --data-urlencode 'json=true' \
    "${DOMAIN}/api/auth/callback/credentials"
)"
[[ "${signin_status}" == "200" || "${signin_status}" == "302" ]] || fail "Credentials sign-in failed with HTTP ${signin_status}"

info "Functional check: session creation"
session_status="$(curl -sS -o "${body_file}" -w '%{http_code}' -b "${cookie_jar}" "${DOMAIN}/api/auth/session")"
expect_status "Session endpoint" "${session_status}" "200"
session_email="$(parse_json_field "${body_file}" "user.email" || true)"
[[ "${session_email}" == "${login_email}" ]] || fail "Authenticated session email mismatch: expected ${login_email}, got ${session_email:-<empty>}"
session_role="$(parse_json_field "${body_file}" "user.role" || true)"
[[ -n "${session_role}" ]] || fail "Authenticated session missing user.role"

info "Functional check: authenticated dashboard, tip page and admin"
dashboard_status="$(curl -sS -o /dev/null -w '%{http_code}' -b "${cookie_jar}" --max-time 20 "${DOMAIN}/dashboard")"
expect_status "Authenticated /dashboard" "${dashboard_status}" "200"
tip_status="$(curl -sS -o /dev/null -w '%{http_code}' -b "${cookie_jar}" --max-time 20 "${DOMAIN}${tip_path}")"
expect_status "Authenticated ${tip_path}" "${tip_status}" "200"
admin_status="$(curl -sS -o /dev/null -w '%{http_code}' -b "${cookie_jar}" --max-time 20 "${DOMAIN}${admin_path}")"
expect_status "Authenticated ${admin_path}" "${admin_status}" "200"

info "Functional check: reversible production write"
mutation_output="$(remote_mutate_app_data)"
printf '%s\n' "${mutation_output}" | grep -qx 'ok:tip\|info:no-active-match'
printf '%s\n' "${mutation_output}" | grep -qx 'skip:appsetting\|ok:appsetting'

if printf '%s\n' "${mutation_output}" | grep -qx 'ok:tip'; then
  info "Mutation path: tip"
elif printf '%s\n' "${mutation_output}" | grep -qx 'ok:appsetting'; then
  info "Mutation path: appSetting fallback"
else
  fail "Mutation verification returned unexpected output"
fi

info "Functional check: sign out"
csrf_token="$(fetch_csrf)"
signout_status="$(
  curl -sS \
    -o /dev/null \
    -w '%{http_code}' \
    -c "${cookie_jar}" \
    -b "${cookie_jar}" \
    -X POST \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "csrfToken=${csrf_token}" \
    --data-urlencode "callbackUrl=${DOMAIN}/login" \
    "${DOMAIN}/api/auth/signout"
)"
[[ "${signout_status}" == "200" || "${signout_status}" == "302" ]] || fail "Sign-out failed with HTTP ${signout_status}"

session_status="$(curl -sS -o "${body_file}" -w '%{http_code}' -b "${cookie_jar}" "${DOMAIN}/api/auth/session")"
expect_status "Post sign-out session endpoint" "${session_status}" "200"
session_empty="$(node -e "
  const fs = require('fs');
  const data = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
  process.stdout.write(data && Object.keys(data).length === 0 ? 'yes' : 'no');
" "${body_file}")"
[[ "${session_empty}" == "yes" ]] || fail "Session still present after sign-out"

info "Functional verification completed"
