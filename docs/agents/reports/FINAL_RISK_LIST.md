# Final Risk List

## High

- `apps/client/state/BillingRoute.tsx`, `LearningRoute.tsx`, `ProfessionalRoute.tsx`, and `SpeakingRoute.tsx` still contain feature UI instead of orchestration-only code.
- `apps/backend/services/voice_service.py` still depends on `app.*` support modules, so the backend still has one real internal shadow dependency chain.
- `apps/backend/app/cards/**` remains a large parallel card architecture on disk and can still confuse future work even though it is not the live HTTP authority.

## Medium

- `apps/backend/yki/**` is still part of the orchestration path even though `engine/**` is the intended sole runtime authority.
- direct service calls to YKI exam start with hyphenated level bands (`B1-B2`) still fail; the live client path avoids this by normalizing to `B1_B2`.
- `features/exam/**` and `features/yki-exam/**` are split by responsibility, but the distinction is architectural rather than obvious by naming and should be documented for future maintainers.

## Low

- runtime artifact directories such as `engine/.runtime_audio_cache/**`, `exam_sessions/**`, and `logs/**` remain in the worktree and can create noise during future audits.
- `pydub` still warns about missing `ffmpeg`/`avconv` at import time; route registration still works, but media workflows should be validated in a real runtime environment.

## Next recommended convergence steps

1. Move `BillingRoute.tsx` UI into `features/billing/screens/*` and reduce the route file to a wrapper.
2. Move `LearningRoute.tsx` landing UI into `features/learning/screens/*`.
3. Move `ProfessionalRoute.tsx` and `SpeakingRoute.tsx` menu UIs into `features/professional/**` and `features/speaking/**`.
4. Rewrite canonical voice/TTS services to stop importing `app.*`.
5. Quarantine `apps/backend/app/routers/**`, `apps/backend/app/services/auth_service.py`, `apps/backend/app/db/**`, and `apps/backend/src/features/practice_content/**`.
