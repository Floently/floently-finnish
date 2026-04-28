# Material Fix Agent Prompt

You are the implementation agent for the Floently Finnish material-bank convergence work.

Repository:

`/home/vitus/floently-finnish/`

Before changing anything, read these files:

- `docs/agents/MATERIAL_BANK_FORENSIC_AUDIT.md`
- `docs/agents/MATERIAL_SCHEMA_RANKING.md`
- `docs/agents/MATERIAL_CONVERSION_PLAN.md`
- `docs/agents/MATERIAL_USEFULNESS_AND_COUNTS.md`
- `docs/agents/MATERIAL_GOVERNANCE_RECOMMENDATION.md`
- `docs/agents/MATERIAL_ACTION_PLAN_FOR_IMPLEMENTATION.md`
- `docs/agents/MATERIAL_REPO_DECISION_LEDGER.json`

## Mission

Converge the project onto exactly two runtime material schema families:

1. YKI tasks -> v3.2 certified family
2. Cards -> canonical `puhis` card envelope/publication/runtime family

## Non-negotiable rules

1. Preserve the `engine/` YKI schema/validator family already present in `floently-finnish`.
2. Do not introduce a third runtime schema.
3. Do not publish raw generator outputs directly to runtime.
4. Keep runtime inventory files separate from runtime payload files.
5. Do not destroy donor materials; classify and isolate them.

## Required implementation order

### Phase 1

Fix card-system incompleteness in `floently-finnish`.

Evidence to address:

- `apps/backend/app/cards/schemas/publication.py` exists
- but these are missing:
  - `apps/backend/app/cards/schemas/cards.py`
  - `apps/backend/app/cards/schemas/common.py`
  - `apps/backend/app/cards/ingestion/builders/card_builder.py`
  - `apps/backend/app/audio/card_audio_preparation.py`
- imports currently fail:
  - `app.cards.runtime.api.router`
  - `app.cards.publication.deck_publication_service`

### Phase 2

Internalize the canonical card family from `puhis`.

- import only the required modules
- keep YKI and card contracts separate
- verify imports and targeted tests

### Phase 3

Replace `practice_content` runtime publication behavior.

Current bad target:

- `apps/backend/src/features/practice_content/config.py`
  - `RUNTIME_TARGET = ... /runtime/materials/material_inventory.json`

Current bad writer:

- `apps/backend/src/features/practice_content/pipeline/publish_to_material_bank.py`

Required fix:

- publish generated candidates to a dedicated offline export or canonical ingestion target
- never overwrite `material_inventory.json` with card payload items

### Phase 4

Internalize the certified YKI bank.

- bring the winning certified YKI bank under governed control inside `floently-finnish`
- rebuild the local task index
- keep schema/validator/index-builder compatibility with the current v3.2 family

### Phase 5

Build deterministic importers.

- importer 1: `kielitaika` normalized cards -> canonical card envelopes
- importer 2: `puhis` YKI v1 -> v3.2 certified tasks for overlapping families only

## Verification

At minimum, verify:

1. card runtime/publication imports load
2. YKI schema/validator imports load
3. no runtime code reads raw donor banks directly
4. inventory files and payload files have separate contracts
5. canonical sample cards validate
6. canonical YKI bank indexes rebuild deterministically

## Required outputs

Write these after implementation:

- `docs/agents/MATERIAL_FIX_EXECUTION_LOG.md`
- `docs/agents/MATERIAL_FIX_CHANGE_LEDGER.json`
- `docs/agents/MATERIAL_POST_FIX_STATUS.md`

## Success condition

`floently-finnish` ends with:

- one YKI runtime material family
- one card runtime material family
- controlled donor import paths
- no multi-truth runtime drift
