You are executing CLEANUP PASS 3 for the project at:

/home/vitus/floently-finnish

Read these files first and treat them as governing inputs for this pass:

1. Cleanup matrix:
`/home/vitus/floently-finnish/docs/cleanup/floently_finnish_duplication_cleanup_matrix.md`

2. Pass 1 outputs:
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_report.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_authority_map.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_merge_log.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_quarantine_manifest.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_verification_results.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_repo_tree_after.txt`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_open_items_for_pass_2.md`

3. Pass 2 outputs:
- `/home/vitus/floently-finnish/docs/cleanup/pass_2_report.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_2_authority_map.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_2_merge_log.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_2_quarantine_manifest.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_2_verification_results.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_2_repo_tree_after.txt`
- `/home/vitus/floently-finnish/docs/cleanup/pass_2_open_items_for_pass_3.md`

This is a MERGE-AND-MOVE cleanup.
This is NOT a freeze/hold/block cleanup.
This is NOT a delete-first cleanup.
This is PASS 3 ONLY.

======================================================================
PASS 3 GOAL
======================================================================

Pass 3 is for:
1. backend structural duplication cleanup
2. consolidation of legacy top-level backend siblings into `apps/backend/app/*`
3. backend router/service/config/auth/session/state ownership consolidation
4. removal of resolved backend duplicate structures from the repo after merge

At the end of Pass 3:
- `apps/backend/app/*` must be the only active backend application authority
  for the areas touched in this pass
- duplicate top-level backend sibling namespaces resolved in this pass must no longer remain in the repo
- imports, loaders, scripts, and tests must no longer point at moved Pass 3 paths
- backend boot/health must still pass
- do not yet do deep cards-authority, YKI-authority, or engine-adjacent merges unless a tiny supporting rewrite is strictly necessary to complete a Pass 3 structural merge safely

======================================================================
CANONICAL STRUCTURE FOR THIS PASS
======================================================================

For Pass 3, the surviving canonical backend application structure is:

/home/vitus/floently-finnish/apps/backend/app/
  core/
  db/
  routers/
  services/
  runtime/
  integrations/
  middleware/
  models/
  adapters/
  cards/
  audio/

Interpretation for this pass:
- `apps/backend/app/*` is the canonical backend application layer.
- top-level backend sibling namespaces under `apps/backend/*` that overlap with those responsibilities must be merged into the canonical `app/*` survivor and then moved out of the repo.
- this pass is about structural backend duplication, not yet the deep authority repair of cards, YKI, or engine.

======================================================================
PASS 3 MANDATORY TARGETS
======================================================================

You must resolve these in Pass 3, where they overlap with canonical `apps/backend/app/*` ownership:

A. Top-level backend structural duplicates
- `apps/backend/api/`
- `apps/backend/audio/`
- `apps/backend/cards/`
- `apps/backend/db/`
- `apps/backend/learning/`
- `apps/backend/services/`
- any other top-level backend sibling namespace that duplicates responsibility already present under `apps/backend/app/*`

B. Backend config/auth/session/state authority overlap
- duplicate OAuth responsibility
- duplicate state store or session authority
- duplicate config/security/helper ownership
- duplicate DB/model authority where it overlaps with `apps/backend/app/db/*` and `apps/backend/app/models/*`

C. Router/service overlap for non-cards, non-YKI structural families
- versioned vs unversioned router overlap where clearly part of the same responsibility
- service wrappers/sibling modules whose live behavior belongs under `apps/backend/app/services/*`
- integration wrappers whose live behavior belongs under `apps/backend/app/integrations/*`

D. Runtime/build/artifact contamination still inside backend source structure if it is directly part of these resolved duplicate families
Only if resolving that contamination is necessary to complete the structural merge safely in this pass.

======================================================================
DO NOT DO THESE YET
======================================================================

Do NOT do Pass 4+ work in this prompt.
Do NOT do the full cards authority-chain merge yet.
Do NOT do the full YKI authority-chain merge yet.
Do NOT do engine-adjacent overlap resolution yet.
Do NOT do broad content-bank migration work yet.
Do NOT do broad docs cleanup beyond tiny reference rewrites strictly needed to complete Pass 3 safely.

If you encounter those, document them for Pass 4+ and stop at reporting.

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
`/home/vitus/floently-finnish/apps/backend/api/...`
must become
`/home/vitus/floently-finnish-duplication-quarantine/apps/backend/api/...`

After moving:
- confirm the original path no longer exists inside the repo
- confirm no imports/scripts/configs/tests point to it

======================================================================
WORKING METHOD FOR PASS 3
======================================================================

STEP 0 — READ THE MATRIX AND PASS 1 / PASS 2 OUTPUTS
Use the cleanup matrix and prior pass outputs as governing context.
Treat Pass 1 and Pass 2 as complete and do not reopen them unless a tiny reference fix is absolutely necessary for Pass 3 safety.

STEP 1 — INVENTORY PASS 3 AUTHORITIES
Determine exactly which Pass 3 backend paths are still acting as live authority.
Inspect:
- `apps/backend/app/**`
- `apps/backend/api/**`
- `apps/backend/audio/**`
- `apps/backend/cards/**`
- `apps/backend/db/**`
- `apps/backend/learning/**`
- `apps/backend/services/**`
- `apps/backend/main.py`
- `apps/backend/api_contract.py`
- backend tests and scripts that may still reference legacy sibling paths

Produce a Pass 3 authority map before editing.

STEP 2 — FORENSIC COMPARISON
For each Pass 3 duplicate family:
- diff overlapping backend files deeply
- identify functions/classes/helpers/routes/config/schema exports existing only in legacy sibling paths
- identify drift between sibling paths and canonical `apps/backend/app/*` paths
- identify dead wrappers vs still-useful behavior
- identify import/test/script dependencies that still target legacy sibling paths

Classify every discovered piece as:
- must merge into canonical survivor
- already duplicated, safe to keep only one
- obsolete legacy behavior
- dead residue
- belongs to cards/YKI/engine later pass, document and do not fully resolve now unless a tiny supporting rewrite is necessary

Do not move anything yet.

STEP 3 — CANONICAL MERGE
Merge all still-useful behavior for this pass into canonical survivor locations under `apps/backend/app/*`.

Rules:
- backend route authority should survive under `apps/backend/app/routers/*`
- backend service authority should survive under `apps/backend/app/services/*`
- integration authority should survive under `apps/backend/app/integrations/*`
- DB/model authority should survive under `apps/backend/app/db/*` and `apps/backend/app/models/*`
- state/config/security/helper authority should survive under `apps/backend/app/core/*`
- preserve imports, response shapes, startup/bootstrap behavior, and helper contracts unless a correction is clearly necessary

Do not preserve duplicate top-level sibling authorities after parity is complete.

STEP 4 — REWRITE REFERENCES
Rewrite imports and references so that:
- no live code points to moved Pass 3 sibling paths
- `apps/backend/app/*` is the only active backend application authority for the resolved groups
- backend scripts/tests/imports resolve only to canonical survivors
- root-level helpers or wrappers no longer act as competing authority

STEP 5 — VERIFY BEFORE MOVE
Run at minimum:
- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -c "import main; print('main import ok')"`
- `bash /home/vitus/floently-finnish/apps/backend/scripts/boot_gate.sh`

Also run additional targeted checks as needed:
- grep/import sanity for moved backend sibling paths
- targeted pytest for touched backend areas
- router import sanity
- auth/session/import checks if touched
- non-cards/non-YKI route smoke checks if touched

If verification fails, continue fixing Pass 3 parity.
Do not leave duplicates in repo as fallback.

STEP 6 — MOVE TO QUARANTINE
Once Pass 3 parity is complete:
- MOVE every resolved duplicate tree/file from this pass into `/home/vitus/floently-finnish-duplication-quarantine/`
- confirm they are gone from the repo
- confirm canonical backend authority is now obvious for the groups touched

STEP 7 — FINAL PASS 3 SWEEP
Run repo-wide searches to confirm there are no stale references to Pass 3 moved paths.

======================================================================
PASS 3 SUCCESS CRITERIA
======================================================================

Pass 3 is successful only if ALL of the following are true:

1. The backend structural groups touched in this pass now have one active authority under `apps/backend/app/*`.
2. Resolved top-level backend sibling paths from this pass are no longer in the repo.
3. No stale imports/reference paths point to moved Pass 3 paths.
4. `cd apps/backend && .venv/bin/python -c "import main; print('main import ok')"` passes.
5. `bash apps/backend/scripts/boot_gate.sh` passes.
6. The backend structure is more canonical and less ambiguous than after Pass 2.
7. Cards/YKI/engine work is left only as documented Pass 4+ open items, not intermixed unresolved duplication from this pass.

======================================================================
REPORTING REQUIREMENTS
======================================================================

Write all Pass 3 reports to:

`/home/vitus/floently-finnish/docs/cleanup/`

Create or update these files specifically for Pass 3:

- `pass_3_report.md`
- `pass_3_authority_map.md`
- `pass_3_merge_log.md`
- `pass_3_quarantine_manifest.md`
- `pass_3_verification_results.md`
- `pass_3_repo_tree_after.txt`
- `pass_3_open_items_for_pass_4.md`

Also update, if appropriate:
- `00_cleanup_index.md`
- `04_group_by_group_merge_log.md`
- `05_quarantine_manifest.md`
- `07_verification_results.md`
- `11_change_inventory.csv`
- `12_change_inventory.json`

======================================================================
PASS 3 REPORT CONTENT
======================================================================

Your `pass_3_report.md` must include:

1. Scope of Pass 3
2. Exact files/dirs inspected
3. Exact files/dirs merged into canonical locations
4. Exact files/dirs moved to quarantine
5. What behavior/config/routes/helpers were preserved before move
6. Verification commands run
7. Verification results
8. Whether Pass 3 is complete
9. Exact recommendations for Pass 4 based on what remains

Your `pass_3_open_items_for_pass_4.md` must include only:
- what remains after Pass 3
- what you learned that should shape Pass 4
- no actual Pass 4 edits

======================================================================
IMPORTANT CONSTRAINT
======================================================================

Do the work for Pass 3 only.
Do not jump ahead.
Do not leave resolved Pass 3 duplicates inside the repo.
Do not freeze anything from this pass.
Resolve, merge, verify, move, and report.
