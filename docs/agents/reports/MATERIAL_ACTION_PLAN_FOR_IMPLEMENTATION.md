# Material Action Plan For Implementation

## Phase 1

Internalize the YKI certified bank.

- Copy or rebuild the certified v3.2 bank inside `floently-finnish`.
- Keep:
  - `engine/schema/task_models_v3_2.py`
  - `engine/validator/task_validator_v3_2.py`
  - `engine/tools/build_task_index_v3_2.py`
- Rebuild local `task_index_v3_2.json`.

## Phase 2

Internalize the full canonical card system from `puhis`.

- Import missing schema/runtime/publication modules.
- Resolve current missing-module failures before any card publication claims are trusted.
- Preserve the card/YKI separation defined in `puhis/backend/practice/docs/card_engine_architecture_freeze.md`.

## Phase 3

Convert `kielitaika` normalized cards into canonical card envelopes.

- Build deterministic importer.
- Emit validated canonical card payloads.
- Publish via the canonical card publication system.

## Phase 4

Demote `practice_content` to offline-only generator status.

- Stop writing generated card payloads to `runtime/materials/material_inventory.json`.
- Route all generated card candidates through canonical ingestion/validation instead.

## Phase 5

Add donor conversion tooling.

- `puhis` v1 YKI -> v3.2 converter
- `kielitaika` normalized card -> canonical envelope converter
- optional `puhis` v2 atomic -> future-task-family converter

## Phase 6

Quarantine or archive non-winning families.

- `yki_material_pipeline` runtime-shaped outputs
- raw `puhis/backend/practice/data/*`
- any partial/incomplete card-system copies in `floently-finnish`

## Phase 7

Add governance checks.

- schema validation in CI
- inventory contract checks
- no raw/offline file reads from runtime code
- duplicate source-of-truth detection

## Immediate blockers

1. `floently-finnish` card system is incomplete.
2. `practice_content` publishes into the wrong file role.
3. YKI authority still lives outside the repo.

## End state

- one internal YKI bank
- one internal card bank
- one inventory contract per domain
- donor repos used only for controlled import/update workflows
