#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] --release <path>

Restore the exact predeploy fallback created while switching to this release.

$(usage_common)
EOF
}

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

require_release_path "${release_path}"
require_cmd ssh
fallback_path="${APP_DIR}-predeploy-$(basename "${release_path}")"
require_safe_absolute_path "${fallback_path}" "predeploy fallback path"

info "Restoring fallback ${fallback_path}"
ssh_run "set -euo pipefail
rel='${release_path}'
fallback='${fallback_path}'
test -L '${APP_DIR}' || {
  echo 'Active app path is not a symlink' >&2
  exit 1
}
test -d \"\${rel}\" || {
  echo 'Selected release directory is missing' >&2
  exit 1
}
active=\$(readlink -e '${APP_DIR}')
expected=\$(readlink -e \"\${rel}\")
[ \"\${active}\" = \"\${expected}\" ] || {
  echo 'Refusing rollback because the selected release is no longer active' >&2
  exit 1
}
test -L \"\${fallback}\" || {
  echo 'Predeploy fallback is not a symlink' >&2
  exit 1
}
readlink -e \"\${fallback}\" >/dev/null || {
  echo 'Predeploy fallback is missing or broken' >&2
  exit 1
}
fallback_target=\$(readlink -e \"\${fallback}\")
case \"\${fallback_target}\" in
  '${RELEASES_DIR}/'*) ;;
  *) echo 'Fallback target is outside the releases directory' >&2; exit 1 ;;
esac
test -f \"\${fallback_target}/server.js\" || {
  echo 'Fallback release is missing server.js' >&2
  exit 1
}
test -f \"\${fallback_target}/.env\" || {
  echo 'Fallback release is missing .env' >&2
  exit 1
}

recover_restore() {
  trap - ERR
  echo 'Rollback operation failed; recovering the safest available app path' >&2
  if [ ! -e '${APP_DIR}' ] && [ -L '${APP_DIR}' ]; then
    rm -f '${APP_DIR}' || true
  fi
  if [ ! -e '${APP_DIR}' ] && [ ! -L '${APP_DIR}' ] && [ -L \"\${fallback}\" ]; then
    mv \"\${fallback}\" '${APP_DIR}' || true
  fi
  supervisorctl start '${SERVICE_NAME}' >/dev/null 2>&1 || true
}
trap recover_restore ERR
supervisorctl stop '${SERVICE_NAME}'
rm -f '${APP_DIR}'
mv \"\${fallback}\" '${APP_DIR}'
supervisorctl start '${SERVICE_NAME}'
sleep 5
restored_target=\$(readlink -f '${APP_DIR}')
[ \"\${restored_target}\" = \"\${fallback_target}\" ] || {
  echo 'Restored app target does not match the fallback release' >&2
  exit 1
}
supervisorctl status '${SERVICE_NAME}' | grep -q 'RUNNING'
status=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 'http://127.0.0.1:${LOCAL_PORT}/login')
[ \"\${status}\" = '200' ] || {
  echo \"Restored release login check returned HTTP \${status}\" >&2
  exit 1
}
trap - ERR
"

info "Previous release restored"
