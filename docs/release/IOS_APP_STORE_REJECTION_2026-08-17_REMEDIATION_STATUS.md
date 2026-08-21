# KieliValmis iOS Rejection Remediation — Live Status Ledger

**Rejection being remediated:** Apple App Review rejection received **2026-08-17**  
**App version under review:** `1.0` / source marketing version currently `1.0.0`  
**Rejected build:** `34`  
**Submission ID:** `9ca64a66-a835-4a85-b97d-987bf54044eb`  
**Master runbook:** `docs/release/IOS_APP_STORE_REJECTION_2026-08-17_RESUBMISSION_RUNBOOK.md`  
**Frozen runbook commit:** `d17e5894f6628f0a81d7a33ff21f466abf8a9359`  
**Live ledger rule:** change an item to `[x]` only when its stated definition of done is true and supported by evidence. Unknown, inferred, source-only-without-required-tests, dashboard-only-without-verification, and physical-device-only items remain unchecked.

---

## 0. Remediation control state

```text
REMEDIATION_STARTED=YES
PRODUCTION_DEPLOYMENT_AUTHORIZED=NO
APP_STORE_RESUBMISSION_AUTHORIZED=NO
BUILD34_PROVENANCE=PASS
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PARTIAL
SOURCE_REPAIR_STARTED=YES
REPAIR_BRANCH_FORWARD_BASE=PASS
ACCOUNT_DELETION_SOURCE_PHASE=PASS
ACCOUNT_DELETION_BACKEND_TRUTH_GATE=PASS
ACCOUNT_DELETION_CLIENT_ACCESS_GATE=PASS
REVENUECAT_IDENTITY_SOURCE_GATE=PASS
STORE_BILLING_PREFLIGHT_SERVICE_GATE=PASS
STORE_BILLING_SAFE_ERROR_GATE=PASS
PAYWALL_PREFLIGHT_PRESENTATION=PASS
IOS_LOCALIZED_STORE_PRICE_SOURCE_GATE=PASS
IOS_AUTHORITATIVE_BUNDLE_IDENTITY=PASS
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE=PASS
REVENUECAT_IOS_APP_IDENTITY=PASS
PAID_APPS_AGREEMENT=PASS
BANKING_CONFIGURATION=PASS
TAX_CONFIGURATION=PASS
APPLE_SUBSCRIPTION_GROUPS=PASS
APPLE_CORE_PRODUCT_IDS=PASS
APPLE_CORE_DURATIONS=PASS
APPLE_CORE_REVIEW_STATUSES=PASS
PROTECTED_INVARIANT_GATES=BLOCKED_BY_EXISTING_ENGINE_TEST_COLLECTION
IOS_PHYSICAL_DEVICE_ACCEPTANCE=PENDING
APP_STORE_SCREENSHOT_IOS_ONLY=PENDING
```

The frozen master runbook remains the investigation/remediation baseline. This file is the **live evidence and completion ledger** and must be updated after every verified remediation step.

---

# Phase 0 — Prove rejected-build and release provenance

## 0.1 Freeze the investigation reference

- [x] **Master remediation runbook exists at an immutable commit.**  
  **Definition of done:** the exact runbook can be retrieved by immutable Git SHA.  
  **Evidence:** commit `d17e5894f6628f0a81d7a33ff21f466abf8a9359`; path `docs/release/IOS_APP_STORE_REJECTION_2026-08-17_RESUBMISSION_RUNBOOK.md`.

- [x] **The rejection date and rejected build number are recorded.**  
  **Definition of done:** the ledger identifies the Apple rejection being repaired and the rejected build.  
  **Evidence:** Apple review dated 2026-08-17; rejected build `34`.

- [x] **The App Store submission ID is recorded.**  
  **Definition of done:** the rejected submission can be uniquely correlated to Apple review records.  
  **Evidence:** `9ca64a66-a835-4a85-b97d-987bf54044eb`.

- [ ] **Apple rejection screenshots are archived inside durable project release evidence.**  
  **Definition of done:** reviewer screenshots/media are stored in a durable repository/release-evidence location or formally linked durable evidence store.  
  **Current state:** screenshots were supplied during investigation but are not yet archived as durable repository evidence.

## 0.2 Resolve repository production-line reference

- [x] **Repository canonical production integration ref is resolved.**  
  **Definition of done:** GitHub proves the exact head of `integration/canonical-production-20260816`.  
  **Evidence:** canonical ref resolved to `749ffe3669cc1c6184482a735001af769bc71547`.

- [x] **Canonical production-line commit is recorded.**  
  **Definition of done:** exact SHA and commit identity are documented.  
  **Evidence:** `749ffe3669cc1c6184482a735001af769bc71547` — `Migrate Floently Learn SEO surface to KieliValmis`.

- [x] **The exact source SHA used for rejected build 34 is proven.**  
  **Definition of done:** EAS/build/archive/App Store release evidence links build 34 to the exact Git SHA that produced it.  
  **Evidence:** EAS production build `b192f8f3-74ec-42c6-9dda-f3e569f13a3c` records `EAS_BUILD_IOS_BUILD_NUMBER=34` and `EAS_BUILD_GIT_COMMIT_HASH=4ce381deefa79b1b202d1483498f52a11d0c006c`. GitHub independently resolves that exact SHA to `Remove App Review account from shared test entitlements`. GitHub comparison proves canonical production SHA `749ffe3669cc1c6184482a735001af769bc71547` is 20 commits forward from the rejected-build SHA with the rejected-build SHA as merge base.

## 0.3 Resolve current configured iOS app identity from source

- [x] **Current client application name is identified.**  
  **Definition of done:** active Expo client config identifies the release app name.  
  **Evidence:** `apps/client/app.config.ts` and `apps/client/app.base.json` identify `KieliValmis`.

- [x] **Current source marketing version is identified.**  
  **Definition of done:** active client configuration contains the version.  
  **Evidence:** `apps/client/app.base.json` contains `"version": "1.0.0"`.

- [x] **Configured App Store Connect app ID is identified from EAS submit config.**  
  **Definition of done:** production iOS submit configuration contains the App Store Connect application ID.  
  **Evidence:** `apps/client/eas.json` → `submit.production.ios.ascAppId = "6767821805"`.

- [x] **Configured Expo/EAS project ID is identified.**  
  **Definition of done:** active Expo config contains the EAS project identity.  
  **Evidence:** `fa02c141-0a3b-4dbc-9122-7c1cf31ba42c`.

- [x] **Configured client iOS bundle identifier is identified.**  
  **Definition of done:** active client Expo configuration identifies the intended iOS bundle ID.  
  **Evidence:** `apps/client/app.base.json` contains `ios.bundleIdentifier = "com.vitusidi.floently"`; rejected-build EAS app configuration resolved the same value.

- [x] **Conflicting checked-in native iOS bundle identifier is documented.**  
  **Definition of done:** mismatch is recorded and not treated as release authority.  
  **Evidence:** root `ios/floentlyfinnish.xcodeproj/project.pbxproj` contains `PRODUCT_BUNDLE_IDENTIFIER = com.vitusidi.floentlyfinnish`, while the actual Expo/EAS client uses `com.vitusidi.floently`. Build-34 logs prove EAS generated a fresh `apps/client/ios` directory, so the root project was not the native project used for rejected build 34. Phase 4 records and enforces that the legacy root project is non-authoritative for App Store releases.

- [x] **Active client tree is confirmed not to contain `apps/client/ios`.**  
  **Definition of done:** GitHub inspection proves there is no checked-in native iOS directory under the actual Expo client package on the canonical line.  
  **Evidence:** `apps/client` has EAS/app config but no checked-in `apps/client/ios`; build 34 logs show EAS prebuild creating `./ios` inside `apps/client` at build time.

- [x] **Actual bundle identifier used by rejected build 34 is proven from EAS build metadata.**  
  **Definition of done:** build metadata proves build 34 iOS application identity.  
  **Evidence:** build 34 EAS metadata resolves `ios.bundleIdentifier = com.vitusidi.floently`; EAS assigns provisioning profile `*[expo] com.vitusidi.floently AppStore ...` to target `KieliValmis`; fastlane export maps `provisioningProfiles.com.vitusidi.floently`; archive and IPA export succeed from that target.

## 0.4 Resolve build-number source and build method

- [x] **Repository explains why build 34 is not expected as a literal checked-in build number.**  
  **Definition of done:** EAS version-source behavior is inspected.  
  **Evidence:** `apps/client/eas.json` sets `cli.appVersionSource = "remote"`; production sets `autoIncrement = true`. Checked-in `buildNumber: "11"` is therefore not authoritative for the submitted build number.

- [x] **Build 34 build method is proven.**  
  **Definition of done:** build metadata identifies the actual executor/profile for build 34.  
  **Evidence:** EAS build ID `b192f8f3-74ec-42c6-9dda-f3e569f13a3c`, profile `production`, environment `production`, iOS build number `34`, Xcode `26.2 (17C52)`, with EAS prebuild followed by fastlane archive/export.

- [ ] **Exact mutable Git branch/ref name used for build 34 is proven.**  
  **Definition of done:** historical build metadata explicitly records the source branch/ref name.  
  **Current state:** the supplied EAS build record preserves the immutable Git SHA but does not expose a historical branch/ref name. This is informational and no longer a provenance blocker.

## 0.5 Resolve release environment evidence

- [x] **Production EAS profile contains a configured iOS RevenueCat public SDK key.**  
  **Evidence:** build 34 logs confirm `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` was injected.

- [x] **Production API base URL is identified.**  
  **Evidence:** `https://learn-api.floently.com`.

- [x] **RevenueCat project/app represented by the production iOS SDK key is proven.**  
  **Evidence:** RevenueCat project `Floently` → app `Floently iOS` shows bundle ID `com.vitusidi.floently`; its Public API Key matches the iOS public SDK key injected into rejected build 34. Full key intentionally omitted.

- [x] **App Store Connect bundle identifier for Apple app ID `6767821805` is proven from Apple.**  
  **Evidence:** App Store Connect → KieliValmis → App Information shows Bundle ID `com.vitusidi.floently` and Apple ID `6767821805`.

## Phase 0 gate

```text
REPOSITORY_CANONICAL_PRODUCTION_REF=PASS
CONFIGURED_APP_NAME=PASS
CONFIGURED_ASC_APP_ID=PASS
CONFIGURED_EAS_PROJECT_ID=PASS
CONFIGURED_IOS_BUNDLE_ID=PASS
BUILD_NUMBER_REMOTE_SOURCE_EXPLAINED=PASS
BUILD34_SOURCE_SHA=PASS
BUILD34_SOURCE_REF=UNKNOWN_NON_BLOCKING
BUILD34_BUILD_METHOD=PASS
BUILD34_EMBEDDED_BUNDLE_ID=PASS
APP_STORE_CONNECT_BUNDLE_ID=PASS
REVENUECAT_IOS_APP_IDENTITY=PASS
BUILD34_PROVENANCE=PASS
```

**Definition of done for Phase 0:** immutable rejected-build provenance is reproducibly identified. **Phase 0 is DONE.**

---

# Phase 1 — Apple + RevenueCat catalog reconciliation

**Status:** PARTIAL. Apple commercial agreements, cross-system app identity, Apple subscription groups, all nine core Product IDs/durations/review statuses are proven. Individual pricing/localization detail, RevenueCat package→product mapping, entitlement membership and physical StoreKit verification remain open.

- [x] **Paid Apps Agreement active.**  
  **Evidence:** Komplyint Oy Paid Apps Agreement is Active for Aug 19, 2026 – Jan 19, 2027.

- [x] **Banking accepted.**  
  **Evidence:** Komplyint Oy bank account row shows status Active.

- [x] **Tax information accepted.**  
  **Evidence:** displayed U.S. tax forms both show status Active.

- [x] **Apple app ID `6767821805` bundle identifier confirmed.**  
  **Evidence:** Apple ID `6767821805`; bundle ID `com.vitusidi.floently`.

- [x] **Subscription groups confirmed.**  
  **Definition of done:** App Store Connect → Subscriptions shows group names and counts.  
  **Evidence (2026-08-21):** `Floently Read` contains 4 subscriptions; `Kielivalmis Premium` contains 9 subscriptions.

- [x] **KieliValmis Premium subscription group identity confirmed.**  
  **Definition of done:** Apple group name and group ID are visible.  
  **Evidence:** `Kielivalmis Premium`, Subscription Group ID `22077944`, group status `In Review`.

- [x] **All nine core subscription Product IDs confirmed in App Store Connect.**  
  **Definition of done:** exact Product IDs are visible for all YKI, Professional and Combined products.  
  **Evidence:** `floently_combo_3months`, `floently_combo_monthly`, `floently_combo_yearly`, `floently_prof_3months`, `floently_prof_monthly`, `floently_prof_yearly`, `floently_yki_3months`, `floently_yki_monthly`, `floently_yki_yearly`.

- [x] **All nine core subscription durations confirmed.**  
  **Definition of done:** Apple displays duration for each core product.  
  **Evidence:** monthly, 3-month and yearly products are present for Combined, Professional and YKI.

- [x] **All nine core Apple review statuses confirmed.**  
  **Definition of done:** current Apple status is visible for every core product.  
  **Evidence:** every row in `Kielivalmis Premium` currently shows `In Review`.

- [ ] **Individual product prices/localizations/availability confirmed in App Store Connect.**  
  **Current state:** the group page proves group-level English (U.S.) localization (`Kielivalmis Premium`, app name `Kielivalmis`) but does not display each product's price schedule, territory availability, or individual subscription metadata detail.

- [x] **RevenueCat project confirmed.**  
  **Evidence:** RevenueCat project selector shows `Floently`; app settings show `Floently iOS`.

- [x] **RevenueCat iOS app bundle identifier confirmed.**  
  **Evidence:** `Floently iOS` → App Bundle ID `com.vitusidi.floently`, matching build 34 and App Store Connect.

- [ ] **RevenueCat product mappings confirmed.**  
  **Current state:** RevenueCat Products shows Apple products and statuses, but exact package→Apple Product ID mapping still needs the `default` offering detail.

- [ ] **RevenueCat entitlements confirmed end to end.**  
  **Current state:** identifiers are visible (`yki_access`, `professional_access`, `combined_access`, `read_access`, `creator_access`) with product counts, but individual entitlement product membership has not yet been expanded and reconciled.

- [ ] **KieliValmis paywall offering/placement contract confirmed in RevenueCat.**  
  **Current state:** Offerings shows `default` as current with 9 packages and `read_default` with 4 packages. Exact package identifiers and attached Apple Product IDs still require the offering detail view.

- [ ] **Every visible KieliValmis package maps to the intended Apple Product ID.**  
  **Current state:** source expects nine core packages and Apple now proves the nine core Product IDs, but package-detail mapping evidence is still required.

### Durable Apple subscription evidence

Detailed evidence for the 2026-08-21 Apple subscription screenshots is stored at:

`docs/release/evidence/IOS_REJECTION_PHASE1_APPLE_SUBSCRIPTIONS_2026-08-21.md`

Current Phase-1 sub-gates:

```text
APPLE_SUBSCRIPTION_GROUPS=PASS
APPLE_KIELIVALMIS_GROUP_ID=PASS
APPLE_CORE_PRODUCT_IDS=PASS
APPLE_CORE_DURATIONS=PASS
APPLE_CORE_REVIEW_STATUSES=PASS
APPLE_CORE_PRODUCT_PRICING=PENDING
APPLE_CORE_PRODUCT_METADATA_DETAIL=PENDING
REVENUECAT_PACKAGE_PRODUCT_MATRIX=PENDING
REVENUECAT_ENTITLEMENT_MEMBERSHIP=PENDING
PHYSICAL_STOREKIT_FETCH=PENDING
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PARTIAL
```

---

# Phase 2 — Narrow source repair branch

**Status:** DONE.

- [x] Repair base SHA selected from verified production lineage: `749ffe3669cc1c6184482a735001af769bc71547`.
- [x] Forward ancestry verified at branch creation.
- [x] Narrow repair branch created: `release/ios-app-review-remediation-20260818`.

Draft PR: **#37 — iOS review remediation: keep account deletion reachable for free users**. It remains draft with production/resubmission authorization disabled.

---

# Phase 3 — Account deletion accessibility and completion truth

**Status:** DONE for source + automated regression remediation. Physical-device reviewer proof remains Phase 7/9.

- [x] Free authenticated user can open Settings without paid entitlement.
- [x] Paid learning routes remain protected.
- [x] Delete Account remains visible/reachable through signed-in Settings navigation.
- [x] Reviewer-state regression test added and passing.
- [x] Backend deletion cannot report completion after partial required cleanup.
- [x] Backend success/failure regression tests added and passing.
- [x] Automated session/token invalidation behavior verified for deleted account state.

**Phase 3 gate:**

```text
FREE_AUTHENTICATED_USER_CAN_OPEN_SETTINGS=PASS
FREE_USER_PAID_FEATURE_GUARDS_STILL_ENFORCED=PASS
ACCOUNT_DELETION_REACHABLE_SOURCE_GATE=PASS
ACCOUNT_DELETION_COMPLETION_TRUTH=PASS
ACCOUNT_DELETION_SOURCE_REGRESSION_GATES=PASS
```

Known unrelated/global blocker: repository-wide `pytest apps/backend/tests engine/tests -q` fails during collection because canonical tests import missing modules `engine.learning` and `engine.logging`. This remains a Phase-5 blocker and is not hidden.

---

# Phase 4 — iOS identity and RevenueCat client hardening

**Status:** IN PROGRESS overall. Repository-side identity, customer identity, store-product preflight, fail-closed paywall, user-safe errors, localized price presentation, and release-identity verifier are PASS. Dashboard package mapping remains open.

- [x] **iOS bundle identity normalized to Apple-authoritative value.**  
  **Evidence:** authoritative App Store/EAS/RevenueCat identity is `com.vitusidi.floently`; active Expo release config already uses this value. Legacy root Xcode project is explicitly non-authoritative.

- [x] **Release verifier prevents source/build bundle-ID drift.**  
  **Evidence:** machine-readable release identity contract + `verify:ios-release-identity`; PR CI run `32235793433` client job shows **Verify iOS release identity invariants** = SUCCESS at head `356de3b9281d079c1271884e87b05a4d851ea2a5`.

- [ ] **KieliValmis RevenueCat current-offering/placement contract is explicit and tested end to end.**  
  **Current state:** source preflight is verified; RevenueCat `default` offering detail/package mapping is still required.

- [x] Store billing preflight service and purchase-time package recheck implemented and passing.
- [x] Offering/package preflight consumed by paywall before purchase CTAs enable.
- [x] Missing store products disable purchase/trial CTAs safely.
- [x] Raw RevenueCat SDK errors are not normal user-facing purchase/restore copy.
- [x] iOS/mobile prices use RevenueCat/StoreKit localized product data in the visible paywall.
- [x] RevenueCat anonymous → authenticated/account-switch identity behavior corrected/tested.

Verified Phase-4 source sub-gates:

```text
REVENUECAT_IDENTITY_SOURCE_GATE=PASS
STORE_BILLING_PREFLIGHT_SERVICE_GATE=PASS
STORE_BILLING_SAFE_ERROR_GATE=PASS
PAYWALL_PREFLIGHT_PRESENTATION=PASS
IOS_LOCALIZED_STORE_PRICE_SOURCE_GATE=PASS
IOS_AUTHORITATIVE_BUNDLE_IDENTITY=PASS
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE=PASS
REVENUECAT_OFFERING_CONTRACT=PENDING_DASHBOARD_RECONCILIATION
```

---

# Phase 5 — Protected regression gates

**Status:** BLOCKED / PENDING.

- [ ] Authentication/session regression suite passes.
- [x] Navigation/deep-link/back source invariant suite passes on current remediation head.
- [ ] Subscription/access regression suite passes.
- [ ] Cards regression suite passes.
- [ ] Roleplay regression suite passes.
- [ ] Microphone/STT regression suite passes.
- [ ] Everyday Finnish regression suite passes.
- [ ] New iOS rejection regression tests pass as part of the immutable candidate gate.

**Current blocker:** repository-wide backend/engine test collection fails because canonical tests import missing modules `engine.learning` and `engine.logging`. Do not weaken/delete tests to obtain green status.

---

# Phase 6 — Immutable iOS candidate

**Status:** PENDING.

- [ ] Exact candidate SHA recorded.
- [ ] Next unused iOS build number recorded.
- [ ] Bundle ID recorded and artifact-verified.
- [ ] RevenueCat project/app/paywall contract recorded.
- [ ] Artifact identifier recorded.
- [ ] Tested SHA exactly equals built SHA.

**Definition of done:** `CANDIDATE_ARTIFACT_IDENTITY=PASS`.

---

# Phase 7 — Physical-device acceptance

**Status:** PENDING.

- [ ] New free account reaches Settings.
- [ ] Account deletion completes truthfully.
- [ ] Store offering loads.
- [ ] Localized Apple prices display.
- [ ] Native Apple purchase sheet opens.
- [ ] Purchase succeeds and entitlements sync.
- [ ] Restore Purchases works.
- [ ] Purchase cancellation behaves normally.
- [ ] Regression smoke passes on exact candidate.

**Definition of done:** `IOS_PHYSICAL_DEVICE_ACCEPTANCE=PASS` on the exact artifact intended for submission.

---

# Phase 8 — App Store screenshot remediation

**Status:** PENDING.

- [ ] New iPhone screenshots are genuine iOS captures.
- [ ] iPad screenshots corrected if required by listing/review configuration.
- [ ] Every App Store Connect screenshot size group inspected.
- [ ] Every localization inspected.
- [ ] No Android/non-iOS status bar or device chrome remains.
- [ ] Screenshots accurately match the candidate build.

**Definition of done:** `APP_STORE_SCREENSHOT_IOS_ONLY=PASS`.

---

# Phase 9 — Reviewer evidence

**Status:** PENDING.

- [ ] Physical-device account deletion video recorded.
- [ ] Video shows free/no-subscription account reaching Settings.
- [ ] Video shows Delete Account and complete confirmation flow.
- [ ] Reviewer notes updated with exact navigation steps.
- [ ] Billing remediation summarized truthfully for reviewer.
- [ ] Screenshot remediation summarized truthfully for reviewer.

---

# Phase 10 — Resubmission gate

**Status:** BLOCKED.

Do not submit until all required gates are PASS, including Apple/RevenueCat catalog reconciliation, protected regression gates, immutable artifact identity, physical-device acceptance, screenshot remediation, and reviewer evidence.

Only then may this ledger state:

```text
APP_STORE_RESUBMISSION_AUTHORIZED=YES
```
