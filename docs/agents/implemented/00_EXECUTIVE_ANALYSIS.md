# Floently Finnish — Executive Tree Analysis

## Overall conclusion

The project has crossed the line from assembly into a real monorepo with a credible backend, engine, and client surface. The root `engine/` tree is present with API, exam, event store, runtime, schema, validator, services, and tests. The backend has active YKI orchestration files, learning services, cards publication/runtime, practice-content generation, professional/speaking modules, CI, Docker, and environment templates. The client has Expo routes, cards, exam runtime, auth, onboarding, billing, and shared package layers.

That said, the repository is **not yet clinically deployment-ready**. It still shows several strong risk signals that a forensic audit should treat as high priority:

1. **Committed environment and build artifacts**
   - `apps/backend/.venv`
   - `apps/backend/__pycache__`
   - root `node_modules`
   - `apps/client/node_modules`
   - `apps/client/.expo`

2. **Architecture ambiguity and duplicated ownership zones**
   - root `engine/` is real, but `apps/backend/engine/README.stub.txt` still exists
   - backend has both `apps/backend/api/...` and donor-style `apps/backend/app/routers/...`
   - backend has both `apps/backend/services/...` and donor/reference service areas
   - `packages/core/apiClient.ts` and `packages/core/api/apiClient.ts` both exist
   - `packages/core/apiConfig.ts` and `packages/core/api/apiConfig.ts` both exist

3. **Generated/runtime state committed into source tree**
   - `apps/backend/runtime/state.json`
   - `apps/backend/runtime/materials/material_inventory.json`
   - accepted cards and publication outputs under `apps/backend/app/cards/output/...`

4. **Documentation and migration residue still mixed into production repo**
   - top-level migration readmes remain (`EVERYTHING_REMAINING_README.md`, `PRODUCE_NOW_README.md`)
   - production manifests exist, but historical assembly residue is still in the root

5. **Likely unresolved integration risk**
   - enough duplication remains that imports, route registration, and runtime source-of-truth may still conflict or drift under load or during refactor

## What looks strong

- Root `engine/` appears complete enough for serious audit review.
- Backend learning stack reflects the governed loop direction: diagnose, learn, practice, schedule, review, phrase banking, confidence tracking, and study planning.
- Cards and practice-content systems both exist, which supports runtime practice plus offline content generation.
- Client feature separation is much healthier than before: cards, exam, onboarding, auth, billing, and package layers are present.
- CI, Docker, `docker-compose.yml`, and `apps/client/eas.json` exist, so run/deploy plumbing has started.

## What the audit must determine decisively

1. Which route layer is authoritative for each backend domain.
2. Whether committed runtime/generated artifacts are safe, accidental, or masking real state flow problems.
3. Whether shared package duplication is benign or dangerous.
4. Whether the engine is truly wired as the sole source of truth for YKI runtime behavior.
5. Whether the client’s routed surfaces actually map to the intended five product modes without hidden dead ends.
6. Whether the project can be reproduced from scratch on a clean machine without using committed local artifacts.

## Audit severity priors

Treat these as **presumed major faults until disproven**:
- committed `.venv`, `.expo`, `node_modules`, `__pycache__`
- duplicate API/route/service ownership
- duplicate shared-client entrypoints/config wrappers
- committed runtime state/output payloads
- stale migration residue in project root

## Final recommendation

Run a **deep forensic audit before any deployment push**. The repo is advanced enough that a superficial lint/test pass will miss meaningful structural risk.
