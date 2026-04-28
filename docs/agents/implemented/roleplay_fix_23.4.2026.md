You are now in IMPLEMENTATION MODE.

Repository root:
/home/vitus/floently-finnish

Authoritative audit inputs you MUST read first:
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_FORENSIC_AUDIT.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_DUPLICATE_CONFLICT_MATRIX.md

Your job:
Implement the consolidation and permanent cleanup of the roleplay + voice system so that:
- there is exactly ONE authoritative roleplay stack
- there is exactly ONE authoritative voice stack
- every duplicate path not chosen is DELETED completely
- every import, callsite, route mount, helper, fallback, alias, and dependency tied to the deleted paths is also removed
- regression possibility from duplicate systems is reduced to zero as far as the codebase allows

This is not an audit.
This is not a quarantine.
This is not a partial migration.
This is not a compatibility phase.

You MUST:
- choose
- fix
- delete the rest completely

No compatibility layer.
No legacy fallback.
No alias routing.
No silent fallback to older endpoints.
No “keep for now.”
No quarantine folders.
No dead code preserved.
No duplicate implementations preserved.
No stale exports preserved.

==================================================
CANONICAL AUTHORITIES TO KEEP
==================================================

You MUST implement around these canonical authorities:

BACKEND
1. Backend bootstrap/router authority:
- apps/backend/app/router.py

2. Canonical roleplay HTTP API:
- apps/backend/app/routers/v1_roleplay.py
Keep ONLY the new session API family:
- /api/v1/roleplay/session/start
- /api/v1/roleplay/session/{id}/turn
- /api/v1/roleplay/session/{id}/finish
Delete the legacy roleplay session API family entirely:
- /api/v1/roleplay/sessions
- /api/v1/roleplay/sessions/{id}/turns
- and related legacy transcript/review routes if they belong only to the old duplicated flow

3. Canonical roleplay runtime:
- apps/backend/app/runtime/roleplay.py

4. Canonical voice HTTP API:
- apps/backend/app/routers/v1_voice.py
Keep ONLY the canonical /api/v1/voice/* endpoints.

5. Canonical voice services/runtime:
- apps/backend/app/services/voice_service.py
- apps/backend/app/runtime/voice.py

FRONTEND / SHARED
6. Canonical shared voice contract:
- packages/core/api/voice.ts

7. Canonical shared roleplay contract:
- packages/core/api/roleplay.ts
BUT:
- roleplay.ts must no longer contain a parallel STT/TTS voice implementation
- roleplay.ts may keep roleplay-session APIs
- all voice operations must be delegated to the single canonical voice authority in packages/core/api/voice.ts
- no duplicate roleplay-specific STT/TTS fork is allowed to remain

8. Canonical frontend speaking flow:
- apps/client/features/speaking/screens/RoleplayConversationScreen.tsx
- apps/client/features/speaking/hooks/useRoleplayRecorder.ts
- apps/client/features/speaking/services/roleplayAudio.ts
- apps/client/state/SpeakingRoute.tsx
- apps/client/state/ProfessionalRoute.tsx

==================================================
WHAT MUST BE DELETED COMPLETELY
==================================================

Delete completely if they exist and are not the chosen canonical authority:

1. Backend compatibility roleplay/voice alias layer:
- apps/backend/app/routers/v1_roleplay_voice.py

2. Backend unmounted false-authority voice router:
- apps/backend/app/routers/voice.py

3. Legacy roleplay wrapper/service layers that only support the deleted legacy roleplay session flow.
If apps/backend/app/services/roleplay_service.py only exists to support the deleted legacy flow, delete it and remove all imports/usages.
If part of it is still needed for the canonical flow, reduce it to the minimal canonical service only.

4. Any frontend roleplay-specific STT/TTS fallback code in packages/core/api/roleplay.ts that duplicates packages/core/api/voice.ts.
Delete duplicate implementations entirely.

5. Any callsites to:
- /voice/stt
- /voice/tts/generate
- /voice/tts/audio/*
Delete them and replace with canonical /api/v1/voice/* calls only.

6. Duplicate docs tree if present:
- docs/docs/audits/...
Delete it completely.

7. Any wrong-path duplicate backend/client/app/package files found during implementation.
Delete them completely if not on the active import path.

==================================================
NON-NEGOTIABLE IMPLEMENTATION RULES
==================================================

1. ZERO DUPLICATE AUTHORITIES
There must be exactly one source of truth for:
- roleplay session creation
- roleplay turn submission
- roleplay session finish
- STT transcription
- TTS request generation
- audio playback URL generation

2. ZERO FALLBACKS TO DELETED PATHS
After the fix:
- no fallback to /voice/*
- no fallback to legacy roleplay routes
- no roleplay helper trying one contract then another old contract
- no silent fallback that hides the failure source

3. EXPLICIT FAILURE ONLY
If something fails, the canonical path should surface a clear error.
Do not convert every failure into generic “voice unavailable.”
Preserve useful stage-specific error information.

4. CONTRACT INTEGRITY
You MUST align all frontend/backend/shared contracts.
Examples:
- if packages/core/api/voice.ts returns string | null, all consumers must treat it as such
- if contextLabel is sent by the frontend, it must exist in the shared API type or be removed from the caller
- no stale types
- no stale exports
- no stale imports

5. NO UNUSED CODE LEFT BEHIND
After implementation:
- no imports to deleted files
- no mounted references to deleted routers
- no TS references to deleted exports
- no Python references to deleted functions/modules
- no comments/docs claiming old paths still exist

==================================================
REQUIRED IMPLEMENTATION OUTCOMES
==================================================

You must achieve all of the following:

A. ROLEPLAY
- One canonical roleplay start flow
- One canonical roleplay turn flow
- One canonical roleplay finish flow
- Profession/scenario context preserved end to end
- No old session API family remains mounted or callable

B. VOICE
- One canonical STT endpoint family under /api/v1/voice/*
- One canonical TTS request flow under /api/v1/voice/*
- One canonical audio playback route namespace under /api/v1/voice/*
- Shared TTS must not return root-level /voice/... URLs anymore
- Frontend must not call /voice/* anywhere anymore

C. FRONTEND
- Roleplay conversation screen must use only canonical roleplay + canonical voice helpers
- Roleplay recorder must use only canonical transcription flow
- No stale requestRoleplayTts/transcribeRoleplayAudio parallel logic if it duplicates voice.ts
- Professional route and speaking route must not leak access through old path assumptions

D. REGRESSION ELIMINATION
- Remove files that previously attracted “wrong fixes”
- Remove false authorities
- Remove compatibility routes
- Remove duplicate docs tree
- Remove duplicate helper implementations

==================================================
IMPLEMENTATION METHOD
==================================================

Perform the work in this order:

1. Read the audit files fully.
2. Build a concrete delete/keep list.
3. Patch canonical files first so the retained architecture works end to end.
4. Delete duplicate/legacy/compatibility code only after canonical replacements are wired.
5. Remove imports/usages/mounts/references to deleted code.
6. Update route URLs returned by TTS so playback remains functional under canonical /api/v1/voice/* only.
7. Run verification passes.
8. Write final implementation reports.

==================================================
REQUIRED VERIFICATION
==================================================

You MUST run and report these checks:

1. TypeScript:
- pnpm -s tsc --noEmit
This must pass for the touched roleplay/voice/shared/frontend surfaces.

2. Python import sanity:
- verify backend app imports still resolve after deletions

3. Grep checks:
These must return zero matches unless inside historical audit docs or clearly intentional comments:
- /voice/stt
- /voice/tts/generate
- /voice/tts/audio
- build_roleplay_voice_router
- app.routers.voice
- /api/v1/roleplay/sessions
- transcribeRoleplayAudio fallback code to compatibility paths
- duplicate TTS/STT helper implementations outside canonical voice.ts

4. Router authority check:
- confirm app/router.py mounts only the canonical roleplay and canonical voice routers for active roleplay/voice behavior

5. URL authority check:
- verify shared TTS now returns only canonical /api/v1/voice/... playback URLs

6. Live path integrity check:
Produce a final path map:
frontend -> shared helper -> route -> backend router -> service/runtime -> response -> frontend consumer

==================================================
DELIVERABLES
==================================================

Write these files to:

/home/vitus/floently-finnish/docs/audits/

1.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_IMPLEMENTATION_REPORT.md

Must include:
- exact files kept as canonical
- exact files deleted
- exact routes deleted
- exact routes kept
- exact contracts fixed
- exact regressions removed
- proof that compatibility/fallback layers are gone
- any remaining known risk

2.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_DELETION_LOG.md

Must include:
- deleted file path
- why it was deleted
- what replaced it
- import/callsite cleanup completed? yes/no

3.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_POSTFIX_LIVE_PATH.md

Must include:
- canonical frontend entrypoints
- canonical shared API files
- canonical backend routers
- canonical backend services/runtime
- canonical route URLs
- canonical audio playback path

4.
/home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_REGRESSION_ELIMINATION_CHECKLIST.md

Must include checkboxes/results for:
- no duplicate roleplay routers
- no duplicate voice routers
- no compatibility /voice/* calls
- no legacy roleplay session API family
- no stale TS contract drift
- no false-authority router files left
- no duplicate docs tree left
- canonical TTS playback URLs only
- canonical STT flow only
- canonical session flow only

Also write machine-readable artifacts if useful:
- deleted_files.json
- kept_files.json
- removed_routes.json
- remaining_roleplay_voice_routes.json

==================================================
SUCCESS CRITERIA
==================================================

The task is only complete if all of the following are true:

- one canonical roleplay stack remains
- one canonical voice stack remains
- all duplicate/conflicting roleplay/voice stacks are deleted
- all imports/usages of deleted stacks are removed
- all compatibility /voice/* usage is removed
- no false-authority backend voice router remains
- shared frontend contract drift is fixed
- TTS playback URLs are canonicalized
- the codebase no longer contains multiple plausible roleplay/voice authorities

==================================================
IMPORTANT
==================================================

Do not preserve old code “just in case.”
Do not leave compatibility aliases.
Do not leave duplicate files for rollback.
Do not quarantine.
Do not comment out and leave behind.
Delete fully and remove all dependencies.

The entire point of this implementation is to eliminate confusion, contamination, and regression possibility at the architectural level.

Complete the implementation, run the verification, and write the reports.
