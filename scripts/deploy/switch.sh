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

info "Switching active release to ${release_path}"
ssh_run "set -e
rel='${release_path}'
ts=\$(date +%Y%m%d-%H%M%S)

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

if [ ${run_migrate} -eq 1 ]; then
  cd \"\${rel}\"
  npm run db:migrate
fi

supervisorctl stop '${SERVICE_NAME}'
mv '${APP_DIR}' \"${APP_DIR}-predeploy-\${ts}\"
ln -s \"\${rel}\" '${APP_DIR}'
supervisorctl start '${SERVICE_NAME}'
sleep 5
supervisorctl status '${SERVICE_NAME}'
"
