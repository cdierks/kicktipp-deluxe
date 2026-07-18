#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] [--migrate] [--release-name <name>]

Run the standard production deploy path:
check -> create release -> upload standalone build -> validate runtime -> optional migrate and switch -> smoke verify -> functional verify

Cleanup remains a separate explicit step via cleanup.sh.

$(usage_common)
EOF
}

run_migrate=0
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
    --migrate)
      run_migrate=1
      shift
      ;;
    --release-name)
      release_name="$2"
      shift 2
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

common_args=(
  --host "${DEPLOY_HOST}"
  --user "${DEPLOY_USER}"
  --app-dir "${APP_DIR}"
  --releases-dir "${RELEASES_DIR}"
  --service "${SERVICE_NAME}"
  --domain "${DOMAIN}"
  --local-port "${LOCAL_PORT}"
)

info "Deploy configuration"
print_config

info "Step 1/7: preflight checks"
bash "${SCRIPT_DIR}/check.sh" "${common_args[@]}"

info "Step 2/7: create release"
create_args=("${common_args[@]}")
if [[ -n "${release_name}" ]]; then
  create_args+=(--release-name "${release_name}")
fi
release_path="$(bash "${SCRIPT_DIR}/create-release.sh" "${create_args[@]}" | tail -n 1)"
require_release_path "${release_path}"
info "Release created: ${release_path}"

info "Step 3/7: build locally and upload standalone runtime"
bash "${SCRIPT_DIR}/upload-build.sh" "${common_args[@]}" --release "${release_path}"

info "Step 4/7: validate standalone runtime artifacts"
bash "${SCRIPT_DIR}/link-runtime.sh" "${common_args[@]}" --release "${release_path}"

info "Step 5/7: switch active release"
switch_args=("${common_args[@]}" --release "${release_path}")
if ((run_migrate == 1)); then
  switch_args+=(--migrate)
fi
bash "${SCRIPT_DIR}/switch.sh" "${switch_args[@]}"

info "Step 6/7: smoke verification"
bash "${SCRIPT_DIR}/verify-smoke.sh" "${common_args[@]}" --release "${release_path}"

info "Step 7/7: functional verification"
bash "${SCRIPT_DIR}/verify-functional.sh" "${common_args[@]}"

info "Deploy completed successfully"
echo "Release path: ${release_path}"
echo "Run cleanup explicitly with: bash ${SCRIPT_DIR}/cleanup.sh ..."
