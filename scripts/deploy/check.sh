#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]

Check local prerequisites and basic remote host state.

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

git rev-parse --show-toplevel >/dev/null

info "Checking remote host state on ${SSH_TARGET}"
ssh_run "set -e
supervisorctl status '${SERVICE_NAME}'
uberspace web backend list
node -v
npm -v
mysql --version
cat ~/etc/services.d/${SERVICE_NAME}.ini
grep -q '/server.js' ~/etc/services.d/${SERVICE_NAME}.ini || {
  echo 'Remote service definition does not use standalone server.js' >&2
  exit 1
}
cd '${APP_DIR}'
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git status --short
else
  echo 'Remote app dir is not a git work tree; skipping git status check'
fi
"

info "Check completed"
