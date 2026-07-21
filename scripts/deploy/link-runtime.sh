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
      require_option_value "$1" "$#" "${2:-}"
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
ssh_run "set -euo pipefail
rel='${release_path}'
test -d \"\${rel}\" || {
  echo 'Release directory is missing' >&2
  exit 1
}
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
test -x \"\${rel}/.migration/node_modules/.bin/prisma\" || {
  echo 'Pinned Prisma migration runtime missing' >&2
  exit 1
}
test -f \"\${rel}/.migration/prisma.config.ts\" || {
  echo 'Migration configuration missing' >&2
  exit 1
}
test -f \"\${rel}/.migration/node_modules/dotenv/package.json\" || {
  echo 'Pinned dotenv runtime for functional verification missing' >&2
  exit 1
}
test -f \"\${rel}/RELEASE_METADATA\" || {
  echo 'Release metadata missing' >&2
  exit 1
}
test -f \"\${rel}/package.json\" || {
  echo 'Release package.json missing' >&2
  exit 1
}
test -f \"\${rel}/.env\" || {
  echo 'Release .env missing' >&2
  exit 1
}
env_mode=\$(stat -c '%a' \"\${rel}/.env\")
[ \"\${env_mode}\" = '600' ] || {
  echo \"Release .env must have mode 600, got \${env_mode}\" >&2
  exit 1
}
cat \"\${rel}/RELEASE_METADATA\"
grep -Eq '^commit=[0-9a-f]{40}$' \"\${rel}/RELEASE_METADATA\" || {
  echo 'Release metadata contains an invalid commit SHA' >&2
  exit 1
}
grep -Eq '^created_at=[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' \"\${rel}/RELEASE_METADATA\" || {
  echo 'Release metadata contains an invalid creation timestamp' >&2
  exit 1
}
grep -Fx 'build_platform=${BUILD_PLATFORM}' \"\${rel}/RELEASE_METADATA\" >/dev/null || {
  echo 'Release metadata and requested build platform do not match' >&2
  exit 1
}
grep -Fx 'build_image=${BUILD_NODE_IMAGE}' \"\${rel}/RELEASE_METADATA\" >/dev/null || {
  echo 'Release metadata and requested build image do not match' >&2
  exit 1
}
expected_version=\$(/usr/bin/node -p \"require(process.argv[1]).version\" \"\${rel}/package.json\")
grep -Fx \"version=\${expected_version}\" \"\${rel}/RELEASE_METADATA\" >/dev/null || {
  echo 'Release metadata and package version do not match' >&2
  exit 1
}
test -d \"\${rel}/.next/static\" || {
  echo 'Standalone runtime is incomplete: .next/static missing' >&2
  exit 1
}
test -d \"\${rel}/public\" || {
  echo 'Standalone runtime is incomplete: public directory missing' >&2
  exit 1
}
if find \"\${rel}/node_modules\" \"\${rel}/.migration/node_modules\" -path '*darwin*' -print -quit | grep -q .; then
  echo 'Standalone runtime contains macOS-native dependencies' >&2
  exit 1
fi
case '${BUILD_PLATFORM}' in
  linux/amd64) sharp_package='sharp-linux-x64' ;;
  linux/arm64) sharp_package='sharp-linux-arm64' ;;
  *) echo 'Unsupported build platform' >&2; exit 1 ;;
esac
test -d \"\${rel}/node_modules/@img/\${sharp_package}\" || {
  echo 'Linux Sharp runtime missing from standalone artifact' >&2
  exit 1
}
cd \"\${rel}\"
migration_version=\$(
  \"\${rel}/.migration/node_modules/.bin/prisma\" version \
    --config \"\${rel}/.migration/prisma.config.ts\"
)
printf '%s\n' \"\${migration_version}\"
printf '%s\n' \"\${migration_version}\" | grep -Eq '^prisma[[:space:]]+:[[:space:]]+7\.8\.0$' || {
  echo 'Pinned Prisma migration runtime has the wrong version' >&2
  exit 1
}
"
