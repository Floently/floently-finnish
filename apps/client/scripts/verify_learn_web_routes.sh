#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-https://learn.floently.com}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mapfile -t ROUTES < <(node "$SCRIPT_DIR/legal_route_contract_check.mjs" --print-http-routes)

for route in "${ROUTES[@]}"; do
  url="${BASE_URL%/}${route}"
  status="$(curl -sS -o /tmp/floently-legal-check.html -w '%{http_code}' "$url")"
  if [[ "$status" != "200" ]]; then
    echo "FAIL $url returned HTTP $status" >&2
    exit 1
  fi

  if rg -q "Unmatched Route|Page could not be found" /tmp/floently-legal-check.html; then
    echo "FAIL $url rendered unmatched-route content" >&2
    exit 1
  fi

  case "$route" in
    "/auth/login")
      if ! rg -q "Welcome back|Forgot password|Sign in to continue" /tmp/floently-legal-check.html; then
        echo "FAIL $url did not render login page content" >&2
        exit 1
      fi
      ;;
    "/auth/register")
      if ! rg -q "Create your account|Create account|Start your Finnish journey" /tmp/floently-legal-check.html; then
        echo "FAIL $url did not render registration page content" >&2
        exit 1
      fi
      ;;
  esac

  echo "OK   $url"
done
