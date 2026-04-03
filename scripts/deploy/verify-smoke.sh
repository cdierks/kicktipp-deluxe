#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Run the mandatory post-deploy smoke checks on the remote host.

$(usage_common)
EOF
}

if ! parse_common_args "$@"; then
  usage
  exit 0
fi

require_cmd ssh

info "Running smoke checks on ${SSH_TARGET}"
ssh_run "set -e
local_status=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 'http://127.0.0.1:${LOCAL_PORT}/login')
public_login_status=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 '${DOMAIN}/login')
signin_status=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 '${DOMAIN}/api/auth/signin')
dashboard_status=\$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 '${DOMAIN}/dashboard')
service_status=\$(supervisorctl status '${SERVICE_NAME}')

printf 'Local /login: %s\n' \"\${local_status}\"
printf 'Public /login: %s\n' \"\${public_login_status}\"
printf 'Public /api/auth/signin: %s\n' \"\${signin_status}\"
printf 'Public /dashboard: %s\n' \"\${dashboard_status}\"
printf 'Supervisor: %s\n' \"\${service_status}\"

[ \"\${local_status}\" = '200' ]
[ \"\${public_login_status}\" = '200' ]
[ \"\${signin_status}\" != '500' ]
[ \"\${dashboard_status}\" = '307' ]
printf '%s\n' \"\${service_status}\" | grep -q 'RUNNING'
"
