#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./config.sh
source "${SCRIPT_DIR}/config.sh"

POSITIONAL_ARGS=()

fail() {
  echo "Error: $*" >&2
  exit 1
}

info() {
  echo "==> $*"
}

require_cmd() {
  local cmd="$1"
  command -v "${cmd}" >/dev/null 2>&1 || fail "Required command not found: ${cmd}"
}

require_option_value() {
  local option="$1"
  local remaining="$2"
  local value="${3:-}"
  ((remaining >= 2)) && [[ -n "${value}" ]] || fail "Missing value for ${option}"
}

require_safe_absolute_path() {
  local value="$1"
  local label="$2"
  [[ "${value}" =~ ^/[A-Za-z0-9._/-]+$ ]] || fail "Invalid ${label}"
  [[ "${value}" != "/" && "${value}" != */ ]] || fail "Unsafe ${label}"
  [[ "${value}" != *//* && "${value}" != */./* && "${value}" != */../* ]] || fail "Unsafe ${label}"
  [[ "${value}" != */. && "${value}" != */.. ]] || fail "Unsafe ${label}"
}

repo_root() {
  require_cmd git
  git rev-parse --show-toplevel
}

ssh_run() {
  ssh "${SSH_TARGET}" "$@"
}

usage_common() {
  cat <<EOF
Common options:
  --host <host>         Override DEPLOY_HOST
  --user <user>         Override DEPLOY_USER
  --app-dir <path>      Override APP_DIR
  --releases-dir <path> Override RELEASES_DIR
  --service <name>      Override SERVICE_NAME
  --domain <url>        Override DOMAIN
  --local-port <port>   Override LOCAL_PORT
EOF
}

parse_common_args() {
  POSITIONAL_ARGS=()

  while (($# > 0)); do
    case "$1" in
      --host)
        require_option_value "$1" "$#" "${2:-}"
        DEPLOY_HOST="$2"
        shift 2
        ;;
      --user)
        require_option_value "$1" "$#" "${2:-}"
        DEPLOY_USER="$2"
        shift 2
        ;;
      --app-dir)
        require_option_value "$1" "$#" "${2:-}"
        APP_DIR="$2"
        shift 2
        ;;
      --releases-dir)
        require_option_value "$1" "$#" "${2:-}"
        RELEASES_DIR="$2"
        shift 2
        ;;
      --service)
        require_option_value "$1" "$#" "${2:-}"
        SERVICE_NAME="$2"
        shift 2
        ;;
      --domain)
        require_option_value "$1" "$#" "${2:-}"
        DOMAIN="$2"
        shift 2
        ;;
      --local-port)
        require_option_value "$1" "$#" "${2:-}"
        LOCAL_PORT="$2"
        shift 2
        ;;
      --help|-h)
        return 10
        ;;
      *)
        POSITIONAL_ARGS+=("$1")
        shift
        ;;
    esac
  done

  [[ "${APP_NAME}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || fail "Invalid app name"
  [[ "${DEPLOY_USER}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || fail "Invalid deploy user"
  [[ "${DEPLOY_HOST}" =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ ]] || fail "Invalid deploy host"
  require_safe_absolute_path "${APP_DIR}" "app directory"
  require_safe_absolute_path "${RELEASES_DIR}" "releases directory"
  [[ "${APP_DIR}" != "${RELEASES_DIR}" ]] || fail "App and releases directories must differ"
  [[ "${APP_DIR}" != "${RELEASES_DIR}/"* && "${RELEASES_DIR}" != "${APP_DIR}/"* ]] \
    || fail "App and releases directories must not contain one another"
  [[ "${SERVICE_NAME}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || fail "Invalid service name"
  [[ "${DOMAIN}" =~ ^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?$ ]] || fail "Invalid deployment domain"
  [[ "${LOCAL_PORT}" =~ ^[0-9]{1,5}$ ]] || fail "Invalid local port"
  ((10#${LOCAL_PORT} >= 1 && 10#${LOCAL_PORT} <= 65535)) || fail "Invalid local port"
  [[ "${BUILD_PLATFORM}" =~ ^linux/(amd64|arm64)$ ]] || fail "Invalid build platform"
  [[ "${BUILD_NODE_IMAGE}" =~ ^[A-Za-z0-9][A-Za-z0-9._:/@-]*$ ]] || fail "Invalid build image"

  SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"
}

print_config() {
  cat <<EOF
DEPLOY_USER=${DEPLOY_USER}
DEPLOY_HOST=${DEPLOY_HOST}
APP_NAME=${APP_NAME}
APP_DIR=${APP_DIR}
RELEASES_DIR=${RELEASES_DIR}
SERVICE_NAME=${SERVICE_NAME}
DOMAIN=${DOMAIN}
LOCAL_PORT=${LOCAL_PORT}
BUILD_PLATFORM=${BUILD_PLATFORM}
BUILD_NODE_IMAGE=${BUILD_NODE_IMAGE}
SSH_TARGET=${SSH_TARGET}
EOF
}

generate_release_name() {
  local ts
  ts="$(date +%Y%m%d-%H%M%S)"
  printf '%s-%s\n' "${APP_NAME}" "${ts}"
}

release_path_from_name() {
  local name="$1"
  [[ "${name}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || fail "Invalid release name"
  [[ "${name}" == "${APP_NAME}-"* ]] || fail "Release name must start with ${APP_NAME}-"
  printf '%s/%s\n' "${RELEASES_DIR}" "${name}"
}

require_release_path() {
  local release_path="${1:-}"
  [[ -n "${release_path}" ]] || fail "Missing --release <path>"
  require_safe_absolute_path "${release_path}" "release path"
  [[ "${release_path}" == "${RELEASES_DIR}/"* ]] || fail "Release must be below ${RELEASES_DIR}"
  [[ "$(dirname "${release_path}")" == "${RELEASES_DIR}" ]] || fail "Release must be a direct child of ${RELEASES_DIR}"
  [[ "$(basename "${release_path}")" == "${APP_NAME}-"* ]] || fail "Release name must start with ${APP_NAME}-"
}

require_commit_sha() {
  local commit="${1:-}"
  [[ "${commit}" =~ ^[0-9a-f]{40}$ ]] || fail "Commit must be a full 40-character SHA"
}
