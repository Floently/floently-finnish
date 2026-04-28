# Billing Compliance Implementation Report

Date: 2026-04-24

## Implemented
- Removed policy-violating native mobile web-checkout path exposure:
  - Native iOS/Android now route through in-app store billing service path.
  - Web keeps external checkout behavior.
- Added store billing service bridge (`storeBillingService.ts`) with:
  - iOS/Android platform detection.
  - Plan-to-product mapping for mobile product IDs.
  - Store purchase entrypoint used by billing UIs.
- Updated billing screens to:
  - Block native external checkout URL launching.
  - Show store billing messaging for mobile builds.
  - Keep portal/external links on web only.

## Files
- `apps/client/features/billing/services/storeBillingService.ts`
- `apps/client/state/BillingRoute.tsx`
- `apps/client/features/billing/screens/SubscriptionScreen.tsx`

## Remaining External Credential Boundary
- Configure and validate actual App Store Connect and Google Play product IDs against production products.
- Complete native store purchase transaction wiring on signed store-enabled builds.
- Verify reviewer test account purchase path in internal/beta tracks before production submission.
