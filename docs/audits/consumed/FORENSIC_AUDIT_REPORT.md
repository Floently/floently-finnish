# Floently Finnish Forensic Audit Report

## 1. Executive verdict

**Verdict:** Not deployment-ready.

The repository contains credible backend, engine, cards, and client work, but the active delivery surface is structurally inconsistent. There are confirmed deployment blockers in repository hygiene, backend boot authority, client build integrity, runtime-state handling, and CI realism.

Highest-risk confirmed blockers:
- **Critical:** committed local dependency artifact at `/home/vitus/floently-finnish/node_modules`
- **Critical:** committed runtime state with live-looking auth/session data at `/home/vitus/floently-finnish/apps/backend/runtime/state.json`
- **High:** backend has multiple competing API stacks and no single deterministic boot path across `/home/vitus/floently-finnish/apps/backend/main.py`, `/home/vitus/floently-finnish/apps/backend/api/router.py`, and `/home/vitus/floently-finnish/apps/backend/app/**`
- **High:** client TypeScript build is broken with extensive unresolved imports and missing aliases
- **High:** CI intentionally suppresses backend and client failures with `|| true`

## 2. Deployment blocker summary

### Critical

1. **Committed local/install artifact**
   - Evidence: `/home/vitus/floently-finnish/node_modules`
   - Why blocking: clean-checkout reproducibility is already compromised.

2. **Committed runtime state with live-looking auth/session data**
   - Evidence: `/home/vitus/floently-finnish/apps/backend/runtime/state.json`
   - Evidence details: contains `access_tokens`, `auth_session_id`, `user_id`, and expiry timestamps.
   - Why blocking: production/runtime state is mixed into source control; this is both a security and reproducibility failure.

### High

3. **Backend boot path is not authoritative**
   - Evidence: `/home/vitus/floently-finnish/apps/backend/main.py`
   - Evidence: `/home/vitus/floently-finnish/apps/backend/api/router.py`
   - Evidence: `/home/vitus/floently-finnish/apps/backend/app/cards/runtime/api/router.py`
   - Why blocking: the main FastAPI app serves a mock/dev-style API surface and does not clearly mount the more advanced route trees.

4. **Route aggregation silently drops modules**
   - Evidence: `/home/vitus/floently-finnish/apps/backend/api/router.py`
   - Evidence: `/home/vitus/floently-finnish/apps/backend/api/auth_routes.py`
   - Evidence: `/home/vitus/floently-finnish/apps/backend/api/yki_routes.py`
   - Evidence: `/home/vitus/floently-finnish/apps/backend/api/audio_routes.py`
   - Why blocking: aggregator expects `router`, but multiple modules expose `build_*_router()` only; broad `except Exception: continue` masks failures.

5. **Client build fails**
   - Evidence: `npx tsc --noEmit` run in `/home/vitus/floently-finnish/apps/client` returned many `TS2307`, `TS2614`, and route typing failures.
   - Why blocking: current client cannot be treated as releasable.

6. **CI is symbolic instead of gating**
   - Evidence: `/home/vitus/floently-finnish/.github/workflows/ci.yml`
   - Why blocking: `pytest ... || true` and `npx tsc --noEmit || true` explicitly allow broken code to pass CI.

## 3. Architecture/source-of-truth audit

### Confirmed fault: duplicate backend ownership zones

Evidence:
- `/home/vitus/floently-finnish/apps/backend/main.py`
- `/home/vitus/floently-finnish/apps/backend/api/routes/*.py`
- `/home/vitus/floently-finnish/apps/backend/api/*_routes.py`
- `/home/vitus/floently-finnish/apps/backend/app/routers/*.py`
- `/home/vitus/floently-finnish/apps/backend/app/cards/runtime/api/router.py`
- `/home/vitus/floently-finnish/apps/backend/reference/kielitaika/api/*.py`

Assessment:
- `main.py` exposes a direct mock-style API.
- `api/routes/*.py` defines another modern-looking route set.
- `api/*_routes.py` defines legacy builder-based routes.
- `app/**` contains a separate imported stack from another backend lineage.
- `reference/kielitaika/**` preserves donor/reference copies of the legacy stack.

Result:
- There is no single authoritative route domain.
- Security review is weakened because an endpoint being present on disk does not prove it is mounted.

### Confirmed fault: duplicate shared client/network ownership

Evidence:
- `/home/vitus/floently-finnish/packages/core/apiClient.ts`
- `/home/vitus/floently-finnish/packages/core/api/apiClient.ts`
- `/home/vitus/floently-finnish/packages/core/api/client.ts`
- `/home/vitus/floently-finnish/packages/core/apiConfig.ts`
- `/home/vitus/floently-finnish/packages/core/api/apiConfig.ts`
- `/home/vitus/floently-finnish/apps/client/features/shared/serviceClient.ts`

Assessment:
- There are at least four network/config entrypoints with different base-URL assumptions:
  - `http://127.0.0.1:8585`
  - `env.API_URL`
  - hard-coded `http://localhost:8000/api/v1`
  - `EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000'`
- This is a confirmed source-of-truth fault, not harmless duplication.

### Architectural risk: docs and migration residue compete with active truth

Evidence:
- `/home/vitus/floently-finnish/EVERYTHING_REMAINING_README.md`
- `/home/vitus/floently-finnish/PRODUCE_NOW_README.md`
- `/home/vitus/floently-finnish/everything_remaining_ledger.json`
- `/home/vitus/floently-finnish/docs/SOURCE_TRUTH_LEDGER.json`

Assessment:
- The repo still carries assembly/migration control artifacts in the production root.
- This increases ambiguity about live truth and active operating procedure.

## 4. Backend audit

### Confirmed fault: active app is dev/mock-oriented and permissive

Evidence:
- `/home/vitus/floently-finnish/apps/backend/main.py`

Findings:
- `allow_origins=["*"]`
- `allow_credentials=True` with wildcard origin
- mock auth endpoint `/api/v1/auth/mock-login`
- root app returns hard-coded modes and sample data
- learning endpoints return generated sample structures rather than documented persistence-backed API contracts

Impact:
- This is not a clean production boot path.
- Auth posture is not production-safe.

### Confirmed fault: environment contract drift

Evidence:
- `/home/vitus/floently-finnish/apps/backend/core/config.py`
- `/home/vitus/floently-finnish/apps/backend/.env.example`

Findings:
- code expects `FLOENTLY_ENV`, `YKI_ENGINE_BASE_URL`, `SIGNED_SESSION_SECRET`
- `.env.example` provides `APP_ENV`, `ENGINE_BASE_URL`, `JWT_SECRET`
- these do not line up

Impact:
- a clean machine cannot infer the true configuration contract reliably.

### Confirmed fault: insecure default secret

Evidence:
- `/home/vitus/floently-finnish/apps/backend/core/config.py`
- `/home/vitus/floently-finnish/apps/backend/core/security.py`

Finding:
- `signed_session_secret` defaults to `dev-only-secret-change-me`

Impact:
- unsafe-by-default session signing violates deployment-readiness expectations.

### Likely fault requiring runtime confirmation: request ID and structured error path are not installed on the active backend app

Evidence:
- `/home/vitus/floently-finnish/apps/backend/middleware/request_id.py`
- `/home/vitus/floently-finnish/apps/backend/middleware/error_handlers.py`
- `/home/vitus/floently-finnish/apps/backend/main.py`

Assessment:
- middleware/utilities exist, but `main.py` does not obviously register them.
- runtime confirmation would verify whether any real boot path installs them.

## 5. Engine audit

### Strength

Evidence:
- `/home/vitus/floently-finnish/engine/api/server_v3_3.py`
- `/home/vitus/floently-finnish/engine/tests/test_exam_runtime_integration.py`
- `/home/vitus/floently-finnish/engine/tests/test_event_sourcing.py`

Assessment:
- the root `engine/` tree is the cleanest source-of-truth candidate in the repo.
- engine boot path is more disciplined than backend boot path.
- engine tests reflect real runtime concerns: session tokens, speaking flows, submission lifecycle.

### Confirmed fault: backend still carries alternate YKI orchestration logic

Evidence:
- `/home/vitus/floently-finnish/apps/backend/yki/adapter.py`
- `/home/vitus/floently-finnish/apps/backend/yki/orchestrator.py`
- `/home/vitus/floently-finnish/apps/backend/api/routes/yki_exam.py`
- `/home/vitus/floently-finnish/apps/backend/adapters/yki_engine_adapter.py`

Assessment:
- backend can both orchestrate YKI locally and proxy to engine.
- this violates the desired “engine is sole source of truth” model unless one path is explicitly demoted.

### Architectural risk: stub residue near real engine

Evidence:
- `/home/vitus/floently-finnish/apps/backend/engine/README.stub.txt`

Impact:
- contributor confusion and future import drift.

## 6. Client audit

### Confirmed fault: route tree is present but not buildable

Evidence:
- `/home/vitus/floently-finnish/apps/client/app/**`
- `/home/vitus/floently-finnish/apps/client/state/AppShell.tsx`
- TypeScript compile failure output

Findings:
- many routes point to incorrect relative paths, e.g. `/home/vitus/floently-finnish/apps/client/app/index.tsx`
- aliases such as `@core/*` and `@ui/*` are used extensively, but `/home/vitus/floently-finnish/apps/client/tsconfig.json` only defines `@/*`
- `AppShell.tsx` imports many modules that do not exist in the repo

Impact:
- Expo route reachability on disk does not translate to a runnable client.

### Confirmed fault: stale starter and donor residue remain mixed into the app

Evidence:
- `/home/vitus/floently-finnish/apps/client/app/(tabs)/*`
- `/home/vitus/floently-finnish/apps/client/README.md`

Assessment:
- default Expo starter tabs and README remain beside product-specific route trees.
- this is not deployment-blocking on its own, but it is a maintainability and coherence fault.

### Confirmed fault: intended product modes are only partially exposed through a coherent runnable shell

Evidence:
- `/home/vitus/floently-finnish/apps/client/app/cards/index.tsx`
- `/home/vitus/floently-finnish/apps/client/app/learn/*.tsx`
- `/home/vitus/floently-finnish/apps/client/app/professional/*.tsx`
- `/home/vitus/floently-finnish/apps/client/app/speaking/index.tsx`
- `/home/vitus/floently-finnish/apps/client/app/yki-exam/*.tsx`
- `/home/vitus/floently-finnish/apps/client/app/yki-practice/index.tsx`

Assessment:
- the intended user-facing modes exist in the route tree.
- however, client compilation failure and broken imports mean this completeness is only nominal.

## 7. Learning-product evidence audit

### Strength

Evidence:
- `/home/vitus/floently-finnish/apps/backend/learning/scheduler.py`
- `/home/vitus/floently-finnish/apps/backend/learning/revision_vault_service.py`
- `/home/vitus/floently-finnish/apps/backend/learning/personal_phrase_bank_service.py`
- `/home/vitus/floently-finnish/apps/backend/learning/confidence_tracker_service.py`

Assessment:
- the repository encodes the intended learning loop conceptually.
- there is real scheduling logic, confidence usage, revision support, and phrase-bank support.

### Confirmed fault: several client learning surfaces depend on fallback content or non-existent endpoints

Evidence:
- `/home/vitus/floently-finnish/apps/client/features/learning/services/ykiPlannerService.ts`
- `/home/vitus/floently-finnish/apps/client/features/learning/services/confidenceTrackerService.ts`
- `/home/vitus/floently-finnish/apps/client/features/learning/services/revisionVaultService.ts`
- `/home/vitus/floently-finnish/apps/client/features/learning/services/personalPhraseBankService.ts`
- `/home/vitus/floently-finnish/apps/client/features/learning/services/workplaceIncidentService.ts`

Findings:
- these clients call `/api/routes/...` endpoints that are not represented by the mounted backend code reviewed.
- they often fall back to local mock summaries.

Impact:
- evidence-based learning behavior is only partially wired in runtime reality.

### Confirmed fault: offline content-generation and runtime material boundaries are blurred

Evidence:
- `/home/vitus/floently-finnish/apps/backend/src/features/practice_content/pipeline/**`
- `/home/vitus/floently-finnish/apps/backend/runtime/materials/material_inventory.json`
- `/home/vitus/floently-finnish/apps/backend/app/cards/output/accepted/accepted_cards.json`

Impact:
- runtime artifacts, normalized inventories, and publication outputs remain mixed into source control.

## 8. Accessibility audit

### Likely fault requiring runtime confirmation

Evidence:
- client does not compile, preventing meaningful WCAG review of active flows.
- no dedicated accessibility test harness or audit artifacts were found in inspected files.

Assessment:
- route-level and component-level existence is not enough to claim WCAG 2.2 AA alignment.
- due to broken build state, accessibility readiness cannot be confirmed.

## 9. Security/API/mobile/supply-chain audit

### Confirmed fault: runtime state file is a security issue

Evidence:
- `/home/vitus/floently-finnish/apps/backend/runtime/state.json`

Impact:
- committed access-token/session state is incompatible with secure SDLC expectations.

### Confirmed fault: permissive CORS and mock auth in active backend boot path

Evidence:
- `/home/vitus/floently-finnish/apps/backend/main.py`

Impact:
- misconfiguration risk, weak auth posture, and accidental production exposure.

### Confirmed fault: CI does not enforce quality gates

Evidence:
- `/home/vitus/floently-finnish/.github/workflows/ci.yml`

Impact:
- Scorecard/SLSA-style maturity is low; broken code can merge without failing CI.

### Confirmed fault: package/workspace metadata is under-specified

Evidence:
- `/home/vitus/floently-finnish/packages/core/package.json`
- `/home/vitus/floently-finnish/packages/ui/package.json`

Findings:
- placeholder package metadata
- `main: index.js` despite no built JS artifact in package roots

Impact:
- package resolution and workspace reliability are weak.

## 10. Testing and CI audit

### Confirmed fault: tests are not reproducible from current environment contract

Evidence:
- local `python3 -m pytest apps/backend/tests engine/tests -q` failed because `pytest` is unavailable
- `python3` imports of backend and engine apps failed because `fastapi` is unavailable
- `/home/vitus/floently-finnish/apps/backend/requirements.txt` exists, but repo depends on external install state

Assessment:
- inability to run on a clean environment is itself a readiness signal.
- more importantly, CI intentionally masks failure.

### Confirmed fault: tests cover code that is not clearly part of the active backend boot path

Evidence:
- `/home/vitus/floently-finnish/apps/backend/tests/test_runtime_api.py`
- `/home/vitus/floently-finnish/apps/backend/app/cards/runtime/api/router.py`
- `/home/vitus/floently-finnish/apps/backend/main.py`

Assessment:
- strong cards tests exist, but they exercise `app.cards.runtime.api.router` directly, not the mounted production app.

## 11. Reproducibility audit

### Confirmed fault

Evidence:
- `/home/vitus/floently-finnish/node_modules`
- `/home/vitus/floently-finnish/.gitignore`
- `/home/vitus/floently-finnish/apps/backend/.env.example`
- `/home/vitus/floently-finnish/apps/client/tsconfig.json`

Assessment:
- `.gitignore` is too minimal for a monorepo.
- root dependencies are committed.
- env contract is inconsistent.
- client path aliases are incomplete.
- clean-clone reproducibility is not established.

## 12. Deployment readiness verdict

**Deployment verdict:** Block deployment.

Blocking conditions:
1. Remove committed runtime/auth state and local artifacts.
2. Establish one authoritative backend boot path.
3. Eliminate route/client/config duplication.
4. Make client compile cleanly.
5. Turn CI into a real gate.
6. Align environment variables and startup contracts.

## 13. Ordered remediation sequence

1. Remove committed runtime state and local dependency artifacts; strengthen `.gitignore`.
2. Freeze one backend entrypoint and mount only explicitly chosen routers.
3. Demote or archive duplicate backend stacks under `app/`, `api/*_routes.py`, and `reference/`.
4. Converge client API/config layers to one authoritative implementation.
5. Fix client TypeScript path aliases, broken relative imports, and missing modules or delete dead shell code.
6. Align `.env.example`, backend config names, Docker, and deployment descriptors.
7. Make CI fail on test/build errors and add clean-install verification.
8. Re-run backend tests, engine tests, client typecheck, and smoke routes from a clean environment.
