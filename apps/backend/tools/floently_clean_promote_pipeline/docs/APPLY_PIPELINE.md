# Applying the Floently Learn Pipeline v4

## 1. Install

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Run on a clean manifest-first batch

```bash
python -m floently_pipeline.cli run \
  --input examples/doctor_vocab_batch.json \
  --output runs/doctor_vocab_test
```

## 3. Run on messy material without AI

```bash
python -m floently_pipeline.cli run \
  --input examples/messy_vocab_array.json \
  --output runs/messy_vocab_test
```

## 4. Run on messy material with AI verification/recovery

```bash
export OPENAI_API_KEY=your_key_here
python -m floently_pipeline.cli run \
  --input examples/messy_vocab_array.json \
  --output runs/messy_vocab_ai \
  --ai-mode verify
```

AI modes:

- `off` — deterministic only
- `verify` — verify batches and recover uncertain items
- `full` — verify batches, recover uncertain items, and adjudicate duplicate clusters

## 5. Recommended destination strategy

Use a temporary release-candidate destination first, for example:

```text
apps/backend/card_bank/ready_bank/<run_id>/
```

Do not overwrite the live canonical bank during initial testing.

## 6. What to inspect after each run

- `summary.json`
- `validation_report.json`
- `metrics.json`
- `duplicate_report.json`
- `release_candidate.json`
- `ai_reviews.jsonl` if AI is enabled

## 7. Promotion policy

Only promote the release candidate after:

- schema and validation pass
- duplicate counts are acceptable
- rejected items look justified
- high-risk items are reviewed
- the output matches the intended manifest and profession/domain context
