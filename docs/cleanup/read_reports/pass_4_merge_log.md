# Pass 4 Merge Log

1. Inventoried remaining cards/audio/YKI duplication and confirmed that the top-level `cards/` and `audio/` packages were namespace bridges, while the top-level `yki/` package was stale and internally broken.
2. Rewrote backend cards/audio import usage from `cards.*` and `audio.*` to `app.cards.*` and `app.audio.*` across canonical code, tools, and targeted tests.
3. Replaced the old `yki.*`-based test surface with canonical `app.services.yki_service` and `app.services.yki_exam_runtime_guard` coverage.
4. Reworked the targeted cards/runtime verification to exercise canonical `app.cards.*` publication and route surfaces directly.
5. Deferred `app.routers.auth` import inside `app.cards.runtime.api.router` so canonical cards route imports no longer depend on eager JWT import during unit verification.
6. Re-ran backend import, boot, pytest, and grep verification after the reference rewrites.
7. Moved `apps/backend/cards/`, `apps/backend/audio/`, and `apps/backend/yki/` into the external quarantine root.
8. Re-ran backend import, boot, pytest, and grep verification after the quarantine move.
