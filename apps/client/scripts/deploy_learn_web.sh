#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${LEARN_WEB_HOST:-}" ]]; then
  echo "ERROR: LEARN_WEB_HOST is required, for example deploy@learn.floently.com" >&2
  exit 1
fi

if [[ -z "${LEARN_WEB_ROOT:-}" ]]; then
  echo "ERROR: LEARN_WEB_ROOT is required, for example /var/www/learn.floently.com" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLIENT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$CLIENT_DIR/dist"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
REMOTE_RELEASES_DIR="$LEARN_WEB_ROOT/releases"
REMOTE_RELEASE_DIR="$REMOTE_RELEASES_DIR/$TIMESTAMP"
REMOTE_CURRENT_LINK="$LEARN_WEB_ROOT/current"
SSH_KEY_OPTION=()
RSYNC_RSH="ssh"
BASE_URL="${LEARN_WEB_BASE_URL:-https://learn.floently.com}"

if [[ -n "${LEARN_WEB_SSH_KEY:-}" ]]; then
  SSH_KEY_OPTION=(-i "$LEARN_WEB_SSH_KEY")
  RSYNC_RSH="ssh -i $LEARN_WEB_SSH_KEY"
fi

bash "$SCRIPT_DIR/export_learn_web.sh"
node "$SCRIPT_DIR/legal_route_contract_check.mjs" --check-dist

if [[ ! -d "$DIST_DIR" ]]; then
  echo "ERROR: expected export output at $DIST_DIR" >&2
  exit 1
fi

ssh "${SSH_KEY_OPTION[@]}" "$LEARN_WEB_HOST" "mkdir -p '$REMOTE_RELEASE_DIR'"
rsync -az --delete -e "$RSYNC_RSH" "$DIST_DIR"/ "$LEARN_WEB_HOST:$REMOTE_RELEASE_DIR/"
ssh "${SSH_KEY_OPTION[@]}" "$LEARN_WEB_HOST" "ln -sfn '$REMOTE_RELEASE_DIR' '$REMOTE_CURRENT_LINK'"

bash "$SCRIPT_DIR/verify_learn_web_routes.sh" "$BASE_URL"
