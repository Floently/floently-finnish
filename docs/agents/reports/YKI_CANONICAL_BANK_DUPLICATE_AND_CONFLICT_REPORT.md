# YKI Canonical Bank Duplicate And Conflict Report

## Duplicate/Conflict Audit

### Canonical bank duplicates
- Duplicate `task_id` values in `task_index_v3_2.json`: `0`
- Duplicate `file_path` values in `task_index_v3_2.json`: `0`

### Secondary/donor index conflict risk
- `task_index_salvaged_tasks.json`
  - present but empty
  - no overlap conflict because it contributes no entries
- `task_index_unusable_tasks.json`
  - present but empty
  - no overlap conflict because it contributes no entries

### Engine-side conflict risk
- No `manifest.json`, `pool_index.json`, or `task_index*.json` files were found under `engine/`
- Engine generator code builds from the canonical task index path under `apps/backend/materials/yki/task_banks/`

## Conflict Verdict
- No hidden duplicate bank/index source was found that could explain zero-task behavior.
- The main future conflict risk is path drift in runtime reader code, not duplicate bank content.

## Confirmed Path Drift Fixed
- `apps/backend/api/routes/yki_exam.py`
- `apps/backend/api/routes/yki_practice.py`

Both previously assumed a root-level `certified_bank/pool_index.json`.
The real canonical file is `certified_bank/metadata/pool_index.json`.
