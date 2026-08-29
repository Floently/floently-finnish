# KieliValmis Build 35 — YKI trial configuration blocker

Date: 2026-08-29
Build: `1.0.0 (35)`
Exact built/tested source: `13212827d31a82331e3440f55ca31eab9d538288`
EAS build ID: `ca17b79a-b6cc-45a6-bb21-1681730849c0`

## Physical/TestFlight observations

The exact TestFlight Build 35 successfully reached the native Apple subscription purchase sheet for YKI Monthly. The sheet identified the product as `YKI Monthly`, showed the Finland storefront price `19,90 €/kuukausi`, explicitly stated that the beta tester would not be charged, and the sandbox transaction subsequently completed. The app then reported `yki_access` as synchronized.

An earlier attempt returned the user-safe message `Purchases are temporarily unavailable. Please try again later.` A later attempt succeeded. The transient first failure remains a repeatability item for physical acceptance; it is not treated as proof that the final purchase path is unavailable.

Apple sandbox/TestFlight transactions do not incur real charges. This behavior is expected and is not evidence of a payment bypass.

## App Store Connect introductory-offer evidence

User-supplied App Store Connect screenshots show:

- `Floently YKI Monthly` → **Introductory Offers** contains no offer and displays `Set up Introductory Offer`.
- `Floently YKI Yearly` → **Introductory Offers** contains no offer and displays `Set up Introductory Offer`.
- `Floently YKI 3 Months` pricing was supplied, but its Introductory Offers tab was not supplied in this evidence set.

Therefore at least two selectable YKI products have no Apple introductory offer even though Build 35 advertises `Aloita 3 päivän kokeilu` / a 3-day trial.

Apple reference: https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions

## Finland YKI pricing evidence

The user supplied current App Store Connect price exports. The Finland rows prove:

| YKI product | Finland storefront price |
|---|---:|
| Monthly | EUR 19.90 |
| 3 Months | EUR 49.99 |
| Yearly | EUR 179.00 |

The dollar prices displayed by the TestFlight app before purchase are not used as production Finland pricing evidence. The native Apple purchase sheet is the authoritative transaction presentation for the tested storefront.

## Exact-source trial-path review

Build 35 source currently constructs `trial_days: 3`, but on iOS the trial action calls the normal RevenueCat/StoreKit purchase path. The `trial_days` value does not create an Apple introductory offer.

After StoreKit/RevenueCat returns active entitlements, the client sync payload contains plan/package/period/professions/active-entitlements but no authoritative StoreKit introductory-offer/period-type/expiration metadata.

The backend `apply_store_subscription_sync` path records the store result as paid/active (`trial_started_at=None`, `subscription_status="active"`, `access_choice="paid"`). Therefore simply adding introductory offers in App Store Connect would not make Build 35 model the trial lifecycle truthfully end-to-end.

## Gate result

```text
PHYSICAL_STOREKIT_YKI_MONTHLY_FETCH=PASS
NATIVE_APPLE_PURCHASE_SHEET=PASS
YKI_MONTHLY_SANDBOX_PURCHASE=PASS
YKI_ACCESS_ENTITLEMENT_SYNC=PASS
REAL_MONEY_CHARGE_IN_TESTFLIGHT=NOT_APPLICABLE
APPLE_YKI_MONTHLY_INTRO_OFFER=ABSENT
APPLE_YKI_YEARLY_INTRO_OFFER=ABSENT
APPLE_YKI_3MONTH_INTRO_OFFER=UNKNOWN
IOS_TRIAL_PROMISE_CONSISTENCY=FAIL
BUILD35_RESUBMISSION_READY=NO
APP_STORE_RESUBMISSION_AUTHORIZED=NO
```

## Release decision

Build 35 must not be resubmitted while it advertises a 3-day iOS trial that Apple is not configured to provide and the backend does not model as a store trial.

The lowest-risk release correction is to remove/hide the iOS trial CTA and 3-day-trial claims for the immediate App Store rejection remediation, leaving the now-proven paid StoreKit purchase flow intact. A future trial release can add Apple introductory offers together with authoritative eligibility/period/expiration synchronization and dedicated sandbox regression coverage.
