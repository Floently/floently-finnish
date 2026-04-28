# Floently Finnish Material Convergence Execution Document

Repository target:
`/home/vitus/floently-finnish/`

This document is the ordered implementation manuscript for material-bank convergence.
It assumes the forensic material audit has already made the schema decisions.

## Required reading before any change
Read these first:

- `/home/vitus/floently-finnish/docs/agents/MATERIAL_BANK_FORENSIC_AUDIT.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_SCHEMA_RANKING.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_USEFULNESS_AND_COUNTS.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_REPO_DECISION_LEDGER.json`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_GOVERNANCE_RECOMMENDATION.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_CONVERSION_PLAN.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_ACTION_PLAN_FOR_IMPLEMENTATION.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_FIX_AGENT_PROMPT.md`

## Frozen decisions
Do not revisit these during implementation unless a validator-backed contradiction is discovered.

- Canonical YKI runtime family: `kielitaikka-yki-engine` / `floently-finnish` v3.2 certified family
- Canonical card runtime family: `puhis` card envelope/publication/runtime family
- Professional Finnish content donor: `kielitaika` normalized card authority
- `yki_material_pipeline`: offline forensic/recovery donor only
- `puhis` YKI v1/v2: donor/reference only
- `practice_content`: offline generator only until it emits canonical card envelopes

## Success condition
At the end of this run, `floently-finnish` must have:

1. one internal YKI material authority
2. one internal card material authority
3. one inventory contract per domain
4. donor repos used only through controlled import/update workflows
5. no runtime path reading directly from donor or raw/offline banks
6. deterministic validators and rebuild scripts for active material families

---

## Phase 1 — Internalize YKI certified authority

### Source paths
- `/home/vitus/kielitaikka-yki-engine/yki_material_certified_bank/`
- `/home/vitus/kielitaikka-yki-engine/task_banks/task_index_v3_2.json`

### Target paths to create/use
- `/home/vitus/floently-finnish/apps/backend/materials/yki/certified_bank/`
- `/home/vitus/floently-finnish/apps/backend/materials/yki/task_banks/task_index_v3_2.json`
- `/home/vitus/floently-finnish/apps/backend/materials/yki/manifest/`

### Keep as active code authority
- `/home/vitus/floently-finnish/engine/schema/task_models_v3_2.py`
- `/home/vitus/floently-finnish/engine/validator/task_validator_v3_2.py`
- `/home/vitus/floently-finnish/engine/validator/task_semantic_guard_v3_2.py`
- `/home/vitus/floently-finnish/engine/tools/build_task_index_v3_2.py`

### Actions
- Copy the certified bank into the internal governed YKI materials location.
- Preserve manifest and metadata structure.
- Rebuild a local `task_index_v3_2.json` using the existing builder.
- Repoint any runtime/config/inventory references away from external repo paths and to the internal bank.
- Write provenance metadata for the import: source repo, source path, import date, item counts, validator family.

### Verification
- Import the active YKI schema/validator modules successfully.
- Rebuild the local task index deterministically.
- Validate a representative sample from each skill family.
- Verify no active runtime path references `/home/vitus/kielitaikka-yki-engine/` directly after internalization.

---

## Phase 2 — Internalize the full canonical card system from `puhis`

### Source paths
- `/home/vitus/Documents/puhis/backend/app/cards/schemas/`
- `/home/vitus/Documents/puhis/backend/app/cards/publication/`
- `/home/vitus/Documents/puhis/backend/app/cards/runtime/`
- `/home/vitus/Documents/puhis/backend/app/cards/validators/`
- `/home/vitus/Documents/puhis/backend/app/cards/ingestion/`
- `/home/vitus/Documents/puhis/backend/app/audio/`

### Required target paths in `floently-finnish`
- `/home/vitus/floently-finnish/apps/backend/app/cards/schemas/`
- `/home/vitus/floently-finnish/apps/backend/app/cards/publication/`
- `/home/vitus/floently-finnish/apps/backend/app/cards/runtime/`
- `/home/vitus/floently-finnish/apps/backend/app/cards/validators/`
- `/home/vitus/floently-finnish/apps/backend/app/cards/ingestion/`
- `/home/vitus/floently-finnish/apps/backend/app/audio/`

### Explicit missing/incomplete targets to resolve
- `apps/backend/app/cards/schemas/cards.py`
- `apps/backend/app/cards/schemas/common.py`
- `apps/backend/app/cards/ingestion/builders/card_builder.py`
- `apps/backend/app/audio/card_audio_preparation.py`

### Actions
- Import the full canonical card family with all required dependencies.
- Remove partial/incomplete shadow copies or replace them cleanly.
- Ensure `accepted_cards.json` remains a validated sample and not the primary runtime bank.
- Restore importability of:
  - `apps/backend/app/cards/runtime/api/router.py`
  - `apps/backend/app/cards/publication/deck_publication_service.py`
- Keep card contracts strictly separate from YKI contracts.

### Verification
- All canonical card schema modules import successfully.
- Card runtime API router imports and mounts successfully.
- Card publication services import successfully.
- Representative accepted cards validate against canonical envelopes.

---

## Phase 3 — Convert `kielitaika` normalized cards into canonical envelopes

### Source path
- `/home/vitus/kielitaika/backend/runtime/materials/normalized/cards_authority.json`

### Target structure
- `/home/vitus/floently-finnish/apps/backend/materials/cards/imports/kielitaika_normalized/`
- `/home/vitus/floently-finnish/apps/backend/materials/cards/validated/`
- `/home/vitus/floently-finnish/apps/backend/materials/cards/published/`

### Create these tools
- `apps/backend/app/cards/importers/import_kielitaika_normalized_cards.py`
- `apps/backend/app/cards/importers/mappers/kielitaika_to_canonical.py`
- `apps/backend/app/cards/importers/validators/normalized_card_precheck.py`

### Mapping requirements
Map at least:
- `content_type` -> canonical discriminator
- `path` -> canonical learning path
- `domain` -> canonical domain scope
- `profession` -> canonical profession scope
- `level_band` -> canonical level band
- `front_text` / `word` -> canonical front content
- `back_prompt` -> canonical back/follow-up content
- `served_follow_up` -> canonical follow-up object
- `_accepted_variants` -> canonical accepted variants
- `_source_path` / `_source_id` -> provenance
- `_quality_score` -> quality metadata

### Actions
- Convert all valid normalized cards into canonical envelopes.
- Preserve provenance and donor metadata.
- Publish only through the canonical card publication path.
- Quarantine malformed rows.

### Verification
- Count converted, validated, quarantined, and rejected cards.
- Validate representative samples across vocabulary, sentence, grammar, and profession-specific segments.

---

## Phase 4 — Demote `practice_content` to offline-only generation

### Problem paths
- `/home/vitus/floently-finnish/apps/backend/src/features/practice_content/pipeline/publish_to_material_bank.py`
- `/home/vitus/floently-finnish/apps/backend/src/features/practice_content/pipeline/build_unified_cards.py`
- `/home/vitus/floently-finnish/apps/backend/runtime/materials/material_inventory.json`

### Actions
- Remove any behavior that writes card payloads into `material_inventory.json`.
- Preserve `material_inventory.json` as inventory ledger only.
- Redirect `practice_content` output to either:
  - `/home/vitus/floently-finnish/apps/backend/materials/cards/offline_exports/`
  - or `/home/vitus/floently-finnish/apps/backend/materials/cards/import_queue/`
- Require canonical card validation before any generated cards can become runtime-published.

### Verification
- Search the repo to confirm no runtime code writes payload items to `material_inventory.json`.
- Confirm generated outputs land only in offline export/import paths.

---

## Phase 5 — Add donor conversion tooling for useful non-canonical material

### 5A. `puhis` YKI v1 -> v3.2

#### Source
- `/home/vitus/Documents/puhis/yki_content_bank/v1/`

#### Target tools
- `apps/backend/materials/yki/importers/import_puhis_v1_yki.py`
- `apps/backend/materials/yki/importers/mappers/puhis_v1_to_v3_2.py`
- `apps/backend/materials/yki/quarantine/`

#### Actions
- Convert only overlapping families:
  - `reading_mcq_set`
  - `listening_mcq_set`
  - `writing_prompt`
  - `speaking_roleplay`
- Map non-canonical metadata into provenance/source fields.
- Run v3.2 validator and semantic guard.
- Quarantine all failures.

#### Verification
- Report converted, validated, quarantined counts.
- Sample-check each overlapping family.

### 5B. `puhis` v2 atomic YKI

#### Source
- `/home/vitus/Documents/puhis/content/yki_bank/v2/`

#### Action
- Do not mass-convert now.
- Classify as future donor only.
- Optionally create a placeholder note or future converter scaffold, but do not activate it.

### 5C. Raw card artifacts

#### Source
- `/home/vitus/Documents/puhis/backend/practice/data/generated_cards.json`
- `/home/vitus/Documents/puhis/backend/practice/data/enriched_cards.json`

#### Action
- Keep offline only.
- Do not use as runtime authority.
- If sampled, report quality issues and filtering strategy only.

---

## Phase 6 — Add material governance inside `floently-finnish`

### Create these files
- `/home/vitus/floently-finnish/apps/backend/materials/GOVERNANCE.md`
- `/home/vitus/floently-finnish/apps/backend/materials/STATUS_RULES.md`
- `/home/vitus/floently-finnish/apps/backend/materials/datasets/dataset_registry.json`
- `/home/vitus/floently-finnish/apps/backend/materials/datasets/provenance_registry.json`

### Allowed statuses
- `source_truth`
- `published_runtime`
- `validated_donor`
- `offline_generation`
- `quarantine`
- `archive`

### Actions
- Register each active and donor bank.
- Record schema family, validator binding, source path, counts, and last import/publish method.
- Mark non-winning families explicitly as donor/offline/quarantine/archive.

### Verification
- Every material bank in runtime paths has a declared status.
- Every active bank names its validator and provenance.

---

## Phase 7 — Add CI and verification gates for materials

### Add checks for
- YKI schema validation over the internal certified bank
- card canonical envelope validation over published card payloads
- duplicate ID detection
- no runtime reads from forbidden donor/raw/offline paths
- inventory vs payload contract separation
- deterministic rebuild of YKI task index

### Verification
- CI/config exists for these checks.
- Failing sample cases produce real failures, not warnings.

---

## Phase 8 — Quarantine/archive non-winning families

### Classify and isolate
- `/home/vitus/yki_material_pipeline/` -> offline forensic only
- `/home/vitus/Documents/puhis/content/yki_bank/v2/` -> donor/future only
- `/home/vitus/Documents/puhis/backend/practice/data/*` -> artifact only
- partial/incomplete copied card files in `floently-finnish` -> replaced/deprecated once canonical set lands

### Verification
- No active runtime code reads from these locations.
- Registries/status files reflect the classification.

---

## Mandatory outputs after the run
Write all outputs to:
`/home/vitus/floently-finnish/docs/agents/`

### Required post-run files
- `MATERIAL_EXECUTION_RUN_LOG.md`
- `MATERIAL_EXECUTION_CHANGE_LEDGER.json`
- `MATERIAL_POST_RUN_DECISION_REPORT.md`
- `MATERIAL_POST_RUN_OPEN_ISSUES.md`
- `MATERIAL_POST_RUN_COUNTS.json`
- `MATERIAL_RUNTIME_AUTHORITY_MAP.md`

### Decision report must answer
1. Is YKI now fully internalized and runtime-authoritative inside `floently-finnish`?
2. Is the card system now fully canonical and importable inside `floently-finnish`?
3. Are `kielitaika` normalized cards converted and published through the canonical path?
4. Is `practice_content` safely offline-only?
5. Are donor/raw families now quarantined or explicitly classified?
6. What blockers remain before materials can be called deployment-ready?
7. What is the exact next recommended implementation move?

---

## Abort conditions
Stop and report instead of guessing if:
- canonical donor files are missing unexpectedly
- validator-backed schemas contradict the frozen decisions
- import chains reveal a hidden third runtime schema that cannot be safely demoted in this run

When aborting, still write the post-run files with exact blockers and recommended next action.
