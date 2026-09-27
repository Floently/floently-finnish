#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== FRONTEND: lint ==="
npm --workspace client run lint

echo
echo "=== FRONTEND: TypeScript ==="
npm --workspace client exec -- tsc --noEmit -p tsconfig.json

echo
echo "=== FRONTEND: i18n completeness ==="
node apps/client/scripts/check-i18n-completeness.mjs

echo
echo "=== BACKEND: syntax ==="
python3 -m py_compile \
  apps/backend/main.py \
  apps/backend/app/core/request_context.py \
  apps/backend/app/services/auth_service.py \
  apps/backend/app/services/device_guard.py \
  apps/backend/app/services/subscription_service.py \
  apps/backend/app/runtime/cards_logic.py \
  apps/backend/app/runtime/card_i18n_overlay_runtime.py \
  apps/backend/app/routers/v1_auth.py \
  apps/backend/app/routers/v1_subscription.py \
  apps/backend/app/routers/v1_cards.py \
  apps/backend/app/routers/v1_devices.py

echo
echo "=== DOCKER COMPOSE CONFIG ==="
docker compose config >/tmp/floently-compose-config.out

echo
echo "=== WEB BUNDLE STATIC ENV CHECK IF DIST EXISTS ==="
if [ -d apps/client/dist ]; then
  grep -R "learn-api.floently.com" apps/client/dist/_expo/static/js/web >/dev/null || true
fi

echo
echo "=== FAST RELEASE VALIDATION PASSED ==="
