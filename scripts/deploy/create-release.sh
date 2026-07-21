#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] [--release-name <name>] [--commit <sha>]

Create a new release directory on the server and upload the committed
HEAD archive. Local, ignored and uncommitted files are never deployed.

$(usage_common)
EOF
}

release_name=""
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
    --release-name)
      require_option_value "$1" "$#" "${2:-}"
      release_name="$2"
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

require_cmd ssh
require_cmd tar
require_cmd node
repo_dir="$(repo_root)"

if [[ -z "${release_commit}" ]]; then
  release_commit="$(git -C "${repo_dir}" rev-parse HEAD)"
fi
require_commit_sha "${release_commit}"
git -C "${repo_dir}" cat-file -e "${release_commit}^{commit}" \
  || fail "Commit is not available locally: ${release_commit}"
package_version="$(
  git -C "${repo_dir}" show "${release_commit}:package.json" \
  | node -e "const fs=require('fs'); process.stdout.write(JSON.parse(fs.readFileSync(0,'utf8')).version)"
)"
[[ "${package_version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || fail "Invalid package version in release commit"
created_at="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

if [[ -z "${release_name}" ]]; then
  release_name="$(generate_release_name)"
fi

release_path="$(release_path_from_name "${release_name}")"
require_release_path "${release_path}"

info "Creating release ${release_path}"
git -C "${repo_dir}" archive --format=tar.gz "${release_commit}" \
| ssh_run "set -e
rel='${release_path}'
test ! -e \"\${rel}\" || {
  echo 'Release path already exists' >&2
  exit 1
}
mkdir \"\${rel}\"
trap 'rm -rf \"\${rel}\"' ERR
tar -xzf - -C \"\${rel}\"
test -f '${APP_DIR}/.env' || {
  echo 'Active production .env is missing' >&2
  exit 1
}
cp '${APP_DIR}/.env' \"\${rel}/.env\"
chmod 600 \"\${rel}/.env\"
cat > \"\${rel}/RELEASE_METADATA\" <<'METADATA'
commit=${release_commit}
version=${package_version}
created_at=${created_at}
build_platform=${BUILD_PLATFORM}
build_image=${BUILD_NODE_IMAGE}
METADATA
chmod 644 \"\${rel}/RELEASE_METADATA\"
trap - ERR
printf '%s\n' \"\${rel}\"
"
