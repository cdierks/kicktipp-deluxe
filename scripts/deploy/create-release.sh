#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] [--release-name <name>]

Create a new release directory on the server and upload source files
without .git, .env, .next, node_modules, or tsbuildinfo artifacts.

$(usage_common)
EOF
}

release_name=""

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
    --release-name)
      release_name="$2"
      shift 2
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

require_cmd ssh
require_cmd tar
repo_dir="$(repo_root)"

if [[ -z "${release_name}" ]]; then
  release_name="$(generate_release_name)"
fi

release_path="$(release_path_from_name "${release_name}")"

info "Creating release ${release_path}"
tar \
  -C "${repo_dir}" \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.env \
  --exclude=tsconfig.tsbuildinfo \
  -czf - . \
| ssh_run "set -e
rel='${release_path}'
mkdir -p \"\${rel}\"
tar -xzf - -C \"\${rel}\"
cp '${APP_DIR}/.env' \"\${rel}/.env\"
printf '%s\n' \"\${rel}\"
"
