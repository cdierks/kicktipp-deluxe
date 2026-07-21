#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] --release <path> [--migrate]

Switch production to the given release. With --migrate, run
production database migrations before the switch.

$(usage_common)
EOF
}

release_path=""
run_migrate=0

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
    --migrate)
      run_migrate=1
      shift
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

info "Switching active release to ${release_path}"
ssh_run "set -e
rel='${release_path}'
fallback='${fallback_path}'
moved_previous=0

test -f \"\${rel}/server.js\" || {
  echo 'Cannot switch release without standalone server.js' >&2
  exit 1
}
test -d \"\${rel}/node_modules\" || {
  echo 'Cannot switch release without standalone node_modules directory' >&2
  exit 1
}
test -d \"\${rel}/node_modules/@prisma/client\" || {
  echo 'Cannot switch release without standalone node_modules/@prisma/client' >&2
  exit 1
}
test -L '${APP_DIR}' || {
  echo 'Active app path is not a symlink' >&2
  exit 1
}
previous_release=\$(readlink -f '${APP_DIR}')
case \"\${previous_release}\" in
  '${RELEASES_DIR}/'*) ;;
  *) echo 'Active release is outside the configured releases directory' >&2; exit 1 ;;
esac
if [ -e \"\${fallback}\" ] || [ -L \"\${fallback}\" ]; then
  echo 'Predeploy fallback path already exists' >&2
  exit 1
fi

if [ ${run_migrate} -eq 1 ]; then
  cd \"\${rel}\"
  \"\${rel}/.migration/node_modules/.bin/prisma\" migrate deploy \
    --config \"\${rel}/.migration/prisma.config.ts\"
fi

rollback_switch() {
  trap - ERR
  echo 'New release failed to start; restoring previous app path' >&2
  supervisorctl stop '${SERVICE_NAME}' >/dev/null 2>&1 || true
  if [ \"\${moved_previous}\" -eq 1 ]; then
    rm -f '${APP_DIR}'
    mv \"\${fallback}\" '${APP_DIR}'
  fi
  supervisorctl start '${SERVICE_NAME}'
}
trap rollback_switch ERR

supervisorctl stop '${SERVICE_NAME}'
mv '${APP_DIR}' \"\${fallback}\"
moved_previous=1
ln -s \"\${rel}\" '${APP_DIR}'
supervisorctl start '${SERVICE_NAME}'
sleep 5
service_status=\$(supervisorctl status '${SERVICE_NAME}')
printf '%s\n' \"\${service_status}\"
printf '%s\n' \"\${service_status}\" | grep -q 'RUNNING'
trap - ERR
"
