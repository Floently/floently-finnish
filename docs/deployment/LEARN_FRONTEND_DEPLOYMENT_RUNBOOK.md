# Learn Frontend Deployment Runbook

Date: 2026-05-16

## Purpose
- Publish the Expo static web export for `learn.floently.com`.
- Ensure direct legal URLs render real exported HTML instead of falling through to an unmatched client route.
- Ensure direct auth URLs like `/auth/login` and `/auth/register` render their exported HTML instead of falling through to the root shell.
- Make the deployment path reproducible inside this repo.

## Source Of Truth
- Export source: `apps/client/dist`
- Export command: `bash apps/client/scripts/export_learn_web.sh`
- Legal route contract check: `node apps/client/scripts/legal_route_contract_check.mjs --check-dist`
- Verification command: `bash apps/client/scripts/verify_learn_web_routes.sh`
- Nginx template: `apps/client/deploy/nginx/learn.floently.com.conf`

## Required Host Layout
- Web root base directory, for example `/var/www/learn.floently.com`
- Release directories under `/var/www/learn.floently.com/releases/<timestamp>`
- Active symlink at `/var/www/learn.floently.com/current`
- Nginx `root` pointing at the `current` symlink

## Deployment Procedure
1. Export the web app:
   - `bash apps/client/scripts/export_learn_web.sh`
2. Validate legal-route export contract:
   - `node apps/client/scripts/legal_route_contract_check.mjs --check-dist`
3. Confirm the legal route files exist locally:
   - `apps/client/dist/privacy.html`
   - `apps/client/dist/terms.html`
   - `apps/client/dist/support.html`
   - `apps/client/dist/account-deletion.html`
   - `apps/client/dist/auth/login.html`
   - `apps/client/dist/auth/register.html`
   - `apps/client/dist/legal/privacy-policy.html`
   - `apps/client/dist/legal/terms-of-use.html`
   - `apps/client/dist/legal/account-deletion.html`
4. Install or update nginx using `apps/client/deploy/nginx/learn.floently.com.conf`.
   The critical behavior is `try_files $uri $uri.html $uri/index.html /index.html;`.
   Without `$uri.html`, direct requests like `/auth/login` and `/privacy` will incorrectly receive `/index.html`.
5. Deploy the export atomically:
   - `LEARN_WEB_HOST=deploy@learn.floently.com LEARN_WEB_ROOT=/var/www/learn.floently.com bash apps/client/scripts/deploy_learn_web.sh`
6. Verify live routes:
   - `bash apps/client/scripts/verify_learn_web_routes.sh https://learn.floently.com`

## Operational Notes
- Do not publish only `_expo/static` assets. The route HTML files under `dist/` are required.
- Do not flatten the `dist/legal/` directory during upload.
- HTML should be effectively uncached; immutable caching should be limited to `/_expo/static` and `assets`.
- If a route returns `200` but still shows `Unmatched Route`, compare the deployed HTML tree and live bundle hash against the local export before changing app code again.
- Do not hand-edit the route list in `verify_learn_web_routes.sh`; it is generated from `config/legalRoutes.ts` via `scripts/legal_route_contract_check.mjs`.
