# YKI Canonical Bank Open Issues

## Open Issue 1
- Title: external YKI engine unavailable
- Class: runtime dependency
- Impact: `POST /api/v1/yki/sessions` returns `503`
- Evidence:
  - `http://localhost:8010` unreachable
  - `http://127.0.0.1:8181` unreachable

## Open Issue 2
- Title: adapter fallback from external engine to in-process engine is not present in live code
- Class: runtime implementation gap
- Evidence:
  - `docs/agents/YKI_ENGINE_RUNTIME_FIX_NOTES.md` says fallback should exist
  - live `apps/backend/adapters/yki_engine_adapter.py` still raises `YKI_ENGINE_UNAVAILABLE`

## Open Issue 3
- Title: practice-start user-visible failure is not explained by bank integrity
- Class: likely frontend/runtime UX issue
- Evidence:
  - backend `POST /api/v1/yki-practice/start` returns `200`
  - canonical bank/index coverage is healthy

## Open Issue 4
- Title: runtime readers still rely on a secondary manifest path
- Class: authority-chain clarity
- Evidence:
  - overview/practice readers use `apps/backend/materials/yki/manifest/manifest.json`
  - canonical certified manifest also exists under `certified_bank/manifest.json`
- Impact:
  - low immediate risk because the content currently matches
  - medium future drift risk if the two manifests diverge
