You are performing a second deep forensic audit of the Floently Finnish roleplay system after the canonical roleplay/voice consolidation.

Repository root:
/home/vitus/floently-finnish

Current symptom:
Roleplay voice still fails.
The user-facing message is now:

- “Voice transcription is temporarily unavailable.”

This means the architecture was already consolidated, but the live system still fails somewhere in the canonical roleplay/voice/STT path.

IMPORTANT:
This is an AUDIT ONLY.
You must NOT change any code.
You must NOT patch anything.
You must NOT refactor anything.
You must NOT “quick fix” anything.
You must NOT delete anything.
You must ONLY investigate, verify, trace, and report.

Your job is to determine exactly why the canonical system still fails after the cleanup.

==================================================
AUTHORITATIVE CONTEXT TO READ FIRST
==================================================

You MUST read these first before doing anything else:

- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_FORENSIC_AUDIT.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_DUPLICATE_CONFLICT_MATRIX.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_IMPLEMENTATION_REPORT.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_DELETION_LOG.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_POSTFIX_LIVE_PATH.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_REGRESSION_ELIMINATION_CHECKLIST.md

If any machine-readable artifacts exist, read them too:
- removed_routes.json
- remaining_roleplay_voice_routes.json
- kept_files.json
- deleted_files.json

These are your baseline.
Your audit must determine whether:
- the implementation truly matches those reports
- something stale/remnant still survives
- the live code path differs from the intended canonical path
- imports, aliases, bundles, or route wiring still point somewhere unexpected

==================================================
PRIMARY GOAL
==================================================

Determine why roleplay voice still fails after consolidation, with special focus on:

- STT
- microphone capture
- audio recording
- MIME/container handling
- upload path
- backend parsing
- normalization
- transcription
- AI/session continuity after transcription
- frontend error interpretation
- stale imports/exports
- stale route calls
- path alias drift
- remnants of deleted systems
- “fixes” that may not actually be on the live path
- files that are canonical in theory but not the real active consumer path

You must audit this as if regression or false confidence could kill a high-value enterprise/public-sector contract.

==================================================
STRICT SCOPE
==================================================

Audit ALL of the following, but do not modify anything.

--------------------------------------------------
A. FRONTEND ROLEPLAY / MICROPHONE / STT FLOW
--------------------------------------------------

At minimum inspect:
- apps/client/state/SpeakingRoute.tsx
- apps/client/state/ProfessionalRoute.tsx
- apps/client/features/speaking/screens/RoleplayConversationScreen.tsx
- apps/client/features/speaking/screens/RecordedResponseScreen.tsx
- apps/client/features/speaking/hooks/useRoleplayRecorder.ts
- apps/client/features/speaking/services/roleplayAudio.ts

You must verify:
- how roleplay starts
- how profession/context is preserved
- how mic permission is requested
- how recording begins and ends
- how recorded audio is packaged
- which helper sends STT
- how STT responses are interpreted
- exactly where “Voice transcription is temporarily unavailable” is produced
- whether frontend code still contains stale assumptions from earlier STT contracts
- whether any callsites still point to deleted routes or deleted helper shapes
- whether Metro/Expo aliasing could still resolve an unexpected file

--------------------------------------------------
B. SHARED PACKAGE CONTRACTS
--------------------------------------------------

At minimum inspect:
- packages/core/api/voice.ts
- packages/core/api/roleplay.ts
- packages/core/api/types.ts
- packages/core/schemas/session.ts
- packages/core/schemas/cards.ts

You must verify:
- exact exported symbols
- return types
- real contract expected by frontend
- stale imports
- stale type assumptions
- mismatches between declared types and actual runtime usage
- duplicate wrapper logic that may still survive
- any remaining fallback behavior that masks the true failure
- whether roleplay.ts is now truly delegating voice work to voice.ts only

--------------------------------------------------
C. BACKEND CANONICAL VOICE / STT / ROLEPLAY PATH
--------------------------------------------------

At minimum inspect:
- apps/backend/app/router.py
- apps/backend/app/routers/v1_roleplay.py
- apps/backend/app/routers/v1_voice.py
- apps/backend/app/runtime/roleplay.py
- apps/backend/app/services/voice_service.py
- apps/backend/app/runtime/voice.py
- apps/backend/app/services/tts/runtime.py

Also inspect if they still exist anywhere and verify they are truly unused:
- any old roleplay voice router remnants
- any old voice router remnants
- any deleted imports still referenced anywhere

You must verify:
- actual mounted routes
- exact STT endpoint behavior
- multipart form field names expected by backend
- accepted MIME/content types
- file normalization path
- transcription provider call behavior
- how empty transcript is represented
- how errors are represented
- whether backend swallows provider failures into empty values
- whether backend logging gives enough visibility
- whether TTS and STT share state in a way that can contaminate roleplay flow
- whether roleplay session state is lost when STT fails

--------------------------------------------------
D. IMPORT / ROUTE / PATH / BUNDLE INTEGRITY
--------------------------------------------------

You must search deeply for:
- deleted route strings still referenced
- stale imports to removed files
- stale exports used by live frontend
- duplicate helper names
- leftover “compatibility” calls
- wrong-path duplicates outside apps/ or packages/
- stale generated artifacts or caches likely to confuse live runtime
- route URLs hardcoded anywhere unexpected
- audio playback or STT paths still referencing deleted namespaces
- remnants of deleted docs or false-authority sources still cited in comments/config/docs

You must inspect:
- apps/client/babel.config.js
- apps/client/metro.config.js
- tsconfig.json
- package.json / workspace config if relevant

You must prove whether the live import graph really resolves to the files people think are active.

--------------------------------------------------
E. LOG / FAILURE / ERROR INTERPRETATION
--------------------------------------------------

You must inspect:
- /home/vitus/floently-finnish/dev.log
- any backend logs relevant to STT/voice/roleplay
- any frontend visible error-producing branches in code

You must determine:
- where exactly “Voice transcription is temporarily unavailable” is emitted
- what exact low-level conditions trigger it
- whether that message represents:
  - microphone permission failure
  - empty recording
  - upload failure
  - backend non-200
  - parse failure
  - empty transcript
  - provider failure
  - timeout
  - stale contract mismatch
  - or generic catch-all masking

==================================================
CRITICAL QUESTIONS YOU MUST ANSWER
==================================================

You must explicitly answer all of these in the report:

1. Is the canonical live path truly the one being executed?
2. Are there any remnants of deleted routes, imports, helpers, or assumptions still in use?
3. Are there stale imports, stale exports, stale types, or stale calls still causing drift?
4. Is the microphone capture step healthy?
5. Is the recorded audio non-empty and valid?
6. Is the MIME/container/file extension chain correct end to end?
7. Is the frontend sending exactly what the backend expects?
8. Is the backend receiving and saving the file correctly?
9. Is normalization succeeding?
10. Is transcription actually running, and what does it return?
11. Is the backend returning empty transcript, explicit error, or malformed response?
12. Where exactly is the message “Voice transcription is temporarily unavailable” being decided?
13. Is the UI message accurate, or is it masking a deeper failure?
14. Are there any remaining hidden duplicate/conflicting functions across frontend, backend, or shared package layers?
15. Did the prior consolidation leave any remnant that can still create regression?
16. Why does the roleplay still fail even after route/stack consolidation?
17. What exact file(s) and exact logic are now the real root-cause location?
18. What is the minimum surgical fix set needed next? (Do not implement it. Only specify it.)

==================================================
SPECIAL THINGS TO LOOK FOR
==================================================

You must go beyond the obvious and explicitly check for:

- deleted route strings still referenced in comments/config/constants that could mislead maintainers
- callsites that still expect pre-fix return shapes
- UI branches that convert multiple distinct failures into one generic message
- TS types that look correct but runtime parsing that differs
- backend code that returns 200 with empty transcript instead of an explicit failure
- backend code that catches provider errors and downgrades them silently
- frontend code that trims transcript to empty and then reports temporary unavailability
- stale pnpm/expo/metro path assumptions
- duplicate symbol names across files that may confuse reviewers
- “authoritative” docs or comments that no longer match code reality
- any dependency or import path that points to an unintended module copy
- any mismatch between request field names and FastAPI Form/File parameter names
- any mismatch between audio filename extension and MIME type
- any mismatch between Android recorder output and backend accepted formats
- any place where AI/session prompt/roleplay logic is blamed but the real issue is lower in the audio chain

==================================================
METHOD
==================================================

You must work like a forensic investigator.

1. Build an exact live execution map for roleplay voice:
   frontend screen
   -> hook
   -> shared package function
   -> fetch URL
   -> backend router
   -> backend service
   -> runtime helper
   -> response shape
   -> frontend interpretation

2. Build a remnant map:
   identify every deleted-system remnant, stale call, stale import, stale type, or misleading artifact that still exists.

3. Build a failure-stage map:
   for each stage, classify:
   - healthy
   - uncertain
   - broken
   - masked by generic fallback

4. Build an evidence map:
   for every conclusion, cite file path and exact reason.

5. Do not stop at the first plausible explanation.
   Keep going until you can explain why the app still fails after consolidation.

==================================================
OUTPUTS
==================================================

Write all reports into:

/home/vitus/floently-finnish/docs/audits/

Create at least these files:

1.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_STT_POSTFIX_DEEP_FORENSIC_AUDIT.md

Must include:
- executive summary
- whether canonical path is truly live
- end-to-end live execution map
- root causes
- remnants/stale paths/stale imports
- frontend/backend/shared contract analysis
- exact source of the “Voice transcription is temporarily unavailable” message
- severity ranking
- why failure persists after consolidation
- exact minimum surgical fix set (but DO NOT apply it)

2.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_STT_POSTFIX_REMNANT_MATRIX.md

Table columns:
- symbol / route / import / path / helper
- file path
- remnant / stale / conflict type
- live or not live
- risk level
- why it matters

3.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_STT_POSTFIX_LIVE_STAGE_MAP.md

For each stage:
- frontend entry
- recorder
- request builder
- transport
- backend receive
- save
- normalize
- transcribe
- return payload
- frontend interpretation
- status: healthy / uncertain / broken / masked

4.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_STT_POSTFIX_FIX_SPEC.md

Must include:
- exact files that should be changed next
- exact lines/areas to inspect/change
- why each change is needed
- what not to touch
- what to test after the future fix
- no implementation in this audit

Also create machine-readable artifacts if useful:
- postfix_remnants.json
- postfix_live_stage_status.json
- postfix_route_import_map.json

==================================================
RULES
==================================================

- DO NOT change code.
- DO NOT delete code.
- DO NOT patch code.
- DO NOT quarantine code.
- DO NOT rewrite architecture.
- DO NOT claim “fixed.”
- DO NOT guess without evidence.
- DO NOT confuse “file exists” with “file is live.”
- DO NOT stop at a shallow explanation.
- DO NOT assume the last fix must be correct.
- DO NOT assume the remaining problem is backend-only or frontend-only without proving it.

Your output must be decisive enough that the next engineering pass can fix the issue without guesswork.
