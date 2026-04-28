# Material Bank Forensic Audit

## Executive verdict

The material estate is not a single bank. It is a stack of incompatible generations:

1. `kielitaikka-yki-engine` contains the strongest current YKI source-of-truth family:
   - explicit schema: `engine/schema/task_models_v3_2.py`
   - deterministic validator: `engine/validator/task_validator_v3_2.py`
   - semantic guard: `engine/validator/task_semantic_guard_v3_2.py`
   - certified bank + manifest + pool index:
     - `yki_material_certified_bank/manifest.json`
     - `yki_material_certified_bank/metadata/pool_index.json`
     - `task_banks/task_index_v3_2.json`
   - usable count: `9706` certified tasks, split across reading/listening/writing/speaking.

2. `puhis` contains the strongest current card schema family:
   - canonical schema and validators under `backend/app/cards/schemas/`
   - publication/runtime stack under `backend/app/cards/publication/` and `backend/app/cards/runtime/`
   - contract freeze in `backend/practice/docs/card_engine_architecture_freeze.md`
   - validation tests in `backend/tests/test_card_domain_foundation.py`
   - example validated outputs in `backend/app/cards/output/accepted/accepted_cards.json`

3. `floently-finnish` is consuming the YKI v3.2 family, but only partially vendoring the card family:
   - YKI schema/validator/index builder are byte-identical to `kielitaikka-yki-engine`:
     - `engine/schema/task_models_v3_2.py`
     - `engine/validator/task_validator_v3_2.py`
     - `engine/tools/build_task_index_v3_2.py`
   - card publication artifacts are copied, but core card schema/ingestion/runtime dependencies are missing:
     - present: `apps/backend/app/cards/schemas/publication.py`
     - present: `apps/backend/app/cards/output/accepted/accepted_cards.json`
     - missing: `apps/backend/app/cards/schemas/cards.py`
     - missing: `apps/backend/app/cards/schemas/common.py`
     - missing: `apps/backend/app/cards/ingestion/builders/card_builder.py`
     - missing: `apps/backend/app/audio/card_audio_preparation.py`

4. `yki_material_pipeline` is a reconstruction donor, not a runtime authority:
   - `reports/pipeline_report.json` shows extremely high raw volume:
     - `files_scanned: 576714`
     - `json_fragments_found: 5817212`
     - `duplicates: 4470789`
     - `corrupted: 5556670`
   - output schemas are heterogeneous and non-canonical:
     - `output/certified/*.json` includes legacy types like `reading_mcq`, `writing_professional_email`
     - `final_task_bank/certified/*.json` includes incompatible types like `listening_dialogue`, `listening_true_false`

5. `puhis` YKI banks are useful donors but not canonical winners:
   - `yki_content_bank/v1` is coherent but smaller (`1875` tasks) and carries extra generator metadata and flatter task structure.
   - `content/yki_bank/v2` is an atomic scaffold, not an active runtime bank:
     - `v2/bank_meta.json` says `status: "scaffold"`
     - atomic task families diverge from the v3.2 runtime set.

6. `kielitaika` is mostly a runtime consumer/normalizer, not an authoritative schema owner:
   - strong normalized professional-card artifact:
     - `backend/runtime/materials/normalized/cards_authority.json`
   - strong inventory:
     - `backend/runtime/materials/material_inventory.json`
   - but card runtime schema there is flattened runtime-shaped JSON, not the richest source-truth envelope.

## Canonical schema decisions

### Winner: YKI exam/practice task schema

Choose `kielitaikka-yki-engine` / `floently-finnish` v3.2 task schema as canonical for YKI materials.

Winning evidence:

- `engine/schema/task_models_v3_2.py` defines explicit Pydantic models with `extra="forbid"`.
- `engine/validator/task_validator_v3_2.py` enforces structure, registry constraints, blueprint rules, and difficulty ranges.
- `engine/validator/task_semantic_guard_v3_2.py` rejects serialized options and writing-template reconstruction artifacts.
- `yki_material_certified_bank/manifest.json` and `task_banks/task_index_v3_2.json` provide deterministic inventory and runtime selection.
- `floently-finnish/apps/backend/runtime/materials/material_inventory.json` already marks `/home/vitus/kielitaikka-yki-engine/task_banks/task_index_v3_2.json` as `VALID` backend authority.

Canonical YKI family status:

- source-truth: `kielitaikka-yki-engine/yki_material_certified_bank/tasks/*`
- runtime publication/index truth: `kielitaikka-yki-engine/task_banks/task_index_v3_2.json`
- active consumer target: `floently-finnish/engine/*`

### Winner: card schema

Choose the `puhis` card envelope/publication/runtime family as canonical for cards.

Winning evidence:

- explicit envelopes in `backend/app/cards/schemas/cards.py`
- scoped domain/path/profession consistency checks in the same file
- publication state contract in `backend/app/cards/schemas/publication.py`
- runtime/publication stack under `backend/app/cards/runtime/` and `backend/app/cards/publication/`
- architecture freeze:
  - `backend/practice/docs/card_engine_architecture_freeze.md`
- tests proving separation from YKI models:
  - `backend/tests/test_card_domain_foundation.py`

Important nuance:

- `floently-finnish/apps/backend/app/cards/output/accepted/accepted_cards.json` is byte-identical to `puhis/backend/app/cards/output/accepted/accepted_cards.json`.
- `floently-finnish/apps/backend/app/cards/schemas/publication.py` is byte-identical to `puhis/backend/app/cards/schemas/publication.py`.
- but the rest of the canonical card system is not fully present in `floently-finnish`, so `floently-finnish` cannot yet be treated as the card-schema authority.

### Winner: professional Finnish donor family

Choose normalized professional-card source material from:

- `kielitaika/backend/runtime/materials/normalized/cards_authority.json`
- and the corresponding raw profession banks referenced in:
  - `kielitaika/backend/runtime/materials/material_inventory.json`

Reason:

- this family already normalizes `1425` professional/general cards from profession-specific sources with usable distribution by content type, level, and profession.
- it is much stronger than `puhis/backend/practice/data/generated_cards.json` and `enriched_cards.json`, which are large but pedagogically and linguistically unreliable raw artifacts.

### Status of `practice_content` in `floently-finnish`

This is a donor/generator area, not a canonical runtime schema.

Evidence:

- source corpora under `apps/backend/src/features/practice_content/data/source_corpora/`
- no generated build/export artifacts are present under `apps/backend/src/features/practice_content/build` or `export`
- `pipeline/build_unified_cards.py` emits a simple legacy flat schema (`type`, `front`, `back`, `question`, `evaluation`)
- `pipeline/publish_to_material_bank.py` writes card items directly to `runtime/materials/material_inventory.json`, which conflicts with the current inventory file shape
- `config.py` points `RUNTIME_TARGET` at `runtime/materials/material_inventory.json`, but the checked-in file is an inventory ledger, not an `items` payload

Conclusion: keep `practice_content` offline-only until it publishes into the canonical card envelope, not into the inventory file.

## Schema families discovered

### YKI family A: canonical v3.2 certified bank

- schema:
  - `kielitaikka-yki-engine/engine/schema/task_models_v3_2.py`
  - `floently-finnish/engine/schema/task_models_v3_2.py`
- validators:
  - `engine/validator/task_validator_v3_2.py`
  - `engine/validator/task_semantic_guard_v3_2.py`
- manifest/index:
  - `yki_material_certified_bank/manifest.json`
  - `yki_material_certified_bank/metadata/pool_index.json`
  - `task_banks/task_index_v3_2.json`
- examples:
  - `yki_material_certified_bank/tasks/reading_mcq_set/reading_mcq_set_c58cbb95-7a3e-59d2-8002-7b0ba3228523.json`
  - `yki_material_certified_bank/tasks/speaking_roleplay/speaking_roleplay_04e73cab-8387-50e2-a169-e8218378fe79.json`
- status: active, authoritative

### YKI family B: `puhis` v1 bank

- manifest:
  - `puhis/yki_content_bank/v1/manifest.json`
  - `puhis/yki_content_bank/v1/bank_meta.json`
- examples:
  - `puhis/yki_content_bank/v1/tasks/speaking/C1_C2/speaking_roleplay__C1_C2__d0_75__20260209163243_0003.json`
- status: coherent donor/reference, not chosen winner

### YKI family C: `puhis` v2 atomic bank

- manifest:
  - `puhis/content/yki_bank/v2/A1_A2/manifest.json`
  - `puhis/yki_content_bank/v2/bank_meta.json`
- examples:
  - `puhis/content/yki_bank/v2/A1_A2/tasks/speaking_interview_topic/d75ff350-b589-42e1-ae99-88c7d0b0034a.json`
- status: scaffold/donor only

### YKI family D: raw reconstruction outputs

- repo: `yki_material_pipeline`
- examples:
  - `output/certified/4ce3ae70-2e1a-5822-a312-e26205b210f2.json`
  - `final_task_bank/certified/090d2582-4686-582e-be1d-47a85cd1dc0f.json`
- status: donor only, too heterogeneous for runtime truth

### Card family A: canonical envelope/publication/runtime system

- repo: `puhis/backend/app/cards`
- schema:
  - `schemas/cards.py`
  - `schemas/publication.py`
  - companion schema files under `schemas/`
- publication/runtime:
  - `publication/*`
  - `runtime/*`
- examples:
  - `output/accepted/accepted_cards.json`
- status: strongest card canonical family

### Card family B: normalized flattened runtime cards

- repo: `kielitaika/backend/runtime/materials/normalized/cards_authority.json`
- shape: flattened runtime-serving structure with `front_text`, `back_prompt`, `_accepted_variants`, `served_follow_up`
- status: high-value donor/runtime-normalized artifact, but not richer than family A for source-truth governance

### Card family C: raw/generated practice artifacts

- repo: `puhis/backend/practice/data`
- examples:
  - `generated_cards.json` (`21031` rows)
  - `enriched_cards.json` (`12629` rows)
- status: low-authority donor, not runtime-safe

## Runtime vs offline classification

### Runtime-facing now

- `floently-finnish/engine/*` YKI runtime contracts
- `kielitaikka-yki-engine/yki_material_certified_bank` and `task_banks/task_index_v3_2.json`
- `puhis/backend/app/cards/output/accepted/accepted_cards.json` schema family
- `kielitaika/backend/runtime/materials/normalized/cards_authority.json`

### Offline-only or donor-only

- `yki_material_pipeline/*`
- `puhis/backend/practice/data/*`
- `floently-finnish/apps/backend/src/features/practice_content/*`
- `puhis/content/yki_bank/v2/*`
- `puhis/yki_content_bank/v1/*`

## Usefulness and count buckets

### High-confidence usable now

- YKI certified v3.2 bank:
  - `9706` tasks
- normalized professional/general cards in `kielitaika`:
  - `1425` cards
- validated canonical accepted cards in `puhis` and copied into `floently-finnish`:
  - `4` checked-in examples

### Useful but requires conversion

- `puhis/yki_content_bank/v1`:
  - `1875` tasks
  - same broad domains, but needs deterministic transform into v3.2 certified family
- `puhis/content/yki_bank/v2`:
  - atomic tasks with expanded task-type taxonomy
  - likely useful as generator output or future source for v3.2+ transforms

### Low-value, duplicate, or reject

- `yki_material_pipeline/output/*` and `final_task_bank/*` as runtime truth
  - huge duplicate burden
  - heterogeneous task types
  - no clear canonical validator binding
- `puhis/backend/practice/data/generated_cards.json`
  - `21031` rows but English/non-Finnish content and malformed lexical targets appear in samples
- `puhis/backend/practice/data/enriched_cards.json`
  - `12629` rows with heuristic grammar enrichment, still not canonical runtime envelopes

## Conversion feasibility

### `puhis` v1 YKI -> v3.2 certified YKI

Feasibility: medium-high, deterministic for the overlapping family.

Mapping direction:

- `type` / `task_type` -> `task_type`
- `difficulty_index` -> `difficulty`
- `instructions_fi` / `scenario_fi` / `ai_first_turn_fi` -> nested `content` fields
- source metadata -> `source`
- `estimated_time_sec` -> `content.timing.recommended_minutes` or speaking timing mapping

Issues:

- extra generator metadata should be dropped or moved to `source`
- content nesting differs
- certification fields need to be synthesized as uncertified initially

### `puhis` v2 atomic -> v3.2 certified YKI

Feasibility: medium for subset, low for full bank.

Safe subset:

- atomic families that can be assembled into current runtime families

Problems:

- v2 task taxonomy is broader than current v3.2 runtime winner
- examples show atomic task shapes like `speaking_interview_topic`, `reading_open_response`, `writing_descriptive_short`
- current v3.2 runtime winner expects only:
  - `reading_mcq_set`
  - `listening_mcq_set`
  - `writing_prompt`
  - `speaking_roleplay`

### `kielitaika` normalized cards -> canonical card envelope

Feasibility: high.

Reason:

- records already carry useful fields:
  - `content_type`
  - `path`
  - `domain`
  - `profession`
  - `level_band`
  - `front_text`
  - `back_prompt`
  - `_accepted_variants`
  - `served_follow_up`
- mapping into `puhis`/canonical card envelope is mostly structural wrapping plus publication/source metadata enrichment.

### `puhis` generated/enriched practice cards -> canonical card envelope

Feasibility: low-medium.

Reason:

- many rows are heuristically generated, English, or pedagogically weak
- requires filtering, language validation, and content-quality review before conversion

## Repo strengths by domain

- YKI materials: `kielitaikka-yki-engine`
- Card system materials: `puhis`
- Professional Finnish materials: `kielitaika`
- Practice engine adaptation: `puhis` for canonical card architecture, `floently-finnish` for current integration target
- Speaking Lab adaptation: `kielitaikka-yki-engine` for governed speaking runtime, `puhis` v2 as future donor for atomic speaking prompts
- Vocabulary materials: `kielitaika` normalized authority
- Grammar materials: `kielitaika` normalized authority plus `puhis` canonical card schema
- Phrase/chunk materials: `kielitaika` normalized authority
- Offline material generation pipeline quality: `kielitaikka-yki-engine` tooling is strongest among YKI flows; `yki_material_pipeline` has scale but excessive clutter
- Runtime publication/serving quality: `puhis` card system, `kielitaikka-yki-engine` YKI system

## Final decisions

1. Canonical YKI schema in `floently-finnish` should remain the v3.2 family already present under `engine/`, with `kielitaikka-yki-engine` as the authoritative donor bank until `floently-finnish` internalizes a certified copy.
2. Canonical card schema for `floently-finnish` should be the `puhis` card envelope/publication/runtime family, not the flattened `kielitaika` runtime cards and not the `practice_content` flat card schema.
3. `kielitaika` normalized card bank should be ingested into that canonical card envelope as high-value source material.
4. `puhis` v1 and v2 YKI banks should be treated as donor/reference banks for future conversion or enrichment, not runtime truth.
5. `yki_material_pipeline` should remain offline forensic/recovery infrastructure only.
