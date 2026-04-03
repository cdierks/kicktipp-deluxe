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
        DEPLOY_HOST="$2"
        shift 2
        ;;
      --user)
        DEPLOY_USER="$2"
        shift 2
        ;;
      --app-dir)
        APP_DIR="$2"
        shift 2
        ;;
      --releases-dir)
        RELEASES_DIR="$2"
        shift 2
        ;;
      --service)
        SERVICE_NAME="$2"
        shift 2
        ;;
      --domain)
        DOMAIN="$2"
        shift 2
        ;;
      --local-port)
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
  printf '%s/%s\n' "${RELEASES_DIR}" "${name}"
}

require_release_path() {
  local release_path="${1:-}"
  [[ -n "${release_path}" ]] || fail "Missing --release <path>"
}
