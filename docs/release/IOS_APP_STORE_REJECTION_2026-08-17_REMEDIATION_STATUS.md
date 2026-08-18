# KieliValmis iOS Rejection Remediation — Live Status Ledger

**Rejection being remediated:** Apple App Review rejection received **2026-08-17**  
**App version under review:** `1.0` / source marketing version currently `1.0.0`  
**Rejected build:** `34`  
**Submission ID:** `9ca64a66-a835-4a85-b97d-987bf54044eb`  
**Master runbook:** `docs/release/IOS_APP_STORE_REJECTION_2026-08-17_RESUBMISSION_RUNBOOK.md`  
**Frozen runbook commit:** `d17e5894f6628f0a81d7a33ff21f466abf8a9359`  
**Status ledger rule:** an item is changed to `[x]` **only when its stated definition of done is actually true and supported by evidence**. Unknown, inferred, or merely likely items remain unchecked.  

---

## 0. Remediation control state

```text
REMEDIATION_STARTED=YES
PRODUCTION_DEPLOYMENT_AUTHORIZED=NO
APP_STORE_RESUBMISSION_AUTHORIZED=NO
BUILD34_PROVENANCE=BLOCKED
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PENDING
SOURCE_REPAIR_STARTED=YES
REPAIR_BRANCH_FORWARD_BASE=PASS
IOS_PHYSICAL_DEVICE_ACCEPTANCE=PENDING
APP_STORE_SCREENSHOT_IOS_ONLY=PENDING
```

The master runbook remains the detailed engineering specification. This file is the **live completion ledger** and should be updated after every verified remediation step.

---

# Phase 0 — Prove rejected-build and release provenance

## 0.1 Freeze the investigation reference

- [x] **Master remediation runbook exists at an immutable commit.**  
  **Definition of done:** the exact runbook can be retrieved by immutable Git SHA.  
  **Evidence:** commit `d17e5894f6628f0a81d7a33ff21f466abf8a9359`; path `docs/release/IOS_APP_STORE_REJECTION_2026-08-17_RESUBMISSION_RUNBOOK.md`.

- [x] **The rejection date and rejected build number are recorded.**  
  **Definition of done:** the ledger identifies the Apple rejection being repaired and the rejected build.  
  **Evidence:** Apple review information supplied for review dated 2026-08-17; rejected build `34`.

- [x] **The App Store submission ID is recorded.**  
  **Definition of done:** the rejected submission can be uniquely correlated to Apple review records.  
  **Evidence:** `9ca64a66-a835-4a85-b97d-987bf54044eb`.

- [ ] **Apple rejection screenshots are archived inside durable project release evidence.**  
  **Definition of done:** the reviewer screenshots/media are stored in a durable repository/release-evidence location or another formally linked release-evidence store.  
  **Current state:** screenshots were supplied during investigation but are not yet archived as repository evidence.

## 0.2 Resolve the repository production-line reference

- [x] **Repository canonical production integration ref is resolved.**  
  **Definition of done:** GitHub proves the exact head of `integration/canonical-production-20260816`.  
  **Evidence:** GitHub compare reports the branch is identical to `749ffe3669cc1c6184482a735001af769bc71547`.

- [x] **Canonical production-line commit is recorded.**  
  **Definition of done:** exact SHA and commit identity are documented.  
  **Evidence:** `749ffe3669cc1c6184482a735001af769bc71547` — `Migrate Floently Learn SEO surface to KieliValmis`.

- [ ] **The exact deployed production artifact/source SHA at the time build 34 was produced is proven.**  
  **Definition of done:** release evidence proves the Git SHA actually used to build the rejected iOS binary, not merely the current canonical branch head.  
  **Current state:** GitHub alone has not yet proven which SHA generated build 34.

## 0.3 Resolve current configured iOS app identity from source

- [x] **Current client application name is identified.**  
  **Definition of done:** active Expo client config identifies the release application name.  
  **Evidence:** `apps/client/app.config.ts` sets `KIELIVALMIS_APP_NAME = 'KieliValmis'`; `apps/client/app.base.json` also names the app `KieliValmis`.

- [x] **Current source marketing version is identified.**  
  **Definition of done:** active client configuration contains the version.  
  **Evidence:** `apps/client/app.base.json` contains `"version": "1.0.0"`.

- [x] **Configured App Store Connect app ID is identified from EAS submit config.**  
  **Definition of done:** production iOS submit configuration contains the App Store Connect application ID.  
  **Evidence:** `apps/client/eas.json` → `submit.production.ios.ascAppId = "6767821805"`.

- [x] **Configured Expo/EAS project ID is identified.**  
  **Definition of done:** active Expo config contains the EAS project identity used for updates/build association.  
  **Evidence:** `apps/client/app.config.ts` and `apps/client/app.base.json` contain EAS project ID `fa02c141-0a3b-4dbc-9122-7c1cf31ba42c`.

- [x] **Configured client iOS bundle identifier is identified.**  
  **Definition of done:** active client Expo configuration identifies the intended iOS bundle ID.  
  **Evidence:** `apps/client/app.base.json` contains `ios.bundleIdentifier = "com.vitusidi.floently"`. The repository release checklist independently instructs release builders to confirm `ios.bundleIdentifier com.vitusidi.floently`.

- [x] **A conflicting checked-in native iOS bundle identifier is documented.**  
  **Definition of done:** the mismatch is recorded and is not silently treated as resolved.  
  **Evidence:** root native Xcode project `ios/floentlyfinnish.xcodeproj/project.pbxproj` contains `PRODUCT_BUNDLE_IDENTIFIER = com.vitusidi.floentlyfinnish`, while the active Expo client config uses `com.vitusidi.floently`.

- [x] **The active client tree is confirmed not to contain `apps/client/ios`.**  
  **Definition of done:** GitHub lookup for `apps/client/ios` at canonical production returns no directory.  
  **Evidence:** canonical branch has `apps/client/eas.json`, `app.config.ts`, and `app.base.json`, but no `apps/client/ios` directory. This is useful evidence for understanding the EAS-prebuild path, but it does not by itself prove how build 34 was executed.

- [ ] **Actual bundle identifier embedded in rejected build 34 is proven.**  
  **Definition of done:** App Store Connect build metadata, EAS build metadata, an archived `.ipa`, or equivalent artifact inspection proves `CFBundleIdentifier` for build 34.  
  **Current state:** source strongly indicates the intended EAS client identifier is `com.vitusidi.floently`, but the rejected artifact itself has not yet been inspected; this therefore remains unchecked.

## 0.4 Resolve build-number source and build method

- [x] **The repository explains why build 34 is not expected to appear as a literal source build number.**  
  **Definition of done:** EAS configuration is inspected for version-source behavior.  
  **Evidence:** `apps/client/eas.json` sets `cli.appVersionSource = "remote"` and the production profile sets `autoIncrement = true`. Therefore the checked-in `buildNumber: "11"` in `app.base.json` is not evidence that the submitted build was 11; production EAS can assign/increment the remote build number.

- [ ] **Build 34 build method is proven (EAS vs local Xcode vs other CI).**  
  **Definition of done:** release/EAS metadata identifies the actual build executor and profile for build 34.  
  **Current state:** repository configuration supports EAS production builds, but the actual build-34 record has not yet been retrieved.

- [ ] **Exact Git SHA used by EAS/local build 34 is proven.**  
  **Definition of done:** build metadata links build 34 to an exact Git commit.  
  **Current state:** pending EAS/App Store/release artifact evidence.

- [ ] **Exact Git branch/ref used for build 34 is proven.**  
  **Definition of done:** build metadata or release logs identify the source ref.  
  **Current state:** pending.

## 0.5 Resolve release environment evidence

- [x] **Production EAS profile contains a configured iOS RevenueCat public SDK key.**  
  **Definition of done:** source proves the production build profile injects a non-empty iOS RevenueCat SDK key variable.  
  **Evidence:** `apps/client/eas.json` production environment defines `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`. The value is deliberately not repeated in this ledger.

- [x] **Production API base URL is identified.**  
  **Definition of done:** production EAS environment identifies the API endpoint injected into the client.  
  **Evidence:** `EXPO_PUBLIC_API_BASE_URL = https://learn-api.floently.com`.

- [ ] **The RevenueCat project/app represented by the production iOS SDK key is proven.**  
  **Definition of done:** RevenueCat dashboard evidence maps the configured public SDK key to the intended KieliValmis iOS app/project.  
  **Current state:** GitHub cannot prove dashboard ownership/mapping.

- [ ] **The App Store Connect bundle identifier for Apple app ID `6767821805` is proven from Apple.**  
  **Definition of done:** App Store Connect metadata confirms the bundle ID for the actual app record.  
  **Current state:** source intends `com.vitusidi.floently`; Apple-side confirmation remains required.

---

## Phase 0 gate

```text
REPOSITORY_CANONICAL_PRODUCTION_REF=PASS
CONFIGURED_APP_NAME=PASS
CONFIGURED_ASC_APP_ID=PASS
CONFIGURED_EAS_PROJECT_ID=PASS
CONFIGURED_IOS_BUNDLE_ID=PASS
BUILD_NUMBER_REMOTE_SOURCE_EXPLAINED=PASS
BUILD34_SOURCE_SHA=UNKNOWN
BUILD34_SOURCE_REF=UNKNOWN
BUILD34_BUILD_METHOD=UNKNOWN
BUILD34_EMBEDDED_BUNDLE_ID=UNKNOWN
APP_STORE_CONNECT_BUNDLE_ID=UNKNOWN
REVENUECAT_IOS_APP_IDENTITY=UNKNOWN
BUILD34_PROVENANCE=BLOCKED
```

**Definition of done for Phase 0:** `BUILD34_PROVENANCE=PASS`.  
**Phase 0 is NOT done yet.** No source-code checkbox from later phases should be marked complete merely because the likely defect has been identified.

---

# Phase 1 — Apple + RevenueCat catalog reconciliation

**Status:** PENDING. Nothing is marked done until Apple/RevenueCat-side evidence is obtained.

- [ ] Paid Apps Agreement active.
- [ ] Banking accepted.
- [ ] Tax information accepted.
- [ ] Apple app ID `6767821805` bundle identifier confirmed.
- [ ] All visible subscription Product IDs confirmed in App Store Connect.
- [ ] Subscription groups confirmed.
- [ ] Product prices/localizations/statuses confirmed.
- [ ] RevenueCat project confirmed.
- [ ] RevenueCat iOS app bundle identifier confirmed.
- [ ] RevenueCat product mappings confirmed.
- [ ] RevenueCat entitlements confirmed.
- [ ] Explicit KieliValmis offering ID confirmed/created.
- [ ] Every KieliValmis package maps to the intended Apple Product ID.

**Definition of done:** complete plan → offering → package → RevenueCat product → Apple Product ID → entitlement matrix with all rows PASS.

---

# Phase 2 — Narrow source repair branch

**Status:** DONE.

- [x] **Repair base SHA selected from verified production lineage.**  
  **Definition of done:** the repair branch starts at the verified canonical production head rather than stale `main` or Wave-1 UAT.  
  **Evidence:** repair base `749ffe3669cc1c6184482a735001af769bc71547`, verified as the exact head of `integration/canonical-production-20260816` when the branch was created.

- [x] **Forward ancestry verified.**  
  **Definition of done:** GitHub comparison proves the new repair branch began identically from the canonical production SHA.  
  **Evidence:** initial compare of base `749ffe3669cc1c6184482a735001af769bc71547` to `release/ios-app-review-remediation-20260818` returned `status=identical`, `ahead_by=0`, `behind_by=0`, merge base equal to the same SHA.

- [x] **Narrow iOS review remediation branch created.**  
  **Definition of done:** dedicated repair branch exists and is separate from canonical production and Wave-1 UAT.  
  **Evidence:** `release/ios-app-review-remediation-20260818`.

**Gate:** `REPAIR_BRANCH_FORWARD_BASE=PASS`.

A draft PR now tracks source repair from this branch to canonical production: **PR #37**. The PR is intentionally draft and carries `PRODUCTION_DEPLOYMENT_AUTHORIZED=NO` and `APP_STORE_RESUBMISSION_AUTHORIZED=NO`.

---

# Phase 3 — Account deletion accessibility and completion truth

**Status:** IN PROGRESS.

- [ ] Free authenticated user can open Settings without paid entitlement.  
  **Current evidence:** source repair commit `d36d5ac6392edc6a8415fbbe379fe7c1edb16196` separates authenticated account-management routes (`settings`, `help`, `billing`) from paid learning entitlement checks. This checkbox remains open until the permanent regression/CI gate passes.
- [ ] Paid learning routes remain protected.
- [ ] Delete Account remains visible/reachable.
- [ ] Reviewer-state regression test added.  
  **Current evidence:** verifier source added in commit `d47c08f2468f4d5090bcd1b389a950a4296633d4`; checkbox remains open until CI executes it successfully.
- [ ] Free-user protected-feature regression test added.
- [ ] Backend deletion result no longer reports completion after partial required cleanup.
- [ ] Backend success/failure tests added.
- [ ] Session/deleted-account behavior verified.

**Current PR head:** `3db104dd3778ba59aee23050a31b2980bdfdb2fe`. PR CI is running; no Phase-3 test-dependent checkbox is marked complete until CI reports success.

**Definition of done:** all account-deletion source and automated regression requirements in the master runbook pass.

---

# Phase 4 — iOS identity and RevenueCat client hardening

**Status:** NOT STARTED.

- [ ] iOS bundle identity normalized to Apple-authoritative value.
- [ ] Release verifier prevents Expo/native bundle-ID drift.
- [ ] Explicit KieliValmis RevenueCat offering used.
- [ ] Offering/package preflight implemented.
- [ ] Missing store products disable purchase safely.
- [ ] Raw RevenueCat SDK messages are not normal user-facing copy.
- [ ] iOS prices come from localized StoreProduct data.
- [ ] RevenueCat identity/account switching behavior tested.

**Definition of done:** all source tests and identity checks pass and external Apple/RevenueCat catalog remains coherent.

---

# Phase 5 — Protected regression gates

**Status:** PENDING.

- [ ] Authentication/session regression suite passes.
- [ ] Navigation/deep-link/back regression suite passes.
- [ ] Subscription/access regression suite passes.
- [ ] Cards regression suite passes.
- [ ] Roleplay regression suite passes.
- [ ] Microphone/STT regression suite passes.
- [ ] Everyday Finnish regression suite passes.
- [ ] New iOS rejection regression tests pass.

**Definition of done:** `PROTECTED_INVARIANT_GATES=PASS` and `IOS_REJECTION_REGRESSION_GATES=PASS`.

---

# Phase 6 — Immutable iOS candidate

**Status:** PENDING.

- [ ] Exact candidate SHA recorded.
- [ ] Next unused iOS build number recorded.
- [ ] Bundle ID recorded and artifact-verified.
- [ ] RevenueCat project/app/offering recorded.
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
- [ ] Cancellation behaves normally.
- [ ] Regression smoke passes on exact candidate.

**Definition of done:** `IOS_PHYSICAL_DEVICE_ACCEPTANCE=PASS`.

---

# Phase 8 — App Store screenshot remediation

**Status:** PENDING.

- [ ] New iPhone screenshots are genuine iOS captures.
- [ ] iPad screenshots corrected if required by the listing.
- [ ] Every App Store Connect size group inspected.
- [ ] Every localization inspected.
- [ ] No Android/non-iOS status bar or device chrome remains.
- [ ] Screenshots accurately match the candidate build.

**Definition of done:** `APP_STORE_SCREENSHOT_IOS_ONLY=PASS`.

---

# Phase 9 — Reviewer evidence

**Status:** PENDING.

- [ ] Physical-device account deletion video recorded.
- [ ] Video shows free/no-subscription account reaching Settings.
- [ ] Video shows Delete Account and confirmation flow.
- [ ] Reviewer notes updated with exact navigation steps.
- [ ] Billing remediation summarized truthfully for reviewer.
- [ ] Screenshot remediation summarized truthfully for reviewer.

**Definition of done:** reviewer can reproduce the repaired flows without developer-only instructions.

---

# Phase 10 — Resubmission gate

**Status:** BLOCKED.

Do not submit until all of the following are PASS:

```text
BUILD34_PROVENANCE
APPLE_REVENUECAT_CATALOG_RECONCILIATION
REPAIR_BRANCH_FORWARD_BASE
FREE_AUTHENTICATED_USER_CAN_OPEN_SETTINGS
ACCOUNT_DELETION_REACHABLE
ACCOUNT_DELETION_COMPLETION_TRUTH
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE
REVENUECAT_EXPLICIT_OFFERING
REVENUECAT_PACKAGE_PREFLIGHT
IOS_LOCALIZED_STORE_PRICE
PROTECTED_INVARIANT_GATES
IOS_REJECTION_REGRESSION_GATES
CANDIDATE_ARTIFACT_IDENTITY
IOS_PHYSICAL_DEVICE_ACCEPTANCE
APP_STORE_SCREENSHOT_IOS_ONLY
```

Only when every value is PASS may this ledger state:

```text
APP_STORE_RESUBMISSION_AUTHORIZED=YES
```
