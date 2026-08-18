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
BUILD34_PROVENANCE=BLOCKED
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PENDING
SOURCE_REPAIR_STARTED=YES
REPAIR_BRANCH_FORWARD_BASE=PASS
ACCOUNT_DELETION_SOURCE_PHASE=PASS
ACCOUNT_DELETION_BACKEND_TRUTH_GATE=PASS
ACCOUNT_DELETION_CLIENT_ACCESS_GATE=PASS
REVENUECAT_IDENTITY_SOURCE_GATE=PASS
STORE_BILLING_PREFLIGHT_SERVICE_GATE=PASS
STORE_BILLING_SAFE_ERROR_GATE=PASS
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

- [ ] **The exact source SHA used for rejected build 34 is proven.**  
  **Definition of done:** EAS/build/archive/App Store release evidence links build 34 to the exact Git SHA that produced it.  
  **Current state:** GitHub source history alone does not prove this.

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
  **Evidence:** `apps/client/app.base.json` contains `ios.bundleIdentifier = "com.vitusidi.floently"`; the release checklist independently names the same identifier.

- [x] **Conflicting checked-in native iOS bundle identifier is documented.**  
  **Definition of done:** mismatch is recorded and not treated as resolved.  
  **Evidence:** root `ios/floentlyfinnish.xcodeproj/project.pbxproj` contains `PRODUCT_BUNDLE_IDENTIFIER = com.vitusidi.floentlyfinnish`, while active client Expo config uses `com.vitusidi.floently`.

- [x] **Active client tree is confirmed not to contain `apps/client/ios`.**  
  **Definition of done:** GitHub inspection proves there is no checked-in native iOS directory under the actual Expo client package on the canonical line.  
  **Evidence:** `apps/client` has EAS/app config but no `apps/client/ios` directory.

- [ ] **Actual bundle identifier embedded in rejected build 34 is proven.**  
  **Definition of done:** App Store Connect build metadata, EAS build metadata, archived `.ipa`, or equivalent artifact inspection proves build 34 `CFBundleIdentifier`.  
  **Current state:** source indicates intended EAS identifier `com.vitusidi.floently`, but artifact identity remains unproven.

## 0.4 Resolve build-number source and build method

- [x] **Repository explains why build 34 is not expected as a literal checked-in build number.**  
  **Definition of done:** EAS version-source behavior is inspected.  
  **Evidence:** `apps/client/eas.json` sets `cli.appVersionSource = "remote"`; production sets `autoIncrement = true`. Checked-in `buildNumber: "11"` is therefore not authoritative for the submitted build number.

- [ ] **Build 34 build method is proven (EAS vs local Xcode vs other CI).**  
  **Definition of done:** build metadata identifies the actual executor/profile for build 34.  
  **Current state:** repository supports EAS production builds, but actual build-34 record has not been retrieved.

- [ ] **Exact Git branch/ref used for build 34 is proven.**  
  **Definition of done:** build metadata/release logs identify the source ref.  
  **Current state:** pending external build evidence.

## 0.5 Resolve release environment evidence

- [x] **Production EAS profile contains a configured iOS RevenueCat public SDK key.**  
  **Definition of done:** source proves production build profile injects a non-empty iOS RevenueCat SDK key variable.  
  **Evidence:** `apps/client/eas.json` defines `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`; value intentionally not repeated here.

- [x] **Production API base URL is identified.**  
  **Definition of done:** production EAS environment identifies API endpoint.  
  **Evidence:** `https://learn-api.floently.com`.

- [ ] **RevenueCat project/app represented by production iOS SDK key is proven.**  
  **Definition of done:** RevenueCat dashboard evidence maps the configured public SDK key to the intended KieliValmis iOS app/project.  
  **Current state:** GitHub cannot prove dashboard ownership/mapping.

- [ ] **App Store Connect bundle identifier for Apple app ID `6767821805` is proven from Apple.**  
  **Definition of done:** App Store Connect metadata confirms the actual app-record bundle ID.  
  **Current state:** source intends `com.vitusidi.floently`; Apple-side confirmation remains required.

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

**Definition of done for Phase 0:** `BUILD34_PROVENANCE=PASS`. Phase 0 is **not done**.

---

# Phase 1 — Apple + RevenueCat catalog reconciliation

**Status:** PENDING. These are dashboard/store facts and must not be checked from source inference alone.

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
- [ ] KieliValmis paywall offering/placement contract confirmed in RevenueCat.
- [ ] Every visible KieliValmis package maps to the intended Apple Product ID.

**Definition of done:** complete plan → offering/placement → package → RevenueCat product → Apple Product ID → entitlement matrix with every visible iOS plan PASS.

### Runbook amendment: Offering strategy

The frozen runbook recommended hardcoding an explicit KieliValmis offering ID. Current official RevenueCat guidance recommends using the customer's `current` Offering for a dynamically managed paywall, and RevenueCat also supports fetching a current Offering for a named Placement. Therefore the remediation must **not** invent/hardcode an offering identifier before the RevenueCat dashboard is reconciled.

For this live remediation, the requirement represented by the older `REVENUECAT_EXPLICIT_OFFERING` gate means: **the KieliValmis paywall has a deterministic, tested offering contract**. That may be implemented using RevenueCat `current` plus required-package preflight, or a dedicated RevenueCat Placement if the dashboard is configured for it. A literal hardcoded Offering identifier is not required unless the reconciled dashboard/product strategy intentionally chooses one.

---

# Phase 2 — Narrow source repair branch

**Status:** DONE.

- [x] **Repair base SHA selected from verified production lineage.**  
  **Definition of done:** repair branch starts from verified canonical production head, not stale `main` or Wave-1 UAT.  
  **Evidence:** base `749ffe3669cc1c6184482a735001af769bc71547`.

- [x] **Forward ancestry verified at branch creation.**  
  **Definition of done:** GitHub comparison proves the new branch initially matched canonical production exactly.  
  **Evidence:** initial comparison returned `status=identical`, `ahead_by=0`, `behind_by=0`, merge base `749ffe3669cc1c6184482a735001af769bc71547`.

- [x] **Narrow iOS review remediation branch created.**  
  **Definition of done:** dedicated repair branch exists separately from canonical production and Wave-1 UAT.  
  **Evidence:** `release/ios-app-review-remediation-20260818`.

**Gate:** `REPAIR_BRANCH_FORWARD_BASE=PASS`.

Draft PR: **#37 — iOS review remediation: keep account deletion reachable for free users**. The PR remains draft and carries `PRODUCTION_DEPLOYMENT_AUTHORIZED=NO` and `APP_STORE_RESUBMISSION_AUTHORIZED=NO`.

---

# Phase 3 — Account deletion accessibility and completion truth

**Status:** DONE for source + automated regression remediation. Physical-device reviewer proof remains Phase 7/9.

- [x] **Free authenticated user can open Settings without paid entitlement.**  
  **Definition of done:** source fix exists and permanent client invariant/TypeScript gate passes.  
  **Evidence:** commit `d36d5ac6392edc6a8415fbbe379fe7c1edb16196`; PR CI run `32155927222` client TypeScript, navigation invariants, and account-deletion access invariant all SUCCESS at head `2417270ffb1d2e35b47b411e034ebefce61a1842`.

- [x] **Paid learning routes remain protected by the account-management exemption.**  
  **Definition of done:** client invariant proves protected learning/YKI/professional/read/create/progress routes were not reclassified as account management and navigation/TypeScript checks pass.  
  **Evidence:** `verify-account-deletion-access.mjs`; PR CI run `32155927222` = SUCCESS.

- [x] **Delete Account remains visible/reachable through signed-in Settings navigation.**  
  **Definition of done:** permanent verifier proves drawer → Settings discoverability and Settings → Delete Account handler/API wiring; client checks pass.  
  **Evidence:** verifier checks sidebar navigation, `handleDeleteAccount`, authenticated API call, and visible `onPress={handleDeleteAccount}` wiring; PR CI run `32155927222` = SUCCESS.

- [x] **Reviewer-state regression test added and passing.**  
  **Definition of done:** `verify-account-deletion-access.mjs` runs successfully in PR CI.  
  **Evidence:** verifier created in commit `d47c08f2468f4d5090bcd1b389a950a4296633d4`; CI account-deletion access step SUCCESS in run `32155927222`.

- [x] **Free-user protected-feature regression assertion added and passing.**  
  **Definition of done:** verifier proves the account-management exemption does not include learning/YKI/professional/read/create/progress routes and passes in CI.  
  **Evidence:** CI account-deletion access step SUCCESS in run `32155927222`.

- [x] **Backend deletion result no longer reports completion after partial required cleanup.**  
  **Definition of done:** service returns success only after database and state-store cleanup succeed; database/state failure produces retryable error; targeted regression passes.  
  **Evidence:** source commit `720222299cffcb40212002c880bf85d613d8c2e2`; PR CI run `32155927222`, step **Verify account deletion completion truth** = SUCCESS.

- [x] **Backend success/failure regression tests added and passing.**  
  **Definition of done:** tests cover cleanup order, complete success, database cleanup failure, and state-store cleanup failure and pass in CI.  
  **Evidence:** `apps/backend/tests/test_account_deletion_service.py`; targeted PR CI step SUCCESS in run `32155927222`.

- [x] **Automated session/token invalidation behavior verified for deleted account state.**  
  **Definition of done:** regression verifies deleted user's identity/session/access/refresh state is removed while unrelated user session state is preserved, and test passes in CI.  
  **Evidence:** commit `393765c9542702d7b63e91b143bff3cba0344765`; included in successful targeted account-deletion test step in run `32155927222`.

**Phase 3 gate:**

```text
FREE_AUTHENTICATED_USER_CAN_OPEN_SETTINGS=PASS
FREE_USER_PAID_FEATURE_GUARDS_STILL_ENFORCED=PASS
ACCOUNT_DELETION_REACHABLE_SOURCE_GATE=PASS
ACCOUNT_DELETION_COMPLETION_TRUTH=PASS
ACCOUNT_DELETION_SOURCE_REGRESSION_GATES=PASS
```

### Known unrelated/global regression-suite blocker discovered while validating Phase 3

The targeted account-deletion backend gate and the complete client account-access gate pass. The subsequent repository-wide `pytest apps/backend/tests engine/tests -q` step still fails during collection because the canonical source/test combination references missing modules `engine.learning` and `engine.logging`. This is **not** marked green and remains a blocker for Phase 5 protected invariant gates. Do not hide the failure or weaken/delete tests to obtain a green check.

---

# Phase 4 — iOS identity and RevenueCat client hardening

**Status:** IN PROGRESS. RevenueCat customer identity and user-safe store error gates are verified; paywall-level preflight/localized-price work and external Apple/RevenueCat reconciliation remain open.

- [ ] **iOS bundle identity normalized to Apple-authoritative value.**  
  **Definition of done:** build 34/App Store Connect/RevenueCat authoritative identity is proven first, then source/build configuration is normalized and verified.  
  **Current state:** external authoritative identity remains unproven; do not guess.

- [ ] **Release verifier prevents source/build bundle-ID drift.**  
  **Definition of done:** release-time verification fails if the actual iOS build identity diverges from the Apple-authoritative identity.  
  **Current state:** blocked on the authoritative identity decision above.

- [ ] **KieliValmis RevenueCat current-offering/placement contract is explicit and tested end to end.**  
  **Definition of done:** source contract plus RevenueCat dashboard offering/placement and every visible package/product mapping are reconciled and tested.  
  **Current state:** source now supports current-offering snapshot/preflight, but RevenueCat dashboard evidence remains pending.

- [x] **Store billing preflight service and purchase-time package recheck are implemented and passing.**  
  **Definition of done:** all nine core plan/package mappings are explicit; preflight resolves the RevenueCat offering and requires package + underlying store Product ID + localized price; selected plan is rechecked immediately before purchase; TypeScript and invariant gate pass.  
  **Evidence:** `preflightStoreBillingPlans()` and reusable package snapshot matching added in commits through `1126871b0eb1db0adc16e43d804abb371fac3f55`; PR CI run `32157537832` client TypeScript and **Verify store billing preflight invariants** = SUCCESS.

- [ ] **Offering/package preflight is consumed by the paywall before enabling purchase CTAs.**  
  **Definition of done:** BillingRoute loads the store catalog before enabling store purchase controls and does not present a purchasable CTA for a plan whose App Store product/price was not fetched.  
  **Current state:** service/purchase-time gate is complete, but paywall presentation integration remains to be implemented.

- [ ] **Missing store products disable/replace the purchase CTA safely.**  
  **Definition of done:** an unavailable plan cannot be tapped as a normal Buy action and the user receives stable retry/unavailable presentation instead of discovering the problem only after tapping.  
  **Current state:** purchase-time service fails closed safely, but the existing BillingRoute still needs preflight-driven CTA state.

- [x] **Raw RevenueCat SDK errors are not normal user-facing purchase/restore copy.**  
  **Definition of done:** RevenueCat purchase/restore/preflight failures are converted to stable application errors before reaching current BillingRoute error alerts; technical cause is retained in diagnostics; TypeScript/invariant gate passes.  
  **Evidence:** `StoreBillingUnavailableError`, `StorePurchaseCancelledError`, technical diagnostic logging and safe wrappers in `storeBillingService.ts`; PR CI run `32157537832` client TypeScript and store-billing preflight invariant = SUCCESS at head `1126871b0eb1db0adc16e43d804abb371fac3f55`.

- [ ] **iOS prices come from localized RevenueCat/StoreKit product data in the visible paywall.**  
  **Definition of done:** BillingRoute displays the matched package `priceString`/localized store price instead of static EUR estimates for iOS store purchases, with regression coverage.  
  **Current state:** RevenueCat snapshot now carries localized price data, but BillingRoute still renders the static estimate and therefore this remains open.

- [x] **RevenueCat anonymous → authenticated and account-switching identity behavior is corrected/tested.**  
  **Definition of done:** an anonymous-configured SDK logs in when a concrete application user appears; a different authenticated app user is re-identified; application logout attempts RevenueCat logout without trapping the local app session; TypeScript and permanent identity invariant pass.  
  **Evidence:** identity changes in `revenueCatService.ts` and `authStore.ts`; `verify-revenuecat-identity.mjs`; PR CI run `32157537832` client TypeScript and **Verify RevenueCat identity invariants** = SUCCESS.

**Verified Phase-4 source sub-gates:**

```text
REVENUECAT_IDENTITY_SOURCE_GATE=PASS
STORE_BILLING_PREFLIGHT_SERVICE_GATE=PASS
STORE_BILLING_SAFE_ERROR_GATE=PASS
PAYWALL_PREFLIGHT_PRESENTATION=PENDING
IOS_LOCALIZED_STORE_PRICE=PENDING
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE=PENDING_EXTERNAL_IDENTITY_PROOF
REVENUECAT_OFFERING_CONTRACT=PENDING_DASHBOARD_RECONCILIATION
```

**Phase 4 overall remains IN PROGRESS.**

---

# Phase 5 — Protected regression gates

**Status:** BLOCKED / PENDING.

- [ ] Authentication/session regression suite passes.
- [x] **Navigation/deep-link/back source invariant suite passes on the current remediation head.**  
  **Evidence:** PR CI run `32157537832`, **Verify navigation invariants** = SUCCESS at head `1126871b0eb1db0adc16e43d804abb371fac3f55`.
- [ ] Subscription/access regression suite passes.
- [ ] Cards regression suite passes.
- [ ] Roleplay regression suite passes.
- [ ] Microphone/STT regression suite passes.
- [ ] Everyday Finnish regression suite passes.
- [ ] New iOS rejection regression tests pass as part of the immutable candidate gate.

**Current blockers:** repository-wide backend/engine test collection fails on missing `engine.learning` and `engine.logging`. The latest roleplay-audio invariant workflow passes, but the latest roleplay-scenario workflow did not execute its scenario verifier because its dependency-install step failed; therefore Roleplay remains unchecked. Do not weaken/delete tests to obtain green status; reconcile canonical test/runtime source according to `ANTI-REGRESSION-001`.

**Definition of done:** `PROTECTED_INVARIANT_GATES=PASS` and `IOS_REJECTION_REGRESSION_GATES=PASS`.

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
- [ ] iPad screenshots corrected if required by the listing/review configuration.
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

**Definition of done:** Apple reviewer can reproduce the repaired flows without developer-only instructions.

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
REVENUECAT_OFFERING_CONTRACT
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
