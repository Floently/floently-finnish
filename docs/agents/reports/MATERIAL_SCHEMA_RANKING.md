# Material Schema Ranking

## Weighting

Weighted score per domain:

- authority/source-truth status: 20
- explicit schema quality: 15
- validation support: 10
- compatibility with current `floently-finnish`: 15
- conversion burden: 10
- material richness/usefulness: 10
- duplication burden: 5
- runtime suitability: 5
- offline generation suitability: 3
- maintainability/determinism: 5
- evidence-based learning value: 5
- deployability/operational safety: 2

Reason for weighting:

- the target repo already constrains the answer, so authority, compatibility, explicit schemas, and deterministic validation matter more than sheer corpus size.

## Schema family ranking

### 1. YKI materials

1. `kielitaikka-yki-engine` v3.2 certified family: 92/100
   - evidence:
     - `engine/schema/task_models_v3_2.py`
     - `engine/validator/task_validator_v3_2.py`
     - `yki_material_certified_bank/manifest.json`
     - `task_banks/task_index_v3_2.json`
   - why:
     - strongest explicit contract and validator pair
     - directly aligned to `floently-finnish/engine/*`

2. `puhis` `yki_content_bank/v1`: 66/100
   - evidence:
     - `yki_content_bank/v1/manifest.json`
     - `yki_content_bank/v1/bank_meta.json`
   - why:
     - coherent and useful, but smaller and not the active target family

3. `puhis` `content/yki_bank/v2`: 55/100
   - evidence:
     - `content/yki_bank/v2/A1_A2/manifest.json`
     - `yki_content_bank/v2/bank_meta.json`
   - why:
     - promising atomic family, but scaffold status and broader taxonomy reduce deployment readiness

4. `yki_material_pipeline` outputs: 28/100
   - evidence:
     - `reports/pipeline_report.json`
     - `output/certified/*`
     - `final_task_bank/certified/*`
   - why:
     - huge scale, but extreme duplication/corruption burden and unstable schemas

### 2. Card system materials

1. `puhis` card envelope/publication/runtime family: 90/100
   - evidence:
     - `backend/app/cards/schemas/cards.py`
     - `backend/app/cards/schemas/publication.py`
     - `backend/tests/test_card_domain_foundation.py`

2. `kielitaika` normalized card authority: 76/100
   - evidence:
     - `backend/runtime/materials/normalized/cards_authority.json`
     - `backend/runtime/materials/material_inventory.json`
   - why:
     - strong usable material bank, but weaker as source-truth schema than `puhis`

3. `floently-finnish` partial card copy: 41/100
   - evidence:
     - present `apps/backend/app/cards/schemas/publication.py`
     - missing `apps/backend/app/cards/schemas/cards.py`
     - missing `apps/backend/app/cards/schemas/common.py`
     - import failure in `app.cards.runtime.api.router`
   - why:
     - copied artifacts exist, but the family is incomplete

4. `puhis/backend/practice/data/*`: 22/100
   - why:
     - raw/generated donor data, not a governed runtime contract

### 3. Professional Finnish materials

1. `kielitaika` normalized authority: 88/100
2. `puhis` canonical card schema plus imported professional card banks: 79/100
3. `floently-finnish` `practice_content` corpora and generators: 42/100

### 4. Practice engine adaptation potential

1. `puhis` card architecture: 87/100
2. `floently-finnish` target integration surface: 71/100
3. `kielitaika` normalized donor bank: 69/100
4. raw `practice_content` flat-card pipeline: 38/100

### 5. Speaking Lab adaptation potential

1. `kielitaikka-yki-engine` speaking runtime family: 84/100
   - evidence:
     - `engine/exam/speaking_controller.py`
     - `engine/exam/speaking_state_machine.py`
     - certified speaking roleplay tasks

2. `puhis` v2 atomic speaking family: 63/100
   - useful future donor, but not current runtime winner

3. `puhis` v1 speaking roleplay family: 58/100

### 6. Vocabulary learning materials

1. `kielitaika` normalized professional/general cards: 86/100
2. `puhis` canonical card envelope family: 80/100
3. `floently-finnish` accepted card examples only: 35/100

### 7. Grammar learning materials

1. `kielitaika` normalized grammar cards: 82/100
2. `puhis` canonical grammar-card schema: 80/100
3. `practice_content` grammar generator outputs: 39/100

### 8. Phrase/chunk/expression learning materials

1. `kielitaika` normalized phrase/sentence cards: 85/100
2. `puhis` canonical sentence-card schema: 77/100
3. `practice_content` phrase generators: 43/100

### 9. Offline material generation pipeline quality

1. `kielitaikka-yki-engine` certification/indexing toolchain: 83/100
2. `puhis` YKI builders and certification scripts: 61/100
3. `yki_material_pipeline`: 34/100

### 10. Runtime publication/inventory/serving quality

1. YKI: `kielitaikka-yki-engine` v3.2 manifest/index family: 90/100
2. Cards: `puhis` publication/runtime family: 88/100
3. `kielitaika` flattened runtime inventory: 70/100
4. `floently-finnish` `practice_content` inventory publishing: 24/100

### 11. Validation and schema discipline

1. `kielitaikka-yki-engine` v3.2: 93/100
2. `puhis` card family: 88/100
3. `puhis` YKI v1: 54/100
4. `puhis` YKI v2 scaffold: 46/100
5. `yki_material_pipeline`: 21/100

### 12. Conversion friendliness

1. `kielitaika` normalized cards -> `puhis` card envelope: 85/100
2. `puhis` YKI v1 -> YKI v3.2 certified family: 72/100
3. `puhis` YKI v2 atomic -> YKI v3.2 family: 55/100
4. `yki_material_pipeline` outputs -> YKI v3.2 family: 31/100

### 13. Evidence-based learning usefulness

1. `puhis` canonical card family: 84/100
   - explicit follow-up variants support retrieval and productive recall
2. `kielitaika` normalized professional/general cards: 78/100
3. YKI v3.2 certified exam tasks: 74/100
4. raw generated practice artifacts: 25/100

### 14. Operational readiness for deployment in `floently-finnish`

1. YKI v3.2 certified family: 91/100
2. `puhis` card canonical family as donor for internalization: 73/100
3. `kielitaika` flattened normalized cards as donor: 71/100
4. current partial `floently-finnish` card copy: 29/100
5. `practice_content` flat runtime publisher: 19/100

## Winners

- Canonical YKI schema winner: `kielitaikka-yki-engine` / `floently-finnish` v3.2 certified family
- Canonical card schema winner: `puhis` card envelope/publication/runtime family
- Best professional Finnish donor: `kielitaika` normalized card authority
- Best offline recovery donor: `yki_material_pipeline`, but donor only
