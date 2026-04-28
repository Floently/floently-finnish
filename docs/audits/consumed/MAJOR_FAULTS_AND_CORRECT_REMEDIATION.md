# Major Faults And Correct Remediation

## MF-01
- ID: `MF-01`
- Title: Committed runtime state with auth/session data
- Severity: Critical
- Exact evidence: `/home/vitus/floently-finnish/apps/backend/runtime/state.json`
- Why it is dangerous: mixes runtime state into source control, leaks operational identifiers, and masks missing bootstrap/persistence boundaries.
- Correct fix strategy: remove from version control, rotate any affected secrets/tokens if real, classify runtime state storage outside repo, add ignore coverage, and verify fresh boot without it.
- Wrong fixes to avoid: renaming the file but keeping it committed; treating it as a harmless fixture without strict fixture isolation.
- Owner domain: `backend`
- Blocks deployment: Yes
- Verification steps after fix: clean clone; install from manifests; boot backend; confirm runtime state is generated externally or ephemeral.

## MF-02
- ID: `MF-02`
- Title: Committed local dependency artifact
- Severity: Critical
- Exact evidence: `/home/vitus/floently-finnish/node_modules`
- Why it is dangerous: breaks reproducibility, bloats repo, and hides missing dependency declarations.
- Correct fix strategy: remove from version control, tighten ignore rules for workspace-level dependency/build artifacts, and validate `npm ci` or equivalent from a clean tree.
- Wrong fixes to avoid: leaving it in repo “temporarily”; relying on committed dependencies during CI or local smoke tests.
- Owner domain: `ops`
- Blocks deployment: Yes
- Verification steps after fix: delete install artifacts, run clean dependency install, verify lockfile-only reconstruction.

## MF-03
- ID: `MF-03`
- Title: Non-deterministic backend route authority
- Severity: High
- Exact evidence: `/home/vitus/floently-finnish/apps/backend/main.py`, `/home/vitus/floently-finnish/apps/backend/api/router.py`, `/home/vitus/floently-finnish/apps/backend/api/routes/*.py`, `/home/vitus/floently-finnish/apps/backend/app/**`
- Why it is dangerous: the repo contains multiple plausible production APIs with no single authoritative mounting strategy.
- Correct fix strategy: pick one boot path, mount routers explicitly, remove or archive competing stacks, and document the chosen authority.
- Wrong fixes to avoid: leaving several active stacks on disk and relying on convention or comments to imply which one matters.
- Owner domain: `backend`
- Blocks deployment: Yes
- Verification steps after fix: import chosen app entrypoint, enumerate routes, run targeted API smoke tests, and verify removed stacks are not imported.

## MF-04
- ID: `MF-04`
- Title: Silent route-drop behavior in backend aggregator
- Severity: High
- Exact evidence: `/home/vitus/floently-finnish/apps/backend/api/router.py`, `/home/vitus/floently-finnish/apps/backend/api/auth_routes.py`, `/home/vitus/floently-finnish/apps/backend/api/yki_routes.py`, `/home/vitus/floently-finnish/apps/backend/api/audio_routes.py`
- Why it is dangerous: missing routers can go unnoticed because the loader swallows exceptions and assumes a `router` symbol that often does not exist.
- Correct fix strategy: remove dynamic silent loading; import explicit routers; fail fast on import errors.
- Wrong fixes to avoid: keeping `except Exception: continue`; adding more candidate strings without surfacing failures.
- Owner domain: `backend`
- Blocks deployment: Yes
- Verification steps after fix: route enumeration test; explicit imports; startup should fail if a required router cannot mount.

## MF-05
- ID: `MF-05`
- Title: Client build is broken
- Severity: High
- Exact evidence: `npx tsc --noEmit` output in `/home/vitus/floently-finnish/apps/client`
- Why it is dangerous: release surface is not buildable; route existence on disk is misleading.
- Correct fix strategy: repair path aliases, fix incorrect relative imports, remove dead AppShell dependencies or implement them, and make typecheck clean.
- Wrong fixes to avoid: muting TypeScript errors; narrowing `include` to hide broken files; relying on Expo dev server without static validation.
- Owner domain: `client`
- Blocks deployment: Yes
- Verification steps after fix: `npx tsc --noEmit`; Expo web/dev smoke path; route-level sanity checks.

## MF-06
- ID: `MF-06`
- Title: Duplicate client API/config ownership
- Severity: High
- Exact evidence: `/home/vitus/floently-finnish/packages/core/apiClient.ts`, `/home/vitus/floently-finnish/packages/core/api/apiClient.ts`, `/home/vitus/floently-finnish/packages/core/api/client.ts`, `/home/vitus/floently-finnish/packages/core/apiConfig.ts`, `/home/vitus/floently-finnish/packages/core/api/apiConfig.ts`, `/home/vitus/floently-finnish/apps/client/features/shared/serviceClient.ts`
- Why it is dangerous: inconsistent base URLs, auth/header handling, and runtime contracts.
- Correct fix strategy: define one authoritative API client and one authoritative env/config source; keep compatibility wrappers only if thin and documented.
- Wrong fixes to avoid: preserving all layers and hoping developers “know which one to use”.
- Owner domain: `shared`
- Blocks deployment: Yes
- Verification steps after fix: dependency graph check; grep for banned legacy entrypoints; typecheck and smoke calls.

## MF-07
- ID: `MF-07`
- Title: Environment contract mismatch
- Severity: High
- Exact evidence: `/home/vitus/floently-finnish/apps/backend/core/config.py`, `/home/vitus/floently-finnish/apps/backend/.env.example`
- Why it is dangerous: clean machines and deploy targets cannot reliably set the correct variables.
- Correct fix strategy: align env names across app code, examples, Docker, and deployment manifests; fail fast on missing required secrets in production.
- Wrong fixes to avoid: documenting multiple competing env names indefinitely.
- Owner domain: `ops`
- Blocks deployment: Yes
- Verification steps after fix: backend boot under documented env file; Docker boot; deployment manifest review.

## MF-08
- ID: `MF-08`
- Title: CI does not gate quality
- Severity: High
- Exact evidence: `/home/vitus/floently-finnish/.github/workflows/ci.yml`
- Why it is dangerous: broken backend and client states can merge unnoticed.
- Correct fix strategy: remove `|| true`, split jobs by real boundaries, and make CI fail on compile/test failures.
- Wrong fixes to avoid: keeping advisory CI while calling the repo deployment-ready.
- Owner domain: `ops`
- Blocks deployment: Yes
- Verification steps after fix: intentionally break a checked file and confirm CI fails.

## MF-09
- ID: `MF-09`
- Title: Generated/runtime material files committed in source tree
- Severity: High
- Exact evidence: `/home/vitus/floently-finnish/apps/backend/runtime/materials/material_inventory.json`, `/home/vitus/floently-finnish/apps/backend/app/cards/output/accepted/accepted_cards.json`
- Why it is dangerous: runtime, publication, and fixture boundaries are blurred.
- Correct fix strategy: classify each file as seed, fixture, publication artifact, or runtime output; version only true seeds/fixtures in controlled locations.
- Wrong fixes to avoid: leaving large generated outputs under active source paths without ownership rules.
- Owner domain: `backend`
- Blocks deployment: Potentially, pending classification
- Verification steps after fix: publication/runtime tests from clean inputs; confirm runtime generation does not depend on committed outputs unless explicitly seeded.

## MF-10
- ID: `MF-10`
- Title: Engine authority is not fully enforced
- Severity: Medium
- Exact evidence: `/home/vitus/floently-finnish/engine/api/server_v3_3.py`, `/home/vitus/floently-finnish/apps/backend/yki/adapter.py`, `/home/vitus/floently-finnish/apps/backend/yki/orchestrator.py`, `/home/vitus/floently-finnish/apps/backend/adapters/yki_engine_adapter.py`
- Why it matters: backend can locally orchestrate YKI flows while also proxying to engine, creating future drift risk.
- Correct fix strategy: preserve root `engine/` as authority and explicitly demote backend-local YKI logic to adapters or remove it.
- Wrong fixes to avoid: duplicating engine rules in backend for convenience.
- Owner domain: `engine`
- Blocks deployment: Not by itself, but should be resolved before stabilization
- Verification steps after fix: route-to-engine trace; architecture docs; targeted tests that verify backend delegates instead of re-implementing.
