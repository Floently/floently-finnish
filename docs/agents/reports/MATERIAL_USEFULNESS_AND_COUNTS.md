# Material Usefulness And Counts

## Count summary

### YKI families

- `kielitaikka-yki-engine/yki_material_certified_bank/tasks`: `9706` JSON tasks
- `kielitaikka-yki-engine/yki_material_certified_bank/quarantine`: `1076` JSON tasks
- `puhis/yki_content_bank/v1/tasks`: `1875` JSON tasks
- `yki_material_pipeline/output/certified`: `21401` JSON files
- `yki_material_pipeline/final_task_bank/certified`: `8261` JSON files

### Card/practice families

- `kielitaika/backend/runtime/materials/normalized/cards_authority.json`: `1425` cards
- `floently-finnish/apps/backend/app/cards/output/accepted/accepted_cards.json`: `4` validated examples
- `puhis/backend/app/cards/output/accepted/accepted_cards.json`: `4` validated examples
- `puhis/backend/practice/data/generated_cards.json`: `21031` rows
- `puhis/backend/practice/data/enriched_cards.json`: `12629` rows

### Raw pipeline scale signal

From `yki_material_pipeline/reports/pipeline_report.json`:

- files scanned: `576714`
- json fragments found: `5817212`
- certified: `23781`
- salvageable: `236761`
- duplicates: `4470789`
- corrupted: `5556670`

## Usefulness buckets

## High-value and already runtime-aligned

### 1. YKI certified v3.2 bank

- count: `9706`
- quality: highest current confidence
- why useful:
  - explicit schema
  - validator-backed
  - already used as authority by `floently-finnish` inventory
  - broad coverage across all four YKI skills

### 2. Normalized professional/general cards from `kielitaika`

- count: `1425`
- distribution from `cards_authority.json`:
  - vocabulary: `615`
  - sentence: `566`
  - grammar: `244`
  - A1_A2: `402`
  - B1_B2: `940`
  - C1_C2: `83`
- why useful:
  - real profession segmentation
  - retrieval-friendly follow-up structure already present in normalized form
  - much stronger than the raw generated card corpora

## Useful but requires conversion

### 3. `puhis` YKI v1

- count: `1875`
- why useful:
  - coherent exam-like structure
  - same broad domains as the winning family
- why not runtime-ready:
  - smaller bank
  - extra metadata shape
  - not the active `floently-finnish` runtime family

### 4. `puhis` YKI v2 atomic bank

- visible count from sampled manifest:
  - A1_A2 alone shows multiple atomic families with 100-300 items each
- why useful:
  - good future-source for atomic practice and expanded task types
- why not runtime-ready:
  - scaffold status
  - broader taxonomy than current runtime winner

## Low-value or reject for runtime

### 5. `yki_material_pipeline` output families

- large raw counts
- high duplicate/corruption burden
- incompatible task taxonomies
- should be rejected as runtime truth

### 6. `puhis/backend/practice/data/generated_cards.json`

- count: `21031`
- sample issues:
  - English source material
  - malformed lexical targets
  - pedagogically weak fill targets
- value:
  - offline mining only

### 7. `puhis/backend/practice/data/enriched_cards.json`

- count: `12629`
- value:
  - filtered donor only
- reason for downgrade:
  - still heuristic
  - not canonical envelope
  - still requires language/pedagogy validation

## Evidence-based learning usefulness

### Strong

- canonical `puhis` card envelope examples:
  - explicit recognition + typed recall follow-ups
  - grammar application follow-up
  - publication and quality metadata
- `kielitaika` normalized authority:
  - already structured around prompt/answer/follow-up serving
- YKI v3.2 certified tasks:
  - realistic exam-style retrieval and production tasks

### Weak

- flat legacy practice cards with only `prompt`, `input_hint`, `expected`
- huge reconstruction corpora with no governed retrieval/review semantics

## Recommended retained set

- retain as primary YKI runtime bank:
  - `9706` certified v3.2 tasks
- retain as primary card donor bank:
  - `1425` normalized professional/general cards
- retain as canonical card contract examples:
  - `4` validated sample accepted cards
- retain as donor-only references:
  - `1875` `puhis` YKI v1 tasks
  - `puhis` v2 atomic bank
- reject from runtime truth:
  - `yki_material_pipeline` output families
  - `generated_cards.json`
  - `enriched_cards.json`
