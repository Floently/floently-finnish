# Hetzner Backend Deployment Runbook

Last updated: 2026-04-23  
Scope: `apps/backend` (FastAPI service for Floently Finnish)

## 1) Server Prerequisites

1. Ubuntu 22.04/24.04 host on Hetzner Cloud.
2. DNS `learn-api.floently.com` -> server public IP.
3. TLS termination (Nginx + Let’s Encrypt).
4. Docker installed and running (if using container path), or Python 3.12 + venv (if using systemd path).
5. Firewall rules:
   - inbound `22/tcp` from admin IPs only
   - inbound `80/tcp`, `443/tcp` from internet
   - block direct public access to backend container port
6. Repo deployed at `/opt/floently/backend` (recommended).

Hetzner references:
- https://docs.hetzner.com/cloud/firewalls/getting-started/creating-a-firewall
- https://docs.hetzner.com/cloud/firewalls/overview

## 2) Environment Variables

Start from [apps/backend/.env.production.template](/home/vitus/floently-finnish/apps/backend/.env.production.template) and set real values.

Minimum required:
- `APP_ENV=production`
- `FLOENTLY_ENV=production`
- `SIGNED_SESSION_SECRET` (and/or `SECRET_KEY`) strong random value
- `PUBLIC_BASE_URL=https://learn-api.floently.com`
- `CORS_ALLOW_ORIGINS` production web origins only
- `TRUSTED_HOSTS=learn-api.floently.com,localhost,127.0.0.1`
- voice provider credentials (`OPENAI_API_KEY`, Google credential path vars) if voice features are enabled
- `STATE_STORE_PATH=/app/runtime/state.json` (or another mounted persistent path)

Optional but recommended for QA/staging test users:
- `INTERNAL_ALL_ACCESS_TEST_EMAILS=test1@example.com,test2@example.com`

## 3) Deployment Model

Current repository supports two viable production models:

1. Docker model (recommended for current repo state)
   - Use [apps/backend/Dockerfile](/home/vitus/floently-finnish/apps/backend/Dockerfile)
   - Use [apps/backend/scripts/hetzner_release.sh](/home/vitus/floently-finnish/apps/backend/scripts/hetzner_release.sh)
   - Reverse proxy from Nginx to `127.0.0.1:8080`

2. Systemd model (non-container)
   - Service template: [apps/backend/deploy/systemd/floently-backend.service](/home/vitus/floently-finnish/apps/backend/deploy/systemd/floently-backend.service)

Nginx template:
- [apps/backend/deploy/nginx/floently-backend.conf](/home/vitus/floently-finnish/apps/backend/deploy/nginx/floently-backend.conf)

## 4) Build / Deploy / Update Steps

### A. First-time setup (Docker path)

1. Clone repo on server:
   - `/opt/floently/backend`
2. Copy env:
   - `/opt/floently/backend/apps/backend/.env`
3. Install Nginx and apply config:
   - symlink `apps/backend/deploy/nginx/floently-backend.conf` to `/etc/nginx/sites-enabled/`
4. Obtain cert:
   - `certbot --nginx -d learn-api.floently.com`
5. Run deployment script from local machine:
   - `HETZNER_HOST=deploy@learn-api.floently.com HETZNER_SSH_KEY=~/.ssh/id_ed25519 DEPLOY_ENV_FILE=/path/to/prod.env bash apps/backend/scripts/hetzner_release.sh`

### B. Regular update

1. Pull latest repo changes locally.
2. Re-run `apps/backend/scripts/hetzner_release.sh`.
3. Confirm health and critical flows.
4. If login/session history was on another host or branch snapshot, sync it once:
   - `bash apps/backend/scripts/hetzner_sync_state_and_db.sh`

## 5) Service / Restart Steps

Docker:
- `docker ps | rg floently-backend`
- `docker restart floently-backend`

Systemd (if used):
- `sudo systemctl daemon-reload`
- `sudo systemctl enable floently-backend`
- `sudo systemctl restart floently-backend`
- `sudo systemctl status floently-backend`

## 6) Healthcheck

Primary:
- `GET https://learn-api.floently.com/health`

Secondary:
- `GET https://learn-api.floently.com/api/v1/health/`
- `GET https://learn-api.floently.com/api/v1/voice/tts/health`

## 7) Runtime Directories / Persistence

Ensure writable:
- `apps/backend/runtime/` (state snapshots and runtime uploads)

If database uses SQLite in production:
- `apps/backend/puhis.db` must persist across deploys

Recommendation:
- move to managed Postgres for production and backup strategy.

## 8) Log Inspection

Docker:
- `docker logs floently-backend --tail 200`
- `docker logs -f floently-backend`

Nginx:
- `/var/log/nginx/access.log`
- `/var/log/nginx/error.log`

Systemd (if used):
- `journalctl -u floently-backend -n 200 --no-pager`

## 9) Rollback

1. Keep previous image tag (`floently-backend:<timestamp-or-sha>`).
2. Stop current container and run previous image:
   - `docker stop floently-backend && docker rm floently-backend`
   - `docker run ... floently-backend:<previous-tag>`
3. Re-check `/health`.

## 10) Failure Recovery

If health fails after deploy:
1. Inspect container logs.
2. Validate `.env` exists and contains required secrets.
3. Validate external dependencies:
   - OpenAI key validity
   - Google credentials file path and permissions
4. Verify host header and CORS origin configuration.
5. Roll back to previous known-good image.
