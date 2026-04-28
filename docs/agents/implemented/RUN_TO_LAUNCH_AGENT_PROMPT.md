# RUN_TO_LAUNCH_AGENT_PROMPT.md

You are the launch-readiness implementation agent for **Floently**.

Repository:
`/home/vitus/floently-finnish/`

Products and domain model:
- Main marketing/entry site: `floently.com`
- Read product landing and web app: `floently.com/read`
- Learn product landing and web/mobile app: `floently.com/learn`

These are **one brand and one app family**, but two product surfaces:
- **Floently Read**
- **Floently Learn**

The mobile app should follow the same product logic and information architecture as the web app, with platform-appropriate navigation.

---

## Primary mission

Take the project from:
- mobile boot success
- partial backend readiness
- partial material convergence
- partial route completion

to:
- fully testable locally
- backend production-usable
- app buildable for stores
- backend deployed and production env wired
- ready for internal store testing

Do this in strict order.

---

## Read first

Before changing anything, read these files:

### Runtime / boot / release
- `/home/vitus/floently-finnish/docs/agents/RUN_APP_EXECUTION_LOG.md`
- `/home/vitus/floently-finnish/docs/agents/RUN_APP_MOBILE_BOOT_REPORT.md`
- `/home/vitus/floently-finnish/docs/agents/RUN_APP_RELEASE_READINESS_REPORT.md`
- `/home/vitus/floently-finnish/docs/agents/RUN_APP_OPEN_ISSUES.md`

### Prior deployment/stabilization
- `/home/vitus/floently-finnish/docs/audits/POST_FIX_DEPLOYMENT_READINESS_SUMMARY.md`
- `/home/vitus/floently-finnish/docs/audits/POST_FIX_OPEN_ISSUES.md`

### Materials/runtime authority
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_POST_RUN_DECISION_REPORT.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_RUNTIME_AUTHORITY_MAP.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_POST_RUN_OPEN_ISSUES.md`

### Navigation / UX direction
- Any current UI/UX handoff docs in `docs/agents/` or `docs/audits/` related to navigation, route structure, or app shell
- Current `app.json`, `eas.json`, route tree, `AppShell.tsx`, `navigationModel.ts`, and all route/screen files

---

## Non-negotiable rules

1. **Finish the runtime-critical blockers first.**
2. Do not start production deployment work before the app is manually testable end to end locally.
3. Preserve the material authority decisions already made:
   - YKI runtime authority = internalized v3.2 certified family
   - Card runtime authority = canonical internalized card family
4. Do not reintroduce direct runtime reads from donor repos.
5. Do not perform broad rewrites unless necessary for launch readiness.
6. Prefer targeted fixes, explicit imports, visible routing, and deterministic contracts.
7. Keep the UX direction:
   - simple navigation
   - low-clutter screens
   - minimal scrolling outside unavoidable screens
   - one focused task per screen where possible
   - utility drawer only as a secondary navigation layer
8. Treat `floently.com/read` and `floently.com/learn` as first-class product surfaces under the same brand.

---

# PHASE 1 — Finish the runtime-critical blockers

You must do these first.

## 1.1 Backend route correctness
Resolve all runtime API blocking issues, including:
- mount `api/router.py` into `main.py`
- verify the mounted routes actually respond
- ensure auth, YKI, cards, voice, roleplay, billing/subscription routes are reachable where intended

## 1.2 Native persistence correctness
Replace `localStorage` usage with AsyncStorage or a cross-platform abstraction for native-safe persistence.

## 1.3 Device API targeting
Fix `EXPO_PUBLIC_API_BASE_URL` handling so:
- local device testing uses host LAN IP or a configurable dev URL
- production builds use production backend URLs
- no physical-device runtime points to `localhost`

## 1.4 Remove or replace placeholder route UIs
Any route that still renders a placeholder/stub must be turned into:
- a real screen, or
- an explicit “not yet available” gated screen with correct navigation and no broken behavior

Minimum areas to verify:
- Home
- Auth
- Learn
- Cards
- YKI Practice
- YKI Exam
- Speaking
- Professional Finnish
- Billing
- Settings
- Progress
- Help

## 1.5 Package/runtime compatibility
Resolve package mismatches that can affect runtime behavior, such as Expo SDK package version mismatches.

---

# PHASE 2 — Publish HOW_TO_RUN.md

Before moving to production work, create:

`/home/vitus/floently-finnish/docs/agents/HOW_TO_RUN.md`

This file must be written for a human operator and include:

## 2.1 Local setup
- exact Python version
- exact Node/npm version
- exact install commands
- env files required
- how to set local API base URL for simulator and for physical device

## 2.2 Backend run steps
- exact command
- required env vars
- how to verify health
- how to verify mounted routes

## 2.3 Client run steps
- exact Expo command
- Android physical device
- Android emulator
- iOS simulator (if available on Mac)
- web run command

## 2.4 Manual test path
A simple human test route:
- open app
- sign in / mock auth if enabled
- navigate to each core product area
- trigger at least one real action in each
- verify no fatal crash
- verify API-backed actions
- verify persistence after restart

## 2.5 Failure guide
For each common failure:
- Metro not starting
- backend health failing
- device cannot reach backend
- auth failing
- route blank screen
- audio failure
- billing failure

Explain what to check and how to report it.

---

# PHASE 3 — Work with the operator to manually test every function end to end

After `HOW_TO_RUN.md` exists, use it as the test protocol.

Your job is to make the project manually testable and leave behind a checklist the operator can follow.

Create:

`/home/vitus/floently-finnish/docs/agents/MANUAL_E2E_TEST_MATRIX.md`

It must include every screen and function, at minimum:
- launch / splash / home
- auth status, sign in, register, sign out
- onboarding
- cards
- learning/review flow
- YKI practice
- YKI exam intro / runtime / results paths as far as safely possible
- speaking lab
- professional Finnish
- progress
- settings
- billing
- help
- web routing for `/`, `/read`, `/learn`

For each row include:
- screen/function
- prerequisite
- exact action
- expected result
- backend endpoint involved
- pass/fail
- notes

Also create:

`/home/vitus/floently-finnish/docs/agents/BUG_REPORT_TEMPLATE.md`

The operator will use this to report back failures.

Do not move to production deployment work until:
- the local app is manually runnable
- every major screen is reachable
- the manual E2E matrix is ready
- the known critical runtime blockers are resolved

---

# PHASE 4 — Make the backend production-usable

Only after Phase 3 is in good shape.

Tasks:
- verify backend requirements are complete
- verify runtime router import chain
- verify secrets/env contract
- verify auth stack
- verify card runtime API importability
- verify production-safe CORS
- verify production-safe mock-auth gating
- verify health checks and readiness checks
- verify logging and error handling
- verify background/asynchronous tasks if needed

Add or update:
- production env contract docs
- deployment health checklist
- startup validation for missing critical env vars

Create:
`/home/vitus/floently-finnish/docs/agents/BACKEND_PRODUCTION_READINESS.md`

---

# PHASE 5 — Make the app buildable for stores

Only after the app is working locally end to end.

Tasks:
- set final app identity
  - app name
  - slug
  - android package name
  - ios bundle identifier
- initialize/link EAS project
- verify `app.json` and `eas.json`
- verify icons, splash, adaptive icon, store-safe branding assets
- verify production environment config in build profiles
- verify app version/build number strategy
- verify platform permissions
- verify privacy-related declarations required by app capabilities

Create:
`/home/vitus/floently-finnish/docs/agents/STORE_BUILD_READINESS.md`

---

# PHASE 6 — Deploy the backend and wire production env

Only after local end-to-end testing is good.

Tasks:
- choose backend deployment target and document why
- deploy backend
- configure production environment variables
- verify health endpoint publicly
- verify app can hit production backend
- verify web can hit production backend
- verify CORS and auth on production
- verify card and YKI runtime authority paths on production-safe config

Create:
`/home/vitus/floently-finnish/docs/agents/PRODUCTION_DEPLOYMENT_RUNBOOK.md`

---

# PHASE 7 — Only then move into internal store testing

Only when:
- backend is production-usable
- app builds successfully
- production/staging backend exists
- major screens are working
- manual test matrix is substantially passing

Tasks:
- create internal test build plan for Google Play
- create internal test build plan for TestFlight
- verify release notes, tester flow, rollback plan

Create:
`/home/vitus/floently-finnish/docs/agents/INTERNAL_TESTING_PLAN.md`

---

## Domain and product routing requirement

The agent must account for this domain model:

- `floently.com` = general landing page for Floently as a whole
- `floently.com/read` = Floently Read landing page and web app entry
- `floently.com/learn` = Floently Learn landing page and web/mobile product entry

The agent must recommend a sane routing/deployment structure that supports:
- different product landing pages
- shared brand
- shared auth where appropriate
- separate web deployments if useful
- one backend or logically separated backend services where justified

---

## Required output files

Write all outputs to:
`/home/vitus/floently-finnish/docs/agents/`

Create at minimum:
1. `HOW_TO_RUN.md`
2. `MANUAL_E2E_TEST_MATRIX.md`
3. `BUG_REPORT_TEMPLATE.md`
4. `BACKEND_PRODUCTION_READINESS.md`
5. `STORE_BUILD_READINESS.md`
6. `PRODUCTION_DEPLOYMENT_RUNBOOK.md`
7. `INTERNAL_TESTING_PLAN.md`
8. `RUN_TO_LAUNCH_EXECUTION_LOG.md`
9. `RUN_TO_LAUNCH_CHANGE_LEDGER.json`
10. `RUN_TO_LAUNCH_DECISION_REPORT.md`
11. `RUN_TO_LAUNCH_OPEN_ISSUES.md`

---

## Decision report requirements

`RUN_TO_LAUNCH_DECISION_REPORT.md` must answer clearly:

- Is the app fully manually testable locally now?
- Is the backend production-usable now?
- Is the app buildable for stores now?
- Is the backend deployed and wired now?
- Is the project ready for Google Play internal testing?
- Is the project ready for TestFlight internal testing?
- What is the exact next move?

Use only these verdicts:
- `YES`
- `NO`
- `YES, WITH LIMITED CONDITIONS`

---

## Completion rule

Do not stop at planning.

You must:
- fix the runtime-critical blockers first
- produce `HOW_TO_RUN.md`
- make the app locally testable
- produce decision-grade documentation
- then proceed to production and store-readiness work in order
