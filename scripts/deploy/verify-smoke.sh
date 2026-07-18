#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] --release <path>

Run the mandatory post-deploy smoke checks on the remote host.
The active app symlink must resolve to the expected release path.

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

info "Running smoke checks on ${SSH_TARGET}"
ssh_run "set -e
rel='${release_path}'
test -d \"\${rel}\" || {
  echo 'Expected release directory missing' >&2
  exit 1
}
test -L '${APP_DIR}' || {
  echo 'Active app path is not a symlink: ${APP_DIR}' >&2
  exit 1
}
expected_release=\$(readlink -f \"\${rel}\")
active_release=\$(readlink -f '${APP_DIR}')
local_status=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 'http://127.0.0.1:${LOCAL_PORT}/login')
public_login_status=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 '${DOMAIN}/login')
signin_status=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 '${DOMAIN}/api/auth/signin')
dashboard_status=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 '${DOMAIN}/dashboard')
service_status=\$(supervisorctl status '${SERVICE_NAME}')

printf 'Active release: %s\n' \"\${active_release}\"
printf 'Expected release: %s\n' \"\${expected_release}\"
printf 'Local /login: %s\n' \"\${local_status}\"
printf 'Public /login: %s\n' \"\${public_login_status}\"
printf 'Public /api/auth/signin: %s\n' \"\${signin_status}\"
printf 'Public /dashboard: %s\n' \"\${dashboard_status}\"
printf 'Supervisor: %s\n' \"\${service_status}\"

[ \"\${active_release}\" = \"\${expected_release}\" ] || {
  echo \"Active release mismatch: expected \${expected_release}, got \${active_release}\" >&2
  exit 1
}
[ \"\${local_status}\" = '200' ]
[ \"\${public_login_status}\" = '200' ]
[ \"\${signin_status}\" != '500' ]
[ \"\${dashboard_status}\" = '307' ]
printf '%s\n' \"\${service_status}\" | grep -q 'RUNNING'
"
