# Active Manifest

## Active runtime systems
- `apps/backend/cards/*` -> runtime card selection and evaluation
- `apps/backend/services/cards_service.py` -> card practice orchestration
- `apps/backend/api/cards_routes.py` -> card APIs
- `apps/backend/src/features/practice_content/*` -> offline content factory
- `apps/client/features/cards/*` -> learner-facing card practice UI
- `apps/client/features/exam/*` -> governed exam runtime UI
- `apps/client/features/onboarding/*` -> intent and habit capture
- `apps/client/features/auth/*` -> authentication entry
- `apps/client/features/billing/*` -> subscription management

## Product improvement roadmap
- `docs/PROSPECTIVE_IMPROVEMENTS.md` -> persistent KieliValmis post-release product backlog, status tracker, acceptance requirements, and UI-exposure audit record

## Deployment and stabilization
- `apps/backend/requirements.txt`
- `apps/backend/.env.example`
- `apps/backend/Dockerfile`
- `docker-compose.yml`
- `render.yaml`
- `.github/workflows/ci.yml`
- `apps/client/eas.json`
