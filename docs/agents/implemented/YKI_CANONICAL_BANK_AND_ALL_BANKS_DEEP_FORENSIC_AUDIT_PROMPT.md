# YKI_CANONICAL_BANK_AND_ALL_BANKS_DEEP_FORENSIC_AUDIT_PROMPT.md

You are the forensic YKI bank audit agent for Floently Finnish.

Repository root:
`/home/vitus/floently-finnish/`

## Mission

Deeply and clinically verify that the canonical YKI bank and all secondary/donor banks do not contain hidden problems that could surface as:
- zero-task runtime responses
- wrong level-band selection
- wrong skill coverage
- wrong manifest/index paths
- mixed canonical/donor bank use
- broken runtime file references
- wrong section/task-type mapping
- invalid selected-for-runtime filtering
- drift between exam runtime and practice runtime

This is not a lightweight inventory.
It is a **runtime-integrity forensic audit**.

## Read first

Inspect at minimum:
- `apps/backend/materials/yki/certified_bank/manifest.json`
- `apps/backend/materials/yki/certified_bank/metadata/pool_index.json`
- `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
- `apps/backend/materials/yki/manifest/manifest.json`
- `apps/backend/materials/yki/manifest/task_index_salvaged_tasks.json`
- `apps/backend/materials/yki/manifest/task_index_unusable_tasks.json`
- all YKI-related runtime readers under:
  - `apps/backend/api/routes/`
  - `apps/backend/services/`
  - `apps/backend/yki/`
  - `apps/backend/adapters/`
- engine YKI selectors and schema under:
  - `engine/api/`
  - `engine/exam/`
  - `engine/schema/`
  - `engine/registry/`
  - `engine/tools/`

## Required tasks

1. Verify the canonical authority chain again
2. Verify every manifest/index path used by runtime code
3. Verify per-band totals:
   - A1_A2
   - B1_B2
   - C1_C2
4. Verify per-band skill coverage:
   - reading
   - listening
   - writing
   - speaking
5. Verify task-type coverage:
   - reading_mcq_set
   - listening_mcq_set
   - writing_prompt
   - speaking_roleplay
6. Verify `selected_for_runtime` filtering cannot accidentally zero out a band
7. Verify every `file_path` in the canonical task index exists
8. Compare canonical vs donor/salvaged/unusable side indexes
9. Detect duplicate or conflicting bank files that could confuse future runtime readers
10. Verify that practice readers and exam readers are both pointed at the canonical bank unless intentionally documented otherwise

## Output files

Write all outputs to:
`/home/vitus/floently-finnish/docs/agents/`

Create:
1. `YKI_CANONICAL_BANK_DEEP_AUDIT.md`
2. `YKI_CANONICAL_BANK_DEEP_FILE_LEDGER.json`
3. `YKI_CANONICAL_BANK_RUNTIME_PATHS.md`
4. `YKI_CANONICAL_BANK_DUPLICATE_AND_CONFLICT_REPORT.md`
5. `YKI_CANONICAL_BANK_SELECTED_FOR_RUNTIME_REPORT.md`
6. `YKI_CANONICAL_BANK_OPEN_ISSUES.md`

## Completion rule

You are not done until:
- the canonical bank is either proven healthy or the exact defects are listed
- all donor/secondary banks are classified
- all runtime reader paths are verified
- no hidden bank-level source of zero-task behavior remains unexplained
