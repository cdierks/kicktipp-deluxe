#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] --release <path>

Run the local production build and upload standalone runtime artifacts
to the given release directory.

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
require_cmd npm
require_cmd ssh
require_cmd tar
repo_dir="$(repo_root)"

info "Running local production build"
(cd "${repo_dir}" && npm run build)

info "Uploading standalone runtime artifacts to ${release_path}"
tar \
  -C "${repo_dir}/.next/standalone" \
  --exclude='.env' \
  -czf - . \
| ssh_run "set -e
rel='${release_path}'
rm -rf \"\${rel}/.next\"
rm -rf \"\${rel}/node_modules\"
rm -f \"\${rel}/server.js\"
tar -xzf - -C \"\${rel}\"
"

info "Uploading standalone static assets to ${release_path}"
tar \
  -C "${repo_dir}/.next" \
  -czf - static \
| ssh_run "set -e
rel='${release_path}'
mkdir -p \"\${rel}/.next\"
rm -rf \"\${rel}/.next/static\"
tar -xzf - -C \"\${rel}/.next\"
"
