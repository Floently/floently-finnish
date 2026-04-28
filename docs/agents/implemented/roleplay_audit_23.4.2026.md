You are performing a deep, clinical, forensic audit of the Floently Finnish roleplay system and the entire voice engine.

Repository root:
/home/vitus/floently-finnish

Primary goal:
Determine why the roleplay system keeps throwing errors and regressing even after repeated fixes, and why voice functionality remains unstable or unavailable.

Your task is not to “quick fix” first.
Your first job is to investigate, isolate, explain, and document the real root causes.
Only after the audit may you recommend fixes.

You must assume there may be:
- duplicate implementations
- conflicting routers
- stale code paths still mounted
- mismatched imports/exports
- overlapping APIs
- frontend/backend contract drift
- multiple voice/STT/TTS entry points fighting each other
- old legacy roleplay flows still active
- incompatible fallback logic
- alias/path confusion
- dead code that still gets imported
- patches applied in one layer but not the actual live execution path
- multiple files providing the “same” function under different names
- regression caused by partial copies or wrong-path files
- roleplay context being lost between UI, API, runtime, and service layers
- canonical and legacy content/runtime logic coexisting and colliding

You must audit this system as if a failed public tender or enterprise contract depends on your conclusions.

==================================================
SCOPE
==================================================

Audit at minimum all of the following areas:

1. FRONTEND ROLEPLAY FLOW
- speaking route entry
- profession selection
- interview entry
- workplace roleplay entry
- voice recording flow
- STT request flow
- TTS playback flow
- roleplay session start payloads
- roleplay turn submission payloads
- fallback handling and user-facing error handling

2. BACKEND ROLEPLAY FLOW
- roleplay routers
- roleplay services
- roleplay runtime
- scenario registry
- session creation
- session continuation
- scenario selection and defaulting
- profession normalization
- intro/opening selection
- transcript handling
- completion/review/report generation

3. VOICE ENGINE
- all STT endpoints
- all TTS endpoints
- all roleplay voice endpoints
- shared voice services
- runtime voice helpers
- MIME/content-type handling
- upload normalization
- file persistence
- transcription contract
- audio reference resolution
- retry/fallback chains
- missing export/import mismatches
- route duplication
- inconsistent endpoint naming
- wrong frontend target path vs backend mounted path

4. DUPLICATES / CONFLICTS / REGRESSION SOURCES
- duplicated functions across files
- near-duplicate routers
- compatibility routers shadowing real routers
- old and new route systems both mounted
- duplicated function names with different signatures
- two sources of truth for roleplay or voice behavior
- duplicated frontend helpers
- stale package exports
- conflicting imports between apps/client and packages/core
- places where fixes were applied to the wrong file/path and never hit runtime

5. BUILD / PATH / PACKAGE INTEGRITY
- wrong-path duplicate files
- alternate copies of backend/client files outside apps/
- whether real runtime imports apps/... or some duplicate path
- whether package exports match what frontend imports
- whether metro/expo aliasing points to expected files
- whether routers mounted in app/router.py match the files people thought they were fixing
- whether compatibility endpoints are masking the actual broken endpoint

==================================================
CRITICAL QUESTIONS TO ANSWER
==================================================

You must explicitly answer all of these:

1. Why do fixes to roleplay appear not to stick?
2. Which exact files are actually live in the running system?
3. Which files were likely edited previously without affecting live runtime?
4. Are there duplicate or conflicting roleplay routers/services/runtime modules?
5. Are there duplicate or conflicting voice/STT/TTS routers/services/runtime modules?
6. Is the frontend calling the wrong roleplay/voice endpoint?
7. Is the frontend importing functions that are missing, stale, or shadowed?
8. Is scenario selection deterministic or still falling back incorrectly?
9. Why does roleplay voice keep ending in fallback messages like “voice input unavailable”?
10. Is the failure in permission, recording, upload, MIME type, endpoint, transcription, response parsing, or session continuity?
11. Are legacy and new systems both active at once?
12. Are there dead-code or compatibility layers creating regression risk?
13. What exact architectural changes are needed to stop future regression?

==================================================
FILES / AREAS TO PRIORITIZE
==================================================

At minimum inspect these, if they exist:

Frontend:
- apps/client/state/SpeakingRoute.tsx
- apps/client/state/ProfessionalRoute.tsx
- apps/client/features/speaking/hooks/useRoleplayRecorder.ts
- apps/client/features/speaking/services/roleplayAudio.ts
- apps/client/features/speaking/screens/RoleplayConversationScreen.tsx
- apps/client/features/speaking/screens/RecordedResponseScreen.tsx
- apps/client/features/cards/components/CardPracticeSession.tsx
- apps/client/features/cards/hooks/useCardPractice.ts
- apps/client/features/cards/services/cardsService.ts

Shared package:
- packages/core/api/roleplay.ts
- packages/core/api/voice.ts
- packages/core/api/cards.ts
- packages/core/api/types.ts
- packages/core/schemas/cards.ts
- packages/core/schemas/session.ts

Backend:
- apps/backend/app/router.py
- apps/backend/app/routers/v1_roleplay.py
- apps/backend/app/routers/v1_roleplay_voice.py
- apps/backend/app/routers/v1_voice.py
- apps/backend/app/routers/voice.py
- apps/backend/app/services/roleplay_service.py
- apps/backend/app/services/voice_service.py
- apps/backend/app/runtime/roleplay.py
- apps/backend/app/runtime/voice.py
- apps/backend/app/runtime/cards_material_bank.py
- apps/backend/app/runtime/cards_logic.py
- apps/backend/app/services/cards_service.py

Also search broadly for:
- roleplay
- voice
- tts
- stt
- transcribe
- requestRoleplayTts
- start_session
- submit_turn
- build_roleplay_router
- build_roleplay_voice_router
- build_voice_router

==================================================
METHOD
==================================================

You must work like a forensic auditor, not like a casual code reviewer.

1. Build a live execution map
Trace from frontend click -> shared API helper -> request URL -> backend router -> service -> runtime -> response -> frontend render/playback.

2. Build a duplicate/conflict map
Find duplicate functions, near-duplicate files, shadowed routers, compatibility layers, repeated exports, repeated endpoint paths, and ambiguous sources of truth.

3. Build a regression map
Identify why a developer could patch one file and still see no change.
For each issue, say whether the cause is:
- wrong file patched
- duplicate file
- stale import/export
- compatibility layer shadowing fix
- wrong route used
- frontend/backend contract mismatch
- fallback swallowing the real error
- cached/stale client bundle
- legacy code still mounted

4. Verify actual mounted routers
Use router.py and actual import trees to determine the real active endpoints.

5. Verify package contract integrity
Compare frontend imports with package exports. Identify every mismatch.

6. Verify voice chain end to end
For roleplay voice specifically, isolate each stage:
- mic permission
- recording start/stop
- audio blob/file creation
- mime selection
- upload target
- backend parse
- normalization
- transcription
- transcript response shape
- fallback handling
- TTS request path
- TTS response path
- playback hook

7. Verify scenario determinism
Check whether profession, scenario_id, level, and context_label survive intact through the whole roleplay flow.

8. Check for duplicate paths outside apps/
Search repo for stray backend/ or client/ copies, or other wrong-path duplicates that may have caused false fixes.

==================================================
OUTPUTS
==================================================

Write all reports into:

/home/vitus/floently-finnish/docs/audits/

Create at least these files:

1.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_FORENSIC_AUDIT.md

This must include:
- executive summary
- system map
- live execution path
- root causes
- duplicates/conflicts
- regression causes
- frontend/backend contract mismatches
- roleplay findings
- voice findings
- severity ranking
- “why fixes did not stick”
- exact next fixes in priority order

2.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_DUPLICATE_CONFLICT_MATRIX.md

This must include a table with:
- symbol/function/route name
- file path
- duplicate/conflict type
- active or inactive
- risk level
- recommended action

3.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_LIVE_PATH_MAP.md

This must include:
- frontend entrypoint
- API helper
- route called
- backend router
- service
- runtime
- response shape
- frontend consumer

4.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_FIX_PLAN.md

This must include:
- exact files to change
- change order
- rollback notes
- high-risk points
- how to stop recurrence/regression permanently

Also create machine-readable artifacts if useful:
- duplicate_conflicts.json
- live_paths.json
- endpoint_matrix.json

Store them in the same audits directory.

==================================================
RULES
==================================================

- Do not make silent assumptions.
- Do not claim something is live unless you prove the import/mount path.
- Do not confuse “file exists” with “file is active.”
- Do not stop at the first bug.
- Do not hide uncertainty; label it explicitly.
- Do not refactor unrelated systems.
- Do not patch yet unless you first complete the audit outputs.
- If you do propose fixes, distinguish:
  - confirmed root-cause fixes
  - likely follow-up fixes
  - optional hardening

==================================================
SPECIAL EMPHASIS
==================================================

You must pay special attention to:
- why roleplay voice fails even after multiple “fixes”
- why UI or API fixes seem to regress
- whether compatibility layers are swallowing or masking the real failure
- whether multiple voice endpoints are competing
- whether route names and package exports diverged
- whether roleplay and voice are too coupled, causing one failure to collapse the other
- whether fallback logic is hiding the real exception
- whether there are duplicate definitions of the same conceptual feature across files

When done, produce the reports in /home/vitus/floently-finnish/docs/audits/ and make the audit decisive enough that another engineer can execute the fix plan without guesswork.
