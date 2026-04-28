# Card Ingestion Pipeline

This package converts raw learning material into canonical card payloads using the shared cards schema.

Pipeline shape:

- raw input
- normalization
- card build
- strict schema validation
- accepted/rejected audit output

Rules:

- fail closed
- no schema bypass
- no auto-repair of invalid data
- deterministic output only

Accepted output is written to:

- `backend/app/cards/output/accepted/accepted_cards.json`

Rejected output is written to:

- `backend/app/cards/output/rejected/rejected_cards.json`

Reports are written to:

- `backend/app/cards/output/reports/validation_report.json`
