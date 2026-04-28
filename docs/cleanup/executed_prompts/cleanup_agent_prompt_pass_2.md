You are executing CLEANUP PASS 2 for the project at:

/home/vitus/floently-finnish

Read these files first and treat them as governing inputs for this pass:

1. Cleanup matrix:
`/home/vitus/floently-finnish/docs/cleanup/floently_finnish_duplication_cleanup_matrix_v2.md`

2. Pass 1 outputs:
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_report.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_authority_map.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_merge_log.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_quarantine_manifest.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_verification_results.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_repo_tree_after.txt`
- `/home/vitus/floently-finnish/docs/cleanup/pass_1_open_items_for_pass_2.md`

This is a MERGE-AND-MOVE cleanup.
This is NOT a freeze/hold/block cleanup.
This is NOT a delete-first cleanup.
This is PASS 2 ONLY.

======================================================================
PASS 2 GOAL
======================================================================

Pass 2 is for:
1. client-side duplicate feature tree consolidation
2. client-side duplicate navigation/route support consolidation
3. shared client authority consolidation where `apps/client/*` overlaps with `packages/*`
4. removing stale client-side duplicate structures from the repo after merge

At the end of Pass 2:
- `apps/client/features/*` must be the only active client feature tree
- `apps/client/src/features/*` must no longer remain in the repo
- `apps/client/src/navigation/*` must no longer remain in the repo
- overlapping client-owned API/config authority must be consolidated correctly
- no imports or references may point to moved Pass 2 paths
- client compile/lint must still pass

======================================================================
CANONICAL STRUCTURE FOR THIS PASS
======================================================================

For Pass 2, the surviving canonical client-side structure is:

/home/vitus/floently-finnish/apps/client/
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

/home/vitus/floently-finnish/packages/
  core/
  ui/

Interpretation for this pass:
- `apps/client/features/*` is the canonical client feature tree.
- `apps/client/state/*`, `apps/client/config/*`, `apps/client/services/*`, and `apps/client/app/*` are the canonical app-local ownership layers.
- `packages/core/*` and `packages/ui/*` remain canonical shared layers, but only where they are truly shared.
- If `apps/client/core/*` duplicates `packages/core/*`, merge to the right long-term authority and move the duplicate out of the repo.
- The goal is one active authority per responsibility.

======================================================================
PASS 2 MANDATORY TARGETS
======================================================================

You must resolve these in Pass 2:

A. Client feature duplication
- `apps/client/features/*`
- `apps/client/src/features/*`

B. Client navigation/route duplication
- `apps/client/src/navigation/*`
- any overlapping route ownership already present in:
  - `apps/client/app/*`
  - `apps/client/state/*`
  - `apps/client/config/*`

C. Shared client config/API overlap
- `apps/client/core/*`
- `packages/core/*`
especially where API/config/auth/billing/environment behavior overlaps

D. Any small adjacent client-side duplicate helpers discovered as part of the above groups
Only if they clearly belong to the same resolved authority family.

======================================================================
DO NOT DO THESE YET
======================================================================

Do NOT do Pass 3+ work in this prompt.
Do NOT touch deep backend structural merges yet.
Do NOT touch backend legacy siblings vs `apps/backend/app/*` yet.
Do NOT touch cards authority-chain merges yet.
Do NOT touch YKI authority-chain merges yet.
Do NOT touch engine-adjacent merges yet.
Do NOT do broad docs cleanup beyond tiny reference rewrites strictly needed to complete Pass 2 safely.

If you encounter those, document them for Pass 3+ and stop at reporting.

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
`/home/vitus/floently-finnish/apps/client/src/features/...`
must become
`/home/vitus/floently-finnish-duplication-quarantine/apps/client/src/features/...`

After moving:
- confirm the original path no longer exists inside the repo
- confirm no imports/scripts/configs reference it

======================================================================
WORKING METHOD FOR PASS 2
======================================================================

STEP 0 — READ THE MATRIX AND PASS 1 OUTPUTS
Use the cleanup matrix and Pass 1 outputs as governing context.
Treat Pass 1 as complete and do not re-open it unless a tiny reference fix is absolutely necessary for Pass 2 safety.

STEP 1 — INVENTORY PASS 2 AUTHORITIES
Determine exactly which of the Pass 2 paths are still acting as live authority.
Inspect:
- `apps/client/features/*`
- `apps/client/src/features/*`
- `apps/client/src/navigation/*`
- `apps/client/app/*`
- `apps/client/state/*`
- `apps/client/config/*`
- `apps/client/core/*`
- `packages/core/*`

Produce a Pass 2 authority map before editing.

STEP 2 — FORENSIC COMPARISON
For each Pass 2 duplicate family:
- diff overlapping feature folders deeply
- identify functions/components/hooks/services/types/routes existing only in the `src/*` tree
- identify drift between `apps/client/core/*` and `packages/core/*`
- identify whether any app-local API/config wrapper must survive locally or should be merged into `packages/core/*`
- identify dead duplication vs still-useful behavior

Classify every discovered piece as:
- must merge into canonical survivor
- already duplicated, safe to keep only one
- obsolete legacy behavior
- dead residue

Do not move anything yet.

STEP 3 — CANONICAL MERGE
Merge all still-useful behavior into the canonical survivor locations for this pass.

Rules:
- Feature behavior should survive under `apps/client/features/*`
- Shared reusable API/config behavior should survive in the correct shared authority, usually `packages/core/*`, unless the behavior is clearly app-local
- Route ownership should survive under the already chosen app/state/config structure, not under `apps/client/src/navigation/*`
- Preserve exports, types, hooks, services, route names, and expected imports unless a correction is clearly necessary

STEP 4 — REWRITE REFERENCES
Rewrite imports and references so that:
- no live code points to `apps/client/src/features/*`
- no live code points to `apps/client/src/navigation/*`
- duplicated client API/config authority is resolved
- path aliases and relative imports resolve only to canonical survivors

STEP 5 — VERIFY BEFORE MOVE
Run at minimum:
- `cd /home/vitus/floently-finnish/apps/client && npx tsc --noEmit`
- `cd /home/vitus/floently-finnish/apps/client && npx expo lint`

Also run additional small-scope checks as needed:
- grep/import sanity for moved feature paths
- route/module resolution checks
- auth/billing/onboarding/client feature import checks if touched
- any targeted test or static verification you need for changed client modules

If verification fails, continue fixing Pass 2 parity.
Do not leave duplicates in repo as fallback.

STEP 6 — MOVE TO QUARANTINE
Once Pass 2 parity is complete:
- MOVE every resolved duplicate tree/file from this pass into `/home/vitus/floently-finnish-duplication-quarantine/`
- confirm they are gone from the repo
- confirm canonical feature/config authority is now obvious

STEP 7 — FINAL PASS 2 SWEEP
Run repo-wide searches to confirm there are no stale references to Pass 2 moved paths.

======================================================================
PASS 2 SUCCESS CRITERIA
======================================================================

Pass 2 is successful only if ALL of the following are true:

1. `apps/client/features/*` is the only active client feature tree left in the repo.
2. `apps/client/src/features/*` is no longer in the repo.
3. `apps/client/src/navigation/*` is no longer in the repo.
4. Client-side shared config/API duplication targeted in this pass has one active authority.
5. No stale imports/reference paths point to moved Pass 2 paths.
6. `cd apps/client && npx tsc --noEmit` passes.
7. `cd apps/client && npx expo lint` passes.
8. The client-side structure is more canonical and less ambiguous than after Pass 1.

======================================================================
REPORTING REQUIREMENTS
======================================================================

Write all Pass 2 reports to:

`/home/vitus/floently-finnish/docs/cleanup/`

Create or update these files specifically for Pass 2:

- `pass_2_report.md`
- `pass_2_authority_map.md`
- `pass_2_merge_log.md`
- `pass_2_quarantine_manifest.md`
- `pass_2_verification_results.md`
- `pass_2_repo_tree_after.txt`
- `pass_2_open_items_for_pass_3.md`

Also update, if appropriate:
- `00_cleanup_index.md`
- `04_group_by_group_merge_log.md`
- `05_quarantine_manifest.md`
- `07_verification_results.md`
- `11_change_inventory.csv`
- `12_change_inventory.json`

======================================================================
PASS 2 REPORT CONTENT
======================================================================

Your `pass_2_report.md` must include:

1. Scope of Pass 2
2. Exact files/dirs inspected
3. Exact files/dirs merged into canonical locations
4. Exact files/dirs moved to quarantine
5. What behavior/config/types/exports were preserved before move
6. Verification commands run
7. Verification results
8. Whether Pass 2 is complete
9. Exact recommendations for Pass 3 based on what remains

Your `pass_2_open_items_for_pass_3.md` must include only:
- what remains after Pass 2
- what you learned that should shape Pass 3
- no actual Pass 3 edits

======================================================================
IMPORTANT CONSTRAINT
======================================================================

Do the work for Pass 2 only.
Do not jump ahead.
Do not leave resolved Pass 2 duplicates inside the repo.
Do not freeze anything from this pass.
Resolve, merge, verify, move, and report.
