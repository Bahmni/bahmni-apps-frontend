#!/bin/bash

# =============================================================================
# Bahmni Apps Frontend - Developer CLI
# =============================================================================

# ---------------------------------------------------------------------------
# CONFIGURABLE PATHS - overridden by .bahmni-cli.conf if present
# ---------------------------------------------------------------------------
STANDARD_CONFIG_PATH="<ADD PATH HERE>"  # e.g. "../standard-config"
BAHMNI_DOCKER_PATH="<ADD PATH HERE>"    # e.g. "../bahmni-docker"
APPS_DIR="apps"                             # directory containing app modules
EXCLUDE_APPS="sample-app-module"            # comma-separated app dirs to skip

# Load user-specific path overrides (auto-created on first custom path entry)
CLI_CONF_FILE=".bahmni-cli.conf"
if [[ -f "$CLI_CONF_FILE" ]]; then
  source "$CLI_CONF_FILE"
fi

# Auto-discover app modules from apps/*/package.json
APP_DIRS=()
APP_NAMES=()
APP_DISPLAY=()
for app_dir in "${APPS_DIR}"/*/; do
  dir_name=$(basename "$app_dir")
  # Skip excluded apps
  if echo ",$EXCLUDE_APPS," | grep -q ",$dir_name,"; then
    continue
  fi
  pkg_file="${app_dir}package.json"
  if [[ -f "$pkg_file" ]]; then
    nx_name=$(grep '"name"' "$pkg_file" | head -1 | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\(.*\)".*/\1/')
    if [[ -n "$nx_name" ]]; then
      APP_DIRS+=("$dir_name")
      APP_NAMES+=("$nx_name")
      # Display name: capitalize first letter of dir name
      first_char=$(echo "${dir_name:0:1}" | tr '[:lower:]' '[:upper:]')
      display="${first_char}${dir_name:1}"
      APP_DISPLAY+=("$display")
    fi
  fi
done

# ---------------------------------------------------------------------------
# ANSI Color codes
# ---------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; return 0; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; return 0; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; return 0; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; return 1; }

elapsed() {
  local seconds=$1
  local mins=$(( seconds / 60 ))
  local secs=$(( seconds % 60 ))
  if [[ "$mins" -gt 0 ]]; then
    echo "${mins}m ${secs}s"
  else
    echo "${secs}s"
  fi
  return 0
}

run_timed() {
  # Usage: run_timed "description" command [args...]
  local desc="$1"; shift
  info "Starting: ${desc}"
  local start
  start=$(date +%s)
  "$@"
  local status=$?
  local end
  end=$(date +%s)
  local took
  took=$(elapsed $(( end - start )))
  if [[ $status -eq 0 ]]; then
    success "Done: ${desc} (took ${took})"
  else
    error "Failed: ${desc} (took ${took})"
  fi
  return $status
}

pause() {
  echo ""
  echo -e "${YELLOW}Press Enter to return to the menu...${RESET}"
  read -r
  return 0
}

# Shows a sub-menu of app modules and runs an nx command on the selected one
# Usage: pick_app_and_run "label" "nx_target" "yarn_all_cmd" [extra_args...]
#   label       - display label (e.g. "tests", "lint")
#   nx_target   - nx target for per-module (e.g. "test", "lint")
#   yarn_all_cmd - yarn script for "All" (e.g. "test", "test:coverage", "lint")
#   extra_args  - extra flags passed to per-module nx command (e.g. "--coverage")
pick_app_and_run() {
  local title="$1"; shift
  local nx_target="$1"; shift
  local yarn_all_cmd="$1"; shift
  local extra_args=("$@")

  echo -e "  ${CYAN}1)${RESET} All Modules"
  echo -e "  ${CYAN}2)${RESET} Specific Module"
  echo -e "  ${CYAN}3)${RESET} Specific File"
  echo -e "  ${CYAN}0)${RESET} Back"
  echo ""
  read -rp "Choose an option: " sub
  if [[ "$sub" = "0" ]]; then
    return
  fi

  # --- All Modules ---
  if [[ "$sub" = "1" ]]; then
    run_timed "All ${title}" yarn "${yarn_all_cmd}"
    return
  fi

  # --- Specific Module ---
  if [[ "$sub" = "2" ]]; then
    echo ""
    echo -e "  ${BOLD}Select module:${RESET}"
    local i=1
    for display in "${APP_DISPLAY[@]}"; do
      echo -e "  ${CYAN}${i})${RESET} ${display}"
      (( i++ ))
    done
    echo -e "  ${CYAN}0)${RESET} Back"
    echo ""
    read -rp "Choose module: " mod_choice
    if [[ "$mod_choice" = "0" ]]; then
      return
    fi

    # Run specific module
    local mod_idx=$(( mod_choice - 1 ))
    if [[ "$mod_idx" -ge 0 && "$mod_idx" -lt "${#APP_NAMES[@]}" ]]; then
      local project="${APP_NAMES[$mod_idx]}"
      local label="${APP_DISPLAY[$mod_idx]}"
      run_timed "${label} ${title}" npx nx "${nx_target}" "${project}" "${extra_args[@]}"
    else
      warn "Invalid option: ${mod_choice}"
    fi
    return
  fi

  # --- Specific File ---
  if [[ "$sub" = "3" ]]; then
    echo ""
    read -rp "Enter file path (relative to repo root): " file_path
    if [[ -z "$file_path" ]]; then
      warn "No file path provided."
      return
    fi
    if [[ ! -f "$file_path" ]]; then
      warn "File not found: ${file_path}"
      return
    fi
    info "Running ${title} on: ${file_path}"
    # Detect which app module the file belongs to and run via nx
    local matched_project=""
    for idx in "${!APP_DIRS[@]}"; do
      if echo "$file_path" | grep -q "^${APPS_DIR}/${APP_DIRS[$idx]}/"; then
        matched_project="${APP_NAMES[$idx]}"
        break
      fi
    done
    if [[ "$nx_target" = "lint" ]]; then
      local eslint_config=""
      if [[ -n "$matched_project" ]]; then
        eslint_config="${APPS_DIR}/${APP_DIRS[$idx]}/eslint.config.ts"
      fi
      local eslint_cmd=(npx eslint)
      if [[ -n "$eslint_config" ]]; then
        eslint_cmd+=(--config "$eslint_config")
      fi
      eslint_cmd+=("${file_path}" "${extra_args[@]}")
      "${eslint_cmd[@]}"
      if [[ $? -eq 0 ]]; then
        success "No lint errors found."
      fi
    else
      if [[ -n "$matched_project" ]]; then
        npx nx test "$matched_project" --testPathPattern="${file_path}" --verbose "${extra_args[@]}"
      else
        # Fallback for files outside apps/
        npx jest "${file_path}" --verbose "${extra_args[@]}"
      fi
    fi
    return
  fi

  warn "Invalid option: ${sub}"
}

# ---------------------------------------------------------------------------
# ASCII art header
# ---------------------------------------------------------------------------
print_header() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "  ██████╗  █████╗ ██╗  ██╗███╗   ███╗███╗   ██╗██╗"
  echo "  ██╔══██╗██╔══██╗██║  ██║████╗ ████║████╗  ██║██║"
  echo "  ██████╔╝███████║███████║██╔████╔██║██╔██╗ ██║██║"
  echo "  ██╔══██╗██╔══██║██╔══██║██║╚██╔╝██║██║╚██╗██║██║"
  echo "  ██████╔╝██║  ██║██║  ██║██║ ╚═╝ ██║██║ ╚████║██║"
  echo "  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═══╝╚═╝"
  echo -e "${RESET}"
  echo -e "${MAGENTA}${BOLD}  ╔══════════════════════════════════════════╗${RESET}"
  echo -e "${MAGENTA}${BOLD}  ║      Apps Frontend Developer CLI         ║${RESET}"
  echo -e "${MAGENTA}${BOLD}  ╚══════════════════════════════════════════╝${RESET}"
  echo ""
  return 0
}

# ---------------------------------------------------------------------------
# Validate that a configurable path exists; prompt with retry if not found
# ---------------------------------------------------------------------------
save_path_to_conf() {
  local var_name="$1"
  local value="$2"
  # Update or add the variable in .bahmni-cli.conf
  if [[ -f "$CLI_CONF_FILE" ]] && grep -q "^${var_name}=" "$CLI_CONF_FILE"; then
    # Update existing entry
    sed -i '' "s|^${var_name}=.*|${var_name}=\"${value}\"|" "$CLI_CONF_FILE"
  else
    echo "${var_name}=\"${value}\"" >> "$CLI_CONF_FILE"
  fi
  return 0
}

validate_path() {
  local label="$1"
  local var_name="$2"  # variable name: STANDARD_CONFIG_PATH or BAHMNI_DOCKER_PATH
  local path="${!var_name}"

  if [[ -d "$path" ]]; then
    return 0
  fi

  warn "Path not found for ${label}: '${path}'"

  while true; do
    read -rp "Enter the correct path for ${label} (or 'q' to cancel): " new_path
    if [[ "$new_path" = "q" || "$new_path" = "Q" ]]; then
      error "Cancelled. Cannot proceed without a valid path."
      return 1
    fi

    if [[ -z "$new_path" ]]; then
      warn "Path cannot be empty. Try again or enter 'q' to cancel."
      continue
    fi

    if [[ ! -d "$new_path" ]]; then
      warn "Path does not exist: '${new_path}'. Try again or enter 'q' to cancel."
      continue
    fi

    # Valid path found - update variable and save permanently
    eval "$var_name=\"$new_path\""
    save_path_to_conf "$var_name" "$new_path"
    success "Path saved: ${var_name}=${new_path}"
    info "Saved to ${CLI_CONF_FILE} (will persist across sessions)."
    return 0
  done
}

# ---------------------------------------------------------------------------
# 1. Build and Serve
# ---------------------------------------------------------------------------
cmd_build_and_serve() {
  echo -e "\n${BOLD}=== Build and Serve ===${RESET}\n"
  (
    set -e
    run_timed "yarn install" yarn install
    run_timed "yarn build"   yarn build
    info "Starting dev server (Ctrl+C to stop)..."
    yarn dev
  )
  local status=$?
  [[ $status -ne 0 ]] && error "Build and Serve encountered an error (exit code ${status})."
  pause
  return 0
}

# ---------------------------------------------------------------------------
# 2. Run Tests
# ---------------------------------------------------------------------------
cmd_test() {
  echo -e "\n${BOLD}=== Run Tests ===${RESET}\n"
  pick_app_and_run "tests" "test" "test"
  pause
  return 0
}

# ---------------------------------------------------------------------------
# 3. Clean Build and Serve
# ---------------------------------------------------------------------------
cmd_clean_build() {
  echo -e "\n${BOLD}=== Clean Build and Serve ===${RESET}\n"
  warn "This will delete node_modules and dist directories."
  read -rp "Are you sure? (y/N): " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    info "Cancelled."
    pause
    return
  fi
  (
    set -e
    run_timed "Remove node_modules and dist" rm -rf node_modules dist
    run_timed "Reset Nx cache"               npx nx reset
    run_timed "Clean yarn cache"             yarn cache clean
    run_timed "yarn install"                 yarn install
    run_timed "yarn build"                   yarn build
    info "Starting dev server (Ctrl+C to stop)..."
    yarn dev
  )
  local status=$?
  if [[ $status -ne 0 ]]; then
    error "Clean build and serve failed (exit code ${status})."
  fi
  pause
}

# ---------------------------------------------------------------------------
# 4. Update Standard Config
# ---------------------------------------------------------------------------
_do_update_standard_config() {
  echo -e "\n${BOLD}=== Update Standard Config ===${RESET}\n"

  validate_path "Standard Config" "STANDARD_CONFIG_PATH" || return 1

  (
    set -e
    cd "$STANDARD_CONFIG_PATH"

    local current_branch
    current_branch=$(git rev-parse --abbrev-ref HEAD)
    info "Current branch in standard-config: ${current_branch}"

    # Stash local changes (if any)
    local stash_output
    stash_output=$(git stash 2>&1)
    local stashed=false
    if echo "$stash_output" | grep -q "No local changes to save"; then
      info "No local changes to stash."
    else
      info "Stashed local changes."
      stashed=true
    fi

    # Detect default branch (master or main)
    local default_branch
    default_branch=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
    if [[ -z "$default_branch" ]]; then
      # Fallback: check if master or main exists
      if git show-ref --verify --quiet refs/heads/master; then
        default_branch="master"
      else
        default_branch="main"
      fi
    fi
    info "Default branch: ${default_branch}"

    # Switch to default branch if not already on it
    if [[ "$current_branch" != "$default_branch" ]]; then
      info "Switching to ${default_branch}..."
      git checkout "$default_branch"
    else
      info "Already on ${default_branch}."
    fi

    # Pull latest
    run_timed "git pull (standard-config ${default_branch})" git pull

    # Switch back to original branch
    if [[ "$current_branch" != "$default_branch" ]]; then
      info "Switching back to ${current_branch}..."
      git checkout "$current_branch"
    fi

    # Restore stashed changes
    if [[ "$stashed" = true ]]; then
      local pop_output
      pop_output=$(git stash pop 2>&1)
      if echo "$pop_output" | grep -qi "conflict\|error"; then
        warn "git stash pop reported issues - please review manually:"
        echo "$pop_output"
      else
        info "Stash restored successfully."
      fi
    fi
  )
  local status=$?
  if [[ $status -eq 0 ]]; then
    success "Standard config updated."
  else
    error "Standard config update failed (exit code ${status})."
  fi
  return $status
}

cmd_update_standard_config() {
  _do_update_standard_config
  pause
  return 0
}

# ---------------------------------------------------------------------------
# 5. Update Docker Images
# ---------------------------------------------------------------------------
_docker_compose_dir() {
  validate_path "Bahmni Docker" "BAHMNI_DOCKER_PATH" || return 1
  local compose_dir="${BAHMNI_DOCKER_PATH}/bahmni-standard"
  if [[ ! -d "$compose_dir" ]]; then
    error "bahmni-standard directory not found inside ${BAHMNI_DOCKER_PATH}"
    return 1
  fi
  echo "$compose_dir"
}

_docker_env_file=".env.dev"
_docker_all_profiles="--profile emr --profile bahmni-lite --profile bahmni-standard --profile bahmni-mart"

cmd_update_docker_images() {
  echo -e "\n${BOLD}=== Docker Services ===${RESET}\n"

  if ! command -v docker &>/dev/null; then
    error "Docker is not installed or not in PATH."
    pause
    return 1
  fi

  echo -e "  ${CYAN}1)${RESET} Start services"
  echo -e "  ${CYAN}2)${RESET} Stop services"
  echo -e "  ${CYAN}3)${RESET} Pull latest images"
  echo -e "  ${CYAN}4)${RESET} Pull and Start (update)"
  echo -e "  ${CYAN}5)${RESET} Status of all services"
  echo -e "  ${CYAN}6)${RESET} Restart a service"
  echo -e "  ${CYAN}7)${RESET} Show logs of a service"
  echo -e "  ${CYAN}8)${RESET} SSH into a container"
  echo -e "  ${CYAN}9)${RESET} Reset and erase ALL volumes"
  echo -e "  ${CYAN}0)${RESET} Back"
  echo ""
  read -rp "Choose an option: " docker_choice

  local compose_dir
  compose_dir=$(_docker_compose_dir) || { pause; return 1; }

  case "$docker_choice" in
    1)
      ( set -e; cd "$compose_dir"
        run_timed "docker compose up" docker compose --env-file "$_docker_env_file" up -d
      ) ;;
    2)
      ( set -e; cd "$compose_dir"
        run_timed "docker compose down" docker compose --env-file "$_docker_env_file" $_docker_all_profiles down
      ) ;;
    3)
      ( set -e; cd "$compose_dir"
        run_timed "docker compose pull" docker compose --env-file "$_docker_env_file" pull
      ) ;;
    4)
      ( set -e; cd "$compose_dir"
        run_timed "docker compose pull" docker compose --env-file "$_docker_env_file" pull
        run_timed "docker compose up"   docker compose --env-file "$_docker_env_file" up -d
      ) ;;
    5)
      ( cd "$compose_dir"
        docker compose --env-file "$_docker_env_file" $_docker_all_profiles ps
      ) ;;
    6)
      ( cd "$compose_dir"
        echo -e "\n  ${BOLD}Running services:${RESET}"
        docker compose --env-file "$_docker_env_file" ps
        echo ""
        read -rp "Enter service name to restart: " svc_name
        if [[ -n "$svc_name" ]]; then
          docker compose --env-file "$_docker_env_file" restart "$svc_name"
          success "Restarted ${svc_name}."
          read -rp "Show logs? (y/N): " show_logs
          if [[ "$show_logs" =~ ^[Yy]$ ]]; then
            docker compose --env-file "$_docker_env_file" logs "$svc_name" -f
          fi
        fi
      ) ;;
    7)
      ( cd "$compose_dir"
        echo -e "\n  ${BOLD}Running services:${RESET}"
        docker compose --env-file "$_docker_env_file" $_docker_all_profiles ps
        echo ""
        read -rp "Enter service name: " svc_name
        if [[ -n "$svc_name" ]]; then
          docker compose --env-file "$_docker_env_file" logs "$svc_name" -f
        fi
      ) ;;
    8)
      ( cd "$compose_dir"
        echo -e "\n  ${BOLD}Running services:${RESET}"
        docker compose --env-file "$_docker_env_file" $_docker_all_profiles ps
        echo ""
        read -rp "Enter service name to SSH into: " svc_name
        if [[ -n "$svc_name" ]]; then
          docker compose --env-file "$_docker_env_file" exec "$svc_name" /bin/sh
        fi
      ) ;;
    9)
      ( cd "$compose_dir"
        warn "This will DELETE all Bahmni data and volumes!"
        read -rp "Are you sure? (y/N): " confirm
        if [[ "$confirm" =~ ^[Yy]$ ]]; then
          info "Stopping all services..."
          docker compose --env-file "$_docker_env_file" $_docker_all_profiles down
          info "Deleting all volumes..."
          docker compose --env-file "$_docker_env_file" $_docker_all_profiles down -v
          success "All volumes deleted."
          echo ""
          info "Remaining volumes:"
          docker volume ls
        else
          info "Cancelled."
        fi
      ) ;;
    0) return ;;
    *) warn "Invalid option: ${docker_choice}" ;;
  esac
  pause
}

# ---------------------------------------------------------------------------
# 6. Update All
# ---------------------------------------------------------------------------
cmd_update_all() {
  echo -e "\n${BOLD}=== Update All ===${RESET}\n"
  _do_update_standard_config

  local compose_dir
  compose_dir=$(_docker_compose_dir)
  if [[ $? -eq 0 ]]; then
    (
      set -e
      cd "$compose_dir"
      run_timed "docker compose pull" docker compose --env-file "$_docker_env_file" pull
    )
    if [[ $? -eq 0 ]]; then
      success "Docker images pulled."
    else
      error "Docker pull failed."
    fi
  fi

  echo ""
  success "Update All complete."
  pause
  return 0
}

# ---------------------------------------------------------------------------
# 7. Coverage Reports
# ---------------------------------------------------------------------------
cmd_coverage() {
  echo -e "\n${BOLD}=== Coverage Reports ===${RESET}\n"
  pick_app_and_run "coverage" "test" "test:coverage" --coverage
  pause
  return 0
}

# ---------------------------------------------------------------------------
# 8. Lint Check
# ---------------------------------------------------------------------------
cmd_lint() {
  echo -e "\n${BOLD}=== Lint Check ===${RESET}\n"
  pick_app_and_run "lint" "lint" "lint"
  pause
  return 0
}

# ---------------------------------------------------------------------------
# Main menu loop
# ---------------------------------------------------------------------------
main_menu() {
  while true; do
    print_header
    echo -e "  ${BOLD}Main Menu${RESET}"
    echo ""
    echo -e "  ${CYAN}1)${RESET} Build and Serve"
    echo -e "  ${CYAN}2)${RESET} Clean Build and Serve"
    echo -e "  ${CYAN}3)${RESET} Update Standard Config"
    echo -e "  ${CYAN}4)${RESET} Docker Services"
    echo -e "  ${CYAN}5)${RESET} Update All (Config + Docker Pull)"
    echo -e "  ${CYAN}6)${RESET} Run Tests"
    echo -e "  ${CYAN}7)${RESET} Coverage Reports"
    echo -e "  ${CYAN}8)${RESET} Lint Check"
    echo -e "  ${CYAN}0)${RESET} Exit"
    echo ""
    read -rp "Choose an option: " choice
    case "$choice" in
      1) cmd_build_and_serve    ;;
      2) cmd_clean_build        ;;
      3) cmd_update_standard_config ;;
      4) cmd_update_docker_images   ;;
      5) cmd_update_all         ;;
      6) cmd_test               ;;
      7) cmd_coverage           ;;
      8) cmd_lint               ;;
      0)
        echo -e "\n${GREEN}Goodbye!${RESET}\n"
        exit 0
        ;;
      *)
        warn "Invalid option: '${choice}'. Please choose a number from the menu."
        sleep 1
        ;;
    esac
  done
  return 0
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
main_menu
