# Floently pipeline v12

# Floently Pipeline v11

# Floently Learn Pipeline v6

A modular sanitation and recovery pipeline for transforming manifest-first MGI batches, messy arrays, and compiled legacy card banks into APS release candidates.

## What v6 improves

- Fixes the launcher syntax issue.
- Accepts OpenAI key files in **either** of these formats:
  - raw key only
  - `OPENAI_API_KEY=...`
- Supports relative paths in runspecs.
- Supports output paths ending in `.json` or `.jsonl` by writing artifacts to a same-stem directory and a pointer JSON file.
- Supports compiled legacy card-bank inputs shaped like:
  - `{ "cards": [ ... ] }`
- Recovers vocabulary from compiled card fields like:
  - `word`
  - `front_text`
  - `_answer_value`
  - `served_follow_up`
- Improves Finnish slug handling for IDs (`ä`, `ö`, `å`, etc.).
- Fixes profession mapping so `general` no longer becomes `professional/general` in APS.
- Clarifies dedupe reporting by separating item signatures from actual duplicate signatures.

## Quick start

Run from this folder:

```bash
cd /path/to/floently_pipeline_v6
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./run_pipeline runspecs/example_run.json
```

## Supported input formats

### 1. Preferred wrapper format

```json
{
  "manifest": {
    "content_type": "vocabulary_card",
    "language": "fi",
    "path": "professional/doctor/words",
    "domain": "medical_work_finnish",
    "profession": "doctor",
    "level_band": "B1_B2",
    "source_id": "source.generated.professional.doctor.vocabulary"
  },
  "items": [
    { "term": "vieroitus", "meaning": "withdrawal" }
  ]
}
```

### 2. Sequential manifest + items in one file

```json
{ "content_type": "vocabulary_card", "language": "fi", "profession": "doctor" }

[
  { "term": "vieroitus", "meaning": "withdrawal" }
]
```

### 3. Items-only array

```json
[
  { "word": "vieroitus", "gloss": "withdrawal" }
]
```

### 4. Compiled card bank

```json
{
  "cards": [
    {
      "content_type": "vocabulary_card",
      "word": "anteeksi",
      "front_text": "anteeksi",
      "back_prompt": "What does 'anteeksi' mean?",
      "_answer_value": "excuse me"
    }
  ]
}
```

## Key file formats supported

### Raw key only

```text
sk-xxxxxxxxxxxxxxxx
```

### Env-style key file

```text
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

## Output behavior

The pipeline always writes a **run artifact directory**.

If you pass a directory path:

```text
/path/to/output_general_1
```

it writes directly there.

If you pass a file path:

```text
/path/to/output_general_1.json
```

it writes artifacts to:

```text
/path/to/output_general_1/
```

and writes a small pointer JSON to:

```text
/path/to/output_general_1.json
```

## Main artifacts

- `inventory.json`
- `summary.json`
- `batches/<batch_id>/aid.json`
- `batches/<batch_id>/extracted_items.jsonl`
- `batches/<batch_id>/normalized_items.jsonl`
- `batches/<batch_id>/duplicate_report.json`
- `batches/<batch_id>/aps_items.jsonl`
- `batches/<batch_id>/release_candidate.json`
- `batches/<batch_id>/validation_report.json`
- `batches/<batch_id>/metrics.json`
- `batches/<batch_id>/ai_reviews.jsonl` when AI is enabled

See `docs/RUN_FROM_HERE.md` and `docs/PIPELINE_SPEC.md`.


## v6 highlights
- Unicode-safe launcher
- Optional global bank dedupe
- Full bank audit command


## Canonical-bank promotion

Use `./promote_canonical runspecs/example_promote.json` to scan a ready-pool recursively and inject accepted APS items into a canonical bank. Routing is manifest-driven by `content_type + profession + level_band`, and the promoter auto-creates missing profession branches and a dedicated `sentences/` lane.


## New in v12

- Incremental scan cache skips unchanged files on reruns using size, mtime, and file SHA-256.
- Added support for multi-batch stream files, mixed manifest/object streams, and repaired malformed generated JSON variants.
- Cached files are reported in run summaries instead of being rescanned.


## v14 promotion safety

`promote_canonical` now writes promoted items into `candidate/` and `validated/` only. It no longer writes directly into `published/`.
It also writes promotion progress and history under `canonical_bank/reports/` and caches promoted batch hashes under `canonical_bank/index/promotion_state.json`.


## v17 notes
- Practical-nurse alias normalization now recognizes `lähihoitaja` and routes to `practical_nurse`.
- Canonical bank routing now uses `words`, `grammar`, and `sentences` only; phrase/idiom/slang/opposite/similar items are folded into the requested top-level buckets.
- Promotion reuses canonical signature indices and the cleaner skips known large low-value arrays earlier for speed.
- Compiled sentence and grammar cards have stronger extraction from `back_prompt` and `blank_template`.
