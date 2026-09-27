# Voice + Roleplay Security Source Candidate — 2026-08-16

Status: SOURCE CANDIDATE ONLY — NOT PRODUCTION DEPLOYMENT AUTHORITY

This branch combines the already-verified forward source slices for:

- KV-VOICE-002 — corrected Finnish TTS provider gender registry and permanent voice registry checks;
- KV-VOICE-003 — deterministic roleplay persona -> exact provider voice identity with shipped-client compatibility transport;
- KV-VOICE-004 — narrowly-scoped YKI two-speaker male/female dialogue playback with card/default audio compatibility;
- KV-SEC-002 — authenticated roleplay session ownership, safe legacy preview-session claiming, and permanent cross-account denial checks.

The branch descends from the green YKI R3C1-R3C5 recovery lineage. It does not move `integration/canonical-production-20260816`, `main`, or any deployment reference.

## Required source-candidate gates

Before this candidate can be considered ready for later canonical reconciliation:

- `VOICE_REGISTRY_INVARIANTS=PASS`
- `ROLEPLAY_VOICE_IDENTITY_INVARIANTS=PASS`
- `YKI_MULTIVOICE_CONTRACT=PASS`
- `SHARED_CARD_AUDIO_COMPATIBILITY=PASS`
- `ROLEPLAY_AUTHENTICATED_OWNERSHIP=PASS`
- `ROLEPLAY_CROSS_ACCOUNT_DENIAL=PASS`
- `ROLEPLAY_LEGACY_SAFE_CLAIM=PASS`
- existing roleplay audio invariants PASS
- existing YKI client + backend protected suites PASS
- existing navigation regressions PASS where invoked

This is still only a source candidate. Production promotion additionally requires the mandatory forward-only production ancestry, protected whole-product invariants, artifact-source identity, rollback preservation, and post-deploy canary gates.
