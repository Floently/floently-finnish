# Run App Agent Prompt

You are the execution agent for booting **Floently Finnish** on a real mobile display path and proving whether the app can run end-to-end on device or simulator.

Repository:
`/home/vitus/floently-finnish/`

Your goal is not to refactor first. Your goal is to **run the app**, display it on mobile, capture exactly what blocks startup if anything fails, and leave behind a decision-ready run report.

## Primary objective

Get the app to display on mobile using the current repository, with the lightest changes possible. Prefer:
1. Expo start on simulator/emulator
2. Expo Go or dev build on a physical device
3. Web only as a fallback check, not as the main success criterion

Success means:
- the Expo app boots
- the first screen renders on a mobile target
- navigation can reach the main product shell without crashing
- any backend dependency required for first render is either running or explicitly stubbed only for boot verification

## Constraints

- Do not perform broad architecture rewrites.
- Do not change material authority decisions.
- Do not introduce new schema families.
- Keep all fixes narrowly scoped to booting and runtime display.
- Record every change.

## Read first

Open and read these before doing anything:
- `/home/vitus/floently-finnish/docs/audits/POST_FIX_DEPLOYMENT_READINESS_SUMMARY.md`
- `/home/vitus/floently-finnish/docs/audits/POST_FIX_OPEN_ISSUES.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_POST_RUN_DECISION_REPORT.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_POST_RUN_OPEN_ISSUES.md`

Key known blockers already identified:
- backend card runtime/router import still blocked by environment dependency issues such as `bcrypt`
- full audio execution still depends on optional provider/runtime packages
- the app may compile but still contain placeholder route/state modules
- the repo may still contain local artifact folders that should not define runtime truth

## Execution order

### Phase 1 — Environment and boot contract
1. Inspect:
   - `apps/client/package.json`
   - `apps/client/app.json`
   - `apps/client/eas.json`
   - `apps/client/tsconfig.json`
   - root `docker-compose.yml`
   - `apps/backend/requirements.txt`
   - `apps/backend/main.py`
2. Determine the expected local boot commands for:
   - backend
   - Expo client
3. Confirm whether the client expects:
   - Expo Go
   - development build
   - local backend URL via `EXPO_PUBLIC_*` vars

### Phase 2 — Install and start dependencies
1. Install backend dependencies in a clean venv.
2. Install client dependencies.
3. Start backend.
4. Start Expo with a mobile target path:
   - first try simulator/emulator if available
   - if not available, still start Metro and produce the QR/dev URL
5. Confirm whether the app bundle is produced successfully.

### Phase 3 — First mobile render proof
1. Open the app on:
   - iOS simulator if available
   - Android emulator if available
   - otherwise capture the Expo start URL/QR flow and bundle success
2. Verify:
   - splash/initial route loads
   - AppShell or route shell loads
   - no red-screen fatal crash on first render
3. Navigate as far as possible into:
   - Home
   - Learn
   - Cards
   - YKI Practice
   - YKI Exam
   - Speaking
   - Professional Finnish

### Phase 4 — Runtime blocker triage
If startup fails, classify the blocker strictly as one of:
- install/dependency problem
- path/import/module-resolution problem
- env/config problem
- backend API availability problem
- route/state-shell problem
- mobile-native package/config problem
- asset/material loading problem

For each blocker:
- identify exact file(s)
- identify exact command that failed
- propose smallest correct fix
- apply only if it is narrowly necessary to get the app to render

### Phase 5 — Mobile release readiness check
Assess whether the app is ready for:
- Google Play internal testing
- TestFlight internal testing
- full production store release

Check specifically:
- release/build config presence
- privacy policy / data safety readiness
- age rating / app info readiness
- icon, splash, screenshots, and store asset readiness
- target API / platform readiness
- account deletion/privacy disclosure implications if account creation exists
- authentication and backend production env readiness
- crash-free first-run experience
- whether current open issues still block release

## Required outputs

Write all outputs to:
`/home/vitus/floently-finnish/docs/agents/`

Create:
1. `RUN_APP_EXECUTION_LOG.md`
2. `RUN_APP_CHANGE_LEDGER.json`
3. `RUN_APP_MOBILE_BOOT_REPORT.md`
4. `RUN_APP_RELEASE_READINESS_REPORT.md`
5. `RUN_APP_OPEN_ISSUES.md`

## Minimum content of the release-readiness report

It must answer clearly:
- Can this app be displayed on mobile right now?
- Can it enter Google Play internal testing right now?
- Can it enter TestFlight internal testing right now?
- Is it ready for Google Play production release?
- Is it ready for Apple App Store production release?

Use verdicts only from:
- `YES`
- `NO`
- `YES, WITH LIMITED CONDITIONS`

And for each `NO` or limited answer, list:
- blocking issue
- severity
- exact fix path

## Completion rule

Do not stop at “it should work.”
Actually attempt to boot the app and produce evidence of:
- successful render path, or
- exact failure path

The report must be decision-grade, not aspirational.
