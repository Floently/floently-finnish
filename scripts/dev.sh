#!/usr/bin/env bash
# Start local mobile dev environment: Metro + Android run.
# By default this uses the deployed backend (Hetzner) and does not start local backend.
# Run from repo root: bash scripts/dev.sh

set -Eeuo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOG_FILE="$REPO_ROOT/dev.log"
ANDROID_BUILD_LOG="$REPO_ROOT/dev-android-build.log"
USE_LOCAL_BACKEND="${USE_LOCAL_BACKEND:-0}"
REMOTE_API_URL="${REMOTE_API_URL:-https://learn-api.floently.com}"
LOCAL_API_URL="${LOCAL_API_URL:-http://127.0.0.1:8000}"
ANDROID_PACKAGE="${ANDROID_PACKAGE:-com.vitusidi.floentlyfinnish}"
if [[ "$USE_LOCAL_BACKEND" == "1" ]]; then
  API_BASE_URL="$LOCAL_API_URL"
else
  API_BASE_URL="$REMOTE_API_URL"
fi
touch "$LOG_FILE"

log() {
  local level="$1"
  shift
  local message="$*"
  printf '%s [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$level" "$message" | tee -a "$LOG_FILE"
}

stream_logs() {
  local source_name="$1"
  awk -v source_name="$source_name" '
    BEGIN {
      pattern = "(^Error:|\\bERROR\\b|\\bWARN\\b|\\bWARNING\\b|\\bFATAL\\b|\\bCRASH\\b|\\bUnhandled\\b|\\bException\\b|\\bTypeError\\b|\\bReferenceError\\b|\\bSyntaxError\\b|\\bFailed\\b|\\bfailed\\b|\\btimeout\\b|\\bTimeout\\b|\\bEADDRINUSE\\b|\\bunable to\\b|\\bCould not\\b|\\bCannot\\b|\\bcannot\\b|\\bAndroid Bundling failed\\b|\\bBUILD FAILED\\b|\\bINSTALL_FAILED\\b|\\bMetro error\\b|\\bNo connected devices\\b|\\bdevice offline\\b|\\bECONNREFUSED\\b|\\b503\\b|\\b500\\b)"
    }
    $0 ~ pattern {
      cmd = "date \"+%Y-%m-%d %H:%M:%S\""
      cmd | getline now
      close(cmd)
      printf "%s [%s] %s\n", now, source_name, $0
      fflush()
    }
  ' >> "$LOG_FILE"
}

cleanup() {
  local exit_code=$?
  [[ -n "${METRO_PID:-}" ]] && kill "$METRO_PID" 2>/dev/null || true
  [[ -n "${BACKEND_PID:-}" ]] && kill "$BACKEND_PID" 2>/dev/null || true
  wait "${METRO_PID:-}" "${BACKEND_PID:-}" 2>/dev/null || true
  log "INFO" "dev.sh exiting with code $exit_code"
}
trap cleanup EXIT

log "INFO" "Writing filtered crash and fault logs to $LOG_FILE"
log "INFO" "Writing full Android build output to $ANDROID_BUILD_LOG"

setup_adb_reverse() {
  adb reverse tcp:8081 tcp:8081 2>/dev/null || true
  if [[ "$USE_LOCAL_BACKEND" == "1" ]]; then
    adb reverse tcp:8000 tcp:8000 2>/dev/null || true
  fi
}

wait_for_http_ready() {
  local url="$1"
  local service_name="$2"
  local pid="$3"
  local attempts="${4:-60}"

  for ((i = 1; i <= attempts; i += 1)); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      log "INFO" "$service_name ready"
      return 0
    fi

    if ! kill -0 "$pid" 2>/dev/null; then
      log "ERROR" "$service_name process exited before becoming ready"
      return 1
    fi

    sleep 1
  done

  log "ERROR" "$service_name did not become ready at $url"
  return 1
}

monitor_dev_environment() {
  while true; do
    sleep 5

    if ! curl -fsS "http://127.0.0.1:8081/status" >/dev/null 2>&1; then
      log "WARN" "Metro status endpoint is not responding"
    fi
  done
}
if [[ "$USE_LOCAL_BACKEND" == "1" ]]; then
  log "INFO" "Starting local backend"
  source "$REPO_ROOT/venv/bin/activate"
  cd "$REPO_ROOT/apps/backend"
  uvicorn main:app --host 0.0.0.0 --port 8000 \
    > >(stream_logs "backend") \
    2> >(stream_logs "backend" >&2) &
  BACKEND_PID=$!
  wait_for_http_ready "http://127.0.0.1:8000/health" "Backend" "$BACKEND_PID"
else
  log "INFO" "Skipping local backend startup (USE_LOCAL_BACKEND=0)"
fi

log "INFO" "Starting Metro from apps/client"
cd "$REPO_ROOT/apps/client"
export EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-$API_BASE_URL}"
export EXPO_PUBLIC_AUDIO_BASE_URL="${EXPO_PUBLIC_AUDIO_BASE_URL:-$API_BASE_URL}"
log "INFO" "Using API base URL $EXPO_PUBLIC_API_BASE_URL"
npx expo start -c --port 8081 \
  > >(stream_logs "metro") \
  2> >(stream_logs "metro" >&2) &
METRO_PID=$!
wait_for_http_ready "http://127.0.0.1:8081/status" "Metro" "$METRO_PID"

log "INFO" "Setting up ADB reverse"
setup_adb_reverse
if [[ "$USE_LOCAL_BACKEND" == "1" ]]; then
  log "INFO" "ADB reverse active for 8081 and 8000"
else
  log "INFO" "ADB reverse active for 8081"
fi

ensure_debug_keystore() {
  local keystore_path="$REPO_ROOT/apps/client/android/app/debug.keystore"
  if [[ -f "$keystore_path" ]]; then
    return 0
  fi

  if ! command -v keytool >/dev/null 2>&1; then
    log "ERROR" "debug.keystore is missing and keytool is not available to generate it."
    return 1
  fi

  log "WARN" "debug.keystore not found. Generating $keystore_path"
  keytool -genkeypair \
    -v \
    -storetype PKCS12 \
    -keystore "$keystore_path" \
    -storepass android \
    -keypass android \
    -alias androiddebugkey \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -dname "CN=Android Debug,O=Android,C=US" >/dev/null
  log "INFO" "Generated debug.keystore"
}

ensure_debug_keystore

log "INFO" "Running Android build/install via npx expo run:android"

run_android_install() {
  npx expo run:android --no-bundler 2>&1 \
    | tee "$ANDROID_BUILD_LOG" \
    | stream_logs "android"
  local exit_code=${PIPESTATUS[0]}
  return "$exit_code"
}

set +e
run_android_install
ANDROID_EXIT_CODE=$?
set -e

if [[ $ANDROID_EXIT_CODE -ne 0 ]] && rg -q "INSTALL_FAILED_UPDATE_INCOMPATIBLE" "$ANDROID_BUILD_LOG"; then
  log "WARN" "Detected signature mismatch for $ANDROID_PACKAGE. Uninstalling and retrying once."
  adb uninstall "$ANDROID_PACKAGE" >/dev/null 2>&1 || true
  adb shell pm uninstall --user 0 "$ANDROID_PACKAGE" >/dev/null 2>&1 || true
  set +e
  run_android_install
  ANDROID_EXIT_CODE=$?
  set -e
fi

if [[ $ANDROID_EXIT_CODE -ne 0 ]]; then
  log "ERROR" "Android build/install failed with code $ANDROID_EXIT_CODE"
  log "ERROR" "Last 60 lines from $ANDROID_BUILD_LOG:"
  while IFS= read -r line; do
    log "ERROR" "[android-tail] $line"
  done < <(tail -n 60 "$ANDROID_BUILD_LOG")
  exit "$ANDROID_EXIT_CODE"
fi
adb wait-for-device >/dev/null 2>&1 || true
setup_adb_reverse
log "INFO" "ADB reverse refreshed after Android device became available"
if [[ "$USE_LOCAL_BACKEND" == "1" ]]; then
  log "INFO" "Verify backend with: curl -i http://127.0.0.1:8000/health"
else
  log "INFO" "Verify backend with: curl -i $EXPO_PUBLIC_API_BASE_URL/health"
fi
log "INFO" "Verify ADB reverse with: adb reverse --list"
log "INFO" "Dev environment is online. Backend and Metro will keep running until Ctrl-C."
monitor_dev_environment
