# Release Compliance Deployment Alignment

Date: 2026-04-24

## Hetzner Alignment
- Release-oriented legal/support/deletion URLs are defined and ready for publication paths under `learn.floently.com`.
- Mobile release config assumes production API URL is set via environment (`EXPO_PUBLIC_API_BASE_URL`) to Hetzner production backend.
- Android cleartext traffic disabled in release config.

## Deployment Follow-up
1. Publish legal/support/deletion pages on production host.
2. Ensure reverse proxy routes serve published legal pages over HTTPS.
3. Confirm production API base URL and CORS origins match store-distributed app domains/schemes.
