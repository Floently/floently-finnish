# M19-R4B Mobile Read Payment

This patch connects the native Floently Read mobile app to the separate RevenueCat Read offering.

## RevenueCat contract

Existing Learn/Finnish mobile payment remains on the `default` offering.

Read uses a separate offering:

- Offering: `read_default`
- Entitlements: `read_access`, `creator_access`
- Packages: `reader_monthly`, `reader_yearly`, `creator_monthly`, `creator_yearly`

Current dashboard mapping at time of patch:

- `reader_monthly`: iOS `floently_read_reader_monthly`, Android `floently_read_reader:monthly`
- `reader_yearly`: iOS `floently_read_reader_yearly`, Android yearly postponed
- `creator_monthly`: iOS `floently_read_creator_monthly`, Android `floently_read_creator:monthly`
- `creator_yearly`: iOS `floently_read_creator_yearly`, Android yearly postponed

## Scope

- Adds Read-specific RevenueCat purchase helpers.
- Adds a native Read subscription screen at `/read/subscribe`.
- Keeps Stripe web checkout out of the native app.
- Keeps Learn/YKI/Professional/Combined purchase mapping untouched.
- Keeps Create Studio route locked as Coming soon.
- Adds local post-purchase entitlement refresh so Read unlocks immediately after RevenueCat purchase/restore.

## Follow-up

Android yearly packages should be added after the RevenueCat / Google Play compatibility warning is cleared. A production-grade backend RevenueCat webhook or receipt sync endpoint should be added before full public launch so Render Read usage limits can be enforced server-side from verified RevenueCat purchases.
