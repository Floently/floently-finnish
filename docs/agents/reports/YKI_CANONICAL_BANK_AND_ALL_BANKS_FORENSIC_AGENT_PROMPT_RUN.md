# YKI Canonical Bank And All Banks Forensic Prompt Run

Prompt source:
- `docs/agents/YKI_CANONICAL_BANK_AND_ALL_BANKS_FORENSIC_AGENT_PROMPT.md`

Execution summary:
- inventoried YKI bank manifests and indexes under `apps/backend/materials/yki/`
- checked engine tree for competing indexes
- verified canonical manifest, task index, and pool index against actual files
- verified level-band and skill coverage
- traced backend runtime readers
- identified and repaired stale pool-index path assumptions in:
  - `apps/backend/api/routes/yki_exam.py`
  - `apps/backend/api/routes/yki_practice.py`

Final verdict:
- canonical bank is healthy
- current YKI failures are caused by runtime wiring and external engine availability, not by an empty or broken canonical bank
