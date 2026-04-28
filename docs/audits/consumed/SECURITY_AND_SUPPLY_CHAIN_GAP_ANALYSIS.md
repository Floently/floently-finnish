# Security And Supply Chain Gap Analysis

## Critical

### Committed runtime state with live-looking auth/session data

Evidence:
- `/home/vitus/floently-finnish/apps/backend/runtime/state.json`

Risk:
- violates secure SDLC expectations
- may expose sensitive operational data
- couples deployment/runtime state to source control

Recommended action:
- remove from version control immediately
- classify storage and retention rules
- rotate affected credentials/tokens if they were real

## High

### Unsafe backend defaults and dev-mode auth behavior in active app path

Evidence:
- `/home/vitus/floently-finnish/apps/backend/main.py`
- `/home/vitus/floently-finnish/apps/backend/core/config.py`

Risk:
- permissive CORS
- mock-login route in active boot path
- default session-signing secret

Recommended action:
- create a production-safe backend entrypoint
- remove mock auth from production app mount
- fail fast on missing secrets

### CI does not enforce trustable quality gates

Evidence:
- `/home/vitus/floently-finnish/.github/workflows/ci.yml`

Risk:
- broken code can appear green
- low confidence in branch protection and release quality

Recommended action:
- remove `|| true`
- add real backend and client validation commands

### Deployment/env contract drift

Evidence:
- `/home/vitus/floently-finnish/apps/backend/.env.example`
- `/home/vitus/floently-finnish/apps/backend/core/config.py`
- `/home/vitus/floently-finnish/apps/backend/Dockerfile`
- `/home/vitus/floently-finnish/docker-compose.yml`

Risk:
- misconfiguration
- hidden local-state dependency
- non-reproducible deploys

Recommended action:
- align variable names and expected defaults across code and deployment files

## Medium

### Package/workspace metadata is under-specified

Evidence:
- `/home/vitus/floently-finnish/packages/core/package.json`
- `/home/vitus/floently-finnish/packages/ui/package.json`

Risk:
- poor package resolution clarity
- accidental consumer/runtime drift

Recommended action:
- define correct package names, exports, and build/runtime expectations

### Supply-chain maturity is low

Evidence:
- no meaningful SBOM/provenance/hardening path was found in inspected repo metadata
- CI is non-gating

Recommended action:
- start with reproducible installs and fail-fast CI
- then add dependency review / SBOM generation proportionate to project size

## Runtime confirmation still needed

- authorization coverage by endpoint once the authoritative backend app is fixed
- mobile-storage and token-handling review once the client build is stabilized
- transport and secret-injection review in the final deployment environment
