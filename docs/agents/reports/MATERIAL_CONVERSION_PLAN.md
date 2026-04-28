# Material Conversion Plan

## Goal

Converge all useful materials into two canonical families only:

1. YKI tasks -> v3.2 certified YKI family
2. Cards -> canonical `puhis` card envelope/publication/runtime family

No third runtime schema should remain active.

## Phase 1: Freeze the targets

### YKI target

- target schema:
  - `floently-finnish/engine/schema/task_models_v3_2.py`
- target validators:
  - `floently-finnish/engine/validator/task_validator_v3_2.py`
  - `floently-finnish/engine/validator/task_semantic_guard_v3_2.py`
- target inventory/index:
  - internal certified-bank mirror plus `task_banks/task_index_v3_2.json`

### Card target

- target schema family to import into `floently-finnish` from `puhis`:
  - `backend/app/cards/schemas/*`
  - `backend/app/cards/publication/*`
  - `backend/app/cards/runtime/*`
  - `backend/app/cards/validators/*`
  - required supporting ingestion/audio pieces

## Phase 2: Internalize YKI authority into `floently-finnish`

### Source

- `/home/vitus/kielitaikka-yki-engine/yki_material_certified_bank`
- `/home/vitus/kielitaikka-yki-engine/task_banks/task_index_v3_2.json`

### Action

1. Mirror the certified bank into a governed location inside `floently-finnish`.
2. Keep the schema/validator/index builder byte-compatible with the donor family.
3. Rebuild the local task index with the same builder.

### Risks

- storage size
- audio asset handling for listening/speaking prompts
- accidental divergence from donor validator logic

## Phase 3: Convert `kielitaika` normalized cards into canonical card envelopes

### Source

- `/home/vitus/kielitaika/backend/runtime/materials/normalized/cards_authority.json`

### Mapping

- `content_type` -> canonical discriminator
- `path` -> canonical learning path
- `domain` -> canonical domain scope
- `profession` -> canonical profession scope
- `level_band` -> canonical level band
- `front_text` / `word` -> `content.front.*`
- `back_prompt` -> `content.back.*` and follow-up prompt
- `served_follow_up` -> explicit canonical follow-up object
- `_accepted_variants` -> canonical accepted variants
- `_source_path` / `_source_id` -> canonical source descriptor
- `_quality_score` -> canonical quality descriptor

### Feasibility

High. This is mostly deterministic restructuring plus metadata wrapping.

### Required validations

- path/domain/profession consistency
- follow-up variant constraints
- publication state constraints
- language sanity checks

## Phase 4: Promote the full `puhis` card system into `floently-finnish`

### Why

`floently-finnish` currently has only a partial copy. Imports fail because key schema and runtime modules are missing.

Evidence:

- `ModuleNotFoundError No module named 'app.cards.adaptive'`
- `ModuleNotFoundError No module named 'app.cards.publication.ingestion_pipeline'`

### Action

1. Import the full canonical card schema/publication/runtime dependency set from `puhis`.
2. Rewire `floently-finnish` card endpoints to the internalized canonical system.
3. Treat the checked-in `accepted_cards.json` only as a validated sample/source file, not as the whole runtime bank.

## Phase 5: Convert selected `puhis` YKI v1 tasks

### Source

- `/home/vitus/Documents/puhis/yki_content_bank/v1`

### Strategy

1. Convert only overlapping families:
   - `reading_mcq_set`
   - `listening_mcq_set`
   - `writing_prompt`
   - `speaking_roleplay`
2. Drop non-canonical metadata into `source`.
3. Run v3.2 validator and semantic guard.
4. Quarantine failures.

### Lossy fields

- `plan_refs`
- detailed generator provenance
- some timing fields that need normalization into recommended minutes

## Phase 6: Treat `puhis` v2 as future-source atomic bank

### Source

- `/home/vitus/Documents/puhis/content/yki_bank/v2`

### Strategy

Do not convert wholesale now.

Use it only for:

- future expansion beyond the current v3.2 task family
- controlled assemblers that map atomic tasks into runtime-approved composites

### Reason

Its taxonomy is broader than the current canonical YKI runtime family and would otherwise create multi-truth drift.

## Phase 7: Reject raw runtime publication from `practice_content`

### Current problem

- `apps/backend/src/features/practice_content/pipeline/publish_to_material_bank.py` writes `{'items': cards}` to `runtime/materials/material_inventory.json`
- the checked-in `material_inventory.json` is an inventory ledger with dataset rows, not a card bank payload

### Action

1. Stop publishing generated cards into `material_inventory.json`.
2. Publish only into:
   - a dedicated offline export file, or
   - the canonical card ingestion entrypoint
3. Require canonical card validation before anything reaches runtime.

## Phase 8: Reject raw pipeline outputs as runtime truth

### Reject

- `/home/vitus/yki_material_pipeline/output/*`
- `/home/vitus/yki_material_pipeline/final_task_bank/*`
- `/home/vitus/Documents/puhis/backend/practice/data/generated_cards.json`
- `/home/vitus/Documents/puhis/backend/practice/data/enriched_cards.json`

### Keep

- as offline donor material only

## Implementation sequence

1. Internalize certified YKI bank into `floently-finnish`
2. Internalize full canonical card system from `puhis`
3. Convert `kielitaika` normalized cards into canonical envelopes
4. Repoint runtime card services to canonical envelopes
5. Convert selected `puhis` YKI v1 tasks
6. Leave `puhis` v2 and `yki_material_pipeline` offline-only

## Success condition

- one YKI runtime schema family
- one card runtime schema family
- one inventory truth per domain
- all donor banks explicitly classified as donor/reference/offline
