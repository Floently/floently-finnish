# KieliValmis Build 35 — TestFlight YKI StoreKit / RevenueCat purchase evidence

Date: 2026-08-29
Build: `1.0.0 (35)`
Exact built/tested source: `13212827d31a82331e3440f55ca31eab9d538288`
EAS build ID: `ca17b79a-b6cc-45a6-bb21-1681730849c0`
Uploaded screen-recording SHA-256: `eae0c1cd43363c6c95ec47ca23edf127f7b99b4dd383823f4ab8f332a082688e`

## Physical TestFlight evidence

The supplied iPhone screenshots and 56.7-second recording show the exact TestFlight Build 35 billing flow.

Observed:

- the billing screen is reachable for a free account;
- RevenueCat-backed plan cards are visible for YKI, Professional and Combined paths across monthly, 3-month and yearly selectors;
- a native Apple/TestFlight purchase sheet opens for `YKI Monthly`;
- the native sheet displays `19,90 €/kuukausi` and explicitly states the tester will not be charged for the test purchase;
- Apple/TestFlight authentication is requested through the tester Apple ID rather than an in-app card-selection UI;
- the native transaction completes successfully;
- KieliValmis then displays `Purchase complete` and `Store purchase completed and access synced: yki_access`;
- after the purchase/sync, the billing status changes to an active YKI path/subscription state.

This is a sandbox/TestFlight transaction. Apple documents that TestFlight uses the App Store sandbox and test transactions do not incur real charges; therefore the absence of a bank/card charge is expected and is not evidence of a production payment bypass.

## Price-metadata observation

The in-app RevenueCat price strings shown before purchase are USD values (for example `$17.99` for YKI monthly), while the native Apple/TestFlight purchase sheet for YKI monthly shows `19,90 €/kuukausi`.

The exact source displays `storeAvailability.priceString` returned by the RevenueCat/StoreKit offering snapshot on mobile; it does not use the static checkout estimate for iOS. RevenueCat documents that TestFlight/sandbox `getOfferings()` can return USD or otherwise inaccurate metadata for non-US storefronts. Therefore this mismatch is recorded as a TestFlight metadata limitation until production/storefront detail is independently reconciled; it does not by itself prove that the production paywall will show USD.

## First-attempt availability observation

A supplied screenshot also shows `Purchases are temporarily unavailable. Please try again later.` on the billing screen. A later attempt successfully opened the native TestFlight purchase sheet and completed the YKI transaction. Because the original Apple rejection involved product availability, this transient is not dismissed: repeat/cold-launch testing of the purchase preflight and additional core products remains required.

## Trial concern — still open

The in-app UI advertises `Aloita 3 päivän kokeilu` / a 3-day trial. The native YKI Monthly TestFlight purchase sheet supplied in this evidence shows the regular `19,90 €/kuukausi` subscription price and does not visibly show a 3-day free-trial term.

Source inspection shows that the mobile `handleStartTrial()` path calls the normal RevenueCat/App Store purchase for the selected YKI package. The `trial_days: 3` request value does not create an Apple introductory offer. On iOS, Apple applies a free trial only when an eligible introductory offer is configured in App Store Connect and the purchasing Apple account is eligible. The current release evidence does not yet prove that the required 3-day introductory offers are configured/active for the relevant products and territories, nor that the test Apple ID is eligible.

Do not treat `3-day trial` as production-proven until App Store Connect introductory-offer configuration and an eligible fresh sandbox/TestFlight account are verified.

## Gate accounting from this evidence

Proven physically:

```text
PHYSICAL_STOREKIT_FETCH=PASS_FOR_YKI_MONTHLY
REVENUECAT_CURRENT_DEFAULT_OFFERING_YKI_PACKAGE_LOAD=PASS
NATIVE_APPLE_PURCHASE_SHEET=PASS
REPRESENTATIVE_YKI_SANDBOX_PURCHASE=PASS
YKI_REVENUECAT_ENTITLEMENT_SYNC=PASS
```

Still deliberately open:

```text
ALL_CORE_PRODUCTS_PHYSICAL_FETCH=PENDING
ALL_VISIBLE_CORE_LOCALIZED_PRICES=PENDING
INTRODUCTORY_3_DAY_TRIAL_CONFIGURATION=PENDING
INTRODUCTORY_TRIAL_ELIGIBILITY_UI=PENDING
REPRESENTATIVE_PROFESSIONAL_PURCHASE=PENDING
REPRESENTATIVE_COMBINED_PURCHASE=PENDING
RESTORE_PURCHASES=PENDING
PURCHASE_CANCELLATION=PENDING
IOS_PHYSICAL_DEVICE_ACCEPTANCE=PENDING
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PARTIAL
```

No App Store review resubmission is authorized by this evidence.