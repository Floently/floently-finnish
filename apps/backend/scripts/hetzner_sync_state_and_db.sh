#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   HETZNER_HOST=deploy@learn-api.floently.com \
#   HETZNER_SSH_KEY=$HOME/.ssh/id_ed25519 \
#   REMOTE_ROOT=/opt/floently/backend \
#   LOCAL_STATE_FILE=apps/backend/runtime/state.json \
#   LOCAL_DB_FILE=apps/backend/puhis.db \
#   bash apps/backend/scripts/hetzner_sync_state_and_db.sh

HETZNER_HOST="${HETZNER_HOST:-deploy@learn-api.floently.com}"
HETZNER_SSH_KEY="${HETZNER_SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/floently/backend}"
REMOTE_BACKEND="${REMOTE_BACKEND:-$REMOTE_ROOT/apps/backend}"
LOCAL_STATE_FILE="${LOCAL_STATE_FILE:-apps/backend/runtime/state.json}"
LOCAL_DB_FILE="${LOCAL_DB_FILE:-apps/backend/puhis.db}"

SSH="ssh -i $HETZNER_SSH_KEY -o StrictHostKeyChecking=no"

if [[ ! -f "$LOCAL_STATE_FILE" ]]; then
  echo "Missing local state file: $LOCAL_STATE_FILE" >&2
  exit 1
fi
if [[ ! -f "$LOCAL_DB_FILE" ]]; then
  echo "Missing local db file: $LOCAL_DB_FILE" >&2
  exit 1
fi

echo "==> Prepare remote paths"
$SSH "$HETZNER_HOST" "mkdir -p '$REMOTE_BACKEND/runtime' '$REMOTE_BACKEND/backups'"

timestamp="$(date +%Y%m%d-%H%M%S)"
echo "==> Backup current remote state/db (if present)"
$SSH "$HETZNER_HOST" "
if [ -f '$REMOTE_BACKEND/runtime/state.json' ]; then cp '$REMOTE_BACKEND/runtime/state.json' '$REMOTE_BACKEND/backups/state.json.$timestamp'; fi
if [ -f '$REMOTE_BACKEND/puhis.db' ]; then cp '$REMOTE_BACKEND/puhis.db' '$REMOTE_BACKEND/backups/puhis.db.$timestamp'; fi
"

echo "==> Upload local state"
scp -i "$HETZNER_SSH_KEY" -o StrictHostKeyChecking=no "$LOCAL_STATE_FILE" "$HETZNER_HOST:$REMOTE_BACKEND/runtime/state.json"

echo "==> Upload local db"
scp -i "$HETZNER_SSH_KEY" -o StrictHostKeyChecking=no "$LOCAL_DB_FILE" "$HETZNER_HOST:$REMOTE_BACKEND/puhis.db"

echo "Sync complete."
