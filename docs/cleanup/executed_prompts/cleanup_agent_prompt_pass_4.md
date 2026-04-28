You are executing CLEANUP PASS 4 for the project at:

/home/vitus/floently-finnish

Read these files first and treat them as governing inputs for this pass:

1. Cleanup matrix (authoritative in-repo matrix path):
`/home/vitus/floently-finnish/docs/cleanup/floently_finnish_duplication_cleanup_matrix.md`

If a `_v2` matrix also exists, compare it briefly and note any material differences in the Pass 4 report, but the actual in-repo matrix file above is the governing input unless they are byte-identical.

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

4. Pass 3 outputs:
- `/home/vitus/floently-finnish/docs/cleanup/pass_3_report.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_3_authority_map.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_3_merge_log.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_3_quarantine_manifest.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_3_verification_results.md`
- `/home/vitus/floently-finnish/docs/cleanup/pass_3_repo_tree_after.txt`
- `/home/vitus/floently-finnish/docs/cleanup/pass_3_open_items_for_pass_4.md`

This is a MERGE-AND-MOVE cleanup.
This is NOT a freeze/hold/block cleanup.
This is NOT a delete-first cleanup.
This is PASS 4 ONLY.

======================================================================
PASS 4 GOAL
======================================================================

Pass 4 is for:
1. full cards authority-chain consolidation
2. full audio/voice/cards-audio authority-chain consolidation
3. full top-level YKI authority-chain consolidation into canonical `apps/backend/app/*`
4. removing resolved cards/audio/yki duplicate structures from the repo after merge

At the end of Pass 4:
- `apps/backend/cards/` must no longer remain in the repo
- `apps/backend/audio/` must no longer remain in the repo
- `apps/backend/yki/` must no longer remain in the repo
- no live cards/audio/yki code may depend on those moved paths
- one canonical cards authority chain must remain under `apps/backend/app/*`
- one canonical audio authority chain must remain under `apps/backend/app/*`
- one canonical YKI authority chain must remain under `apps/backend/app/*`
- backend boot/health must still pass
- cards/YKI/audio paths touched in this pass must remain intact

======================================================================
CANONICAL STRUCTURE FOR THIS PASS
======================================================================

For Pass 4, the surviving canonical backend structure is:

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

Interpretation for this pass:
- cards authority must end under `app/cards/*`, `app/runtime/*`, `app/services/*`, `app/routers/*`, and canonical content/material paths that remain intentionally outside `app/*` but are loaded only through one canonical authority chain
- audio/voice/TTS authority must end under `app/audio/*`, `app/services/*`, `app/runtime/*`, and canonical router paths
- YKI authority must end under `app/adapters/*`, `app/runtime/*`, `app/services/*`, `app/routers/*`, and any canonical content/material paths intentionally used by that chain
- top-level namespace bridges/shims must not remain after this pass

======================================================================
PASS 4 MANDATORY TARGETS
======================================================================

You must resolve these in Pass 4:

A. Cards authority chain
- `apps/backend/cards/`
- any legacy namespace imports using `cards.*`
- cards route/service/runtime overlap involving:
  - `apps/backend/app/routers/v1_cards.py`
  - `apps/backend/app/services/cards_service.py`
  - `apps/backend/app/runtime/cards_logic.py`
  - `apps/backend/app/cards/**`
- legacy donor/loader/path overlaps that still make the live cards authority ambiguous
- card publication/runtime/schema/loader ownership must end with one obvious live authority

B. Audio / voice / cards-audio authority chain
- `apps/backend/audio/`
- any legacy namespace imports using `audio.*`
- overlaps involving:
  - `apps/backend/app/audio/**`
  - `apps/backend/app/services/voice_service.py`
  - `apps/backend/app/services/tts/**`
  - `apps/backend/app/runtime/voice.py`
  - any card-audio preparation path that still depends on top-level `audio.*`

C. YKI authority chain
- `apps/backend/yki/`
- legacy namespace imports using `yki.*`
- overlaps involving:
  - `apps/backend/app/adapters/yki_engine_adapter.py`
  - `apps/backend/app/runtime/yki.py`
  - `apps/backend/app/services/yki_service.py`
  - `apps/backend/app/services/yki_exam_runtime_guard.py`
  - `apps/backend/app/services/yki_runtime_integrity.py`
  - `apps/backend/app/routers/v1_yki.py`
  - `apps/backend/app/routers/yki_exam.py`
  - `apps/backend/app/routers/yki_practice.py`
- exam/practice/runtime/state-machine/orchestrator ownership must end with one canonical chain under `app/*`, even if that chain still calls into engine later

D. Supporting rewrites
- tests
- scripts
- helper imports
- loader paths
- route mounts
- config references
only where needed to complete the cards/audio/yki deduplication safely in this pass

======================================================================
DO NOT DO THESE YET
======================================================================

Do NOT do Pass 5 global sweep/final canonicalization yet.
Do NOT perform broad engine-internal consolidation beyond the minimum caller rewrites needed to complete Pass 4 safely.
Do NOT do broad content-bank augmentation beyond what is strictly needed to preserve runtime behavior after cards/YKI authority consolidation.
Do NOT do unrelated docs cleanup beyond tiny reference rewrites strictly needed to complete Pass 4 safely.

If engine-adjacent overlap is discovered that cannot be responsibly consolidated without turning this into a deep engine pass, document it for Pass 5 after you have still completed the cards/audio/yki merge-and-move work in this pass.

======================================================================
QUARANTINE RULES
======================================================================

Quarantine root:
`/home/vitus/floently-finnish-duplication-quarantine/`

Rules:
- DO NOT quarantine inside `/home/vitus/floently-finnish/`
- MOVE duplicates there; do not copy them
- preserve original relative paths

Examples:
`/home/vitus/floently-finnish/apps/backend/cards/...`
must become
`/home/vitus/floently-finnish-duplication-quarantine/apps/backend/cards/...`

`/home/vitus/floently-finnish/apps/backend/yki/...`
must become
`/home/vitus/floently-finnish-duplication-quarantine/apps/backend/yki/...`

After moving:
- confirm the original path no longer exists inside the repo
- confirm no imports/scripts/tests/configs/loaders point to it

======================================================================
WORKING METHOD FOR PASS 4
======================================================================

STEP 0 — READ THE MATRIX AND PRIOR PASS OUTPUTS
Use the cleanup matrix and prior pass outputs as governing context.
Treat Passes 1–3 as complete and do not reopen them unless a tiny reference fix is absolutely necessary for Pass 4 safety.

STEP 1 — INVENTORY PASS 4 AUTHORITIES
Determine exactly which cards/audio/yki paths are still acting as live authority.
Inspect:
- `apps/backend/app/cards/**`
- `apps/backend/app/audio/**`
- `apps/backend/app/adapters/**`
- `apps/backend/app/runtime/cards_logic.py`
- `apps/backend/app/runtime/voice.py`
- `apps/backend/app/runtime/yki.py`
- `apps/backend/app/services/cards_service.py`
- `apps/backend/app/services/voice_service.py`
- `apps/backend/app/services/tts/**`
- `apps/backend/app/services/yki*`
- `apps/backend/app/routers/v1_cards.py`
- `apps/backend/app/routers/v1_yki.py`
- `apps/backend/app/routers/yki_exam.py`
- `apps/backend/app/routers/yki_practice.py`
- `apps/backend/cards/**`
- `apps/backend/audio/**`
- `apps/backend/yki/**`
- backend tests/scripts that still reference legacy cards/audio/yki namespaces
- relevant material loader paths for cards and YKI to ensure one runtime authority remains

Produce a Pass 4 authority map before editing.

STEP 2 — FORENSIC COMPARISON
For each Pass 4 duplicate family:
- diff overlapping cards/audio/yki files deeply
- identify functions/classes/helpers/contracts/adapters/state-machine pieces existing only in legacy top-level namespaces
- identify drift between those and canonical `app/*` equivalents
- identify namespace shims vs real live logic
- identify loader/path/manifest/source-of-truth ambiguity that still makes the live authority unclear
- identify tests/scripts still importing legacy namespaces

Classify every discovered piece as:
- must merge into canonical survivor
- already duplicated, safe to keep only one
- obsolete legacy behavior
- dead residue
- engine-adjacent dependency that may remain external but must be invoked only through the canonical app-level authority after this pass

Do not move anything yet.

STEP 3 — CANONICAL MERGE
Merge all still-useful behavior for this pass into canonical survivor locations under `apps/backend/app/*`.

Rules:
- cards public/runtime/service/schema/loader authority must end under canonical `app/*`
- audio public/runtime/service/schema/provider authority must end under canonical `app/*`
- YKI public/runtime/service/adapter/state authority must end under canonical `app/*`
- preserve route behavior, response shapes, startup/bootstrap behavior, loader behavior, and helper contracts unless a correction is clearly necessary
- do not keep top-level `cards/`, `audio/`, or `yki/` as surviving namespace bridges after parity is complete
- if a top-level file contains still-useful logic, absorb it into canonical `app/*` first, then move the top-level source out

STEP 4 — REWRITE REFERENCES
Rewrite imports and references so that:
- no live code points to `cards.*`
- no live code points to `audio.*`
- no live code points to `yki.*`
- canonical `app/*` locations are the only live authority for these families
- tests/scripts/imports/loaders resolve only to canonical survivors
- route mounts and runtime loader paths do not rely on moved namespace bridges

STEP 5 — VERIFY BEFORE MOVE
Run at minimum:
- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -c "import main; print('main import ok')"`
- `bash /home/vitus/floently-finnish/apps/backend/scripts/boot_gate.sh`

Also run targeted checks needed for this pass:
- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -m pytest tests/test_publication_lifecycle.py tests/test_runtime_api.py -q`
- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -m pytest tests/test_yki_orchestrator.py tests/test_yki_state_machine.py -q`

Also run any additional targeted checks you need, such as:
- cards import sanity
- audio/voice/TTS import sanity
- YKI route/import sanity
- grep sweeps for `cards.`, `audio.`, `yki.` legacy imports
- loader/path sanity around cards and YKI runtime authority

If verification fails, continue fixing Pass 4 parity.
Do not leave duplicates in repo as fallback.

If a verification failure is caused only by deeper engine-internal duplication outside Pass 4 scope, document that clearly in the Pass 4 report, but still complete the cards/audio/yki merge-and-move work for the repo-local duplicate authorities.

STEP 6 — MOVE TO QUARANTINE
Once Pass 4 parity is complete:
- MOVE every resolved duplicate tree/file from this pass into `/home/vitus/floently-finnish-duplication-quarantine/`
- confirm they are gone from the repo
- confirm canonical cards/audio/yki authority is now obvious

STEP 7 — FINAL PASS 4 SWEEP
Run repo-wide searches to confirm there are no stale references to Pass 4 moved paths.

======================================================================
PASS 4 SUCCESS CRITERIA
======================================================================

Pass 4 is successful only if ALL of the following are true:

1. `apps/backend/cards/` is no longer in the repo.
2. `apps/backend/audio/` is no longer in the repo.
3. `apps/backend/yki/` is no longer in the repo.
4. No live code imports `cards.*`, `audio.*`, or `yki.*`.
5. Cards, audio, and YKI now each have one active authority chain under `apps/backend/app/*`.
6. `cd apps/backend && .venv/bin/python -c "import main; print('main import ok')"` passes.
7. `bash apps/backend/scripts/boot_gate.sh` passes.
8. Targeted cards/YKI verification is run and recorded.
9. The backend structure is more canonical and less ambiguous than after Pass 3.

======================================================================
REPORTING REQUIREMENTS
======================================================================

Write all Pass 4 reports to:

`/home/vitus/floently-finnish/docs/cleanup/`

Create or update these files specifically for Pass 4:

- `pass_4_report.md`
- `pass_4_authority_map.md`
- `pass_4_merge_log.md`
- `pass_4_quarantine_manifest.md`
- `pass_4_verification_results.md`
- `pass_4_repo_tree_after.txt`
- `pass_4_open_items_for_pass_5.md`

Also update, if appropriate:
- `00_cleanup_index.md`
- `04_group_by_group_merge_log.md`
- `05_quarantine_manifest.md`
- `07_verification_results.md`
- `11_change_inventory.csv`
- `12_change_inventory.json`

======================================================================
PASS 4 REPORT CONTENT
======================================================================

Your `pass_4_report.md` must include:

1. Scope of Pass 4
2. Exact files/dirs inspected
3. Exact files/dirs merged into canonical locations
4. Exact files/dirs moved to quarantine
5. What behavior/routes/helpers/contracts/loaders were preserved before move
6. Verification commands run
7. Verification results
8. Whether Pass 4 is complete
9. Exact recommendations for Pass 5 based on what remains

Your `pass_4_open_items_for_pass_5.md` must include only:
- what remains after Pass 4
- what you learned that should shape Pass 5
- no actual Pass 5 edits

======================================================================
IMPORTANT CONSTRAINT
======================================================================

Do the work for Pass 4 only.
Do not jump ahead.
Do not leave resolved Pass 4 duplicates inside the repo.
Do not freeze anything from this pass.
Resolve, merge, verify, move, and report.
