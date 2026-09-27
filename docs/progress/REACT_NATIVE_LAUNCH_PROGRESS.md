# Floently React Native Launch Progress

## Current milestone
React Native / Expo Learn-first launch.

## Current branch
`preview/enable-all-languages`

## Launch strategy
Launch the existing React Native / Expo app first, then continue native Android/iOS gradually after launch.

## Completed
- Confirmed backend is running in Docker on Hetzner and exposed through `learn-api.floently.com`.
- Confirmed backend health endpoints are live.
- Confirmed current Expo web export succeeds.
- Confirmed current source uses correct roleplay and cards endpoints.
- Deployed current Expo web export to `/var/www/learn`.
- Confirmed `learn.floently.com` routes return `200`.
- Confirmed backend remained healthy after deploy.
- Saved rollback backup path on server at `/root/floently-last-var-www-learn-backup-path.txt`.

## Live deploy
- Web host: `https://learn.floently.com`
- API host: `https://learn-api.floently.com`
- Static root: `/var/www/learn`
- Last backup marker: `/root/floently-last-var-www-learn-backup-path.txt`

## Current blockers / risks
- Nginx has duplicate `learn.floently.com` server-name warnings. Reload succeeds, but duplicate config should be cleaned before final launch.
- Browser-level authenticated Learn flow still needs manual end-to-end verification.
- Global `floently.com` landing still needs final product-suite alignment: Learn active, Read/Create coming soon.

## Next step
Run live authenticated Learn testing:
1. Login/register.
2. Verify Learn home.
3. Verify cards.
4. Verify YKI practice.
5. Verify YKI exam.
6. Verify speaking/roleplay.
7. Verify billing/subscription page.
8. Verify settings/progress.
9. Verify Read/Create are positioned as coming soon for launch.
