# YKI Bank Open Issues

## Open Issue 1
- Title: stale pool-index path in YKI overview/practice readers
- Class: runtime wiring
- Impact: exam overview crashed with `500`
- Status: repaired

## Open Issue 2
- Title: external YKI engine unavailable
- Class: runtime dependency / deployment
- Impact: `POST /api/v1/yki/sessions` returns `503`
- Evidence:
  - `localhost:8010` unreachable
  - `127.0.0.1:8181` unreachable

## Open Issue 3
- Title: canonical pool index lives under `metadata/`, not bank root
- Class: authority-chain clarity
- Impact: future readers may repeat the same mistake if they assume a root-level `pool_index.json`

## Open Issue 4
- Title: practice may still have frontend-side issues despite backend `200`
- Class: unresolved client/runtime behavior
- Impact: user-reported “does not start” is not explained by the canonical bank itself
- Next check:
  - inspect frontend practice route/state consumer after confirmed backend response payload
