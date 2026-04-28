You are now in IMPLEMENTATION MODE for the remaining roleplay voice/STT outage.

Repository root:
/home/vitus/floently-finnish

Read these first and treat them as the current source of truth:
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_IMPLEMENTATION_REPORT.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_VOICE_POSTFIX_LIVE_PATH.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_STT_POSTFIX_DEEP_FORENSIC_AUDIT.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_STT_POSTFIX_FIX_SPEC.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_STT_POSTFIX_LIVE_STAGE_MAP.md
- /home/vitus/floently-finnish/docs/audits/ROLEPLAY_STT_POSTFIX_REMNANT_MATRIX.md

Current symptom:
Roleplay voice still fails and the user sees:
- “Voice transcription is temporarily unavailable.”

Critical user instruction:
The keys were already set.
You must NOT assume the problem is simply “missing keys.”
You must verify the actual runtime configuration path, provider usage path, request path, credential loading path, project/API enablement path, and error-classification path.

This is now a surgical fix task.
Do NOT reopen or recreate any deleted compatibility route, legacy roleplay route, fallback stack, or duplicate authority.
The canonical architecture must remain intact.

==================================================
GOAL
==================================================

Fix the remaining STT/roleplay voice issue completely, while preserving the canonical consolidated architecture.

You must determine and fix the real remaining cause among possibilities such as:
- runtime environment not reading the configured keys
- wrong env var names
- process not inheriting env values
- credentials loaded in shell but not in backend runtime
- OpenAI client using wrong key source or wrong endpoint/model
- Google credentials path/project mismatch
- Google Speech-to-Text API not enabled for the actual project used at runtime
- credentials present but insufficient permissions
- provider errors misclassified into generic message
- frontend showing vague backend error instead of actionable one
- provider chain selection behavior causing false negative
- request payload accepted but provider rejects due to format/model/account restrictions

==================================================
NON-NEGOTIABLE RULES
==================================================

1. Do NOT reintroduce:
- /voice/*
- legacy /api/v1/roleplay/sessions*
- compatibility STT/TTS fallback paths
- duplicate roleplay-specific STT/TTS logic in packages/core/api/roleplay.ts

2. Keep canonical authority only:
- /api/v1/roleplay/session/*
- /api/v1/voice/*
- packages/core/api/voice.ts as the only shared voice transport authority

3. Do NOT widen scope into cards, onboarding, YKI, or unrelated TypeScript issues.

4. Do NOT stop at configuration speculation.
You must verify the actual runtime code path and actual loaded configuration source.

==================================================
FILES TO INSPECT AND FIX
==================================================

At minimum inspect and patch as needed:
- apps/backend/app/services/voice_service.py
- apps/backend/app/routers/v1_voice.py
- apps/backend/app/runtime/voice.py
- apps/backend/app/services/tts/runtime.py
- apps/client/features/speaking/hooks/useRoleplayRecorder.ts
- packages/core/api/voice.ts

Also inspect actual runtime config sources used by backend, including but not limited to:
- apps/backend/app/core/config*.py
- env loading/bootstrap files
- startup scripts/dev scripts if they affect env injection
- any provider-specific settings modules

If relevant, inspect:
- apps/backend/main.py
- apps/backend/app/router.py

==================================================
WHAT YOU MUST DETERMINE
==================================================

You must answer through implementation, not just report:

1. Why does backend still produce:
- OpenAI 401 invalid_api_key
- Google 403 SERVICE_DISABLED
even though keys were already set?

2. Are the keys/API settings set in the wrong place for the actual backend runtime process?

3. Is the backend reading a different env source than the user expects?

4. Is Google STT using the intended project and credentials?
5. Is OpenAI STT using the intended key and model/path?
6. Is provider selection order correct?
7. Is one provider enough to keep roleplay working if the other is unavailable?
8. Is the error message too generic even when the backend knows the precise cause?

==================================================
REQUIRED IMPLEMENTATION OUTCOMES
==================================================

You must implement all applicable fixes from this list:

A. Runtime configuration truthfulness
- verify and fix the actual runtime credential/config loading path
- ensure backend reads the correct env/config at execution time
- ensure provider settings reflect real loaded values, not assumed values

B. Provider readiness verification in code path
- if OpenAI config is malformed or read from wrong variable, fix it
- if Google provider is configured but unavailable/disabled and causing false noise, handle it correctly
- if provider order should prefer the actually healthy provider, fix that logic
- do not silently claim a provider is available if it is not

C. Failure classification
In `apps/backend/app/services/voice_service.py`:
- classify auth failures explicitly
- classify permission/API-disabled failures explicitly
- classify provider unavailable vs invalid credentials distinctly
- preserve silence / too-short / user-audio problems as separate categories
- stop collapsing everything into generic `STT_PROVIDER_ERROR`

D. Frontend message handling
In `apps/client/features/speaking/hooks/useRoleplayRecorder.ts` and/or `packages/core/api/voice.ts`:
- preserve actionable backend messages
- do not convert provider auth/permission/config failures into misleading generic text
- keep user-friendly copy, but make it specific enough to diagnose:
  - provider authentication failed
  - speech service not enabled
  - transcription service unavailable
  - no speech detected
  - recording too short
These should not all look the same.

E. Provider strategy
- if one provider is correctly configured and healthy, roleplay STT should work using that provider
- if a provider is misconfigured, the system should not pretend the cause is unknown
- if both are misconfigured, the message should make that clear in logs and actionable in surfaced error class

==================================================
DEEP CHECKS YOU MUST RUN
==================================================

1. Verify backend runtime environment from inside the actual backend process context.
Do not just inspect shell env files.
Confirm what the Python process is actually reading.

2. Verify provider-specific config values are present/non-empty at runtime, without printing secrets.
For example:
- whether OPENAI_API_KEY is present
- whether Google credentials/project values are present
- whether Google Speech API enablement is being checked against the actual project

3. Reproduce the STT call against a real saved recording:
- apps/backend/runtime/uploads/voice/roleplay-session/recording.m4a
or equivalent current test artifact if present

4. Confirm which provider(s) are attempted and in what order.

5. Confirm the exact exception class and message for each provider.

6. Confirm the final returned backend payload on failure and success.

7. Confirm the final frontend user-facing message after your fix.

==================================================
TESTS / VERIFICATION
==================================================

You must run and report:

1. Python import sanity
- from apps/backend: `./.venv/bin/python -c "import main"`

2. Targeted backend STT verification using a real audio sample
- prove either:
  - transcript is returned successfully
  OR
  - precise actionable failure classification is returned

3. Grep checks to ensure no deleted compatibility stacks were reintroduced:
- /voice/stt
- /voice/tts/generate
- /voice/tts/audio
- /api/v1/roleplay/sessions

These should remain absent from active code.

4. If you touch frontend/shared types:
- run `pnpm -s tsc --noEmit`
You may report unrelated pre-existing failures, but touched files must not introduce new ones.

5. Confirm the user-facing roleplay voice error changed appropriately if STT still cannot succeed.

==================================================
DELIVERABLES
==================================================

Write these files to:
/home/vitus/floently-finnish/docs/audits/

1. ROLEPLAY_STT_REMAINING_ISSUE_FIX_REPORT.md
Must include:
- exact root cause found
- exact files changed
- exact logic changed
- what the actual runtime config issue was
- what provider behavior was confirmed
- before/after behavior
- verification results

2. ROLEPLAY_STT_PROVIDER_RUNTIME_FINDINGS.md
Must include:
- actual runtime config sources used
- which env/settings were loaded by backend
- provider attempt order
- provider-specific outcome
- whether “keys were set” but not actually consumed correctly

3. ROLEPLAY_STT_POSTFIX_FINAL_STATUS.md
Must include:
- current canonical path status
- whether roleplay voice now works
- if still failing, exact precise remaining cause
- exact next action if external/provider-side only

Also write machine-readable artifacts if useful:
- stt_runtime_config_snapshot.json (masked, no secrets)
- stt_provider_results.json
- stt_fix_changed_files.json

==================================================
SUCCESS CRITERIA
==================================================

The task is complete only if one of these is true:

A. Roleplay STT works end to end and returns transcript successfully
OR
B. You prove with precise evidence that the remaining blocker is external/provider-side, and the code now surfaces the exact actionable reason rather than a misleading generic failure

In either case:
- no duplicate stacks
- no compatibility routes
- no stale roleplay-specific STT/TTS forks
- no generic misleading message when a more specific reason is known

Proceed with the fix.
