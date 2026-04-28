#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   HETZNER_HOST=deploy@learn-api.floently.com \
#   HETZNER_SSH_KEY=$HOME/.ssh/id_ed25519 \
#   DEPLOY_ENV_FILE=/path/to/prod.env \
#   bash apps/backend/scripts/hetzner_release.sh

HETZNER_HOST="${HETZNER_HOST:-deploy@learn-api.floently.com}"
HETZNER_SSH_KEY="${HETZNER_SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/floently/backend}"
REMOTE_BACKEND="${REMOTE_BACKEND:-$REMOTE_ROOT/apps/backend}"
IMAGE_NAME="${IMAGE_NAME:-floently-backend}"
CONTAINER_NAME="${CONTAINER_NAME:-floently-backend}"
HEALTH_URL="${HEALTH_URL:-https://learn-api.floently.com/health}"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
SSH="ssh -i $HETZNER_SSH_KEY -o StrictHostKeyChecking=no"

echo "==> Sync backend code to $HETZNER_HOST:$REMOTE_BACKEND"
$SSH "$HETZNER_HOST" "mkdir -p '$REMOTE_BACKEND'"
rsync -az --delete \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude '.env' \
  --exclude 'puhis.db' \
  --exclude 'runtime/' \
  --exclude 'uploads/' \
  -e "$SSH" \
  "$BACKEND_DIR/" "$HETZNER_HOST:$REMOTE_BACKEND/"

if [[ -n "$DEPLOY_ENV_FILE" ]]; then
  if [[ ! -f "$DEPLOY_ENV_FILE" ]]; then
    echo "DEPLOY_ENV_FILE does not exist: $DEPLOY_ENV_FILE" >&2
    exit 1
  fi
  scp -i "$HETZNER_SSH_KEY" -o StrictHostKeyChecking=no "$DEPLOY_ENV_FILE" "$HETZNER_HOST:$REMOTE_BACKEND/.env"
fi

echo "==> Build image on remote host"
$SSH "$HETZNER_HOST" "cd '$REMOTE_ROOT' && docker build -f 'apps/backend/Dockerfile' -t '$IMAGE_NAME:latest' ."

echo "==> Replace container"
$SSH "$HETZNER_HOST" "
mkdir -p '$REMOTE_BACKEND/runtime'
if [ ! -f '$REMOTE_BACKEND/puhis.db' ]; then
  if docker inspect '$CONTAINER_NAME' >/dev/null 2>&1; then
    docker exec '$CONTAINER_NAME' sh -c 'cat /app/puhis.db' > '$REMOTE_BACKEND/puhis.db' 2>/dev/null || true
  fi
fi
touch '$REMOTE_BACKEND/puhis.db'
docker stop '$CONTAINER_NAME' 2>/dev/null || true
docker rm '$CONTAINER_NAME' 2>/dev/null || true
docker run -d \
  --name '$CONTAINER_NAME' \
  --restart unless-stopped \
  -p 127.0.0.1:8080:8080 \
  --env-file '$REMOTE_BACKEND/.env' \
  -e STATE_STORE_PATH=/app/runtime/state.json \
  -v '$REMOTE_BACKEND/runtime:/app/runtime' \
  -v '$REMOTE_BACKEND/puhis.db:/app/puhis.db' \
  '$IMAGE_NAME:latest'
"

echo "==> Health check: $HEALTH_URL"
for i in $(seq 1 30); do
  sleep 2
  if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Release succeeded."
    exit 0
  fi
  echo "Waiting for health... ($i/30)"
done

echo "Health check failed. Last logs:"
$SSH "$HETZNER_HOST" "docker logs '$CONTAINER_NAME' --tail 120" >&2
exit 1
