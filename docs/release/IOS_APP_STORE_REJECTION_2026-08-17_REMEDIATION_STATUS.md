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
PROTECTED_INVARIANT_GATES=PASS
IOS_LOCAL_SOURCE_QUALIFICATION=PASS
EXACT_CANDIDATE_SHA=13212827d31a82331e3440f55ca31eab9d538288
CANDIDATE_SOURCE_FROZEN=PASS
CANDIDATE_ARTIFACT_IDENTITY=PASS
IOS_BUILD_NUMBER=35
EAS_BUILD_ID=ca17b79a-b6cc-45a6-bb21-1681730849c0
TESTED_SHA_EQUALS_BUILT_SHA=PASS
IPA_BUNDLE_IDENTITY=PASS
PHYSICAL_FREE_ACCOUNT_SETTINGS_ACCESS=PASS
PHYSICAL_DELETE_ACCOUNT_REACHABILITY=PASS
PHYSICAL_DELETE_ACCOUNT_COMPLETION=PASS
ACCOUNT_DELETION_REVIEWER_VIDEO_RECORDED=PASS
IOS_PHYSICAL_DEVICE_ACCEPTANCE=PENDING
APP_STORE_SCREENSHOT_IOS_ONLY=PENDING
```

The frozen master runbook remains the investigation/remediation baseline. This file is the live evidence/completion ledger and must be updated after each verified step.

---

# Phase 0 — Rejected-build and release provenance

**Status: DONE.**

- [x] Master remediation runbook frozen at immutable commit `d17e5894f6628f0a81d7a33ff21f466abf8a9359`.
- [x] Rejection identity recorded: 2026-08-17, version 1.0, build 34, submission `9ca64a66-a835-4a85-b97d-987bf54044eb`.
- [x] Canonical production lineage resolved: `integration/canonical-production-20260816` → `749ffe3669cc1c6184482a735001af769bc71547`.
- [x] Exact build-34 Git SHA proven: `4ce381deefa79b1b202d1483498f52a11d0c006c`.
- [x] Build-34 EAS build ID proven: `b192f8f3-74ec-42c6-9dda-f3e569f13a3c`.
- [x] Build method/profile proven: EAS production build, Expo prebuild, Xcode/fastlane archive/export.
- [x] Build-34 iOS bundle ID proven: `com.vitusidi.floently`.
- [x] App Store Connect identity proven: Apple app ID `6767821805`, bundle `com.vitusidi.floently`.
- [x] RevenueCat identity proven: project `Floently`, app `Floently iOS`, bundle `com.vitusidi.floently`.
- [x] Production RevenueCat public iOS key is tied to that RevenueCat app; full key intentionally omitted from documentation.
- [x] Old root Xcode project with `com.vitusidi.floentlyfinnish` is documented as non-authoritative for build 34 because EAS generated `apps/client/ios` from Expo config.
- [ ] Historical mutable Git branch name for build 34 is still unknown; this is informational/non-blocking because immutable build/source provenance is proven.

**Gate:** `BUILD34_PROVENANCE=PASS`.

---

# Phase 1 — Apple + RevenueCat catalog reconciliation

**Status: PARTIAL.** Cross-system app identity, commercial prerequisites, Apple core subscription identity, and RevenueCat core offering/package/product mapping are now proven. Individual Apple product pricing/metadata, RevenueCat entitlement membership, and physical StoreKit verification remain open.

## 1.1 Apple commercial prerequisites

- [x] Paid Apps Agreement Active.
- [x] Bank account Active.
- [x] Displayed required tax forms Active.

## 1.2 Apple subscription catalog

- [x] Subscription groups confirmed: `Floently Read` = 4 subscriptions; `Kielivalmis Premium` = 9 subscriptions.
- [x] KieliValmis Premium group identity confirmed: Subscription Group ID `22077944`, status `In Review`.
- [x] All nine core Product IDs confirmed:
  - `floently_combo_3months`
  - `floently_combo_monthly`
  - `floently_combo_yearly`
  - `floently_prof_3months`
  - `floently_prof_monthly`
  - `floently_prof_yearly`
  - `floently_yki_3months`
  - `floently_yki_monthly`
  - `floently_yki_yearly`
- [x] Monthly, 3-month and yearly durations confirmed for Combined, Professional and YKI.
- [x] All nine core products currently show `In Review` in App Store Connect.
- [ ] Individual product prices/localizations/territory availability confirmed.
  - **Definition of done:** each core Apple subscription detail page proves the active price schedule, required metadata/localizations, and availability.
  - **Current state:** group-level English (U.S.) localization is visible, but individual product detail is not yet captured.

Durable Apple evidence: `docs/release/evidence/IOS_REJECTION_PHASE1_APPLE_SUBSCRIPTIONS_2026-08-21.md`.

## 1.3 RevenueCat `default` offering

- [x] RevenueCat project/app confirmed: `Floently` / `Floently iOS`.
- [x] Core offering confirmed: identifier `default`, display name `Default`, 9 packages.
- [x] Core package identifiers confirmed: `combo_yearly`, `combo_3months`, `combo_monthly`, `prof_yearly`, `prof_3months`, `prof_monthly`, `yki_yearly`, `yki_3months`, `yki_monthly`.
- [x] RevenueCat package → Apple Product ID matrix confirmed for all nine core packages:

| RevenueCat package | Apple Product ID | Result |
|---|---|---|
| `combo_yearly` | `floently_combo_yearly` | PASS |
| `combo_3months` | `floently_combo_3months` | PASS |
| `combo_monthly` | `floently_combo_monthly` | PASS |
| `prof_yearly` | `floently_prof_yearly` | PASS |
| `prof_3months` | `floently_prof_3months` | PASS |
| `prof_monthly` | `floently_prof_monthly` | PASS |
| `yki_yearly` | `floently_yki_yearly` | PASS |
| `yki_3months` | `floently_yki_3months` | PASS |
| `yki_monthly` | `floently_yki_monthly` | PASS |

- [x] Current source aliases align with the RevenueCat dashboard packages. `storeBillingService.ts` resolves YKI → `yki_*`, Professional → `prof_*`, Combined → `combo_*`.
- [x] Every core KieliValmis package maps to the intended Apple Product ID; no core package/Product-ID mismatch is visible.
- [ ] RevenueCat entitlement membership confirmed end to end.
  - **Definition of done:** expanded entitlement detail proves the relevant Apple/RevenueCat products belong to `yki_access`, `professional_access`, and `combined_access` exactly as expected.
  - **Current state:** entitlement names/counts were visible previously, but individual membership has not yet been expanded and reconciled.

Durable RevenueCat mapping evidence: `docs/release/evidence/IOS_REJECTION_PHASE1_REVENUECAT_DEFAULT_OFFERING_2026-08-21.md`.

## 1.4 Runtime StoreKit proof

- [ ] Physical/TestFlight StoreKit fetch succeeds.
- [ ] Localized Apple prices are returned for every visible core plan.
- [ ] Native Apple purchase sheet opens.
- [ ] Purchase succeeds.
- [ ] RevenueCat entitlement activates and backend entitlement sync succeeds.
- [ ] Restore Purchases succeeds.

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

**Status: DONE for source + automated regression; physical deletion flow now also proven on Build 35.**

- [x] Free authenticated user can open Settings without paid entitlement.
- [x] Paid learning routes remain protected.
- [x] Delete Account remains visible/reachable in Settings.
- [x] Permanent reviewer-state navigation/deletion invariant added and passing.
- [x] Backend cannot report completed deletion after partial required cleanup.
- [x] Backend success/failure tests cover database and state-store cleanup failures.
- [x] Deleted-account session/access/refresh state cleanup is tested.
- [x] Physical Build 35 deletion flow completes, returns to unauthenticated state, and the deleted credentials no longer authenticate.

**Gate:**

```text
FREE_AUTHENTICATED_USER_CAN_OPEN_SETTINGS=PASS
FREE_USER_PAID_FEATURE_GUARDS_STILL_ENFORCED=PASS
ACCOUNT_DELETION_REACHABLE_SOURCE_GATE=PASS
ACCOUNT_DELETION_COMPLETION_TRUTH=PASS
ACCOUNT_DELETION_SOURCE_REGRESSION_GATES=PASS
PHYSICAL_DELETE_ACCOUNT_COMPLETION=PASS
```

---

# Tester-account clarification

The historical build-34 source commit title `Remove App Review account from shared test entitlements` did **not** delete or deactivate an authentication account. It removed `testuser@floently.com` from a hard-coded Floently Read test-email bypass in `packages/core/api/entitlements.ts`.

- [x] Meaning of historical commit documented.
- [ ] All current human testers are confirmed to have deliberate, non-reviewer test entitlement configuration.
  - **Current state:** if testers relied only on the removed hard-coded `testuser@floently.com` Read bypass, their special Read access may have changed although the account remains active.

Durable clarification: `docs/release/evidence/TEST_ACCOUNT_ENTITLEMENT_CLARIFICATION_2026-08-21.md`.

---

# Phase 4 — iOS identity + RevenueCat client hardening

**Status: repository-side gates DONE; dashboard/runtime proof remains Phase 1/7.**

- [x] Authoritative iOS bundle identity fixed at `com.vitusidi.floently` for the App Store release path.
- [x] Release identity contract records `apps/client` + Expo prebuild as App Store release authority.
- [x] CI release-identity verifier protects bundle ID, ASC app ID, EAS project/profile/channel and release authority from drift.
- [x] RevenueCat anonymous → authenticated identity transition corrected.
- [x] App logout attempts RevenueCat logout without trapping local logout.
- [x] All nine core plan/package mappings preflighted.
- [x] Package + Apple Product ID + localized store price required before plan is store-ready.
- [x] Selected plan rechecked immediately before purchase.
- [x] Missing/loading products disable Buy/trial CTAs.
- [x] Raw RevenueCat failures converted to stable user-safe messages while technical diagnostics are retained.
- [x] iOS/mobile paywall displays RevenueCat/StoreKit localized prices rather than static EUR estimates.

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

**Status: DONE for the deployable combined release source.**

- [x] Current remediation client TypeScript gate passes.
- [x] Navigation invariant passes.
- [x] Account-deletion access invariant passes.
- [x] RevenueCat identity invariant passes.
- [x] Store-billing preflight invariant passes.
- [x] iOS release-identity invariant passes.
- [x] Isolated backend account-deletion completion-truth gate passes.
- [x] Exact combined candidate deployable backend suite and protected Wave-1 regression suite pass on `13212827d31a82331e3440f55ca31eab9d538288`.

Final exact-SHA evidence includes `70 passed` for `apps/backend/tests` (with the historical Agent-F branch-scope-only mission guard executed separately and passing), the Professional Mission contract, Roleplay, YKI, Reading, Writing, Practice, navigation, governance, localization, brand and App Review source invariants. The final source repair is test-only and makes publication-lifecycle tests use an isolated current-schema canonical fixture.

The previously observed root `engine/tests` missing-module collection failure remains a legacy repository issue. The production backend Docker image packages `apps/backend`; the root `engine/` tree is not the shipped backend runtime and is not used to downgrade the exact-candidate release gate.

Durable evidence: `docs/release/evidence/IOS_COMBINED_CANDIDATE_LOCAL_QUALIFICATION_2026-08-29.md`.

**Gate:** `PROTECTED_INVARIANT_GATES=PASS`.

---

# Phase 6 — Immutable iOS resubmission candidate

**Status: DONE.**

- [x] Exact candidate SHA frozen at `13212827d31a82331e3440f55ca31eab9d538288` and verified as the GitHub head of `release/ios-wave1-combined-20260829` after full local qualification.
- [x] Next unused iOS build number recorded: `35`.
- [x] Candidate bundle ID artifact-verified as `com.vitusidi.floently`.
- [x] RevenueCat project/app/offering source contract is tied to the exact built SHA via tested-SHA = built-SHA proof and the authoritative bundle identity.
- [x] EAS/IPA artifact identifier recorded: EAS build `ca17b79a-b6cc-45a6-bb21-1681730849c0`; downloaded IPA SHA-256 `aa7bd93e22eecb7ff2535c6a22409f2739ab10a184f4d781f2b26b4538defb10`.
- [x] Tested SHA exactly equals built SHA: `13212827d31a82331e3440f55ca31eab9d538288`.

**Definition of done:** `CANDIDATE_ARTIFACT_IDENTITY=PASS`.

Durable artifact evidence includes `docs/release/evidence/IOS_BUILD35_EAS_ARTIFACT_2026-08-29.md` and subsequent exact-artifact reconciliation records on PR #42.

---

# Phase 7 — Physical-device acceptance

**Status: PARTIAL.** Account-management/deletion is physically proven on the exact TestFlight Build 35; StoreKit/RevenueCat purchase acceptance remains open.

- [x] New free account reaches Settings without purchasing.
- [x] Delete Account completes truthfully.
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

Physical deletion evidence: `docs/release/evidence/IOS_BUILD35_PHYSICAL_SETTINGS_ACCOUNT_DELETION_2026-08-29.md` and `docs/release/evidence/IOS_BUILD35_ACCOUNT_DELETION_VIDEO_2026-08-29.md`.

The deletion recording also captures a brief post-success `401`/expired-session screen during logout cleanup before the app recovers to the unauthenticated state. The deleted credentials then fail to authenticate. This is tracked as a non-blocking UX blemish and does not downgrade deletion-completion truth.

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

**Status: PARTIAL.** The physical account-deletion video is recorded and proves the requested reviewer flow; final reviewer notes and billing/screenshot summaries remain open.

- [x] Physical-device account-deletion video recorded.
- [x] Video starts with/creates a free no-subscription account and proves `No active subscription` before deletion.
- [x] Video shows Settings navigation, Delete Account, both confirmations, success, return to signed-out state, and failed reauthentication with the deleted account.
- [ ] Reviewer notes contain exact navigation steps.
- [ ] Billing remediation summarized truthfully.
- [ ] Screenshot remediation summarized truthfully.

Durable video review: `docs/release/evidence/IOS_BUILD35_ACCOUNT_DELETION_VIDEO_2026-08-29.md`.

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

Only when every required value is PASS may this ledger state `APP_STORE_RESUBMISSION_AUTHORIZED=YES`.

Until then:

```text
PRODUCTION_DEPLOYMENT_AUTHORIZED=NO
APP_STORE_RESUBMISSION_AUTHORIZED=NO
```
