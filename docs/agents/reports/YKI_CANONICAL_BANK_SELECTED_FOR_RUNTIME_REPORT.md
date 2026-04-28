# YKI Canonical Bank Selected For Runtime Report

## Selected-for-runtime Audit

Primary file:
- `apps/backend/materials/yki/task_banks/task_index_v3_2.json`

## Findings
- Total entries: `9706`
- Entries with `selected_for_runtime = false`: `0`
- Therefore, no level band can be accidentally zeroed out by this filter.

## Per-Band Runtime Availability

### A1_A2
- reading_mcq_set: `282`
- listening_mcq_set: `175`
- writing_prompt: `1282`
- speaking_roleplay: `353`

### B1_B2
- reading_mcq_set: `965`
- listening_mcq_set: `227`
- writing_prompt: `2046`
- speaking_roleplay: `644`

### C1_C2
- reading_mcq_set: `864`
- listening_mcq_set: `216`
- writing_prompt: `2139`
- speaking_roleplay: `513`

## Conclusion
- `selected_for_runtime` is not a source of hidden zero-task behavior.
- Any zero-task runtime behavior must come from:
  - wrong path selection
  - wrong reader logic
  - engine/runtime failure
  - or frontend-side handling
