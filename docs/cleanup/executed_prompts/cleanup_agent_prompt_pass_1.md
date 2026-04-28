You are executing CLEANUP PASS 1 for the project at:

/home/vitus/floently-finnish

Read this file first and treat it as the governing cleanup matrix for this pass:
`/home/vitus/floently-finnish/docs/cleanup/floently_finnish_duplication_cleanup_matrix_v2.md`

This is a MERGE-AND-MOVE cleanup.
This is NOT a freeze/hold/block cleanup.
This is NOT a delete-first cleanup.
This is NOT a multi-pass blur where you do later work now.

You are doing PASS 1 ONLY.

======================================================================
PASS 1 GOAL
======================================================================

Pass 1 is for:
1. contamination cleanup
2. mobile build tree deduplication/removal
3. root mobile app-root deduplication
4. backup/build/runtime artifact removal from the repo
5. merging any still-useful mobile config/bootstrap behavior into the canonical client app before moving duplicates out

At the end of Pass 1:
- the repo must have only one active client app root: `apps/client/*`
- native mobile build trees must be moved out of the repo
- backup/build/cache/runtime artifact contamination targeted in this pass must be moved out of the repo
- no duplicate mobile root files targeted in this pass may remain inside the repo
- the repo must still be able to compile/lint the client as far as the environment allows

======================================================================
CANONICAL STRUCTURE FOR THIS PASS
======================================================================

For Pass 1, the surviving canonical client structure is:

apps/client/
  app/
  state/
  services/
  features/
  components/
  config/
  constants/
  hooks/
  assets/
  web/
  core/

Important:
- Native Android/iOS build trees are NOT surviving in the repo for now.
- They will be rebuilt later from scratch when mobile deployment resumes.
- Therefore, native build trees are merge-then-move targets in this pass, not survivors.

Root monorepo governance files are NOT automatically part of this pass unless they are clearly acting as duplicate mobile app-root authority.
Do not wander into unrelated monorepo cleanup in Pass 1.

======================================================================
PASS 1 MANDATORY TARGETS
======================================================================

You must resolve these in Pass 1:

A. Root mobile app-root duplication
- `App.tsx`
- `index.js`
- root `app.json`
- root `babel.config.js`
- root `metro.config.js`

B. Native/build trees to remove from repo after merge
- root `android/`
- root `ios/`
- `apps/client/android/`
- `android_backup_before_prebuild/`

C. Build/runtime/artifact contamination relevant to this pass
- build caches
- native build caches
- backup trees
- runtime artifacts in clearly non-canonical mobile/build roots
- any generated/build-only material in the above trees

You may also move clearly related contamination discovered during this pass if and only if it belongs to the same resolved mobile/build duplication family.

======================================================================
DO NOT DO THESE YET
======================================================================

Do NOT do Pass 2+ work in this prompt.
Do NOT touch deep backend structural merges yet.
Do NOT touch cards authority merges yet.
Do NOT touch YKI authority merges yet.
Do NOT touch engine-adjacent merges yet.
Do NOT clean unrelated backend duplication in this pass.

If you encounter those, document them for Pass 2+ and stop at reporting, unless a tiny import rewrite is strictly necessary to complete Pass 1 safely.

======================================================================
QUARANTINE RULES
======================================================================

Quarantine root:
`/home/vitus/floently-finnish-duplication-quarantine/`

Rules:
- DO NOT quarantine inside `/home/vitus/floently-finnish/`
- MOVE duplicates there; do not copy them
- preserve original relative paths

Example:
`/home/vitus/floently-finnish/android_backup_before_prebuild/...`
must become
`/home/vitus/floently-finnish-duplication-quarantine/android_backup_before_prebuild/...`

After moving:
- confirm the original path no longer exists inside the repo
- confirm no imports/scripts/configs point to it

======================================================================
WORKING METHOD FOR PASS 1
======================================================================

STEP 0 — READ THE MATRIX
Read:
`/home/vitus/floently-finnish/docs/cleanup/floently_finnish_duplication_cleanup_matrix_v2.md`

Use it as the governing source for:
- canonical targets
- merge-first rules
- pass boundaries
- quarantine expectations

STEP 1 — INVENTORY PASS 1 AUTHORITIES
Determine exactly which of the Pass 1 files/trees are still acting as live mobile authority.
Inspect:
- root mobile app-root files
- `apps/client/*`
- root/native configs
- client package/build config
- any scripts or references that still depend on root mobile roots or native trees

Produce an authority map before editing.

STEP 2 — FORENSIC COMPARISON
For each Pass 1 duplicate family:
- compare root mobile files to their canonical equivalents under `apps/client/*`
- compare root/native tree config/metadata/permissions/build settings to what must survive in canonical client config
- identify what is:
  - required behavior/config to merge
  - dead duplication
  - rebuildable native/build output
  - backup-only material

Do not move anything yet.

STEP 3 — CANONICAL MERGE
Merge any required still-useful behavior into the surviving canonical client authority under `apps/client/*`.

Examples of things that may need to be preserved if present:
- Expo app config values
- route/bootstrap expectations
- Metro/Babel behavior required by `apps/client`
- permissions/config details that are still needed in app config
- any root mobile bootstrap logic still required by the current client structure

Do not preserve native build trees themselves. Only preserve the required behavior/configuration.

STEP 4 — REWRITE REFERENCES
Rewrite any references so that:
- `apps/client/*` is the only active client app root
- no scripts/imports/configs still depend on root mobile app-root duplicates
- no scripts/imports/configs still depend on native trees being present in the repo for this stage

STEP 5 — VERIFY BEFORE MOVE
Run at minimum:
- `cd /home/vitus/floently-finnish/apps/client && npx tsc --noEmit`
- `cd /home/vitus/floently-finnish/apps/client && npx expo lint`

Also run any additional small-scope verification needed to prove Pass 1 succeeded, such as:
- route/module import sanity checks
- grep checks for stale references to moved root mobile files or native trees
- config resolution checks

If a verification fails, continue fixing parity for Pass 1.
Do not leave duplicates in repo as a fallback.

STEP 6 — MOVE TO QUARANTINE
Once Pass 1 parity is complete:
- MOVE every resolved duplicate tree/file from this pass into `/home/vitus/floently-finnish-duplication-quarantine/`
- confirm they are gone from the repo
- confirm the canonical client root is now obvious

STEP 7 — FINAL PASS 1 SWEEP
Run repo-wide searches to confirm there are no stale references to Pass 1 moved paths.

======================================================================
PASS 1 SUCCESS CRITERIA
======================================================================

Pass 1 is successful only if ALL of the following are true:

1. `apps/client/*` is the only active client app root left in the repo.
2. Root duplicate mobile app-root files targeted in this pass are no longer in the repo.
3. Native build trees targeted in this pass are no longer in the repo.
4. `android_backup_before_prebuild/` is no longer in the repo.
5. No stale import/script/config references point to moved paths from this pass.
6. `cd apps/client && npx tsc --noEmit` passes.
7. `cd apps/client && npx expo lint` passes.
8. The repo is cleaner and still internally coherent for the client side.

======================================================================
REPORTING REQUIREMENTS
======================================================================

Write all Pass 1 reports to:

`/home/vitus/floently-finnish/docs/cleanup/`

Create or update these files specifically for Pass 1:

- `pass_1_report.md`
- `pass_1_authority_map.md`
- `pass_1_merge_log.md`
- `pass_1_quarantine_manifest.md`
- `pass_1_verification_results.md`
- `pass_1_repo_tree_after.txt`
- `pass_1_open_items_for_pass_2.md`

Also update, if appropriate:
- `00_cleanup_index.md`
- `04_group_by_group_merge_log.md`
- `05_quarantine_manifest.md`
- `07_verification_results.md`
- `11_change_inventory.csv`
- `12_change_inventory.json`

======================================================================
PASS 1 REPORT CONTENT
======================================================================

Your `pass_1_report.md` must include:

1. Scope of Pass 1
2. Exact files/dirs inspected
3. Exact files/dirs merged into canonical locations
4. Exact files/dirs moved to quarantine
5. What behavior/config was preserved before move
6. Verification commands run
7. Verification results
8. Whether Pass 1 is complete
9. Exact recommendations for Pass 2 based on what remains

Your `pass_1_open_items_for_pass_2.md` must include only:
- what remains after Pass 1
- what you learned that should shape Pass 2
- no actual Pass 2 edits

======================================================================
IMPORTANT CONSTRAINT
======================================================================

Do the work for Pass 1 only.
Do not jump ahead.
Do not leave resolved Pass 1 duplicates inside the repo.
Do not freeze anything from this pass.
Resolve, merge, verify, move, and report.
