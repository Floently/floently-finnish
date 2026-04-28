# YKI Bank Forensic Audit Report

Canonical bank verdict: `HEALTHY BUT RUNTIME WIRING BROKEN`

Root cause class: `runtime wiring problem`

## Executive Verdict
- The canonical certified YKI bank is structurally present and internally coherent.
- The canonical authority is the combination of:
  - `apps/backend/materials/yki/certified_bank/`
  - `apps/backend/materials/yki/certified_bank/manifest.json`
  - `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
  - `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
- The exam overview failure was caused by runtime code reading the wrong pool index path.
- The full exam start `503` is a separate engine availability/configuration problem, not a bank-integrity failure.

## Key Evidence
- `task_index_v3_2.json` contains `9706` entries.
- Manifest level counts match the runtime index exactly:
  - `A1_A2`: `2092`
  - `B1_B2`: `3882`
  - `C1_C2`: `3732`
- The real pool index exists at:
  - `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
- Before repair, these runtime readers were looking for the wrong path:
  - `apps/backend/api/routes/yki_exam.py`
  - `apps/backend/api/routes/yki_practice.py`
- Verified local engine availability:
  - `http://localhost:8010/health` unreachable
  - `http://127.0.0.1:8181/health` unreachable

## Immediate Runtime Conclusions
- `GET /api/v1/yki-exam/overview` was failing because of stale `pool_index.json` path assumptions.
- `POST /api/v1/yki/sessions` is failing because the configured YKI engine is unavailable, not because the certified bank is empty.
- `POST /api/v1/yki-practice/start` returns `200` at backend level and, after the same path repair, reads the same canonical bank successfully.

## Repair Performed
- Updated YKI readers to include the real canonical pool index path:
  - `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`

## Remaining Open Issue
- Full exam runtime still depends on the external engine behind `SETTINGS.yki_engine_base_url`.
- Until that engine is running and healthy, exam session start will continue to fail with `503`.
