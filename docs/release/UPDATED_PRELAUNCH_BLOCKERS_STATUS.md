# Updated Prelaunch Blockers Status

Date: 2026-04-24

## Status Summary
- Account deletion flow: **Implemented in backend + in-app entrypoint**.
- Mobile external checkout path: **Removed/gated on native**.
- Legal/support/deletion drafts and URLs: **Implemented and linked in-app**.
- Android release signing away from debug: **Implemented**.
- EAS internal/beta configuration: **Prepared**.

## Open External Dependencies
- App Store Connect product and subscription configuration finalization.
- Google Play Billing product setup and validation.
- EAS credentials upload key + secrets in CI.
- Final publication of legal/support/deletion pages at production URLs.

## Verification Snapshot
- Backend import sanity: pass with backend venv (`apps/backend/.venv/bin/python`).
- Backend Python compile for touched files: pass.
- Client lint: pass.
- Grep checks:
  - Delete account entry + endpoint present: pass.
  - Legal/support/deletion links wired in Settings: pass.
  - Native billing no longer opens external checkout directly: pass (web-only guarded path remains).
- Android release signing no longer uses debug signing: pass.
- TypeScript project-wide check still has pre-existing onboarding/learning errors unrelated to this compliance patch set.

## Risk Level (Post-Implementation)
- Critical blockers reduced from unresolved to credential/publication-bound.
- Remaining blockers are mostly console/credentials and publication operations.
