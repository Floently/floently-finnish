#!/usr/bin/env bash
# Pre-deploy boot gate: verifies the app can import and serve /health before Railway does.
# Usage: bash scripts/boot_gate.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

PYTHON="${PYTHON:-$(ls .venv/bin/python3 2>/dev/null || echo python3)}"

echo "--- Boot gate: import check ---"
$PYTHON -c "import sys; sys.path.insert(0, '.'); import main; print('Import OK')"

echo "--- Boot gate: HTTP health check ---"
$PYTHON -c "import asyncio, sys; sys.path.insert(0, '.'); import main; from app.routers.health import health; paths = {getattr(route, 'path', None) for route in main.app.router.routes}; assert '/health' in paths, 'health route missing'; print(asyncio.run(health()))"
