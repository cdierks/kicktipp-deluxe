#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "${SCRIPT_DIR}/common.sh"

MIN_RELEASES=3
MIN_WORKING_PREDEPLOYS=1
MIN_APP_BACKUPS=3
MIN_DB_BACKUPS=5

usage() {
  cat <<EOF
Usage: $(basename "$0") [options] [--release <path> ...] [--predeploy <path> ...] [--app-backup <path> ...] [--db-backup <path> ...] [--npm-cache]

Remove only explicitly named old deploy artifacts.

Retention guardrails:
- keep at least ${MIN_RELEASES} releases in total
- keep at least ${MIN_WORKING_PREDEPLOYS} working predeploy fallback
- keep at least ${MIN_APP_BACKUPS} app backups
- keep at least ${MIN_DB_BACKUPS} DB backups

The active release, the newest working predeploy symlink and its target release
are protected and cannot be deleted.

$(usage_common)
EOF
}

releases=()
predeploys=()
app_backups=()
db_backups=()
remove_npm_cache=0

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
      releases+=("$2")
      shift 2
      ;;
    --predeploy)
      predeploys+=("$2")
      shift 2
      ;;
    --app-backup)
      app_backups+=("$2")
      shift 2
      ;;
    --db-backup)
      db_backups+=("$2")
      shift 2
      ;;
    --npm-cache)
      remove_npm_cache=1
      shift
      ;;
    *)
      fail "Unknown argument: $1"
      ;;
  esac
done

require_cmd ssh
require_cmd base64

if ((${#releases[@]} == 0 && ${#predeploys[@]} == 0 && ${#app_backups[@]} == 0 && ${#db_backups[@]} == 0 && remove_npm_cache == 0)); then
  fail "Nothing selected for cleanup"
fi

encode_list() {
  if (($# == 0)); then
    printf ''
  else
    printf '%s\n' "$@" | base64 | tr -d '\n'
  fi
}

info "Cleaning explicitly selected deploy artifacts with retention guards"

ssh "${SSH_TARGET}" \
  APP_DIR="${APP_DIR}" \
  RELEASES_DIR="${RELEASES_DIR}" \
  APP_NAME="${APP_NAME}" \
  DEPLOY_USER="${DEPLOY_USER}" \
  MIN_RELEASES="${MIN_RELEASES}" \
  MIN_WORKING_PREDEPLOYS="${MIN_WORKING_PREDEPLOYS}" \
  MIN_APP_BACKUPS="${MIN_APP_BACKUPS}" \
  MIN_DB_BACKUPS="${MIN_DB_BACKUPS}" \
  REMOVE_NPM_CACHE="${remove_npm_cache}" \
  RELEASES_B64="$(encode_list "${releases[@]}")" \
  PREDEPLOYS_B64="$(encode_list "${predeploys[@]}")" \
  APP_BACKUPS_B64="$(encode_list "${app_backups[@]}")" \
  DB_BACKUPS_B64="$(encode_list "${db_backups[@]}")" \
  'bash -s' <<'REMOTE'
set -euo pipefail

decode_into_array() {
  local var_name="$1"
  local dest_name="$2"
  local encoded="${!var_name:-}"

  if [[ -z "${encoded}" ]]; then
    eval "${dest_name}=()"
    return
  fi

  mapfile -t decoded < <(printf '%s' "${encoded}" | base64 -d)
  eval "${dest_name}=(\"\${decoded[@]}\")"
}

contains_path() {
  local needle="$1"
  shift || true
  local item
  for item in "$@"; do
    [[ "${item}" == "${needle}" ]] && return 0
  done
  return 1
}

count_remaining() {
  local universe_name="$1"
  local delete_name="$2"
  local count=0
  local item
  local universe_items=()
  local delete_items=()
  eval "universe_items=(\"\${${universe_name}[@]}\")"
  eval "delete_items=(\"\${${delete_name}[@]}\")"
  for item in "${universe_items[@]}"; do
    if ! contains_path "${item}" "${delete_items[@]}"; then
      count=$((count + 1))
    fi
  done
  printf '%s\n' "${count}"
}

decode_into_array RELEASES_B64 release_delete
decode_into_array PREDEPLOYS_B64 predeploy_delete
decode_into_array APP_BACKUPS_B64 app_backup_delete
decode_into_array DB_BACKUPS_B64 db_backup_delete

active_release="$(readlink -f "${APP_DIR}")"
app_parent="$(dirname "${APP_DIR}")"
app_basename="$(basename "${APP_DIR}")"
backup_dir="/home/${DEPLOY_USER}/backups"

mapfile -t all_releases < <(find "${RELEASES_DIR}" -mindepth 1 -maxdepth 1 -type d -name "${APP_NAME}-*" | sort)
mapfile -t all_predeploys < <(find "${app_parent}" -mindepth 1 -maxdepth 1 -name "${app_basename}-predeploy-*" | sort)
mapfile -t working_predeploys < <(
  for path in "${all_predeploys[@]}"; do
    if readlink -e "${path}" >/dev/null 2>&1; then
      printf '%s\n' "${path}"
    fi
  done | sort
)
mapfile -t all_app_backups < <(find "${backup_dir}" -mindepth 1 -maxdepth 1 -type f -name "${APP_NAME}-app-*.tar.gz" | sort)
mapfile -t all_db_backups < <(find "${backup_dir}" -mindepth 1 -maxdepth 1 -type f -name "${APP_NAME}-db-*.sql.gz" | sort)

latest_working_predeploy=""
latest_working_target=""
if ((${#working_predeploys[@]} > 0)); then
  latest_working_predeploy="${working_predeploys[${#working_predeploys[@]}-1]}"
  latest_working_target="$(readlink -f "${latest_working_predeploy}")"
fi

for path in "${release_delete[@]}"; do
  [[ "${path}" != "${active_release}" ]] || { echo "Refusing to delete active release: ${path}" >&2; exit 1; }
  [[ -z "${latest_working_target}" || "${path}" != "${latest_working_target}" ]] || {
    echo "Refusing to delete latest working fallback target: ${path}" >&2
    exit 1
  }
done

for path in "${predeploy_delete[@]}"; do
  [[ -z "${latest_working_predeploy}" || "${path}" != "${latest_working_predeploy}" ]] || {
    echo "Refusing to delete latest working predeploy fallback: ${path}" >&2
    exit 1
  }
done

remaining_releases="$(count_remaining all_releases release_delete)"
remaining_working_predeploys="$(count_remaining working_predeploys predeploy_delete)"
remaining_app_backups="$(count_remaining all_app_backups app_backup_delete)"
remaining_db_backups="$(count_remaining all_db_backups db_backup_delete)"

[[ "${remaining_releases}" -ge "${MIN_RELEASES}" ]] || {
  echo "Cleanup would violate release retention: ${remaining_releases} < ${MIN_RELEASES}" >&2
  exit 1
}
[[ "${remaining_working_predeploys}" -ge "${MIN_WORKING_PREDEPLOYS}" ]] || {
  echo "Cleanup would violate working predeploy retention: ${remaining_working_predeploys} < ${MIN_WORKING_PREDEPLOYS}" >&2
  exit 1
}
[[ "${remaining_app_backups}" -ge "${MIN_APP_BACKUPS}" ]] || {
  echo "Cleanup would violate app backup retention: ${remaining_app_backups} < ${MIN_APP_BACKUPS}" >&2
  exit 1
}
[[ "${remaining_db_backups}" -ge "${MIN_DB_BACKUPS}" ]] || {
  echo "Cleanup would violate DB backup retention: ${remaining_db_backups} < ${MIN_DB_BACKUPS}" >&2
  exit 1
}

for path in "${release_delete[@]}"; do
  rm -rf -- "${path}"
  printf 'Deleted release: %s\n' "${path}"
done

for path in "${predeploy_delete[@]}"; do
  rm -rf -- "${path}"
  printf 'Deleted predeploy: %s\n' "${path}"
done

for path in "${app_backup_delete[@]}"; do
  rm -f -- "${path}"
  printf 'Deleted app backup: %s\n' "${path}"
done

for path in "${db_backup_delete[@]}"; do
  rm -f -- "${path}"
  printf 'Deleted db backup: %s\n' "${path}"
done

if [[ "${REMOVE_NPM_CACHE}" == "1" ]]; then
  rm -rf -- "/home/${DEPLOY_USER}/.npm"
  printf 'Deleted npm cache: %s\n' "/home/${DEPLOY_USER}/.npm"
fi

printf 'Retention after cleanup: releases=%s working_predeploys=%s app_backups=%s db_backups=%s\n' \
  "${remaining_releases}" \
  "${remaining_working_predeploys}" \
  "${remaining_app_backups}" \
  "${remaining_db_backups}"
REMOTE
