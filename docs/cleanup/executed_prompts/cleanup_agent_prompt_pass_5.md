You are executing CLEANUP PASS 5 for the project at:

/home/vitus/floently-finnish

Read these files first and treat them as governing inputs for this pass:

1. Cleanup matrix:
`/home/vitus/floently-finnish/docs/cleanup/floently_finnish_duplication_cleanup_matrix_v2.md`

If the non-`_v2` matrix path also exists, compare it and note any drift in the Pass 5 report. If only one exists, use the one that actually exists in the repo and record that explicitly.

2. Pass 1 outputs (read from their actual in-repo locations; if they were moved under `read_reports/`, use those):
- `pass_1_report.md`
- `pass_1_authority_map.md`
- `pass_1_merge_log.md`
- `pass_1_quarantine_manifest.md`
- `pass_1_verification_results.md`
- `pass_1_repo_tree_after.txt`
- `pass_1_open_items_for_pass_2.md`

3. Pass 2 outputs:
- `pass_2_report.md`
- `pass_2_authority_map.md`
- `pass_2_merge_log.md`
- `pass_2_quarantine_manifest.md`
- `pass_2_verification_results.md`
- `pass_2_repo_tree_after.txt`
- `pass_2_open_items_for_pass_3.md`

4. Pass 3 outputs:
- `pass_3_report.md`
- `pass_3_authority_map.md`
- `pass_3_merge_log.md`
- `pass_3_quarantine_manifest.md`
- `pass_3_verification_results.md`
- `pass_3_repo_tree_after.txt`
- `pass_3_open_items_for_pass_4.md`

5. Pass 4 outputs:
- `pass_4_report.md`
- `pass_4_authority_map.md`
- `pass_4_merge_log.md`
- `pass_4_quarantine_manifest.md`
- `pass_4_verification_results.md`
- `pass_4_repo_tree_after.txt`
- `pass_4_open_items_for_pass_5.md`

This is a MERGE-AND-MOVE cleanup.
This is NOT a freeze/hold/block cleanup.
This is NOT a delete-first cleanup.
This is PASS 5 ONLY.
This is the final canonical sweep and finalization pass.

======================================================================
PASS 5 GOAL
======================================================================

Pass 5 is for:
1. final canonical sweep of any duplication or authority ambiguity left after Pass 4
2. engine-adjacent boundary cleanup only where repo-local duplication or ambiguity still remains
3. final cleanup of residual runtime-authority ambiguity between canonical survivors
4. final normalization of cleanup docs/report paths so the repo’s cleanup record is internally coherent
5. final stale-reference sweep
6. final verification
7. final canonical repo tree
8. final cleanup verdict

At the end of Pass 5:
- no active duplicate source authority may remain in the repo
- any remaining repo-local overlap discovered in this pass must be resolved by merge-and-move
- cleanup docs paths must be normalized enough that the final cleanup record is internally consistent
- the final repo tree must make the canonical structure obvious
- backend boot/health must still pass
- client compile/lint must still pass
- final verdict must be recorded with evidence

======================================================================
CANONICAL STRUCTURE FOR THIS PASS
======================================================================

The surviving canonical structure at the end of Pass 5 must be:

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
  core/    (only if still truly app-local after prior passes)
  features/
  hooks/
  services/
  state/
  web/

/home/vitus/floently-finnish/packages/
  core/
  ui/

Interpretation:
- one active authority per responsibility
- no legacy sibling backend authorities
- no legacy client feature/navigation/mobile roots
- no top-level cards/audio/yki namespace bridges
- no active duplication left in repo
- remaining external engine dependency is allowed only as an external dependency boundary, not as repo-local duplicated application authority

======================================================================
PASS 5 MANDATORY TARGETS
======================================================================

You must resolve these in Pass 5:

A. Final engine-adjacent YKI boundary review
- inspect the remaining split involving:
  - `apps/backend/app/routers/yki_exam.py`
  - `apps/backend/app/routers/yki_practice.py`
  - any external engine-facing flow still used by those routes
- if there is still repo-local duplication or ambiguous authority, merge it now
- if the engine remains an external subsystem boundary rather than a duplicate authority, document that clearly and verify that only the canonical `app/*` chain is the live caller boundary

B. Final cards runtime ambiguity review
- inspect whether any residual ambiguity remains between:
  - `apps/backend/app/runtime/cards_logic.py`
  - `apps/backend/app/cards/**`
  - `apps/backend/app/services/cards_service.py`
  - `apps/backend/app/routers/v1_cards.py`
- if two repo-local places still share the same responsibility ambiguously, resolve that now
- if they are distinct layers with one clear authority chain, document that explicitly

C. Final cleanup-doc normalization
- normalize cleanup report locations and path assumptions enough that:
  - the matrix path referenced by the reports is accurate
  - prior-pass report references are accurate
  - the final cleanup record is coherent
- this is not a general docs rewrite; only fix cleanup-process path drift and record ownership

D. Final stale-reference sweep
- search repo-wide for moved/quarantined paths and stale authorities
- if any live non-doc code still points at moved paths, fix it now

E. Final residual artifact/duplicate sweep
- if any runtime/build/cache/source contamination still remains in repo as active-looking structure, resolve it now
- do not reopen completed passes unless a small final fix is required

======================================================================
DO NOT DO
======================================================================

Do NOT start new feature work.
Do NOT start content-bank augmentation work.
Do NOT redesign the engine.
Do NOT broaden into unrelated refactors outside the final canonical sweep.
Only resolve duplication, authority ambiguity, path drift, and final cleanup coherence.

======================================================================
QUARANTINE RULES
======================================================================

Quarantine root:
`/home/vitus/floently-finnish-duplication-quarantine/`

Rules:
- DO NOT quarantine inside `/home/vitus/floently-finnish/`
- MOVE duplicates there; do not copy them
- preserve original relative paths

If Pass 5 discovers any remaining duplicate source paths that must be removed:
- merge required behavior into the canonical survivor first
- then MOVE them into quarantine
- confirm they are gone from the repo
- confirm no live references remain

======================================================================
WORKING METHOD FOR PASS 5
======================================================================

STEP 0 — READ THE MATRIX AND PRIOR PASS OUTPUTS
Use the cleanup matrix and Passes 1–4 outputs as governing context.
Treat earlier passes as complete unless a tiny reference/path correction is needed to finish final canonicalization.

STEP 1 — INVENTORY FINAL AUTHORITIES
Determine whether any repo-local active duplication or authority ambiguity still exists after Pass 4.
Inspect at minimum:
- `apps/backend/app/routers/yki_exam.py`
- `apps/backend/app/routers/yki_practice.py`
- relevant engine-facing callers they depend on
- `apps/backend/app/runtime/cards_logic.py`
- `apps/backend/app/cards/**`
- `apps/backend/app/services/cards_service.py`
- `apps/backend/app/routers/v1_cards.py`
- cleanup report locations under `docs/cleanup/`
- repo-wide references to moved paths

Produce a Pass 5 authority map before editing.

STEP 2 — FORENSIC COMPARISON
For each remaining ambiguous family:
- identify whether this is true duplication, boundary layering, or documentation/path drift
- if duplication remains, compare deeply and classify:
  - must merge into canonical survivor
  - already layered correctly, no merge needed
  - dead residue
  - stale path/reference only

Do not move anything yet.

STEP 3 — FINAL CANONICAL MERGE
Resolve any remaining repo-local duplication or authority ambiguity.
Rules:
- if YKI route/runtime/service ownership is still ambiguous, resolve it into one clear `app/*` chain
- if cards runtime/service authority is still ambiguous, resolve it into one clear `app/*` chain
- if cleanup docs paths are wrong, normalize them so the final cleanup report is internally coherent
- preserve runtime behavior, route behavior, and existing passing verification wherever possible

STEP 4 — REWRITE FINAL REFERENCES
Rewrite any remaining stale imports, loader paths, report paths, test references, and config references so that:
- no live non-doc code points to moved paths
- final cleanup docs point to real files
- canonical authority is obvious

STEP 5 — VERIFY BEFORE FINALIZE
Run at minimum:

Backend:
- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -c "import main; print('main import ok')"`
- `bash /home/vitus/floently-finnish/apps/backend/scripts/boot_gate.sh`

Frontend/client:
- `cd /home/vitus/floently-finnish/apps/client && npx tsc --noEmit`
- `cd /home/vitus/floently-finnish/apps/client && npx expo lint`

Also run:
- repo-wide grep for stale moved-path references
- targeted YKI import/runtime sanity if touched
- targeted cards runtime sanity if touched

If a verification fails, fix the final canonicalization until it passes or document exactly why a remaining external dependency prevents full runtime verification.

STEP 6 — MOVE ANY FINAL DUPLICATES
If Pass 5 resolved any remaining duplicate source paths:
- MOVE them to quarantine
- confirm absence from repo
- confirm no live references remain

STEP 7 — FINAL GLOBAL SWEEP
Re-scan the repo for:
- duplicate active source authorities
- moved-path references
- stale namespace imports
- cleanup-doc path drift
- active-looking artifact contamination

STEP 8 — FINAL TREE AND VERDICT
Produce the final repo tree and final cleanup verdict.

======================================================================
PASS 5 SUCCESS CRITERIA
======================================================================

Pass 5 is successful only if ALL of the following are true:

1. No active duplicate source authority remains in the repo.
2. Any remaining engine interaction is clearly an external subsystem boundary, not repo-local duplicate application authority.
3. Cards authority is either fully canonicalized or explicitly documented as one clear canonical chain with no residual ambiguity.
4. YKI authority is either fully canonicalized or explicitly documented as one clear canonical chain with no residual ambiguity.
5. Cleanup-doc/report paths are internally coherent.
6. `cd apps/backend && .venv/bin/python -c "import main; print('main import ok')"` passes.
7. `bash apps/backend/scripts/boot_gate.sh` passes.
8. `cd apps/client && npx tsc --noEmit` passes.
9. `cd apps/client && npx expo lint` passes.
10. The final repo tree shows one obvious canonical structure.

======================================================================
REPORTING REQUIREMENTS
======================================================================

Write all Pass 5 reports to:

`/home/vitus/floently-finnish/docs/cleanup/`

Create or update these files specifically for Pass 5:

- `pass_5_report.md`
- `pass_5_authority_map.md`
- `pass_5_merge_log.md`
- `pass_5_quarantine_manifest.md`
- `pass_5_verification_results.md`
- `pass_5_repo_tree_after.txt`
- `pass_5_final_open_items.md`

Also finalize these global files:
- `00_cleanup_index.md`
- `04_group_by_group_merge_log.md`
- `05_quarantine_manifest.md`
- `07_verification_results.md`
- `09_final_repo_tree.txt`
- `10_final_verdict.md`
- `11_change_inventory.csv`
- `12_change_inventory.json`

======================================================================
PASS 5 REPORT CONTENT
======================================================================

Your `pass_5_report.md` must include:

1. Scope of Pass 5
2. Exact files/dirs inspected
3. Exact files/dirs merged into canonical locations
4. Exact files/dirs moved to quarantine
5. What behavior/routes/helpers/contracts/path ownership were preserved before move
6. Verification commands run
7. Verification results
8. Whether Pass 5 is complete
9. Final statement on whether the repo is now canonically deduplicated

Your `pass_5_final_open_items.md` must include only:
- residual manual QA risks
- external deployment/runtime prerequisites if any
- no remaining duplicate-source cleanup work left in the repo

======================================================================
FINAL VERDICT FORMAT
======================================================================

In `10_final_verdict.md`, provide:
- overall verdict:
  - PASS
  - PASS WITH QA RISKS
  - FAIL
- whether duplication was fully removed from the live repo
- whether all overlap groups were resolved by merge-and-move
- whether backend boot/health was preserved
- whether client compile/lint was preserved
- whether any manual QA is still recommended
- whether any recovery fallback from quarantine or backup might still be prudent

======================================================================
IMPORTANT CONSTRAINT
======================================================================

Do the work for Pass 5 only.
Do not leave any resolved duplicate source structure in the repo.
Do not freeze anything from this pass.
Finish the cleanup, verify it, and record the final state.
