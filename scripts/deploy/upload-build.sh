#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] --release <path> [--commit <sha>]

Build the committed release in a Linux container and upload the standalone
runtime plus its pinned migration toolchain.

$(usage_common)
EOF
}

release_path=""
release_commit=""

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
    --commit)
      require_option_value "$1" "$#" "${2:-}"
      release_commit="$2"
      shift 2
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

require_release_path "${release_path}"
require_cmd docker
require_cmd git
require_cmd mktemp
require_cmd ssh
require_cmd tar
repo_dir="$(repo_root)"
build_root="$(mktemp -d)"
build_source="${build_root}/source"
if [[ -z "${release_commit}" ]]; then
  release_commit="$(git -C "${repo_dir}" rev-parse HEAD)"
fi
require_commit_sha "${release_commit}"
git -C "${repo_dir}" cat-file -e "${release_commit}^{commit}" \
  || fail "Commit is not available locally: ${release_commit}"

cleanup_build() {
  [[ -n "${build_root}" && -d "${build_root}" ]] && rm -rf "${build_root}"
}
trap cleanup_build EXIT

mkdir "${build_source}"
git -C "${repo_dir}" archive --format=tar "${release_commit}" | tar -xf - -C "${build_source}"
test -f "${repo_dir}/.env" || fail "Local .env is required for the production build"
cp "${repo_dir}/.env" "${build_source}/.env"

info "Building ${release_commit} for ${BUILD_PLATFORM} with ${BUILD_NODE_IMAGE}"
docker run --rm \
  --platform "${BUILD_PLATFORM}" \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/npm-home \
  -e npm_config_cache=/tmp/npm-cache \
  -v "${build_source}:/workspace" \
  -w /workspace \
  "${BUILD_NODE_IMAGE}" \
  sh -eu -c '
    npm ci
    npm run build
    npm ci --prefix scripts/deploy/migration-runtime
  '

info "Uploading standalone runtime artifacts to ${release_path}"
tar \
  -C "${build_source}/.next/standalone" \
  --exclude='.env' \
  -czf - . \
| ssh_run "set -e
rel='${release_path}'
grep -Fx 'commit=${release_commit}' \"\${rel}/RELEASE_METADATA\" >/dev/null || {
  echo 'Release source and build commit do not match' >&2
  exit 1
}
rm -rf \"\${rel}/.next\"
rm -rf \"\${rel}/node_modules\"
rm -f \"\${rel}/server.js\"
tar -xzf - -C \"\${rel}\"
"

info "Uploading pinned Prisma migration runtime to ${release_path}"
tar \
  -C "${build_source}/scripts/deploy/migration-runtime" \
  -czf - package.json package-lock.json prisma.config.ts node_modules \
| ssh_run "set -e
rel='${release_path}'
rm -rf \"\${rel}/.migration\"
mkdir \"\${rel}/.migration\"
tar -xzf - -C \"\${rel}/.migration\"
"
