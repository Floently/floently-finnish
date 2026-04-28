# Account Deletion Implementation Report

Date: 2026-04-24

## Implemented
- Added authenticated deletion endpoint: `POST /api/v1/auth/account/delete`.
- Added deletion request model with explicit confirmation requirement (`confirm_delete: true`).
- Added backend deletion service:
  - Removes user-linked records from in-memory state buckets.
  - Invalidates auth sessions/tokens by deleting those records.
  - Attempts SQL cleanup across known tables with `user_id`/`email` links.
  - Returns deletion response with `deletion_window: up to 24 hours`.
  - Emits audit-safe log entry using hashed subject identifier.
- Added in-app deletion entry in Settings:
  - Visible **Delete Account** action.
  - Two-step destructive confirmation dialog.
  - Copy explains deletion scope, 24h timeline, and subscription cancellation boundary.

## Files
- `apps/backend/app/models/api_models.py`
- `apps/backend/app/routers/v1_auth.py`
- `apps/backend/app/services/account_deletion_service.py`
- `packages/core/api/auth.ts`
- `apps/client/state/SettingsRoute.tsx`

## Compliance Notes
- Deletion initiation is available in-app.
- Flow deletes account data (active stores) and supports legal-retention caveat wording.
- No deactivation-only wording is used.
