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
REVENUECAT_IOS_APP_IDENTITY=PASS
PAID_APPS_AGREEMENT=PASS
BANKING_CONFIGURATION=PASS
TAX_CONFIGURATION=PASS
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
  **Definition of done:** mismatch is recorded and not treated as resolved.  
  **Evidence:** root `ios/floentlyfinnish.xcodeproj/project.pbxproj` contains `PRODUCT_BUNDLE_IDENTIFIER = com.vitusidi.floentlyfinnish`, while the actual Expo/EAS client uses `com.vitusidi.floently`. Build-34 logs prove EAS generated a fresh `apps/client/ios` directory, so the root project was not the native project used for rejected build 34. The stale root identifier still requires normalization or an explicit release-path guard in Phase 4.

- [x] **Active client tree is confirmed not to contain `apps/client/ios`.**  
  **Definition of done:** GitHub inspection proves there is no checked-in native iOS directory under the actual Expo client package on the canonical line.  
  **Evidence:** `apps/client` has EAS/app config but no checked-in `apps/client/ios`; build 34 logs show EAS prebuild creating `./ios` inside `apps/client` at build time.

- [x] **Actual bundle identifier used by rejected build 34 is proven from EAS build metadata.**  
  **Definition of done:** App Store Connect build metadata, EAS build metadata, archived `.ipa`, or equivalent artifact inspection proves build 34 iOS application identity.  
  **Evidence:** build 34 EAS metadata resolves `ios.bundleIdentifier = com.vitusidi.floently`; EAS assigns provisioning profile `*[expo] com.vitusidi.floently AppStore ...` to target `KieliValmis`; fastlane export maps `provisioningProfiles.com.vitusidi.floently`; archive and IPA export succeed from that target.

## 0.4 Resolve build-number source and build method

- [x] **Repository explains why build 34 is not expected as a literal checked-in build number.**  
  **Definition of done:** EAS version-source behavior is inspected.  
  **Evidence:** `apps/client/eas.json` sets `cli.appVersionSource = "remote"`; production sets `autoIncrement = true`. Checked-in `buildNumber: "11"` is therefore not authoritative for the submitted build number.

- [x] **Build 34 build method is proven (EAS vs local Xcode vs other CI).**  
  **Definition of done:** build metadata identifies the actual executor/profile for build 34.  
  **Evidence:** EAS build ID `b192f8f3-74ec-42c6-9dda-f3e569f13a3c`, profile `production`, environment `production`, iOS build number `34`, Xcode `26.2 (17C52)`, with EAS prebuild followed by fastlane archive/export.

- [ ] **Exact mutable Git branch/ref name used for build 34 is proven.**  
  **Definition of done:** historical build metadata explicitly records the source branch/ref name.  
  **Current state:** the supplied EAS build record preserves the immutable Git SHA but does not expose a historical branch/ref name. This is retained as an informational unknown and is no longer a provenance blocker because the immutable SHA, EAS build ID, build number, executor/profile, and bundle identity are all proven.

### Phase-0 provenance amendment

A mutable branch name is weaker release evidence than an immutable Git SHA and can change or disappear after a build. The live ledger therefore treats exact `EAS_BUILD_GIT_COMMIT_HASH` + EAS build ID + iOS build number + production profile + bundle identity as the authoritative rejected-build provenance. The historical branch/ref remains recorded as unknown rather than inferred.

## 0.5 Resolve release environment evidence

- [x] **Production EAS profile contains a configured iOS RevenueCat public SDK key.**  
  **Definition of done:** source proves production build profile injects a non-empty iOS RevenueCat SDK key variable.  
  **Evidence:** `apps/client/eas.json` defines `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`; build 34 logs confirm it was injected into the production build. Key value is intentionally not repeated in this ledger.

- [x] **Production API base URL is identified.**  
  **Definition of done:** production EAS environment identifies API endpoint.  
  **Evidence:** `https://learn-api.floently.com`.

- [x] **RevenueCat project/app represented by the production iOS SDK key is proven.**  
  **Definition of done:** RevenueCat dashboard evidence maps the configured public SDK key to the intended iOS app/project.  
  **Evidence:** RevenueCat project `Floently` → app `Floently iOS` shows bundle ID `com.vitusidi.floently`; its Public API Key matches the iOS public SDK key injected into rejected build 34. Full key intentionally omitted from this ledger.

- [x] **App Store Connect bundle identifier for Apple app ID `6767821805` is proven from Apple.**  
  **Definition of done:** App Store Connect metadata confirms the actual app-record bundle ID.  
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

**Status:** PARTIAL. Apple commercial agreements and cross-system app identity are now proven. Subscription groups, Apple subscription metadata/statuses, and the exact RevenueCat package→product→entitlement matrix remain open.

- [x] **Paid Apps Agreement active.**  
  **Definition of done:** App Store Connect Business shows Paid Apps Agreement status Active.  
  **Evidence:** Komplyint Oy Paid Apps Agreement is Active for Aug 19, 2026 – Jan 19, 2027.

- [x] **Banking accepted.**  
  **Definition of done:** the active legal entity has an active bank account in App Store Connect.  
  **Evidence:** Komplyint Oy bank account row shows status Active.

- [x] **Tax information accepted.**  
  **Definition of done:** required tax forms shown for the active legal entity are accepted/active.  
  **Evidence:** displayed U.S. tax forms both show status Active.

- [x] **Apple app ID `6767821805` bundle identifier confirmed.**  
  **Definition of done:** Apple App Information identifies the app record and bundle ID.  
  **Evidence:** Apple ID `6767821805`; bundle ID `com.vitusidi.floently`.

- [ ] **All visible subscription Product IDs confirmed in App Store Connect.**  
  **Current state:** the supplied App Store Connect screenshot shows the separate **In-App Purchases** page with no non-subscription IAP items. Auto-renewable subscriptions are managed under the separate **Subscriptions** sidebar entry, which has not yet been captured. Do not infer subscription absence from the empty In-App Purchases page.

- [ ] **Subscription groups confirmed.**  
  **Current state:** App Store Connect → Subscriptions group/detail evidence still required.

- [ ] **Product prices/localizations/statuses confirmed in App Store Connect.**  
  **Current state:** RevenueCat currently reports the nine core KieliValmis Apple products as `In Review` and four Read/Creator Apple products as `Missing Metadata`, but Apple-side subscription detail pages are still required before this checkbox can pass.

- [x] **RevenueCat project confirmed.**  
  **Definition of done:** dashboard evidence identifies the project used by the iOS app.  
  **Evidence:** RevenueCat project selector shows `Floently`; app settings show `Floently iOS`.

- [x] **RevenueCat iOS app bundle identifier confirmed.**  
  **Definition of done:** RevenueCat iOS app settings identify the same Apple bundle ID.  
  **Evidence:** `Floently iOS` → App Bundle ID `com.vitusidi.floently`, matching build 34 and App Store Connect.

- [ ] **RevenueCat product mappings confirmed.**  
  **Current state:** RevenueCat Products shows the Apple products and statuses, but the supplied list view does not prove every package→product mapping or every Apple Product ID against the App Store Connect Subscriptions page.

- [ ] **RevenueCat entitlements confirmed end to end.**  
  **Current state:** entitlement identifiers are visible (`yki_access`, `professional_access`, `combined_access`, `read_access`, `creator_access`) with product counts, but individual entitlement product membership has not yet been expanded and reconciled.

- [ ] **KieliValmis paywall offering/placement contract confirmed in RevenueCat.**  
  **Current state:** RevenueCat Offerings shows `default` as the current offering with `9 packages` and `read_default` with `4 packages`. Exact package identifiers and attached product IDs still require the offering detail view.

- [ ] **Every visible KieliValmis package maps to the intended Apple Product ID.**  
  **Current state:** source expects nine core packages; the RevenueCat current offering has nine packages, but package-detail/product mapping evidence is still required before this can pass.

### Dashboard evidence received 2026-08-19

- RevenueCat project: `Floently`.
- RevenueCat iOS app: `Floently iOS`.
- Cross-system bundle identity: `com.vitusidi.floently` in build 34, App Store Connect, and RevenueCat.
- RevenueCat current offering: `default`, 9 packages.
- RevenueCat additional offering: `read_default`, 4 packages.
- RevenueCat entitlements visible: `yki_access`, `professional_access`, `combined_access`, `read_access`, `creator_access`.
- RevenueCat iOS product list currently shows the nine core KieliValmis products in `In Review`; four Read/Creator iOS products show `Missing Metadata`.
- App Store Connect commercial prerequisites shown: Paid Apps Agreement Active, bank account Active, displayed tax forms Active.

**Next required external evidence:** App Store Connect → **Subscriptions** (not In-App Purchases), showing every subscription group and each subscription's Product ID, status, price/localizations, availability, and review inclusion; then RevenueCat → `default` offering detail showing each of the nine package identifiers and attached Apple product.

**Definition of done for Phase 1:** complete plan → offering/placement → package → RevenueCat product → Apple Product ID → entitlement matrix with every visible iOS plan PASS.

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

**Status:** IN PROGRESS. All repository-side RevenueCat customer-identity, store-product preflight, fail-closed paywall, user-safe error, and localized-price presentation gates are verified. Apple-authoritative identity is now proven; source normalization/release drift guard and exact dashboard package mapping remain open.

- [ ] **iOS bundle identity normalized to Apple-authoritative value.**  
  **Definition of done:** build 34/App Store Connect/RevenueCat authoritative identity is proven first, then source/build configuration is normalized and verified.  
  **Current state:** authoritative identity is now proven as `com.vitusidi.floently` across rejected build 34, App Store Connect, RevenueCat, and active Expo client config. The stale root native Xcode project still carries `com.vitusidi.floentlyfinnish`; normalization/guard work is now unblocked and is the next source step.

- [ ] **Release verifier prevents source/build bundle-ID drift.**  
  **Definition of done:** release-time verification fails if the actual iOS build identity diverges from the Apple-authoritative identity.  
  **Current state:** now unblocked; verifier must be added and pass CI before this can be checked.

- [ ] **KieliValmis RevenueCat current-offering/placement contract is explicit and tested end to end.**  
  **Definition of done:** source contract plus RevenueCat dashboard offering/placement and every visible package/product mapping are reconciled and tested.  
  **Current state:** repository-side current-offering snapshot/preflight is verified and RevenueCat confirms `default` is current with 9 packages, but package detail mappings and App Store Connect subscription details remain pending.

- [x] **Store billing preflight service and purchase-time package recheck are implemented and passing.**  
  **Definition of done:** all nine core plan/package mappings are explicit; preflight resolves the RevenueCat offering and requires package + underlying store Product ID + localized price; selected plan is rechecked immediately before purchase; TypeScript and invariant gate pass.  
  **Evidence:** `preflightStoreBillingPlans()` and reusable package snapshot matching; current PR CI run `32158791952` client TypeScript and **Verify store billing preflight invariants** = SUCCESS at exact head `e44453aec7b0c5d5f35a81681e4eef38f251372a`.

- [x] **Offering/package preflight is consumed by the paywall before enabling purchase CTAs.**  
  **Definition of done:** BillingRoute loads all currently visible store plans before enabling mobile purchase controls, and a plan whose App Store product/price was not fetched is not exposed as a normal enabled Buy action.  
  **Evidence:** BillingRoute commit `cce20f49febaa3e4a4dbb0d879f1ce8988c3d81e` adds `storeCatalog`, `storeCatalogLoading`, `visibleStorePlanIds`, and `preflightStoreBillingPlans(...)` consumption; verifier commit `e44453aec7b0c5d5f35a81681e4eef38f251372a`; CI run `32158791952` TypeScript + store-billing preflight invariant = SUCCESS.

- [x] **Missing store products disable/replace the purchase CTA safely.**  
  **Definition of done:** unavailable or still-loading mobile plans cannot invoke the normal purchase action; trial purchase is also gated; stable unavailable presentation is shown.  
  **Evidence:** BillingRoute uses `checkoutDisabled = isBusy || (isMobileStoreBilling && (storeCatalogLoading || !storePlanReady))`, `disabled={checkoutDisabled}`, explicit checkout availability guard, and `trialStoreUnavailable`; current exact-head verifier and TypeScript checks pass in CI run `32158791952`.

- [x] **Raw RevenueCat SDK errors are not normal user-facing purchase/restore copy.**  
  **Definition of done:** RevenueCat purchase/restore/preflight failures are converted to stable application errors before reaching BillingRoute alerts; technical cause is retained in diagnostics; TypeScript/invariant gate passes.  
  **Evidence:** `StoreBillingUnavailableError`, `StorePurchaseCancelledError`, technical diagnostic logging and safe wrappers in `storeBillingService.ts`; current CI run `32158791952` keeps TypeScript and store-billing invariant green.

- [x] **iOS/mobile prices come from localized RevenueCat/StoreKit product data in the visible paywall.**  
  **Definition of done:** mobile BillingRoute displays matched store `priceString` and uses the static checkout estimate only for the non-store branch; direct static estimate rendering in the mobile pricing card is prohibited by a permanent invariant.  
  **Evidence:** BillingRoute `displayedPrice` selects `storeAvailability?.priceString` for mobile and `estimate.totalLabel` only for non-store; verifier commit `e44453aec7b0c5d5f35a81681e4eef38f251372a` explicitly rejects direct static estimate rendering; CI run `32158791952` TypeScript + preflight invariant = SUCCESS.

- [x] **RevenueCat anonymous → authenticated and account-switching identity behavior is corrected/tested.**  
  **Definition of done:** an anonymous-configured SDK logs in when a concrete application user appears; a different authenticated app user is re-identified; application logout attempts RevenueCat logout without trapping the local app session; TypeScript and permanent identity invariant pass.  
  **Evidence:** identity changes in `revenueCatService.ts` and `authStore.ts`; `verify-revenuecat-identity.mjs`; current CI run `32158791952` **Verify RevenueCat identity invariants** = SUCCESS.

**Verified Phase-4 repository-side sub-gates:**

```text
REVENUECAT_IDENTITY_SOURCE_GATE=PASS
STORE_BILLING_PREFLIGHT_SERVICE_GATE=PASS
STORE_BILLING_SAFE_ERROR_GATE=PASS
PAYWALL_PREFLIGHT_PRESENTATION=PASS
IOS_LOCALIZED_STORE_PRICE_SOURCE_GATE=PASS
IOS_AUTHORITATIVE_BUNDLE_IDENTITY=PASS
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE=PENDING_SOURCE_NORMALIZATION
REVENUECAT_OFFERING_CONTRACT=PENDING_DASHBOARD_RECONCILIATION
```

**Phase 4 overall remains IN PROGRESS** because source bundle-ID normalization/release verification and the exact RevenueCat/App Store Connect subscription catalog matrix remain unfinished.

---

# Phase 5 — Protected regression gates

**Status:** BLOCKED / PENDING.

- [ ] Authentication/session regression suite passes.
- [x] **Navigation/deep-link/back source invariant suite passes on the current remediation head.**  
  **Evidence:** PR CI run `32158791952`, **Verify navigation invariants** = SUCCESS at exact head `e44453aec7b0c5d5f35a81681e4eef38f251372a`.
- [ ] Subscription/access regression suite passes.
- [ ] Cards regression suite passes.
- [ ] Roleplay regression suite passes.
- [ ] Microphone/STT regression suite passes.
- [ ] Everyday Finnish regression suite passes.
- [ ] New iOS rejection regression tests pass as part of the immutable candidate gate.

**Current blockers:** repository-wide backend/engine test collection fails because canonical tests import missing modules `engine.learning` and `engine.logging`. The failure is visible in PR CI run `32158791952`; the isolated account-deletion backend gate still passes before that global collection failure. Do not weaken/delete tests to obtain green status; reconcile canonical test/runtime source according to `ANTI-REGRESSION-001`.

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
