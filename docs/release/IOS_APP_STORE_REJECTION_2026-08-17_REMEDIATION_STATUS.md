# KieliValmis iOS Rejection Remediation — Live Status Ledger

**Rejection being remediated:** Apple App Review rejection received **2026-08-17**  
**App version under review:** `1.0` / source marketing version currently `1.0.0`  
**Rejected build:** `34`  
**Submission ID:** `9ca64a66-a835-4a85-b97d-987bf54044eb`  
**Master runbook:** `docs/release/IOS_APP_STORE_REJECTION_2026-08-17_RESUBMISSION_RUNBOOK.md`  
**Frozen runbook commit:** `d17e5894f6628f0a81d7a33ff21f466abf8a9359`  
**Live-ledger rule:** an item changes to `[x]` only when its Definition of Done is true and supported by durable evidence. Unknown, inferred, source-only-without-required-tests, dashboard-only-without-required-detail, and physical-device-only items remain unchecked.

---

# 0. Remediation control state

```text
REMEDIATION_STARTED=YES
PRODUCTION_DEPLOYMENT_AUTHORIZED=NO
APP_STORE_RESUBMISSION_AUTHORIZED=NO

BUILD34_PROVENANCE=PASS
REPAIR_BRANCH_FORWARD_BASE=PASS

ACCOUNT_DELETION_SOURCE_PHASE=PASS
ACCOUNT_DELETION_BACKEND_TRUTH_GATE=PASS
ACCOUNT_DELETION_CLIENT_ACCESS_GATE=PASS

IOS_AUTHORITATIVE_BUNDLE_IDENTITY=PASS
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE=PASS
REVENUECAT_IOS_APP_IDENTITY=PASS

PAID_APPS_AGREEMENT=PASS
BANKING_CONFIGURATION=PASS
TAX_CONFIGURATION=PASS

APPLE_SUBSCRIPTION_GROUPS=PASS
APPLE_KIELIVALMIS_GROUP_ID=PASS
APPLE_CORE_PRODUCT_IDS=PASS
APPLE_CORE_DURATIONS=PASS
APPLE_CORE_REVIEW_STATUSES=PASS

REVENUECAT_DEFAULT_OFFERING=PASS
REVENUECAT_PACKAGE_PRODUCT_MATRIX=PASS
SOURCE_REVENUECAT_PACKAGE_ALIGNMENT=PASS
EVERY_CORE_PACKAGE_APPLE_PRODUCT_MAPPING=PASS

REVENUECAT_ENTITLEMENT_MEMBERSHIP=PENDING
APPLE_CORE_PRODUCT_PRICING=PENDING
APPLE_CORE_PRODUCT_METADATA_DETAIL=PENDING
PHYSICAL_STOREKIT_FETCH=PENDING
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PARTIAL

REVENUECAT_IDENTITY_SOURCE_GATE=PASS
STORE_BILLING_PREFLIGHT_SERVICE_GATE=PASS
STORE_BILLING_SAFE_ERROR_GATE=PASS
PAYWALL_PREFLIGHT_PRESENTATION=PASS
IOS_LOCALIZED_STORE_PRICE_SOURCE_GATE=PASS

PROTECTED_INVARIANT_GATES=BLOCKED_BY_EXISTING_ENGINE_TEST_COLLECTION
IOS_PHYSICAL_DEVICE_ACCEPTANCE=PENDING
APP_STORE_SCREENSHOT_IOS_ONLY=PENDING
```

The frozen master runbook remains the investigation/remediation baseline. This file is the live evidence/completion ledger and must be updated after each verified step.

---

# Phase 0 — Rejected-build and release provenance

**Status: DONE.**

- [x] **Master remediation runbook frozen at an immutable SHA.**  
  **Definition of done:** exact runbook is retrievable by immutable commit.  
  **Evidence:** `d17e5894f6628f0a81d7a33ff21f466abf8a9359:docs/release/IOS_APP_STORE_REJECTION_2026-08-17_RESUBMISSION_RUNBOOK.md`.

- [x] **Rejection identity recorded.**  
  **Evidence:** Apple review 2026-08-17; version `1.0`; build `34`; submission `9ca64a66-a835-4a85-b97d-987bf54044eb`.

- [x] **Canonical production lineage resolved.**  
  **Evidence:** `integration/canonical-production-20260816` → `749ffe3669cc1c6184482a735001af769bc71547`.

- [x] **Exact rejected-build Git SHA proven.**  
  **Evidence:** EAS build `b192f8f3-74ec-42c6-9dda-f3e569f13a3c` records build 34 from `4ce381deefa79b1b202d1483498f52a11d0c006c`; GitHub resolves the SHA to `Remove App Review account from shared test entitlements`.

- [x] **Build method/profile proven.**  
  **Evidence:** EAS production build, environment `production`, Expo prebuild, Xcode/fastlane archive and export.

- [x] **Build-34 iOS bundle identity proven.**  
  **Evidence:** EAS build metadata and export identify `com.vitusidi.floently`.

- [x] **App Store Connect app identity proven.**  
  **Evidence:** Apple app ID `6767821805`; bundle ID `com.vitusidi.floently`.

- [x] **RevenueCat iOS app identity proven.**  
  **Evidence:** RevenueCat project `Floently`, app `Floently iOS`, bundle ID `com.vitusidi.floently`; public iOS SDK key matches the production EAS value used by build 34. Full key intentionally omitted.

- [x] **Old root Xcode bundle mismatch classified correctly.**  
  **Definition of done:** old native source is not treated as release authority for build 34.  
  **Evidence:** root `ios/floentlyfinnish.xcodeproj` contains `com.vitusidi.floentlyfinnish`, but EAS generated `apps/client/ios` from Expo config and exported build 34 as `com.vitusidi.floently`.

- [ ] **Historical mutable branch/ref name for build 34 proven.**  
  **Current state:** EAS evidence preserves the immutable Git SHA but not a historical branch name. This is informational and non-blocking because immutable source/build identity is proven.

**Phase 0 gate:** `BUILD34_PROVENANCE=PASS`.

---

# Phase 1 — Apple + RevenueCat catalog reconciliation

**Status: PARTIAL.** Cross-system app identity, commercial prerequisites, Apple subscription group/product identity, and RevenueCat core offering/package/product mapping are now proven. Individual Apple pricing/metadata, RevenueCat entitlement membership, and physical StoreKit verification remain open.

## 1.1 Apple commercial prerequisites

- [x] **Paid Apps Agreement active.**  
  **Evidence:** Komplyint Oy Paid Apps Agreement shown Active.

- [x] **Bank account active.**  
  **Evidence:** App Store Connect Business bank-account row shown Active.

- [x] **Required displayed tax forms active.**  
  **Evidence:** displayed U.S. tax forms shown Active.

## 1.2 Apple subscription catalog

- [x] **Subscription groups confirmed.**  
  **Evidence (2026-08-21):** `Floently Read` = 4 subscriptions; `Kielivalmis Premium` = 9 subscriptions.

- [x] **KieliValmis Premium group identity confirmed.**  
  **Evidence:** group ID `22077944`; group status `In Review`.

- [x] **All nine core Apple Product IDs confirmed.**  
  **Evidence:**  
  `floently_combo_3months`  
  `floently_combo_monthly`  
  `floently_combo_yearly`  
  `floently_prof_3months`  
  `floently_prof_monthly`  
  `floently_prof_yearly`  
  `floently_yki_3months`  
  `floently_yki_monthly`  
  `floently_yki_yearly`.

- [x] **All nine core durations confirmed.**  
  **Evidence:** monthly, 3-month and yearly subscriptions exist for Combined, Professional and YKI.

- [x] **All nine current Apple review statuses confirmed.**  
  **Evidence:** every KieliValmis Premium row currently shows `In Review`.

- [ ] **Individual product prices/localizations/territory availability confirmed.**  
  **Definition of done:** each of the nine Apple subscription detail pages proves current price schedule, required localization/metadata and availability.  
  **Current state:** group-level English (U.S.) localization is visible, but individual product detail is not yet captured.

Durable Apple evidence:  
`docs/release/evidence/IOS_REJECTION_PHASE1_APPLE_SUBSCRIPTIONS_2026-08-21.md`.

## 1.3 RevenueCat project, offering and package/product mapping

- [x] **RevenueCat project and iOS app confirmed.**  
  **Evidence:** project `Floently`; iOS app `Floently iOS`; bundle `com.vitusidi.floently`.

- [x] **Core KieliValmis offering confirmed.**  
  **Definition of done:** RevenueCat detail view proves which current offering supplies the core iOS paywall and its package count.  
  **Evidence (2026-08-21):** offering identifier `default`, display name `Default`, nine packages.

- [x] **RevenueCat core package identifiers confirmed.**  
  **Evidence:** `combo_yearly`, `combo_3months`, `combo_monthly`, `prof_yearly`, `prof_3months`, `prof_monthly`, `yki_yearly`, `yki_3months`, `yki_monthly`.

- [x] **RevenueCat package → Apple Product ID mapping confirmed for all nine core plans.**  
  **Definition of done:** every RevenueCat package in the `default` offering points to the corresponding Apple product already proven in App Store Connect.  
  **Evidence:**  
  `combo_yearly` → `floently_combo_yearly`  
  `combo_3months` → `floently_combo_3months`  
  `combo_monthly` → `floently_combo_monthly`  
  `prof_yearly` → `floently_prof_yearly`  
  `prof_3months` → `floently_prof_3months`  
  `prof_monthly` → `floently_prof_monthly`  
  `yki_yearly` → `floently_yki_yearly`  
  `yki_3months` → `floently_yki_3months`  
  `yki_monthly` → `floently_yki_monthly`.

- [x] **Current source package aliases align with RevenueCat dashboard package identifiers.**  
  **Definition of done:** source plan IDs resolve to the exact package IDs proven in RevenueCat.  
  **Evidence:** `apps/client/features/billing/services/storeBillingService.ts` maps YKI → `yki_*`, Professional → `prof_*`, Combined → `combo_*`, matching the RevenueCat `default` offering.

- [x] **Every visible core KieliValmis package maps to the intended Apple Product ID.**  
  **Result:** no package/Product-ID mismatch is visible in the nine-plan core matrix.

- [ ] **RevenueCat entitlement membership confirmed end to end.**  
  **Definition of done:** detail views prove which Apple/RevenueCat products belong to `yki_access`, `professional_access`, and `combined_access`, and the membership matches expected product families.  
  **Current state:** entitlement names/counts were visible previously, but individual membership has not yet been expanded and reconciled.

Durable RevenueCat offering evidence:  
`docs/release/evidence/IOS_REJECTION_PHASE1_REVENUECAT_DEFAULT_OFFERING_2026-08-21.md`.

## 1.4 Runtime StoreKit proof still required

- [ ] **Physical/TestFlight StoreKit fetch succeeds.**
- [ ] **Localized Apple prices are returned for every visible core plan.**
- [ ] **Native Apple purchase sheet opens.**
- [ ] **Purchase succeeds.**
- [ ] **RevenueCat entitlement activates and backend entitlement sync succeeds.**
- [ ] **Restore Purchases succeeds.**

**Current Phase-1 gates:**

```text
APPLE_SUBSCRIPTION_GROUPS=PASS
APPLE_KIELIVALMIS_GROUP_ID=PASS
APPLE_CORE_PRODUCT_IDS=PASS
APPLE_CORE_DURATIONS=PASS
APPLE_CORE_REVIEW_STATUSES=PASS
REVENUECAT_DEFAULT_OFFERING=PASS
REVENUECAT_PACKAGE_PRODUCT_MATRIX=PASS
SOURCE_REVENUECAT_PACKAGE_ALIGNMENT=PASS
EVERY_CORE_PACKAGE_APPLE_PRODUCT_MAPPING=PASS
APPLE_CORE_PRODUCT_PRICING=PENDING
APPLE_CORE_PRODUCT_METADATA_DETAIL=PENDING
REVENUECAT_ENTITLEMENT_MEMBERSHIP=PENDING
PHYSICAL_STOREKIT_FETCH=PENDING
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PARTIAL
```

---

# Phase 2 — Narrow remediation branch

**Status: DONE.**

- [x] Repair base selected from verified production lineage: `749ffe3669cc1c6184482a735001af769bc71547`.
- [x] Forward ancestry verified at branch creation.
- [x] Narrow source branch created: `release/ios-app-review-remediation-20260818`.
- [x] Draft PR #37 remains separate from Wave-1 UAT and production promotion.

**Gate:** `REPAIR_BRANCH_FORWARD_BASE=PASS`.

---

# Phase 3 — Account deletion remediation

**Status: DONE for source + automated regression. Physical reviewer proof remains Phase 7/9.**

- [x] Free authenticated user can open Settings without paid entitlement.
- [x] Paid learning routes remain protected.
- [x] Delete Account remains visible and reachable in Settings.
- [x] Permanent reviewer-state navigation/deletion invariant added and passing.
- [x] Backend no longer reports completed deletion after partial required cleanup.
- [x] Backend success/failure tests cover database and state-store cleanup failures.
- [x] Deleted-account session/access/refresh state cleanup is tested.

**Gate:**

```text
FREE_AUTHENTICATED_USER_CAN_OPEN_SETTINGS=PASS
FREE_USER_PAID_FEATURE_GUARDS_STILL_ENFORCED=PASS
ACCOUNT_DELETION_REACHABLE_SOURCE_GATE=PASS
ACCOUNT_DELETION_COMPLETION_TRUTH=PASS
ACCOUNT_DELETION_SOURCE_REGRESSION_GATES=PASS
```

---

# Tester-account clarification

The historical build-34 source commit title `Remove App Review account from shared test entitlements` did **not** delete or deactivate an authentication account. It removed `testuser@floently.com` from a hard-coded Floently Read test-email bypass in `packages/core/api/entitlements.ts`.

- [x] **Meaning of the historical commit documented.**  
  **Evidence:** the commit modifies only the hard-coded Read test-email list; authentication/account records are untouched.

- [ ] **All current human testers are confirmed to have deliberate, non-reviewer test entitlement configuration.**  
  **Current state:** if testers relied only on the removed hard-coded `testuser@floently.com` Read bypass, their special Read access may have changed even though the account itself remains active. This must be audited separately from Apple reviewer behavior.

Durable clarification:  
`docs/release/evidence/TEST_ACCOUNT_ENTITLEMENT_CLARIFICATION_2026-08-21.md`.

---

# Phase 4 — iOS identity + RevenueCat client hardening

**Status: repository-side gates DONE; dashboard/runtime proof is tracked in Phase 1/7.**

- [x] Authoritative iOS bundle identity is `com.vitusidi.floently`.
- [x] Release identity contract records `apps/client` + Expo prebuild as App Store release authority.
- [x] CI release-identity verifier prevents drift in bundle ID, ASC app ID, EAS project/profile/channel and release authority.
- [x] RevenueCat anonymous → authenticated identity transition corrected.
- [x] Application logout attempts RevenueCat logout without trapping local logout.
- [x] All nine core plan/package mappings are preflighted.
- [x] Package + Apple product identifier + localized store price are required for store-ready state.
- [x] Selected plan is rechecked immediately before purchase.
- [x] Missing/loading products disable Buy/trial CTAs.
- [x] Raw RevenueCat SDK failures are converted to stable user-safe messages while technical diagnostics are retained.
- [x] iOS/mobile paywall displays RevenueCat/StoreKit localized price data instead of static EUR estimates.

**Verified source gates:**

```text
IOS_AUTHORITATIVE_BUNDLE_IDENTITY=PASS
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE=PASS
REVENUECAT_IDENTITY_SOURCE_GATE=PASS
STORE_BILLING_PREFLIGHT_SERVICE_GATE=PASS
STORE_BILLING_SAFE_ERROR_GATE=PASS
PAYWALL_PREFLIGHT_PRESENTATION=PASS
IOS_LOCALIZED_STORE_PRICE_SOURCE_GATE=PASS
```

---

# Phase 5 — Protected regression gates

**Status: BLOCKED/PENDING.**

- [x] Current remediation client TypeScript gate passes.
- [x] Navigation invariant passes.
- [x] Account-deletion access invariant passes.
- [x] RevenueCat identity invariant passes.
- [x] Store-billing preflight invariant passes.
- [x] iOS release-identity invariant passes.
- [x] Isolated backend account-deletion completion-truth gate passes.
- [ ] Repository-wide backend/engine protected test suite passes.

**Known blocker:** `pytest apps/backend/tests engine/tests -q` fails during test collection because the canonical test/runtime combination imports missing `engine.learning` and `engine.logging` modules. This failure remains visible and must not be hidden, weakened or reclassified as green.

**Gate:** `PROTECTED_INVARIANT_GATES=BLOCKED_BY_EXISTING_ENGINE_TEST_COLLECTION`.

---

# Phase 6 — Immutable iOS resubmission candidate

**Status: PENDING.**

- [ ] Exact candidate SHA frozen.
- [ ] Next unused iOS build number recorded.
- [ ] Candidate bundle ID artifact-verified as `com.vitusidi.floently`.
- [ ] RevenueCat project/app/offering contract recorded against the candidate.
- [ ] EAS/IPA artifact identifier recorded.
- [ ] Tested SHA exactly equals built SHA.

**Definition of done:** `CANDIDATE_ARTIFACT_IDENTITY=PASS`.

---

# Phase 7 — Physical-device acceptance

**Status: PENDING.**

- [ ] New free account reaches Settings without purchasing.
- [ ] Delete Account completes truthfully.
- [ ] RevenueCat `default` offering loads.
- [ ] All required core products return localized Apple prices.
- [ ] Native Apple purchase sheet opens.
- [ ] Representative YKI purchase succeeds.
- [ ] Representative Professional purchase succeeds.
- [ ] Representative Combined purchase succeeds.
- [ ] RevenueCat entitlements and backend access synchronize.
- [ ] Restore Purchases works.
- [ ] Purchase cancellation behaves normally.
- [ ] Exact-candidate regression smoke passes.

**Definition of done:** `IOS_PHYSICAL_DEVICE_ACCEPTANCE=PASS` on the exact artifact intended for submission.

---

# Phase 8 — App Store screenshot remediation

**Status: PENDING.**

- [ ] New iPhone screenshots are genuine iOS captures.
- [ ] iPad screenshot sets corrected if required by listing/review configuration.
- [ ] Every screenshot size group inspected in Media Manager.
- [ ] Every localization inspected.
- [ ] No Android/non-iOS status bar or device chrome remains.
- [ ] Screenshots accurately represent the corrected candidate.

**Definition of done:** `APP_STORE_SCREENSHOT_IOS_ONLY=PASS`.

---

# Phase 9 — Reviewer evidence

**Status: PENDING.**

- [ ] Physical-device account-deletion video recorded.
- [ ] Video starts with a free/no-subscription account.
- [ ] Video shows Settings navigation, Delete Account and the complete confirmation flow.
- [ ] Reviewer notes contain exact navigation steps.
- [ ] Billing remediation is summarized truthfully.
- [ ] Screenshot remediation is summarized truthfully.

**Definition of done:** Apple reviewer can reproduce the repaired flows without developer-only instructions.

---

# Phase 10 — Resubmission authorization

**Status: BLOCKED.**

Do not submit until all required gates are PASS:

```text
BUILD34_PROVENANCE
APPLE_REVENUECAT_CATALOG_RECONCILIATION
REPAIR_BRANCH_FORWARD_BASE
FREE_AUTHENTICATED_USER_CAN_OPEN_SETTINGS
ACCOUNT_DELETION_REACHABLE
ACCOUNT_DELETION_COMPLETION_TRUTH
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE
REVENUECAT_PACKAGE_PRODUCT_MATRIX
REVENUECAT_ENTITLEMENT_MEMBERSHIP
IOS_LOCALIZED_STORE_PRICE
PROTECTED_INVARIANT_GATES
IOS_REJECTION_REGRESSION_GATES
CANDIDATE_ARTIFACT_IDENTITY
IOS_PHYSICAL_DEVICE_ACCEPTANCE
APP_STORE_SCREENSHOT_IOS_ONLY
```

Only when every required value is PASS may this ledger state:

```text
APP_STORE_RESUBMISSION_AUTHORIZED=YES
```

Until then:

```text
PRODUCTION_DEPLOYMENT_AUTHORIZED=NO
APP_STORE_RESUBMISSION_AUTHORIZED=NO
```
