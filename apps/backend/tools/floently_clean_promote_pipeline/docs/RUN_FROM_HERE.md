# Run From Here

This folder is the pipeline root.

Run commands from this directory:

```bash
cd /path/to/floently_pipeline_v4
```

Do **not** run from inside `floently_pipeline/`.

## Launcher

Use:

```bash
./run_pipeline path/to/runspec.env
```

or

```bash
./run_pipeline path/to/runspec.json
```

## Input formats

### Preferred input

One JSON file containing both `manifest` and `items`:

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
    { "term": "vieroitus", "meaning": "withdrawal" },
    { "term": "haavanhoito", "meaning": "wound care" }
  ]
}
```

### Also accepted

- items-only arrays
- sequential manifest + items in one file
- compiled card banks with top-level `cards`

Compiled card-bank example:

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

## Source, key, and output model

- Source may be inside or outside the project repo.
- OpenAI key should be outside the repo in a separate key file.
- Output should usually be inside the project repo, under a release-candidate path.

Recommended output target for cards:

```text
<project_repo>/apps/backend/card_bank/ready_bank/<run_name>
```

Recommended output target for YKI:

```text
<project_repo>/apps/backend/materials/yki/release_candidates/<run_name>
```

## Key file formats

Both are supported:

### Raw key only

```text
sk-xxxxxxxxxxxxxxxx
```

### Env-style

```text
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

## Output behavior

The pipeline writes a run artifact directory.

If you give a directory path, it writes there directly.

If you give a `.json` output path, it writes artifacts to the same-stem directory and writes a small pointer JSON at the original `.json` path.
