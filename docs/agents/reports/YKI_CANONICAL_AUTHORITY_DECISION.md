# YKI Canonical Authority Decision

## Canonical Authority
The canonical YKI exam bank is:

- `apps/backend/materials/yki/certified_bank/`

Its authoritative supporting indexes are:

- `apps/backend/materials/yki/certified_bank/manifest.json`
- `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
- `apps/backend/materials/yki/task_banks/task_index_v3_2.json`

## Why This Wins
- Certified manifest and task-index counts align exactly.
- Level-band coverage is complete for `A1_A2`, `B1_B2`, and `C1_C2`.
- Referenced task file paths resolve.
- The bank contains the expected certified-task population of `9706`.

## Secondary / Non-Canonical Files
- `apps/backend/materials/yki/manifest/manifest.json`
  - compatible secondary mirror
- `apps/backend/materials/yki/manifest/task_index_salvaged_tasks.json`
  - donor-only / salvage reference
- `apps/backend/materials/yki/manifest/task_index_unusable_tasks.json`
  - reject-side index

## Runtime Authority Chain
- Overview/practice readers should resolve against:
  - `task_index_v3_2.json`
  - `certified_bank/metadata/pool_index.json`
  - certified manifest
- Full exam runtime additionally depends on the external YKI engine via `apps/backend/services/yki_service.py`.
