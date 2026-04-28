# YKI runtime repair notes

This pack repairs the split between YKI Practice and YKI Exam at the level-aware/session-aware layer.

## What it changes

- Practice now accepts `level_band` and `focus`
- Practice overview now reads real counts from the YKI task index
- Practice start now creates a guided session with real indexed tasks
- Exam overview now reads:
  - certified total from manifest
  - real task totals from task index
  - section counts and section timings
- Candidate file paths now include the canonical workspace paths under:
  - `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
  - `apps/backend/materials/yki/certified_bank/pool_index.json`
  - `apps/backend/materials/yki/manifest/manifest.json`

## Important limitation

This pack does not replace the governed engine-backed exam start flow under `/api/v1/yki/sessions`.

If the full exam still fails to start after this repair, the likely remaining problem is:
- engine/runtime authority
- auth/feature gating
- or engine-side bank selection

That is why the forensic bank-audit prompt is included.
