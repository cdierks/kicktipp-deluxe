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
      require_option_value "$1" "$#" "${2:-}"
      releases+=("$2")
      shift 2
      ;;
    --predeploy)
      require_option_value "$1" "$#" "${2:-}"
      predeploys+=("$2")
      shift 2
      ;;
    --app-backup)
      require_option_value "$1" "$#" "${2:-}"
      app_backups+=("$2")
      shift 2
      ;;
    --db-backup)
      require_option_value "$1" "$#" "${2:-}"
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

for path in "${releases[@]}"; do require_safe_absolute_path "${path}" "release cleanup path"; done
for path in "${predeploys[@]}"; do require_safe_absolute_path "${path}" "predeploy cleanup path"; done
for path in "${app_backups[@]}"; do require_safe_absolute_path "${path}" "app backup cleanup path"; done
for path in "${db_backups[@]}"; do require_safe_absolute_path "${path}" "database backup cleanup path"; done

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

valid_app_backup() {
  local path="$1"
  local server_entry root metadata_content

  [[ "$(stat -c '%a' "${path}")" == "600" ]] || return 1

  # Keep the cleanup definition aligned with check.sh: a gzip-compressed tar
  # that only contains the APP_DIR symlink is not a restorable app backup.
  server_entry="$(
    tar -tzf "${path}" 2>/dev/null | awk '
      $0 == "server.js" || $0 == "./server.js" { root_entry = $0; root_count += 1; next }
      $0 ~ /^[^\/]+\/server\.js$/ { named_entry = $0; named_count += 1 }
      END {
        if (root_count == 1) print root_entry
        else if (root_count == 0 && named_count == 1) print named_entry
        else exit 1
      }
    '
  )" || return 1
  root="${server_entry%server.js}"

  tar -tzf "${path}" 2>/dev/null | awk -v root="${root}" '
    BEGIN { seen = server = env = package = static = modules = metadata = 0; unsafe = 0 }
    {
      entry = $0
      if (entry == "") next
      seen = 1
      if (entry ~ /^\// || entry ~ /(^|\/)\.\.(\/|$)/) unsafe = 1
      if (entry == root "server.js") server = 1
      if (entry == root ".env") env = 1
      if (entry == root "package.json") package = 1
      if (index(entry, root ".next/static/") == 1 || entry == root ".next/static") static = 1
      if (index(entry, root "node_modules/") == 1 || entry == root "node_modules") modules = 1
      if (entry == root "RELEASE_METADATA") metadata += 1
    }
    END { exit !(seen && server && env && package && static && modules && metadata <= 1 && !unsafe) }
  ' || return 1

  if tar -tzf "${path}" 2>/dev/null | awk -v target="${root}RELEASE_METADATA" '
    $0 == target { found = 1 }
    END { exit !found }
  '; then
    metadata_content="$(tar -xOzf "${path}" "${root}RELEASE_METADATA" 2>/dev/null)" || return 1
    printf '%s\n' "${metadata_content}" | grep -Eq '^commit=[0-9a-f]{40}$' \
      && printf '%s\n' "${metadata_content}" | grep -Eq '^version=[0-9]+\.[0-9]+\.[0-9]+$'
  fi
}

valid_db_backup() {
  local path="$1"

  [[ "$(stat -c '%a' "${path}")" == "600" ]] || return 1

  gzip -t "${path}" 2>/dev/null \
    && gzip -dc "${path}" 2>/dev/null | awk '
      NF { nonempty = 1 }
      /CREATE TABLE/ { schema = 1 }
      /Dump completed on/ { complete = 1 }
      END { exit !(nonempty && schema && complete) }
    '
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
mapfile -t all_predeploys < <(find "${app_parent}" -mindepth 1 -maxdepth 1 -type l -name "${app_basename}-predeploy-*" | sort)
mapfile -t working_predeploys < <(
  for path in "${all_predeploys[@]}"; do
    target="$(readlink -f "${path}")"
    if [[ "${target}" == "${RELEASES_DIR}/"* && -f "${target}/server.js" ]]; then
      printf '%s\n' "${path}"
    fi
  done | sort
)
mapfile -t discovered_app_backups < <(
  find "${backup_dir}" -mindepth 1 -maxdepth 1 -type f -name "${APP_NAME}-app-*.tar.gz" | sort
)
mapfile -t discovered_db_backups < <(
  find "${backup_dir}" -mindepth 1 -maxdepth 1 -type f -name "${APP_NAME}-db-*.sql.gz" | sort
)
mapfile -t valid_app_backups < <(
  find "${backup_dir}" -mindepth 1 -maxdepth 1 -type f -name "${APP_NAME}-app-*.tar.gz" -print0 \
  | while IFS= read -r -d '' path; do
      if valid_app_backup "${path}"; then
        printf '%s\n' "${path}"
      fi
    done \
  | sort
)
mapfile -t valid_db_backups < <(
  find "${backup_dir}" -mindepth 1 -maxdepth 1 -type f -name "${APP_NAME}-db-*.sql.gz" -print0 \
  | while IFS= read -r -d '' path; do
      if valid_db_backup "${path}"; then
        printf '%s\n' "${path}"
      fi
    done \
  | sort
)

latest_working_predeploy=""
latest_working_target=""
if ((${#working_predeploys[@]} > 0)); then
  latest_working_predeploy="${working_predeploys[${#working_predeploys[@]}-1]}"
  latest_working_target="$(readlink -f "${latest_working_predeploy}")"
fi

# Every deletion target must be one of the artifacts discovered above. The
# retention math is not a substitute for proving membership before rm.
for path in "${release_delete[@]}"; do
  contains_path "${path}" "${all_releases[@]}" || { echo "Unknown release: ${path}" >&2; exit 1; }
done
for path in "${predeploy_delete[@]}"; do
  contains_path "${path}" "${all_predeploys[@]}" || { echo "Unknown predeploy: ${path}" >&2; exit 1; }
done
for path in "${app_backup_delete[@]}"; do
  contains_path "${path}" "${discovered_app_backups[@]}" || { echo "Unknown app backup: ${path}" >&2; exit 1; }
done
for path in "${db_backup_delete[@]}"; do
  contains_path "${path}" "${discovered_db_backups[@]}" || { echo "Unknown database backup: ${path}" >&2; exit 1; }
done

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
remaining_app_backups="$(count_remaining valid_app_backups app_backup_delete)"
remaining_db_backups="$(count_remaining valid_db_backups db_backup_delete)"

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
