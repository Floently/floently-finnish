# YKI Canonical Bank Runtime Paths

## Canonical Reader Paths

### Practice overview/session readers
- `apps/backend/api/routes/yki_practice.py`
  - task index candidates:
    - `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
  - pool index candidates:
    - `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
  - manifest candidates:
    - `apps/backend/materials/yki/manifest/manifest.json`

### Exam overview reader
- `apps/backend/api/routes/yki_exam.py`
  - task index candidates:
    - `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
  - pool index candidates:
    - `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
  - manifest candidates:
    - `apps/backend/materials/yki/manifest/manifest.json`

### Full exam runtime path
- `apps/backend/services/yki_service.py`
- `apps/backend/yki/runtime.py`
- `apps/backend/adapters/yki_engine_adapter.py`

This path does not load the bank files directly inside the backend process. It delegates to the external engine:
- `SETTINGS.yki_engine_base_url`

## Engine Runtime Reader Paths
- `engine/api/exam_api_v3_3.py`
- `engine/exam/exam_generator_v3_2.py`
- `engine/tools/build_task_index_v3_2.py`

These use the canonical task index rooted at:
- `apps/backend/materials/yki/task_banks/task_index_v3_2.json`

## Drift Check
- Practice and exam overview readers point to the canonical bank family.
- Engine generation also points to the canonical runtime task index.
- No hidden engine-side manifest/pool-index files were found that could silently override the canonical materials.

## Runtime Risk Still Open
- `YKI_ENGINE_RUNTIME_FIX_NOTES.md` says the adapter should fall back to in-process engine runtime if the external engine is unavailable.
- Current live `apps/backend/adapters/yki_engine_adapter.py` still raises `YKI_ENGINE_UNAVAILABLE` instead of doing that fallback.
