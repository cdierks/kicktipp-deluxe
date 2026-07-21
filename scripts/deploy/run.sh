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
      require_option_value "$1" "$#" "${2:-}"
      release_name="$2"
      shift 2
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

# Functional verification is mandatory. Fail before acquiring the deploy lock,
# building an artifact or applying a database migration when its credentials
# are unavailable; an application rollback cannot undo a completed migration.
[[ -n "${VERIFY_LOGIN_EMAIL:-}" && -n "${VERIFY_LOGIN_PASSWORD:-}" ]] \
  || fail "Provide VERIFY_LOGIN_EMAIL and VERIFY_LOGIN_PASSWORD before starting a deploy"

common_args=(
  --host "${DEPLOY_HOST}"
  --user "${DEPLOY_USER}"
  --app-dir "${APP_DIR}"
  --releases-dir "${RELEASES_DIR}"
  --service "${SERVICE_NAME}"
  --domain "${DOMAIN}"
  --local-port "${LOCAL_PORT}"
)

require_cmd git
require_cmd ssh
repo_dir="$(repo_root)"
release_commit="$(git -C "${repo_dir}" rev-parse HEAD)"
require_commit_sha "${release_commit}"
deploy_lock="${RELEASES_DIR}/.${APP_NAME}-deploy.lock"
deploy_token="$(date -u +%Y%m%dT%H%M%SZ)-$$"
require_safe_absolute_path "${deploy_lock}" "deploy lock path"

release_deploy_lock() {
  ssh_run "set -e
lock='${deploy_lock}'
token='${deploy_token}'
if [ -f \"\${lock}/owner\" ] && [ \"\$(cat \"\${lock}/owner\")\" = \"\${token}\" ]; then
  rm -f \"\${lock}/owner\"
  rmdir \"\${lock}\"
fi
" || echo "Warning: deploy lock could not be released: ${deploy_lock}" >&2
}

info "Acquiring remote deploy lock"
ssh_run "set -e
lock='${deploy_lock}'
if ! mkdir \"\${lock}\" 2>/dev/null; then
  echo 'Another deploy is active. Inspect the lock before removing it:' >&2
  ls -la \"\${lock}\" >&2 || true
  exit 1
fi
printf '%s\n' '${deploy_token}' > \"\${lock}/owner\"
"
trap release_deploy_lock EXIT

info "Deploy configuration"
print_config

info "Step 1/7: preflight checks"
bash "${SCRIPT_DIR}/check.sh" "${common_args[@]}"

info "Step 2/7: create release"
create_args=("${common_args[@]}" --commit "${release_commit}")
if [[ -n "${release_name}" ]]; then
  create_args+=(--release-name "${release_name}")
fi
release_path="$(bash "${SCRIPT_DIR}/create-release.sh" "${create_args[@]}" | tail -n 1)"
require_release_path "${release_path}"
info "Release created: ${release_path}"

info "Step 3/7: build locally and upload standalone runtime"
bash "${SCRIPT_DIR}/upload-build.sh" "${common_args[@]}" --release "${release_path}" --commit "${release_commit}"

info "Step 4/7: validate standalone runtime artifacts"
bash "${SCRIPT_DIR}/link-runtime.sh" "${common_args[@]}" --release "${release_path}"

info "Step 5/7: switch active release"
switch_args=("${common_args[@]}" --release "${release_path}")
if ((run_migrate == 1)); then
  switch_args+=(--migrate)
fi
bash "${SCRIPT_DIR}/switch.sh" "${switch_args[@]}"

rollback_failed_release() {
  local status="$?"
  trap - ERR
  echo "Post-switch verification failed; restoring the previous release" >&2
  bash "${SCRIPT_DIR}/restore-release.sh" "${common_args[@]}" --release "${release_path}" || {
    echo "Automatic rollback failed; manual intervention is required" >&2
  }
  exit "${status}"
}
trap rollback_failed_release ERR

info "Step 6/7: smoke verification"
bash "${SCRIPT_DIR}/verify-smoke.sh" "${common_args[@]}" --release "${release_path}"

info "Step 7/7: functional verification"
bash "${SCRIPT_DIR}/verify-functional.sh" "${common_args[@]}" --release "${release_path}"
trap - ERR

release_deploy_lock
trap - EXIT

info "Deploy completed successfully"
echo "Release path: ${release_path}"
echo "Run cleanup explicitly with: bash ${SCRIPT_DIR}/cleanup.sh ..."
