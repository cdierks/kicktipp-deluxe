#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] --release <path>

Validate that the release already contains standalone runtime artifacts.

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

info "Validating standalone runtime artifacts for ${release_path}"
ssh_run "set -e
rel='${release_path}'
test -f \"\${rel}/server.js\" || {
  echo 'Standalone entrypoint missing: server.js' >&2
  exit 1
}
test -d \"\${rel}/node_modules\" || {
  echo 'Standalone runtime is incomplete: node_modules directory missing' >&2
  exit 1
}
test -d \"\${rel}/node_modules/@prisma/client\" || {
  echo 'Standalone runtime is incomplete: node_modules/@prisma/client missing' >&2
  exit 1
}
test -d \"\${rel}/.next/static\" || {
  echo 'Standalone runtime is incomplete: .next/static missing' >&2
  exit 1
}
"
