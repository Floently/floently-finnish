# Security Replay Provenance — 2026-08-16

The KV-SEC-002 ownership files on this candidate are replayed from the verified sibling branch `security/roleplay-session-ownership-kv-sec-002-20260816` without redesigning the security logic.

Source sibling exact head at replay preparation: `f8dcf7195d47f27d72d78092304199f3f76ba530`.

Verified source blob identities:

- `apps/backend/app/routers/v1_roleplay.py` -> `e2dfaa2f58f9c658a51cc549fac5b3f0054fd7f2`
- `apps/backend/app/services/roleplay_ownership.py` -> `d575e524174d52f2a0c2597a0752677217bd437c`
- `apps/backend/app/services/roleplay_session_service.py` -> `787002d57e63d68154888c3b5bbbbb343d73bae9`
- `apps/backend/scripts/verify_roleplay_session_ownership.py` -> `40ebe74f61a2cb700b6ab3ee009c1d73657aa4c3`
- `.github/workflows/roleplay-session-ownership.yml` -> `86b27c4254e29bfc0869d8b9d6a0082e8e1ef856`

The sibling's dedicated ownership workflow run `31955974642` passed on that exact source head before replay. The combined candidate must run the same ownership gate again after replay, plus the existing voice/YKI protected suites.
