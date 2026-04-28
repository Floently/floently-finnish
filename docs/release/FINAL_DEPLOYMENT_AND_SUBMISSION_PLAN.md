# Final Deployment and Submission Plan

Last updated: 2026-04-23

## Execution Status Key

- Completed by agent
- Prepared by agent, requires credentialed account action
- Blocked pending product/legal implementation

## Phase 1 — Backend Production on Hetzner

### Completed by agent
- Added production env template.
- Added release deployment script for Hetzner Docker path.
- Added systemd and nginx deployment templates.
- Added backend hardening fixes:
  - trusted host middleware
  - missing config key for yki engine repository root
  - production-safe Docker command defaults
- Wrote deployment runbook and production audit docs.

### Requires credentialed account action
- Provision real server secrets in `.env`.
- Install TLS certs and activate nginx config.
- Apply Hetzner firewall rules on live project.
- Run deployment script against production host.

## Phase 2 — Mobile Store Readiness

### Completed by agent
- Audited Expo/EAS config and package/bundle IDs.
- Drafted store metadata and submission checklists.
- Drafted policy compliance report and legal requirements doc.

### Requires credentialed account action
- EAS login and credentials provisioning.
- Build and upload production binaries:
  - `eas build --platform android --profile production`
  - `eas build --platform ios --profile production`
- Submit with:
  - `eas submit --platform android`
  - `eas submit --platform ios`

## Phase 3 — Blocking Product/Legal Work

### Blocked pending implementation
1. In-app account deletion flow and backend deletion path.
2. Mobile payments model refactor to store-compliant billing for digital subscriptions.
3. Final legal page publishing + in-app links:
   - privacy policy
   - terms
   - support
   - account deletion web endpoint (Play requirement).

## Go/No-Go Gate

No-Go until all are true:
- account deletion requirement satisfied
- payment policy path compliant
- privacy/support/legal URLs live and wired
- production backend deploy verified stable for 48h
- internal testing passes on both stores

## Immediate Next 7 Actions

1. Finalize legal copy and publish URLs.
2. Implement account deletion endpoint + UI entry.
3. Replace external subscription checkout on mobile with compliant billing flows.
4. Set production env and deploy backend via Hetzner runbook.
5. Run mobile smoke test against Hetzner production API.
6. Build/store-upload Android and iOS binaries through EAS.
7. Submit internal/beta tracks, then production rollout.

