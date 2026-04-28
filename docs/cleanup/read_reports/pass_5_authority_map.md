# Pass 5 Authority Map

## Governing Cleanup Inputs

- matrix used: `docs/cleanup/floently_finnish_duplication_cleanup_matrix_v2.md`
- prior-pass reports: `docs/cleanup/read_reports/pass_1_*` through `docs/cleanup/read_reports/pass_4_*`
- executed prompts: `docs/cleanup/executed_prompts/cleanup_agent_prompt_pass_1.md` through `docs/cleanup/executed_prompts/cleanup_agent_prompt_pass_5.md`

## Surviving Canonical Authorities

### YKI

- canonical repo-local materials authority:
  - `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
  - `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
  - `apps/backend/materials/yki/manifest/manifest.json`
  - `apps/backend/materials/yki/certified_bank/manifest.json`
- canonical app-owned loader boundary:
  - `apps/backend/app/services/yki_materials.py`
- canonical app router/material callers:
  - `apps/backend/app/routers/yki_exam.py`
  - `apps/backend/app/routers/yki_practice.py`
  - `apps/backend/app/routers/admin_yki.py`
- canonical external engine boundary:
  - `apps/backend/app/adapters/yki_engine_adapter.py`
  - `apps/backend/app/runtime/yki.py`
  - `apps/backend/app/services/yki_service.py`
  - `apps/backend/app/routers/v1_yki.py`

Interpretation:

- repo-local YKI material discovery now terminates inside `app/*`
- the engine remains external and is reached only through the adapter/runtime/service chain
- `yki_practice.py` is a guided in-app practice surface and no longer acts as a disk-path fallback for the exam runtime

### Cards

- canonical route surface:
  - `apps/backend/app/routers/v1_cards.py`
- canonical service layer:
  - `apps/backend/app/services/cards_service.py`
- canonical runtime/session logic:
  - `apps/backend/app/runtime/cards_logic.py`
  - `apps/backend/app/runtime/cards_material_bank.py`
- canonical domain package:
  - `apps/backend/app/cards/**`

Interpretation:

- this is a layered authority chain, not duplicate ownership
- `runtime/cards_logic.py` owns session assembly and selection behavior
- `runtime/cards_material_bank.py` owns runtime card loading from canonical published/legacy materials
- `app/cards/**` owns publication, schemas, ingestion, runtime repositories, and accepted output structure

### Cleanup Record

- historical prompts: `docs/cleanup/executed_prompts/`
- historical pass reports: `docs/cleanup/read_reports/`
- final pass and final verdict files: `docs/cleanup/`

## Residual Ambiguity Review Result

- no remaining repo-local duplicate YKI route/runtime/service authority was found after the path canonicalization
- no remaining repo-local duplicate cards route/service/runtime authority was found; only layered responsibilities remain
- no final duplicate-source move was required in Pass 5
