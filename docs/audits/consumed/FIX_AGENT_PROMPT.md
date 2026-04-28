# Fix Agent Prompt — Floently Finnish

You are the implementation agent responsible for taking `/home/vitus/floently-finnish/` from structurally inconsistent to a clean deployment-ready baseline.

Before changing code, read:
- `/home/vitus/floently-finnish/docs/audits/FORENSIC_AUDIT_REPORT.md`
- `/home/vitus/floently-finnish/docs/audits/MAJOR_FAULTS_AND_CORRECT_REMEDIATION.md`
- `/home/vitus/floently-finnish/docs/audits/DEPLOYMENT_READINESS_SCORECARD.md`
- `/home/vitus/floently-finnish/docs/audits/EVIDENCE_BASED_LEARNING_AND_UX_GAP_ANALYSIS.md`
- `/home/vitus/floently-finnish/docs/audits/SECURITY_AND_SUPPLY_CHAIN_GAP_ANALYSIS.md`

## Non-negotiable constraints

1. Preserve `/home/vitus/floently-finnish/engine/` as the authoritative source of truth for YKI exam runtime behavior.
2. Do not do destructive rewrites when a surgical convergence is possible.
3. Remove duplicate ownership; do not add new duplicate wrappers.
4. Treat `/home/vitus/floently-finnish/apps/backend/reference/` and other donor/reference material as non-authoritative.
5. After each fix batch, run the relevant checks and record outcomes.

## Required fix order

### Phase 1 — Hygiene and secrets/runtime cleanup
- Remove committed local artifacts from version control, starting with:
  - `/home/vitus/floently-finnish/node_modules`
- Remove committed runtime/auth state from version control, starting with:
  - `/home/vitus/floently-finnish/apps/backend/runtime/state.json`
- Classify and clean generated/runtime outputs:
  - `/home/vitus/floently-finnish/apps/backend/runtime/materials/material_inventory.json`
  - `/home/vitus/floently-finnish/apps/backend/app/cards/output/accepted/accepted_cards.json`
- Tighten `/home/vitus/floently-finnish/.gitignore` for monorepo reality.

### Phase 2 — Backend source-of-truth convergence
- Decide and document the single authoritative backend app entrypoint.
- Audit and fix these competing zones:
  - `/home/vitus/floently-finnish/apps/backend/main.py`
  - `/home/vitus/floently-finnish/apps/backend/api/router.py`
  - `/home/vitus/floently-finnish/apps/backend/api/routes/`
  - `/home/vitus/floently-finnish/apps/backend/api/*_routes.py`
  - `/home/vitus/floently-finnish/apps/backend/app/`
- Remove silent route loading. Explicit imports only. Startup must fail loudly if required routers cannot mount.
- Keep engine delegation explicit; demote backend-local YKI logic if it competes with root engine authority.

### Phase 3 — Shared API/config deduplication
- Converge these into one authoritative client/network/config layer:
  - `/home/vitus/floently-finnish/packages/core/apiClient.ts`
  - `/home/vitus/floently-finnish/packages/core/api/apiClient.ts`
  - `/home/vitus/floently-finnish/packages/core/api/client.ts`
  - `/home/vitus/floently-finnish/packages/core/apiConfig.ts`
  - `/home/vitus/floently-finnish/packages/core/api/apiConfig.ts`
  - `/home/vitus/floently-finnish/apps/client/features/shared/serviceClient.ts`
- Leave only thin compatibility wrappers if necessary, and document them.

### Phase 4 — Client stabilization
- Make `/home/vitus/floently-finnish/apps/client/tsconfig.json` support the aliases actually used or remove those alias usages.
- Fix broken route imports under `/home/vitus/floently-finnish/apps/client/app/`.
- Remove dead shell/state imports from `/home/vitus/floently-finnish/apps/client/state/AppShell.tsx` or implement the missing modules if that shell is truly authoritative.
- Ensure intended product modes remain reachable:
  - cards
  - learn
  - yki practice
  - yki exam
  - professional Finnish
  - speaking lab

### Phase 5 — Environment, CI, and deployment contract cleanup
- Align:
  - `/home/vitus/floently-finnish/apps/backend/core/config.py`
  - `/home/vitus/floently-finnish/apps/backend/.env.example`
  - `/home/vitus/floently-finnish/apps/backend/Dockerfile`
  - `/home/vitus/floently-finnish/docker-compose.yml`
  - `/home/vitus/floently-finnish/render.yaml`
- Make `.github/workflows/ci.yml` fail on backend/client errors.
- Add clean-install verification to prove fresh-machine reproducibility.

## Verification required after each phase

- Backend: import/boot check and targeted tests
- Engine: targeted tests if boundary code changes
- Client: `npx tsc --noEmit`
- CI-related: run the same commands locally that CI enforces
- For route changes: enumerate mounted routes or smoke the critical endpoints

## Required outputs

Write these files under `/home/vitus/floently-finnish/docs/audits/`:
- `FIX_EXECUTION_LOG.md`
- `FIX_CHANGE_LEDGER.json`
- `POST_FIX_DEPLOYMENT_READINESS_SUMMARY.md`
- `POST_FIX_OPEN_ISSUES.md`

For every change:
- name the exact file changed
- state which audit finding it resolves
- state why the change was necessary
- state how you verified it
