# M19-R4F Mobile Read RevenueCat Backend Sync

This patch connects the native Floently Read mobile purchase/restore flow to the Render Read backend RevenueCat sync endpoint.

## What changed

- Added `readRenderApi.syncRevenueCatEntitlements()`.
- After a successful Read purchase or restore, the app posts active RevenueCat entitlements to:
  - `POST /api/v1/billing/revenuecat/sync`
- The app then refreshes subscription state and reapplies local Read access from the RevenueCat result.

## Safety behavior

- Backend sync failure does not cancel a completed App Store / Google Play purchase.
- The app keeps local RevenueCat access active and can retry via Restore purchases.
- Render backend M19-R4E refuses client-side downgrades; cancellations/refunds still require a future server-side RevenueCat webhook/validation path before public launch.

## RevenueCat identifiers used

- Offering: `read_default`
- Entitlements: `read_access`, `creator_access`
- Packages: `reader_monthly`, `reader_yearly`, `creator_monthly`, `creator_yearly`
