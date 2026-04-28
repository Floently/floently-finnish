# YKI Canonical Bank Deep Audit

Canonical bank verdict: `HEALTHY BUT RUNTIME WIRING BROKEN`

Root cause class: `mixed`

## Final Verdict
- The canonical YKI bank is healthy.
- No hidden bank-level zero-task defect was found.
- The previous exam overview failure was caused by a stale pool-index path assumption and has been repaired.
- The remaining full-exam start failure is not a bank-integrity issue. It is caused by engine unavailability, and the adapter does not currently provide the in-process fallback described in `YKI_ENGINE_RUNTIME_FIX_NOTES.md`.

## Canonical Authority Chain
- Canonical bank root:
  - `apps/backend/materials/yki/certified_bank/`
- Canonical manifest:
  - `apps/backend/materials/yki/certified_bank/manifest.json`
- Canonical pool index:
  - `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
- Canonical runtime task index:
  - `apps/backend/materials/yki/task_banks/task_index_v3_2.json`

## Deep Findings
- `task_index_v3_2.json` has `9706` entries.
- Manifest level totals exactly match runtime index totals:
  - `A1_A2`: `2092`
  - `B1_B2`: `3882`
  - `C1_C2`: `3732`
- Per-band skill coverage exists for all required skills:
  - reading
  - listening
  - writing
  - speaking
- Per-band runtime-index task-type coverage exists for all required task types:
  - `reading_mcq_set`
  - `listening_mcq_set`
  - `writing_prompt`
  - `speaking_roleplay`
- `selected_for_runtime` does not zero out anything:
  - `selected_for_runtime = false`: `0`
- Every `file_path` in the canonical task index resolves to an existing file.
- No duplicate `task_id` values were found.
- No duplicate `file_path` values were found.

## Secondary / Donor / Side Indexes
- `apps/backend/materials/yki/manifest/manifest.json`
  - compatible secondary mirror
- `apps/backend/materials/yki/manifest/task_index_salvaged_tasks.json`
  - donor-side file, currently empty
- `apps/backend/materials/yki/manifest/task_index_unusable_tasks.json`
  - reject-side file, currently empty
- No competing bank/index files were found under `engine/`.

## Runtime Reader Integrity
- Practice and exam overview readers both point to the canonical task index and canonical manifest family.
- They previously used a stale pool-index candidate path:
  - `certified_bank/pool_index.json`
- Actual canonical path is:
  - `certified_bank/metadata/pool_index.json`
- That path bug has been repaired in:
  - `apps/backend/api/routes/yki_exam.py`
  - `apps/backend/api/routes/yki_practice.py`

## Remaining Root Cause
- Full exam start uses:
  - `apps/backend/services/yki_service.py`
  - `apps/backend/yki/runtime.py`
  - `apps/backend/adapters/yki_engine_adapter.py`
- That path calls `SETTINGS.yki_engine_base_url`.
- During audit:
  - `http://localhost:8010` was unreachable
  - `http://127.0.0.1:8181` was unreachable
- The live adapter code still raises `YKI_ENGINE_UNAVAILABLE`; it does not yet fall back to the in-process engine runtime described in `YKI_ENGINE_RUNTIME_FIX_NOTES.md`.

## Conclusion
- There is no remaining bank-level explanation for zero-task or wrong-band behavior.
- Remaining YKI runtime failures are explained by:
  - fixed overview/practice path bug
  - unresolved engine availability / fallback implementation gap
