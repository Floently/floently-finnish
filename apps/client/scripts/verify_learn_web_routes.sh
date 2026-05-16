#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${1:-https://learn.floently.com}"
ROUTES=(
  "/"
  "/privacy"
  "/privacy-policy"
  "/terms"
  "/terms-of-use"
  "/support"
  "/account-deletion"
  "/delete-account"
  "/legal/privacy-policy"
  "/legal/terms-of-use"
  "/legal/account-deletion"
  "/learn/privacy"
  "/learn/privacy-policy"
  "/learn/terms"
  "/learn/terms-of-use"
  "/learn/support"
  "/learn/account-deletion"
  "/learn/delete-account"
)

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

  echo "OK   $url"
done
