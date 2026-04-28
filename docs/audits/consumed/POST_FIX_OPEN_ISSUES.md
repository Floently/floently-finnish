# Post-Fix Open Issues

**Date:** 2026-04-11

These issues were not resolved in this fix pass and represent the remaining work before a production deployment can be considered safe.

---

## P1 — Must fix before production

### OI-01: Backend `api/router.py` not mounted in `main.py`

The explicit `api/router.py` (auth, yki, audio, voice, roleplay, subscription, cards routes) is not mounted in the active `main.py` app. These routes exist and are now correctly imported, but they serve endpoints that the client expects (e.g., `/api/v1/auth/register`, `/api/v1/yki/...`).

**Action required:** Mount `api_router` from `api/router.py` into `main.py` after resolving service-layer dependencies (DB, auth service, YKI service).

---

### OI-02: Backend service dependencies not verified

The routes in `api/*_routes.py` depend on services (`auth_service`, `yki_service`, `cards_service`) that have their own dependencies (database, engine client). These were not tested in this pass because the environment lacked `fastapi` and backend deps.

**Action required:** Install backend requirements in a venv, boot the full app, and verify all mounted routes respond to smoke requests.

---

### OI-03: Client state modules are stubs, not full implementations

The following were created as minimal stubs for the TypeScript check to pass. They do not have full runtime behavior:
- `state/appFlowStore.ts` — basic navigation state machine; session restoration logic not wired
- `state/sessionPersistence.ts` — localStorage-based; AsyncStorage not used (would need React Native version)
- `state/AuthRoute.tsx`, `HomeRoute.tsx`, `LearningRoute.tsx`, etc. — placeholder UIs
- `features/yki-practice/services/ykiPracticeService.ts` — calls real API but no error recovery
- `features/learning/services/learningService.ts` — stub; calls `/api/v1/learning/modules`

**Action required:** Implement each to its full intended behavior as defined by the AppShell orchestration logic.

---

### OI-04: Backend engine authority not fully enforced (MF-10)

`apps/backend/yki/` contains local YKI orchestration logic that competes with the root `engine/`. The backend can both proxy to engine AND run local orchestration.

**Action required:** Demote or remove `apps/backend/yki/orchestrator.py` in favor of delegation to `engine/` exclusively.

---

### OI-05: pytest cannot run in clean environment

Backend tests require `fastapi`, `pytest`, and other dependencies from `apps/backend/requirements.txt`. These are not available without installing from the requirements file first.

**Action required:** Verify `pip install -r apps/backend/requirements.txt` → `pytest apps/backend/tests engine/tests -q` succeeds in CI.

---

## P2 — Should fix before stabilization

### OI-06: Learning service client calls non-authoritative endpoints

Client learning services (`confidenceTrackerService.ts`, `ykiPlannerService.ts`, etc.) call `/api/routes/...` endpoints that are placeholder paths not mounted in the active backend.

**Action required:** Wire learning service clients to the actual mounted backend endpoints.

---

### OI-07: `sessionPersistence.ts` uses localStorage, not AsyncStorage

The stub uses `window.localStorage` which works on web but not on native React Native. The `@react-native-async-storage/async-storage` package is now installed but not used in `sessionPersistence.ts`.

**Action required:** Replace localStorage with AsyncStorage for cross-platform persistence.

---

### OI-08: AppShell Route components are placeholder UIs

`HomeRoute`, `LearningRoute`, `YkiPracticeRoute`, `YkiExamRoute`, `AuthRoute`, `FeatureEntryRoute` all render placeholder screens. The full product UIs need to be connected.

**Action required:** Implement each Route component to render the correct screen content.

---

### OI-09: `packages/ui/screens/` screens not indexed in `packages/ui/index.ts`

New screens (`ApplicationErrorScreen`, `CertificateScreen`) are not exported from `packages/ui/index.ts`.

**Action required:** Add exports or use direct path imports (current code uses direct paths, so this is low risk).

---

## P3 — Housekeeping / tech debt

### OI-10: `(tabs)/` directory residue from Expo starter template

`apps/client/app/(tabs)/explore.tsx` and `apps/client/app/(tabs)/index.tsx` are default Expo starter files that should be removed or replaced.

### OI-11: Assembly/migration artifacts at repo root

`EVERYTHING_REMAINING_README.md`, `PRODUCE_NOW_README.md`, `everything_remaining_ledger.json` are migration control artifacts that should be moved to `docs/` or removed.

### OI-12: `apps/backend/engine/README.stub.txt` remains

Stub indicator at `apps/backend/engine/` could cause import confusion. Should be removed or replaced with a proper delegation comment.

### OI-13: WCAG/accessibility review deferred

Client now compiles, so a meaningful accessibility review is possible. Run a task-based UX/a11y pass across all product modes before shipping.

### OI-14: `packages/core` and `packages/ui` package metadata under-specified

`packages/core/package.json` and `packages/ui/package.json` have placeholder metadata. `main: index.js` points to a non-existent built artifact. Should be aligned with actual TypeScript-first workspace usage.
