You are executing the FINAL RESIDUE CLEANUP for the project at:

/home/vitus/floently-finnish

This is a continuation of the completed 5-pass merge-and-move cleanup.
The duplicate source authorities have already been consolidated.
Your job now is to push the repo to a true 100% cleanup state based on what still remains in the live tree.

Read these files first and treat them as governing inputs:

Governing cleanup matrix:
- /home/vitus/floently-finnish/docs/cleanup/floently_finnish_duplication_cleanup_matrix_v2.md

Final cleanup records:
- /home/vitus/floently-finnish/docs/cleanup/00_cleanup_index.md
- /home/vitus/floently-finnish/docs/cleanup/04_group_by_group_merge_log.md
- /home/vitus/floently-finnish/docs/cleanup/05_quarantine_manifest.md
- /home/vitus/floently-finnish/docs/cleanup/07_verification_results.md
- /home/vitus/floently-finnish/docs/cleanup/09_final_repo_tree.txt
- /home/vitus/floently-finnish/docs/cleanup/10_final_verdict.md
- /home/vitus/floently-finnish/docs/cleanup/11_change_inventory.csv
- /home/vitus/floently-finnish/docs/cleanup/12_change_inventory.json

Pass 5 records:
- /home/vitus/floently-finnish/docs/cleanup/pass_5_report.md
- /home/vitus/floently-finnish/docs/cleanup/pass_5_authority_map.md
- /home/vitus/floently-finnish/docs/cleanup/pass_5_merge_log.md
- /home/vitus/floently-finnish/docs/cleanup/pass_5_quarantine_manifest.md
- /home/vitus/floently-finnish/docs/cleanup/pass_5_verification_results.md
- /home/vitus/floently-finnish/docs/cleanup/pass_5_repo_tree_after.txt
- /home/vitus/floently-finnish/docs/cleanup/pass_5_final_open_items.md

Current saved tree to inspect line by line:
- /home/vitus/floently-finnish/docs/cleanup/floently-finnish-cleaned-tree.txt

This is a MERGE-AND-MOVE cleanup.
This is NOT a freeze/hold/block cleanup.
This is NOT a delete-first cleanup.
This is NOT a feature-development task.

======================================================================
PRIMARY MISSION
======================================================================

Make the live repo 100% clean based on what still remains after Pass 5.

That means:

1. inspect the current saved tree line by line
2. identify every remaining non-canonical residue, runtime artifact root, build/cache artifact, stale cleanup-process path issue, or any final leftover duplicate/authority ambiguity
3. if any remaining file/path still contains needed source behavior:
   - merge that behavior into the canonical survivor first
   - then move the leftover path out
4. if a remaining path is only artifact/cache/runtime residue:
   - move it out of the repo to quarantine
5. if a remaining path should stay in the repo because it is true canonical source or a valid test/helper/support file:
   - document exactly why it stays
6. leave the repo in a final state where no duplicate source authority, no active artifact contamination, and no misleading residue remains

======================================================================
CANONICAL STRUCTURE
======================================================================

The canonical live structure must remain:

/home/vitus/floently-finnish/apps/backend/app/
  adapters/
  audio/
  cards/
  core/
  db/
  integrations/
  middleware/
  models/
  routers/
  runtime/
  services/

/home/vitus/floently-finnish/apps/client/
  app/
  assets/
  components/
  config/
  constants/
  features/
  hooks/
  services/
  state/
  web/

/home/vitus/floently-finnish/packages/
  core/
  ui/

Interpretation:
- no non-canonical duplicate source authority may remain outside those canonical homes
- runtime/build/cache/upload/log/session contamination should not remain in the repo unless a specific file is intentionally needed as a canonical fixture or test asset
- if something remains outside those canonical homes, justify it explicitly or remove/move it

======================================================================
LIKELY REMAINING TARGETS TO REVIEW CAREFULLY
======================================================================

Do not assume these must all be removed blindly.
Inspect them and act based on evidence.

Pay special attention to paths still visible in the current tree, including:
- /home/vitus/floently-finnish/apps/backend/.pytest_cache/
- /home/vitus/floently-finnish/apps/backend/runtime/
- /home/vitus/floently-finnish/apps/backend/app/runtime/state.json
- /home/vitus/floently-finnish/apps/backend/app/runtime/uploads/
- /home/vitus/floently-finnish/apps/backend/app/runtime/uploads/voice/roleplay-session/recording.m4a
- any leftover runtime/cache/build/test artifact roots
- any stale cleanup-doc path drift inside /home/vitus/floently-finnish/docs/cleanup/
- any misleading residue that makes the repo look less canonical than it really is

Also inspect any root-level or backend-level leftovers like:
- /home/vitus/floently-finnish/tts_test.py
- /home/vitus/floently-finnish/everything_remaining_ledger.json
- any non-canonical test/support/ledger/artifact file that may now be dead residue

Important:
Do NOT remove true canonical test/support files merely because they are outside app/*.
Only remove or move them if they are artifacts, dead residue, duplicated authority, or misleading contamination.

======================================================================
NON-NEGOTIABLE RULES
======================================================================

1. No active duplicate source authority may remain in the repo.
2. No runtime/build/cache contamination may remain in the repo unless it is explicitly justified as canonical fixture/test/input.
3. Do not break backend boot/health.
4. Do not break client compile/lint.
5. Do not break cards, YKI, roleplay, auth, onboarding, settings, progress, or routing.
6. If a remaining file contains needed logic, merge it first, then move the leftover.
7. If a remaining file is only artifact residue, move it out directly.
8. Do not leave stale imports, scripts, tests, loaders, or docs pointing to moved paths.
9. Preserve the quarantine model:
   - MOVE, do not copy
   - preserve original relative paths under the quarantine root
10. Do not do new feature work.

======================================================================
QUARANTINE RULES
======================================================================

Quarantine root:
`/home/vitus/floently-finnish-duplication-quarantine/`

Rules:
- DO NOT quarantine inside `/home/vitus/floently-finnish/`
- MOVE duplicates/residue there; do not copy them
- preserve original relative paths

Example:
If moving:
`/home/vitus/floently-finnish/apps/backend/.pytest_cache/...`
it must end up at:
`/home/vitus/floently-finnish-duplication-quarantine/apps/backend/.pytest_cache/...`

After moving:
- confirm the original path no longer exists in the repo
- confirm no live reference points to it

======================================================================
WORKING METHOD
======================================================================

STEP 0 — READ THE TREE AND PRIOR REPORTS
Read the saved tree and the final cleanup reports before changing anything.

STEP 1 — FINAL RESIDUE INVENTORY
Create a residue inventory from the saved tree and the live filesystem.

Classify every remaining suspicious path into one of:
- canonical source, keep
- canonical test/support, keep
- artifact/cache/runtime residue, move
- stale cleanup/process residue, move or normalize
- remaining duplicate/authority ambiguity, merge then move
- uncertain, inspect deeper before deciding

STEP 2 — FORENSIC REVIEW OF EACH REMAINING SUSPICIOUS PATH
For each suspicious path:
- determine whether it is live code, support code, fixture, artifact, or dead residue
- determine whether anything imports or references it
- determine whether any logic must be preserved elsewhere before move

STEP 3 — FINAL MERGE-AND-MOVE
For each removable path:
- merge any required behavior first if needed
- then MOVE the path to quarantine
- rewrite any references
- confirm absence from repo

For each kept path:
- document exactly why it survives and why it is not contamination

STEP 4 — FINAL STALE-REFERENCE SWEEP
Run repo-wide sweeps for:
- moved paths
- artifact roots
- stale cleanup paths
- stale runtime path references
- misleading duplicate authority references

STEP 5 — FINAL VERIFICATION
Run at minimum:

Backend:
- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -c "import main; print('main import ok')"`
- `bash /home/vitus/floently-finnish/apps/backend/scripts/boot_gate.sh`

Client:
- `cd /home/vitus/floently-finnish/apps/client && npx tsc --noEmit`
- `cd /home/vitus/floently-finnish/apps/client && npx expo lint`

Also run targeted sanity checks for any path family you touched.

STEP 6 — FINAL TREE AND FINAL VERDICT
Produce a fresh final repo tree and a final final verdict after this residue cleanup.

======================================================================
SUCCESS CRITERIA
======================================================================

This cleanup is successful only if ALL of the following are true:

1. No active duplicate source authority remains in the repo.
2. No obvious runtime/build/cache/upload/log/session contamination remains in the repo unless explicitly justified as canonical fixture/test/input.
3. Every remaining suspicious path has been classified and either:
   - kept with written justification
   - or moved to quarantine
4. Backend import passes.
5. Backend boot gate passes.
6. Client typecheck passes.
7. Client lint passes.
8. The final repo tree is cleaner than the Pass 5 tree.
9. The final report can honestly claim a 100% cleanup for the repo-local duplication/residue scope.

======================================================================
REPORTING REQUIREMENTS
======================================================================

Write all reports to:

`/home/vitus/floently-finnish/docs/cleanup/`

Create these files:

- `pass_6_residue_cleanup_report.md`
- `pass_6_residue_inventory.md`
- `pass_6_merge_and_move_log.md`
- `pass_6_quarantine_manifest.md`
- `pass_6_verification_results.md`
- `pass_6_repo_tree_after.txt`
- `pass_6_keep_justification.md`
- `pass_6_final_verdict.md`

Also update the global final cleanup files if appropriate:
- `00_cleanup_index.md`
- `04_group_by_group_merge_log.md`
- `05_quarantine_manifest.md`
- `07_verification_results.md`
- `09_final_repo_tree.txt`
- `10_final_verdict.md`
- `11_change_inventory.csv`
- `12_change_inventory.json`

======================================================================
REPORT CONTENT REQUIREMENTS
======================================================================

Your `pass_6_residue_cleanup_report.md` must include:
1. Scope
2. Files/dirs inspected
3. Files/dirs moved to quarantine
4. Files/dirs kept with reasons
5. Any behavior preserved before move
6. Verification commands run
7. Verification results
8. Whether the repo is now fully cleaned to the intended 100% state

Your `pass_6_keep_justification.md` must include:
- every suspicious path reviewed but intentionally kept
- exact reason it remains
- proof that it is not duplicate authority or contamination

Your `pass_6_final_verdict.md` must include:
- overall verdict:
  - PASS
  - PASS WITH QA RISKS
  - FAIL
- whether 100% repo-local cleanup was achieved
- whether any artifact/residue still remains intentionally
- whether backend boot/health was preserved
- whether client compile/lint was preserved
- whether any manual QA is still recommended

======================================================================
IMPORTANT CONSTRAINT
======================================================================

Do the work, not only the plan.
This is the final residue cleanup.
Use the saved tree as evidence, inspect the live repo, clean what remains, justify what stays, verify everything, and write the reports.
