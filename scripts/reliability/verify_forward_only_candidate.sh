#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "usage: $0 DEPLOYED_PRODUCTION_SHA CANDIDATE_SHA" >&2
  exit 64
fi

PRODUCTION_SHA="$1"
CANDIDATE_SHA="$2"

echo "=== PRODUCTION FORWARD-ONLY ANCESTRY GATE ==="
echo "production_sha=$PRODUCTION_SHA"
echo "candidate_sha=$CANDIDATE_SHA"

git cat-file -e "${PRODUCTION_SHA}^{commit}"
git cat-file -e "${CANDIDATE_SHA}^{commit}"

if git merge-base \
  --is-ancestor \
  "$PRODUCTION_SHA" \
  "$CANDIDATE_SHA"
then
  echo "PRODUCTION_ANCESTRY_GATE=PASS"
  exit 0
fi

echo "PRODUCTION_ANCESTRY_GATE=FAIL"
echo "DEPLOYMENT_ALLOWED=NO"
echo
echo "Candidate does not contain the current production lineage."
echo "Rebuild integration from the latest production head and replay only"
echo "the intended changes from the older branch."
exit 1
