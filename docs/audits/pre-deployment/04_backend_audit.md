# Backend Audit

## Scope Statement
Audit of backend boot path, health checks, router behavior, auth enforcement, TTS, YKI, cards, and deployment behavior.

## What Was Inspected
- `apps/backend/main.py`, router modules, auth and subscription services, state store, TTS services, deployment scripts, Dockerfile, health routes.

## Methods Used
- Static inspection.
- `main` import check.
- `boot_gate.sh` execution.
- Local TTS health and resolution checks.

## Commands Run
- `cd apps/backend && .venv/bin/python -c "import main; print('main import ok')"`
- `bash apps/backend/scripts/boot_gate.sh`
- local `resolve_tts_audio(...)` and `get_tts_health_snapshot()` checks

## PASS / WARN / FAIL Verdicts
- Import/startup path: **WARN**
- Readiness/health behavior: **FAIL**
- Authz discipline: **FAIL**
- Optional integration resilience: **WARN**
- Deployment reproducibility: **FAIL**

## Findings
### AUD-005 — TTS runtime, diagnostics, and deployment contract are inconsistent
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **backend**
        - Exact paths: `apps/backend/app/services/tts/runtime.py`, `apps/backend/app/services/voice_service.py`, `apps/backend/scripts/deploy.sh`, `apps/backend/.env`
        - Evidence:
        - apps/backend/app/services/tts/runtime.py:137-151 only selects OpenAI or development fallback; Google is never selected in the main resolver.
- apps/backend/app/services/voice_service.py:237-250 reports Google as configured in health output, creating a false operational signal.
- apps/backend/scripts/deploy.sh:33-37 excludes .env from rsync but deploy.sh:65-70 starts the container with --env-file $REMOTE_BACKEND/.env.
- Local check showed resolve_tts_audio succeeds only via provider=openai, while the health snapshot claims default provider google.
        - Suggested remediation: Make TTS provider routing honor configured provider order, align health diagnostics to the actual resolver path, and make deployment env injection explicit and deterministic.
        - Verification after remediation:
        - Production-mode TTS health endpoint must name the real active provider chain.
- End-to-end TTS request succeeds on a clean deploy using only documented environment variables.
- A regression test asserts Google/OpenAI/fallback selection behavior.

### AUD-006 — Boot health contract is unreliable and failed the provided boot gate
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **infra/devops**
        - Exact paths: `apps/backend/scripts/boot_gate.sh`, `apps/backend/app/routers/health.py`, `apps/backend/main.py`
        - Evidence:
        - bash apps/backend/scripts/boot_gate.sh printed Import OK, then logged startup, then exited with `ERROR: /health did not respond within 10s`.
- apps/backend/app/routers/health.py returns a static ok payload and does not validate DB, state store, YKI materials, TTS path, or mounted runtime dependencies.
        - Suggested remediation: Repair server startup/boot gate behavior and replace shallow health checks with readiness probes that validate critical dependencies and fail fast when the runtime is not genuinely ready.
        - Verification after remediation:
        - boot_gate.sh succeeds repeatedly on a clean environment.
- Readiness endpoint reflects DB, auth state store, material authority, and TTS readiness.
- Container orchestration uses readiness/liveness probes with realistic timeouts.

### AUD-008 — Card runtime endpoints permit anonymous access and weaken authorization boundaries
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **backend**
        - Exact paths: `apps/backend/app/routers/v1_cards.py`
        - Evidence:
        - apps/backend/app/routers/v1_cards.py:29-38 maps missing auth to user_id="anonymous".
- apps/backend/app/routers/v1_cards.py:51-108 exposes adaptive session start, answer, next, and deck retrieval without requiring a verified authenticated user.
        - Suggested remediation: Require authenticated identity for personalized card session endpoints, enforce entitlement checks, and add explicit public/private route boundaries.
        - Verification after remediation:
        - Unauthenticated calls to adaptive session and deck endpoints return 401/403.
- Authorized users can access only the tracks permitted by their entitlements.

### AUD-009 — Production auth/session architecture relies on JSON file state instead of durable hardened persistence
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **backend**
        - Exact paths: `apps/backend/app/core/state_store.py`, `apps/backend/app/services/auth_service.py`, `apps/backend/app/db/models.py`
        - Evidence:
        - apps/backend/app/core/state_store.py:42-56 stores users, tokens, sessions, oauth state, and YKI sessions in a single JSON-backed in-memory store.
- The repository also contains ORM user/session-related models, proving dual persistence authorities rather than one production-grade source of truth.
- State snapshots are written with write_snapshot() and a committed runtime state file already contains password_hash values.
        - Suggested remediation: Consolidate auth/session persistence onto a real transactional datastore, retire file-backed auth state for production, and define a single authority for identity/session records.
        - Verification after remediation:
        - Auth lifecycle survives restarts without file-backed state mutation in the repo/runtime image.
- Concurrent login/logout/refresh tests pass against the chosen database-backed implementation.

## Evidence Highlights
- `boot_gate.sh` failed with `ERROR: /health did not respond within 10s` even after startup logs appeared.
- Card runtime endpoints fall back to an anonymous pseudo-user when auth is missing.
- The TTS resolver and TTS health endpoint disagree about provider readiness.
