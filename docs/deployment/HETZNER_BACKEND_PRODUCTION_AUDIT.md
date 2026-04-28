# Hetzner Backend Production Audit

Last updated: 2026-04-23

## Current Deployment Readiness

### Verified

- FastAPI app imports cleanly from `apps/backend/main.py`.
- Health endpoints exist:
  - `/health`
  - `/api/v1/health/`
- Containerized startup path exists (`apps/backend/Dockerfile`).
- Existing remote deploy script exists (`apps/backend/scripts/deploy.sh`).
- Runtime voice health snapshot works locally (providers load with current local env).

### Fixed in this pass

1. Added missing production config key:
   - `Settings.yki_engine_repo_root` in [apps/backend/app/core/config.py](/home/vitus/floently-finnish/apps/backend/app/core/config.py)
   - This prevents runtime attribute errors in `app/runtime/voice.py` when exam upload path resolution is used.
2. Added Trusted Host middleware in [apps/backend/main.py](/home/vitus/floently-finnish/apps/backend/main.py):
   - `TrustedHostMiddleware` now enforces `TRUSTED_HOSTS`.
3. Hardened Docker startup command in [apps/backend/Dockerfile](/home/vitus/floently-finnish/apps/backend/Dockerfile):
   - removed debug startup shell diagnostics
   - now uses `uvicorn ... --log-level info --proxy-headers`.
4. Added production artifacts:
   - env template: [apps/backend/.env.production.template](/home/vitus/floently-finnish/apps/backend/.env.production.template)
   - systemd template: [apps/backend/deploy/systemd/floently-backend.service](/home/vitus/floently-finnish/apps/backend/deploy/systemd/floently-backend.service)
   - nginx template: [apps/backend/deploy/nginx/floently-backend.conf](/home/vitus/floently-finnish/apps/backend/deploy/nginx/floently-backend.conf)
   - deployment script: [apps/backend/scripts/hetzner_release.sh](/home/vitus/floently-finnish/apps/backend/scripts/hetzner_release.sh)

## What Remains

### Requires infra/operator action

- Provision final production `.env` with real secrets.
- Install and bind TLS certs in Nginx config.
- Configure Hetzner firewall with strict inbound rules.
- Decide and implement persistent DB strategy (SQLite vs managed Postgres).
- Set up backup/restore policy for runtime data and DB.

### Requires product/legal decisions

- Account deletion flow implementation and policy copy.
- Final privacy policy and terms publication URLs.
- Subscription billing model for mobile stores (in-app billing compliance).

## Production Risks

1. **High**: Store policy risk due to external checkout for digital subscriptions (Apple/Google billing policy conflict).
2. **High**: Account creation present, but no in-app account deletion flow.
3. **Medium**: SQLite is still default DB path; no explicit backup automation in repo.
4. **Medium**: Deployment still relies on operator-managed host state (cert paths, env, firewall).
5. **Medium**: CORS and trusted hosts depend entirely on env correctness.

## Deployment Verdict

- Backend deployment path is now reproducible and documented.
- Not yet “hands-off production safe” until secrets, firewall, TLS, and backup controls are finalized on the actual Hetzner host.

