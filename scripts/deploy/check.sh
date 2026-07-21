#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

MAX_BACKUP_AGE_HOURS=24

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Check local prerequisites, remote host state and restorable application and
database backups no older than ${MAX_BACKUP_AGE_HOURS} hours.

$(usage_common)
EOF
}

if ! parse_common_args "$@"; then
  usage
  exit 0
fi

info "Checking local prerequisites"
require_cmd git
require_cmd ssh
require_cmd tar
require_cmd node
require_cmd npm
require_cmd curl
require_cmd docker

docker info >/dev/null

repo_dir="$(git rev-parse --show-toplevel)"
git -C "${repo_dir}" diff --check
if [[ -n "$(git -C "${repo_dir}" status --porcelain --untracked-files=all)" ]]; then
  fail "Local worktree is not clean; commit the verified release before deploying"
fi

info "Checking remote host state on ${SSH_TARGET}"
ssh "${SSH_TARGET}" \
  APP_DIR="${APP_DIR}" \
  RELEASES_DIR="${RELEASES_DIR}" \
  APP_NAME="${APP_NAME}" \
  DEPLOY_USER="${DEPLOY_USER}" \
  SERVICE_NAME="${SERVICE_NAME}" \
  LOCAL_PORT="${LOCAL_PORT}" \
  BUILD_PLATFORM="${BUILD_PLATFORM}" \
  MAX_BACKUP_AGE_HOURS="${MAX_BACKUP_AGE_HOURS}" \
  'bash -s' <<'REMOTE'
set -euo pipefail

valid_app_backup() {
  local path="$1"
  local server_entry root archive_metadata

  [[ "$(stat -c '%a' "${path}")" == "600" ]] || return 1

  # A valid application backup contains the complete standalone runtime, not
  # merely the APP_DIR symlink. Unsafe archive paths are rejected as well.
  server_entry="$(
    tar -tzf "${path}" 2>/dev/null | awk '
      $0 == "server.js" || $0 == "./server.js" { root_entry = $0; root_count += 1; next }
      $0 ~ /^[^\/]+\/server\.js$/ { named_entry = $0; named_count += 1 }
      END {
        if (root_count == 1) print root_entry
        else if (root_count == 0 && named_count == 1) print named_entry
        else exit 1
      }
    '
  )" || return 1
  root="${server_entry%server.js}"

  tar -tzf "${path}" 2>/dev/null | awk -v root="${root}" '
    BEGIN { seen = server = env = package = static = modules = metadata = 0; unsafe = 0 }
    {
      entry = $0
      if (entry == "") next
      seen = 1
      if (entry ~ /^\// || entry ~ /(^|\/)\.\.(\/|$)/) unsafe = 1
      if (entry == root "server.js") server = 1
      if (entry == root ".env") env = 1
      if (entry == root "package.json") package = 1
      if (index(entry, root ".next/static/") == 1 || entry == root ".next/static") static = 1
      if (index(entry, root "node_modules/") == 1 || entry == root "node_modules") modules = 1
      if (entry == root "RELEASE_METADATA") metadata += 1
    }
    END { exit !(seen && server && env && package && static && modules && metadata <= 1 && !unsafe) }
  ' || return 1

  if [[ -n "${root}" && "${root}" != "./" && "${root%/}" != "${ACTIVE_RELEASE_BASENAME}" ]]; then
    return 1
  fi
  if [[ -n "${ACTIVE_RELEASE_METADATA}" ]]; then
    archive_metadata="$(tar -xOzf "${path}" "${root}RELEASE_METADATA" 2>/dev/null)" || return 1
    [[ "${archive_metadata}" == "${ACTIVE_RELEASE_METADATA}" ]]
  fi
}

valid_db_backup() {
  local path="$1"

  [[ "$(stat -c '%a' "${path}")" == "600" ]] || return 1

  gzip -t "${path}" 2>/dev/null \
    && gzip -dc "${path}" 2>/dev/null | awk '
      NF { nonempty = 1 }
      /CREATE TABLE/ { schema = 1 }
      /Dump completed on/ { complete = 1 }
      END { exit !(nonempty && schema && complete) }
    '
}

is_recent_backup() {
  local path="$1"
  local now mtime max_age
  now="$(date +%s)"
  mtime="$(stat -c '%Y' "${path}")"
  max_age=$((MAX_BACKUP_AGE_HOURS * 60 * 60))

  # A small future tolerance handles a clock adjustment without accepting an
  # implausibly future-dated backup.
  ((mtime <= now + 300 && now - mtime <= max_age))
}

find_recent_valid_backup() {
  local kind="$1"
  local pattern="$2"
  local validator="$3"
  local path
  local candidates=()

  mapfile -t candidates < <(
    find "/home/${DEPLOY_USER}/backups" -mindepth 1 -maxdepth 1 -type f -name "${pattern}" -print | sort -r
  )
  for path in "${candidates[@]}"; do
    if is_recent_backup "${path}" && "${validator}" "${path}"; then
      printf 'Recent valid %s backup: %s\n' "${kind}" "${path}"
      return 0
    fi
  done

  printf 'No valid %s backup newer than %s hours found in /home/%s/backups\n' \
    "${kind}" "${MAX_BACKUP_AGE_HOURS}" "${DEPLOY_USER}" >&2
  return 1
}

for command in supervisorctl uberspace npm mysql curl tar gzip awk find stat readlink; do
  command -v "${command}" >/dev/null 2>&1 || {
    printf 'Required remote command not found: %s\n' "${command}" >&2
    exit 1
  }
done

supervisorctl status "${SERVICE_NAME}"
uberspace web backend list
/usr/bin/node -v
/usr/bin/node -e '
  const major = Number(process.versions.node.split(".")[0]);
  const minor = Number(process.versions.node.split(".")[1]);
  const supported = (major === 20 && minor >= 19)
    || (major === 22 && minor >= 12)
    || major >= 24;
  if (!supported) {
    console.error("Remote Node.js does not satisfy package engines");
    process.exit(1);
  }
'
npm -v
mysql --version

service_file="${HOME}/etc/services.d/${SERVICE_NAME}.ini"
cat "${service_file}"
grep -Fqx "command=/usr/bin/node ${APP_DIR}/server.js" "${service_file}" || {
  echo 'Remote service definition does not use the configured standalone server.js' >&2
  exit 1
}
expected_environment="environment=NODE_ENV=\"production\",PORT=\"${LOCAL_PORT}\",HOSTNAME=\"127.0.0.1\",TZ=\"Europe/Berlin\""
grep -Fqx "${expected_environment}" "${service_file}" || {
  echo 'Remote service environment does not match port, loopback binding and timezone' >&2
  exit 1
}

remote_arch="$(uname -m)"
case "${remote_arch}" in
  x86_64) remote_platform='linux/amd64' ;;
  aarch64|arm64) remote_platform='linux/arm64' ;;
  *) echo "Unsupported remote architecture: ${remote_arch}" >&2; exit 1 ;;
esac
[ "${remote_platform}" = "${BUILD_PLATFORM}" ] || {
  echo "Build platform ${BUILD_PLATFORM} does not match remote ${remote_platform}" >&2
  exit 1
}

test -L "${APP_DIR}" || {
  echo 'Active app path must be a symlink' >&2
  exit 1
}
active_release="$(readlink -e "${APP_DIR}")"
case "${active_release}" in
  "${RELEASES_DIR}/"*) ;;
  *) echo 'Active app target is outside the releases directory' >&2; exit 1 ;;
esac
test -f "${active_release}/server.js" || {
  echo 'Active release is missing server.js' >&2
  exit 1
}
ACTIVE_RELEASE_BASENAME="$(basename "${active_release}")"
ACTIVE_RELEASE_METADATA=""
if [[ -f "${active_release}/RELEASE_METADATA" ]]; then
  ACTIVE_RELEASE_METADATA="$(cat "${active_release}/RELEASE_METADATA")"
  printf '%s\n' "${ACTIVE_RELEASE_METADATA}" | grep -Eq '^commit=[0-9a-f]{40}$' || {
    echo 'Active release metadata contains an invalid commit SHA' >&2
    exit 1
  }
  printf '%s\n' "${ACTIVE_RELEASE_METADATA}" | grep -Eq '^version=[0-9]+\.[0-9]+\.[0-9]+$' || {
    echo 'Active release metadata contains an invalid version' >&2
    exit 1
  }
fi

test -d "/home/${DEPLOY_USER}/backups" || {
  echo "Backup directory is missing: /home/${DEPLOY_USER}/backups" >&2
  exit 1
}
find_recent_valid_backup 'application' "${APP_NAME}-app-*.tar.gz" valid_app_backup
find_recent_valid_backup 'database' "${APP_NAME}-db-*.sql.gz" valid_db_backup

cd "${APP_DIR}"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git status --short
else
  echo 'Remote app dir is not a git work tree; skipping git status check'
fi
REMOTE

info "Check completed"
