#!/usr/bin/env bash
# Deploy floently backend to Hetzner.
# Run from anywhere:  bash apps/backend/scripts/deploy.sh
# Or from backend dir: bash scripts/deploy.sh

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
SERVER="deploy@learn-api.floently.com"
SSH_KEY="$HOME/.ssh/id_ed25519"
CONTAINER="floently-test"
IMAGE="floently-backend:latest"
REMOTE_BACKEND="~/backend"
REMOTE_DATA="~/data"
HEALTH_URL="https://learn-api.floently.com/health"
LOCAL_ENV_FILE="${DEPLOY_ENV_FILE:-}"

# Resolve backend root regardless of where the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

SSH="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"
# ─────────────────────────────────────────────────────────────────────────────

echo "━━━ Floently backend deploy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Source : $BACKEND_DIR"
echo "Target : $SERVER:$REMOTE_BACKEND"
echo "Image  : $IMAGE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── 1. Sync code ──────────────────────────────────────────────────────────────
echo ""
echo "[1/4] Syncing code..."
rsync -az --delete \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.env' \
  --exclude='puhis.db' \
  --exclude='runtime/' \
  --exclude='uploads/' \
  --exclude='logs/' \
  --exclude='cache/' \
  -e "$SSH" \
  "$BACKEND_DIR/" \
  "$SERVER:$REMOTE_BACKEND/"
echo "     Code synced."

if [[ -n "$LOCAL_ENV_FILE" ]]; then
  if [[ ! -f "$LOCAL_ENV_FILE" ]]; then
    echo "ERROR: DEPLOY_ENV_FILE does not exist: $LOCAL_ENV_FILE" >&2
    exit 1
  fi
  echo "     Syncing env file from $LOCAL_ENV_FILE"
  scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$LOCAL_ENV_FILE" "$SERVER:$REMOTE_BACKEND/.env"
elif ! $SSH "$SERVER" "test -f $REMOTE_BACKEND/.env"; then
  echo "ERROR: remote env file missing at $REMOTE_BACKEND/.env and DEPLOY_ENV_FILE was not provided." >&2
  exit 1
fi

# ── 2. Build image ────────────────────────────────────────────────────────────
echo ""
echo "[2/4] Building Docker image on server..."
$SSH "$SERVER" "cd $REMOTE_BACKEND && docker build -t $IMAGE . 2>&1 | tail -8"
echo "     Image built."

# ── 3. Save state, swap container ────────────────────────────────────────────
echo ""
echo "[3/4] Replacing container..."
$SSH "$SERVER" "
  mkdir -p $REMOTE_DATA
  # Snapshot current state.json if it's only inside the container (no volume yet)
  if docker inspect $CONTAINER &>/dev/null && ! [ -f $REMOTE_DATA/state.json ]; then
    docker exec $CONTAINER cat /app/runtime/state.json > $REMOTE_DATA/state.json 2>/dev/null && echo '     Saved state.json from old container.' || true
  fi
  # Snapshot current sqlite db if it only exists inside container yet.
  if docker inspect $CONTAINER &>/dev/null && ! [ -f $REMOTE_DATA/puhis.db ]; then
    docker exec $CONTAINER cat /app/puhis.db > $REMOTE_DATA/puhis.db 2>/dev/null && echo '     Saved puhis.db from old container.' || true
  fi
  touch $REMOTE_DATA/puhis.db
  docker stop $CONTAINER 2>/dev/null || true
  docker rm   $CONTAINER 2>/dev/null || true
  docker run -d \
    --name $CONTAINER \
    --restart unless-stopped \
    -p 8080:8080 \
    --env-file $REMOTE_BACKEND/.env \
    -e STATE_STORE_PATH=/data/state.json \
    -v $REMOTE_DATA:/data \
    -v $REMOTE_DATA/puhis.db:/app/puhis.db \
    $IMAGE
  echo '     Container started.'
"

# ── 4. Health check ───────────────────────────────────────────────────────────
echo ""
echo "[4/4] Health check ($HEALTH_URL)..."
for i in $(seq 1 15); do
  sleep 2
  if curl -sf "$HEALTH_URL" >/dev/null 2>&1; then
    echo "     Passed after $((i * 2))s."
    echo ""
    echo "━━━ Deploy complete ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    curl -s "$HEALTH_URL"
    echo ""
    exit 0
  fi
  echo "     Waiting... (${i}/15)"
done

echo ""
echo "ERROR: health check did not pass within 30s." >&2
$SSH "$SERVER" "docker logs $CONTAINER --tail 40" >&2
exit 1
