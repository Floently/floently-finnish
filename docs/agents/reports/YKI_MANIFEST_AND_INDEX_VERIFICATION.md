# YKI Manifest And Index Verification

## Files Verified
- `apps/backend/materials/yki/certified_bank/manifest.json`
- `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
- `apps/backend/materials/yki/manifest/manifest.json`
- `apps/backend/materials/yki/task_banks/task_index_v3_2.json`

## Verification Results

### Certified Manifest
- `bank_version`: `certified`
- `levels`:
  - `A1_A2`: `2092`
  - `B1_B2`: `3882`
  - `C1_C2`: `3732`

### Task Index v3.2
- `entries`: `9706`
- `selected_for_runtime = false`: `0`
- missing `file_path`: `0`
- missing referenced files from `file_path`: `0`

### Pool Index
- Real path: `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
- Top-level per-band sections exist for:
  - `A1_A2`
  - `B1_B2`
  - `C1_C2`
- Per-band task-type keys include:
  - `reading_mcq_set`
  - `listening_mcq_set`
  - `writing_prompt`
  - `speaking_roleplay`

## Broken Runtime Assumption Found
- `apps/backend/api/routes/yki_exam.py` previously looked for:
  - `apps/backend/materials/yki/certified_bank/pool_index.json`
- `apps/backend/api/routes/yki_practice.py` had the same stale candidate
- Actual file location is:
  - `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`

## Verdict
- Manifest/index data is valid.
- Runtime path assumption was invalid.
