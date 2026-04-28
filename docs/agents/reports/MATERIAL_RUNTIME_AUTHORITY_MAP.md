# Material Runtime Authority Map

## Active authorities

### YKI
- Source-of-truth bank: `apps/backend/materials/yki/certified_bank/`
- Runtime index: `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
- Builder: `engine/tools/build_task_index_v3_2.py`
- Validator family:
  - `engine/schema/task_models_v3_2.py`
  - `engine/validator/task_validator_v3_2.py`
  - `engine/validator/task_semantic_guard_v3_2.py`
- Runtime status endpoint binding: `engine/api/engine_status_api.py`

### Cards
- Canonical schema family: `apps/backend/app/cards/schemas/`
- Publication/runtime code family:
  - `apps/backend/app/cards/publication/`
  - `apps/backend/app/cards/runtime/`
- Runtime card sources:
  - `apps/backend/app/cards/output/accepted/accepted_cards.json`
  - `apps/backend/materials/cards/validated/*.json`
- Donor importer:
  - `apps/backend/app/cards/importers/import_kielitaika_normalized_cards.py`
  - `apps/backend/app/cards/importers/mappers/kielitaika_to_canonical.py`
  - `apps/backend/app/cards/importers/validators/normalized_card_precheck.py`

## Offline-only and donor-only classifications

- `practice_content` output:
  - offline export: `apps/backend/materials/datasets/offline_exports/`
  - import queue: `apps/backend/materials/cards/imports/practice_content/`
- `kielitaika` normalized source snapshot:
  - `apps/backend/materials/cards/imports/kielitaika_normalized/cards_authority.json`
- Quarantine:
  - `apps/backend/materials/cards/quarantine/`
- Future donor YKI families:
  - `puhis` YKI v1/v2 remain donor-only and are not active runtime authority in this repo

## Explicit non-authorities

- `apps/backend/runtime/materials/material_inventory.json`
  - inventory/ledger only, not a card payload sink
- external donor repos under `/home/vitus/kielitaikka-yki-engine`, `/home/vitus/kielitaika`, and `/home/vitus/Documents/puhis`
  - no longer referenced by active app/src/engine runtime code paths
