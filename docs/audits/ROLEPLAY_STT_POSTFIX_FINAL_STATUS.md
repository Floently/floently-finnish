# ROLEPLAY STT Postfix Final Status

Date: 2026-04-23

## Canonical Path Status

Canonical architecture remains intact:
- Roleplay session APIs: `/api/v1/roleplay/session/*`
- Voice APIs: `/api/v1/voice/*`
- Shared voice transport authority: `packages/core/api/voice.ts`

No legacy compatibility voice stack or deleted roleplay session routes were reintroduced.

## Current Roleplay Voice Status

Status: **working in current runtime via Google fallback path**.

Evidence:
- STT call over real roleplay recording returned transcript.
- Provider results show OpenAI failure + Google success in same request path.

## User-Facing Error Quality Status

Improved:
- Backend now classifies auth and permission/API-enable failures explicitly.
- Frontend preserves actionable categories instead of forcing one generic message.

Examples now distinguished:
- provider authentication failed
- provider permission/API enablement failed
- transcription provider unreachable
- recording too short
- no speech detected

## UI Status for Microphone Panel

Fixed:
- mic container is now theme-adaptive:
  - light mode: white panel
  - dark mode: dark panel

## Remaining External Blocker (if encountered again)

If OpenAI STT still fails in runtime, current evidence indicates credential validity issue (401), not routing/stack architecture issue.

System still transcribes as long as Google provider is healthy.

## Exact Next Action (only if external/provider-side issue persists)

1. Rotate/fix OpenAI key used by backend runtime process.
2. Keep Google STT API enabled for the active runtime project.
3. Re-run STT verification command on a real saved recording and confirm both providers or at least one provider succeeds.

