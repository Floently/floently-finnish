# YKI Bank Runtime Compatibility Report

## Runtime Readers Checked
- `apps/backend/api/routes/yki_exam.py`
- `apps/backend/api/routes/yki_practice.py`
- `apps/backend/services/yki_service.py`
- `apps/backend/yki/runtime.py`
- `apps/backend/adapters/yki_engine_adapter.py`

## Findings

### 1. Exam Overview Reader
- Failure class: wrong file path assumption
- Symptom:
  - `GET /api/v1/yki-exam/overview?level_band=B1-B2` -> `500`
- Root cause:
  - reader expected `certified_bank/pool_index.json`
  - actual file is `certified_bank/metadata/pool_index.json`
- Status:
  - repaired in code

### 2. Practice Reader
- `POST /api/v1/yki-practice/start` uses the canonical `task_index_v3_2.json`
- It had the same stale pool-index fallback list, but current start/session paths do not depend on `_pool_index()`
- Status:
  - aligned to the real canonical pool-index path

### 3. Full Exam Runtime
- `POST /api/v1/yki/sessions` does not read the bank directly
- It calls:
  - `apps/backend/services/yki_service.py`
  - `apps/backend/yki/runtime.py`
  - `apps/backend/adapters/yki_engine_adapter.py`
- That chain depends on `SETTINGS.yki_engine_base_url`

## Engine Compatibility Finding
- Default configured engine base URL:
  - `http://localhost:8010`
- Also observed legacy alternative in shadow config:
  - `http://127.0.0.1:8181`
- Validation:
  - both were unreachable locally during audit
- Conclusion:
  - full exam start failure is an engine/runtime availability issue, not a bank issue

## Runtime Compatibility Verdict
- Canonical bank: compatible
- Overview/practice readers: compatible after path repair
- Full exam runtime: blocked by engine availability
