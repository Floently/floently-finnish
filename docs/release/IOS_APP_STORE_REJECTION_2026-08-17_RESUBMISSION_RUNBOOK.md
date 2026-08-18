# KieliValmis iOS App Store Rejection — 2026-08-17 Resubmission Runbook

**Document type:** release-blocking remediation and resubmission runbook  
**Product:** KieliValmis / Floently Finnish iOS application  
**Repository:** `Floently/floently-finnish`  
**Rejection covered by this document:** the Apple App Review rejection received on **2026-08-17** (the rejection from yesterday relative to this document being created on 2026-08-18)  
**Purpose:** document, in one place, what was found in GitHub, why those findings plausibly explain the rejection, what must be verified outside GitHub, what must be fixed in source, how the fixes must be validated, and how the application should be resubmitted for Apple verification.  
**Reference status:** **IMPORTANT RELEASE REFERENCE — READ BEFORE MAKING ANY IOS RESUBMISSION CHANGE**  
**Production safety policy:** `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md` (`ANTI-REGRESSION-001`) is mandatory and takes precedence over convenience.  

---

## 1. Why this document exists

Apple rejected the iOS application during the 2026-08-17 review. The review feedback covered three distinct areas:

1. **In-App Purchase / subscription purchase availability:** Apple could not successfully obtain the subscription products during review and encountered RevenueCat/store configuration failure behavior.
2. **Account deletion:** Apple reported that the app supports account creation but that a user could not find or initiate account deletion from the app.
3. **App Store screenshots:** Apple reported that submitted screenshots contained non-iOS visual chrome/status-bar imagery and must be replaced with screenshots that accurately represent the iOS app.

The critical lesson from the source audit is that this must **not** be treated as a single App Store Connect metadata problem. At least one of the rejection items has a strong source-code explanation, and the billing rejection has source-side release/configuration risks that must be reconciled with App Store Connect and RevenueCat before another build is submitted.

This document therefore separates:

- **confirmed source findings**;
- **likely source-to-reviewer failure chains**;
- **external configuration checks that GitHub cannot prove**;
- **required source remediations**;
- **required testing and release evidence**;
- **required App Store Connect cleanup and reviewer evidence**.

Do not skip directly to “upload another build.” The purpose of this runbook is to prevent a fourth review attempt from reproducing the same defects.

---

## 2. Hard governance and branch rules

### 2.1 Production is forward-only

The repository contains a mandatory production policy:

`docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`

Policy ID:

`ANTI-REGRESSION-001`

The governing rule is that every production/release candidate must descend from the currently approved production lineage. An old branch, stale workspace, old release clone, or parallel feature branch must not replace current production source.

Before a release candidate can be promoted, the release executor must prove:

```bash
git merge-base --is-ancestor DEPLOYED_PRODUCTION_SHA CANDIDATE_SHA
```

The result must succeed.

If the exact deployed production source SHA cannot be proven, promotion stops until provenance is established.

### 2.2 Do not use repository `main` as the release authority merely because it is the default branch

At the time of this audit, repository `main` was stale relative to the production/integration work and still pointed to an older May 2026 history. The relevant production lineage has been maintained under the canonical production integration line rather than by treating `main` as automatically authoritative.

Do not build the resubmission by checking out stale `main` and applying fixes there.

### 2.3 Do not merge the pending Wave-1 user-acceptance candidate merely to fix the App Store rejection

The current Wave-1 user-acceptance candidate is represented by PR #33 with exact source:

```text
e3685e61cd207fa12c16cd9ffa4a85ecb7f95278
```

That PR explicitly declares:

- non-production status;
- user acceptance pending;
- no server deployment;
- no production ref promotion;
- no App Store/Play release action;
- no production artifact promotion.

The iOS rejection repair should therefore remain a **narrow release/compliance repair**, based on the verified production lineage, unless a later explicit integration decision authorizes Wave-1 promotion.

The Wave-1 candidate must not be used as a shortcut to solve this rejection.

### 2.4 No production deployment is authorized by this document

This runbook is documentation of required work. It is not, by itself, deployment permission.

Before a release is uploaded or promoted, preserve the production rules:

```text
PRODUCTION_ANCESTRY_GATE=PASS
PROTECTED_INVARIANT_GATES=PASS
CANDIDATE_ARTIFACT_IDENTITY=PASS
POST_DEPLOY_CANARY=PASS
```

For the iOS resubmission, additionally require the store-specific gates defined later in this document.

---

## 3. Source snapshot and files inspected during the rejection investigation

The investigation focused on the production-line implementation and then checked that the newest Wave-1 user-acceptance source retained the same relevant billing/account-deletion behavior.

Important files inspected include:

### iOS/native identity

- `app.json`
- `apps/client/ios/floentlyfinnish.xcodeproj/project.pbxproj`

### RevenueCat / mobile store billing

- `apps/client/features/billing/services/revenueCatService.ts`
- `apps/client/features/billing/services/storeBillingService.ts`
- `apps/client/state/BillingRoute.tsx`
- `packages/core/api/entitlements.ts`

### Authentication / account deletion

- `apps/client/state/SettingsRoute.tsx`
- `apps/client/state/AppShell.tsx`
- `packages/core/api/auth.ts`
- `apps/backend/app/routers/v1_auth.py`
- `apps/backend/app/services/account_deletion_service.py`

### Navigation

- `apps/client/config/navigation/AppShell_sidebar_sections.ts`
- `apps/client/state/AppShell.tsx`

### Production/release governance

- `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`
- Wave-1 PR #33 and its declared release boundary

The findings below should be treated as the starting point for the repair agent. The repair agent must re-fetch the exact files at the branch/commit it actually uses before changing code, because source may have moved after this runbook was created.

---

# PART A — ACCOUNT DELETION REJECTION

## 4. What was found

### 4.1 The app already contains an in-app deletion flow

This was an important discovery because Apple’s rejection could initially look like “account deletion has not been implemented.” That is not the whole story.

`apps/client/state/SettingsRoute.tsx` contains an account-deletion control and confirmation flow. It:

1. shows a destructive **Delete Account** action;
2. explains that deletion is permanent;
3. asks for an initial confirmation;
4. asks for a final confirmation;
5. calls `authService.deleteAccount({ deletionReason: 'in_app_settings' })`;
6. logs the user out after a successful response;
7. shows a success or failure alert.

The client API in `packages/core/api/auth.ts` calls:

```text
POST /api/v1/auth/account/delete
```

with explicit deletion confirmation.

The backend router `apps/backend/app/routers/v1_auth.py` defines the authenticated account-deletion endpoint and refuses deletion unless `confirm_delete` is true.

Therefore the problem is not simply “there is no Delete Account code.”

### 4.2 A navigation/access-control rule can prevent a newly created free user from reaching Settings

This is the highest-confidence source explanation for Apple’s account-deletion rejection.

In `apps/client/state/AppShell.tsx`, access is guarded using subscription state. The logic calculates whether the user has unlocked access, using conditions such as internal access, preview access, subscription presence, or active subscription state.

When there is no unlocked access, the guard permits only a narrow set of screens equivalent to:

```ts
return screen === 'landing' || screen === 'auth' || screen === 'billing';
```

That means an authenticated person who has created an account but has **not yet purchased a subscription** can be prevented from entering **Settings**.

The deletion button exists inside Settings.

This creates a direct reviewer failure path:

```text
Create account
      ↓
No paid subscription yet
      ↓
Navigation guard treats account as not unlocked
      ↓
Settings is not reachable
      ↓
Delete Account cannot be found
      ↓
Apple concludes that account deletion is unavailable
```

This is why a response to Apple that merely says “the Delete Account button is in Settings” would be unsafe. A reviewer account can be placed in exactly the state where Settings is blocked.

### 4.3 Account-management screens must not be paywalled

The correct product boundary is:

- paid learning features can require an entitlement;
- subscription plans can require billing access;
- **account management must remain reachable to an authenticated user even without a paid learning entitlement**.

At minimum, a signed-in user must be able to reach the account-management surface needed to:

- view account information;
- access privacy/terms/support links;
- manage or restore purchases where relevant;
- log out;
- **delete the account**.

This must remain true for:

- a brand-new free account;
- an account that has never subscribed;
- an expired subscription;
- a cancelled subscription whose access has ended;
- a payment-failed account;
- a trial user;
- a paid subscriber.

Do not require a subscription simply to delete an account.

---

## 5. Account deletion backend semantics also need hardening

The backend deletion service has a second issue that is not necessarily the direct cause of Apple failing to find the button, but it should be fixed before presenting the workflow as production-ready.

`apps/backend/app/services/account_deletion_service.py` attempts to remove state-store and SQL database records.

The database cleanup function catches broad exceptions and can return a cleanup status equivalent to failure/partial cleanup.

However, the higher-level deletion response can still report:

```json
{
  "account_deleted": true
}
```

while also indicating that database cleanup was only partial.

That creates an undesirable truth mismatch: a client may tell the user “Account deleted” when the service has not proven that all required records were removed.

### Required remediation

The repair should establish explicit, truthful semantics. For example, choose one of these reviewed models:

#### Model A — synchronous completion

Only return `account_deleted: true` if all deletion operations required for the request complete successfully.

If cleanup is incomplete:

- return a controlled error/failure state;
- do not tell the user deletion is complete;
- log a redacted support/incident identifier.

#### Model B — asynchronous deletion job

If deletion is intentionally asynchronous:

- return `deletion_requested: true` or equivalent;
- provide a truthful status such as `pending`;
- revoke the user’s access/session immediately as appropriate;
- complete deletion in a durable job;
- only call it `deleted/completed` after the durable job succeeds.

Do not keep a response shape that says “deleted” while also reporting partial database cleanup.

### Privacy/security note

Any logging for deletion must remain privacy-safe. Do not write full personal data into logs. The existing service uses a hashed subject marker; preserve or strengthen that approach.

---

## 6. Account deletion remediation to-do list

### Source repair checklist

- [ ] Re-fetch `AppShell.tsx` at the actual repair branch head.
- [ ] Add a permanent regression test that reproduces the reviewer state: authenticated user, no subscription, attempts to navigate to Settings.
- [ ] Change the navigation entitlement logic so an authenticated user can access Settings/account management without buying a plan.
- [ ] Confirm that this does **not** accidentally unlock paid learning screens.
- [ ] Confirm Billing remains reachable for users who need to purchase or restore access.
- [ ] Confirm Help/support/legal routes required for account management remain reachable where intended.
- [ ] Add a permanent test proving a free user still cannot open protected paid-learning routes.
- [ ] Add a permanent test proving a free authenticated user **can** open Settings.
- [ ] Add a permanent test proving the Delete Account control is present on the reachable Settings surface.
- [ ] Review `account_deletion_service.py` response semantics.
- [ ] Remove any success claim that can be returned after partial required cleanup.
- [ ] Add backend tests for successful deletion.
- [ ] Add backend tests for database cleanup failure.
- [ ] Add backend tests proving failure/partial cleanup never masquerades as a completed deletion.
- [ ] Confirm auth tokens/sessions are invalidated according to the current authentication design after deletion.
- [ ] Confirm a deleted account cannot simply continue using an existing session.
- [ ] Confirm re-login behavior is appropriate and documented.

### Device acceptance checklist

Use a physical iOS device and TestFlight/release-like build, not only Expo web.

- [ ] Create a brand-new account.
- [ ] Do **not** purchase a subscription.
- [ ] Navigate to Settings.
- [ ] Verify Settings opens without redirecting to billing.
- [ ] Locate Delete Account without hidden developer steps.
- [ ] Tap Delete Account.
- [ ] Verify first confirmation appears.
- [ ] Verify final confirmation appears.
- [ ] Complete deletion.
- [ ] Verify the app logs out/revokes the active session appropriately.
- [ ] Verify the deleted account cannot continue using protected data through stale navigation state.
- [ ] Attempt to sign in again and confirm expected deleted-account behavior.
- [ ] Repeat with a paid/trial account as a second scenario.
- [ ] If an Apple subscription remains separately active, confirm the deletion copy truthfully tells the user how store subscription management is handled.

### Apple reviewer evidence checklist

- [ ] Record a short physical-device video that begins with a signed-in account that has no paid subscription.
- [ ] Show how Settings is reached.
- [ ] Show Delete Account.
- [ ] Show both confirmation steps.
- [ ] Show the post-deletion state.
- [ ] Make sure the video does not use internal/development-only controls.
- [ ] Add precise navigation instructions in App Review Notes.

---

# PART B — REVENUECAT / APPLE IN-APP PURCHASE REJECTION

## 7. What was found in source

### 7.1 The app uses real RevenueCat purchase APIs

The current source includes `react-native-purchases` and implements genuine RevenueCat calls.

`revenueCatService.ts`:

- selects iOS/Android by `Platform.OS`;
- reads platform-specific public RevenueCat API keys from Expo environment variables;
- configures RevenueCat with `Purchases.configure(...)`;
- calls `Purchases.getOfferings()`;
- finds a package;
- calls `Purchases.purchasePackage(...)`;
- supports `Purchases.restorePurchases()`.

Therefore the repair is not “replace a fake payment placeholder with RevenueCat.” RevenueCat is already integrated.

The rejection is more likely connected to release identity/configuration and to how the app resolves offerings/packages/products at runtime.

---

## 8. Critical finding: conflicting iOS bundle identifiers exist in the source tree

This is one of the most important billing/release findings.

### `app.json`

The root Expo configuration currently declares the iOS bundle identifier as:

```text
com.vitusidi.floently
```

### Native Xcode project

The checked-in iOS Xcode project contains:

```text
PRODUCT_BUNDLE_IDENTIFIER = com.vitusidi.floentlyfinnish
```

These are not the same identifier.

This is a release-blocking inconsistency until proven harmless for the exact build pipeline used.

### Why this matters

Apple In-App Purchase products are associated with the Apple application/bundle identity configured in App Store Connect. RevenueCat also has an Apple app configuration associated with a specific bundle/application identity.

If the binary uploaded as build 34 uses one identifier while:

- App Store Connect subscription products belong to another app identity;
- RevenueCat is configured against another bundle/application;
- the Expo build uses a different config from the native Xcode build;

then StoreKit may be unable to return the expected products to RevenueCat.

The repository mismatch does **not by itself prove** which identifier build 34 contained. The exact build pipeline determines which configuration wins.

That is why build 34 provenance must be established before changing product identifiers.

### Mandatory rule

Do not “fix” this by guessing which bundle identifier should win.

First determine the exact identity of the existing App Store Connect KieliValmis app and the identity embedded in build 34.

Then reconcile every source/configuration surface to that authoritative value.

---

## 9. Mandatory build-34 provenance audit

Before changing billing code, create a written release-provenance record for the rejected build.

At minimum determine:

- [ ] App Store Connect app name.
- [ ] App Store Connect Apple ID.
- [ ] App Store Connect bundle identifier.
- [ ] Rejected build number: build 34.
- [ ] Marketing/version number associated with build 34.
- [ ] Exact Git commit used to build build 34.
- [ ] Git branch/ref used to build it.
- [ ] Whether build 34 was produced by EAS, local Xcode archive, another CI pipeline, or another machine.
- [ ] Which `app.json`/Expo config the build consumed.
- [ ] Which native iOS project/config the build consumed.
- [ ] Actual `CFBundleIdentifier` embedded in the uploaded `.app`/`.ipa`.
- [ ] RevenueCat project and iOS app used by the build.
- [ ] RevenueCat iOS public SDK key injected into the build.
- [ ] Backend environment/API base URL injected into the build.
- [ ] Whether the build was Sandbox/TestFlight production environment compatible.

If the exact build source SHA cannot be proven, classify that as a release-provenance blocker. Do not continue as if the build source were known.

---

## 10. RevenueCat offering behavior is fragile

The current RevenueCat service can accept an explicit offering identifier, but the regular KieliValmis subscription purchase path does not pin a dedicated KieliValmis offering.

For normal purchases, the code falls back to:

- `offerings.current`, or
- an offering named `default`.

There is a special explicit path for the separate Read product (`read_default`), but the normal YKI/Professional/Combined purchase flow does not have the same explicit contract.

### Why this matters

A RevenueCat dashboard change can alter which offering is “Current.” That can make a previously working application load a different package set or no appropriate packages at all.

For a production learning app being reviewed by Apple, the desired relationship should be explicit and testable:

```text
KieliValmis iOS app
      ↓
known RevenueCat project
      ↓
known iOS app / bundle identity
      ↓
known KieliValmis offering ID
      ↓
known package IDs
      ↓
known RevenueCat product IDs
      ↓
known Apple Product IDs
      ↓
known entitlements
```

### Required remediation direction

- define a dedicated, explicit KieliValmis offering ID in source/configuration;
- fail closed if that offering cannot be found;
- do not silently purchase from whichever offering happens to be marked Current;
- add automated tests for offering/package resolution.

The final offering name should be chosen only after the external RevenueCat dashboard is audited. Do not invent an offering identifier in code that does not exist in RevenueCat.

---

## 11. Existing plan-to-package mapping must be reconciled with RevenueCat and Apple

`storeBillingService.ts` maps product plans to package identifiers.

Current expected package aliases include:

### YKI

```text
yki_monthly     → yki_monthly
yki_3_months    → yki_3months
yki_yearly      → yki_yearly
```

### Professional

```text
professional_monthly  → prof_monthly
professional_3_months → prof_3months
professional_yearly   → prof_yearly
```

### Combined

```text
combined_monthly  → combo_monthly
combined_3_months → combo_3months
combined_yearly   → combo_yearly
```

There are additional aliases for backwards compatibility.

The external audit must produce a matrix for **every** purchasable KieliValmis plan.

Use this table and fill it with actual dashboard values:

| KieliValmis plan | Source package expected | RevenueCat offering | RevenueCat package | RevenueCat product | Apple Product ID | RC entitlement(s) | Apple status | Localized price fetches | PASS/FAIL |
|---|---|---|---|---|---|---|---|---|---|
| `yki_monthly` | `yki_monthly` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `yki_3_months` | `yki_3months` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `yki_yearly` | `yki_yearly` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `professional_monthly` | `prof_monthly` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `professional_3_months` | `prof_3months` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `professional_yearly` | `prof_yearly` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `combined_monthly` | `combo_monthly` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `combined_3_months` | `combo_3months` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| `combined_yearly` | `combo_yearly` | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

Do not mark the IAP remediation complete until every row used by the iOS paywall is proven.

---

## 12. App Store Connect checks that GitHub cannot prove

The following checks must be performed manually or with authorized Apple tooling. GitHub source cannot prove them.

### Agreements / business status

- [ ] Paid Apps Agreement is active.
- [ ] Banking information is complete and accepted.
- [ ] Tax information is complete and accepted.
- [ ] There are no App Store Connect contract blockers preventing IAP availability.

### App identity

- [ ] KieliValmis App Store Connect app has the intended bundle identifier.
- [ ] The intended bundle identifier exactly matches the uploaded binary.
- [ ] The intended bundle identifier exactly matches the RevenueCat Apple-app configuration.

### Subscription products

For every product used by the app:

- [ ] Product ID is exactly correct, including case and punctuation.
- [ ] Product exists under the correct App Store Connect app.
- [ ] Product is in the correct subscription group.
- [ ] Pricing is configured.
- [ ] Required localization/name/description is configured.
- [ ] Availability/territories are appropriate.
- [ ] Product is not accidentally attached to a different bundle/app.
- [ ] Product status is compatible with review/testing.
- [ ] Any required review information is present.
- [ ] Products that must accompany the app submission are correctly included.

### Test environment

- [ ] Sandbox tester accounts exist and work.
- [ ] TestFlight build can query StoreKit products on a physical iPhone.
- [ ] TestFlight build can query StoreKit products on a physical iPad or the supported iPad target used for review.

Record evidence rather than relying on “it looks configured.”

---

## 13. RevenueCat checks that GitHub cannot prove

In the RevenueCat dashboard, verify:

### Project/app identity

- [ ] Correct RevenueCat project.
- [ ] Correct iOS app record.
- [ ] Bundle identifier equals the actual Apple app/binary bundle identifier.
- [ ] Apple credentials/configuration required by the current RevenueCat setup are valid.

### Public SDK key

- [ ] The iOS public SDK key used by the release build belongs to this RevenueCat project/app.
- [ ] The key is not a placeholder.
- [ ] The release environment actually injects `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` into the iOS build.

### Products

- [ ] Every Apple Product ID expected by the app exists in RevenueCat.
- [ ] RevenueCat products point to the correct Apple store products.

### Entitlements

- [ ] YKI purchase products grant the intended YKI entitlement.
- [ ] Professional products grant the intended Professional entitlement.
- [ ] Combined products grant the intended combined access.
- [ ] Entitlement IDs returned by RevenueCat match what backend/client synchronization expects.

### Offering/package structure

- [ ] A dedicated KieliValmis offering exists or is deliberately defined during remediation.
- [ ] All required packages are attached to it.
- [ ] Each package points to the correct product.
- [ ] No package points to an obsolete product.
- [ ] Current/default offering state is not being relied on accidentally.

### Test query

- [ ] A physical iOS/TestFlight build fetches the offering successfully.
- [ ] All nine expected plan/package combinations (or the final reduced supported set) are visible and resolvable.
- [ ] RevenueCat dashboard customer events show the test device/user correctly.

---

## 14. Store availability is currently discovered too late

`supportsStoreBilling()` essentially determines whether the platform is iOS or Android. It does not prove that the RevenueCat offering and package set required by the paywall are actually available.

The Billing UI can therefore present a purchase button and only discover the configuration problem after the reviewer taps the button.

The current purchase path catches the resulting exception and can expose its message directly in an `Alert`.

That is poor production behavior and was especially harmful during review because the reviewer was shown technical RevenueCat/store configuration details instead of a controlled customer-facing state.

### Required source improvement: billing preflight

Before enabling purchase actions on iOS, the billing surface should perform an explicit preflight:

1. confirm RevenueCat can be configured for iOS;
2. fetch the explicit KieliValmis offering;
3. enumerate its packages;
4. verify that the packages required by the plans visible on screen exist;
5. verify each package exposes a valid StoreProduct/product identifier;
6. obtain localized price text from the actual StoreProduct;
7. enable only plans that are truly purchasable.

### Failure behavior

If store configuration is not ready:

- do not expose raw SDK configuration messages to normal users;
- show a stable customer-facing message such as “Purchases are temporarily unavailable. Please try again later.”;
- log the technical cause with a non-sensitive diagnostic code;
- preserve a retry path;
- do not claim a purchase succeeded if backend entitlement sync failed.

This is not a method for hiding a broken store from Apple. The external configuration must still be fixed. The purpose is to make runtime behavior production-safe and diagnosable.

---

## 15. The iOS paywall currently displays locally computed euro prices

`packages/core/api/entitlements.ts` contains static price tables such as:

### YKI

- monthly: `EUR 19.90`
- 3 months: `EUR 49.90`
- yearly: `EUR 179`

### Professional

- monthly: `EUR 24.90`
- 3 months: `EUR 64.90`
- yearly: `EUR 249`

### Combined

- monthly: `EUR 29.90`
- 3 months: `EUR 79.90`
- yearly: `EUR 299`

`BillingRoute.tsx` renders `estimate.totalLabel` for the displayed price.

### Risk

For App Store purchases, the displayed price should be the actual localized store price whenever possible.

A static `EUR` label can drift from:

- the price Apple currently has configured;
- localized currency/price formatting;
- country/territory pricing;
- changes made in App Store Connect.

That discrepancy can create user-trust and review issues even after StoreKit product fetching is repaired.

### Required remediation

For iOS store billing:

- obtain price/localized price string from RevenueCat `StoreProduct` / underlying StoreKit product;
- display that localized store value;
- treat the local pricing table as non-store estimation/configuration support only where appropriate;
- add tests proving the iOS paywall uses store-provided price display data when a product is available.

Do not change Apple prices merely to make the source table match. Apple/App Store Connect remains authoritative for the IAP price shown by StoreKit.

---

## 16. IAP source remediation to-do list

### Identity and build configuration

- [ ] Establish exact build-34 Git SHA and embedded bundle ID.
- [ ] Determine authoritative App Store Connect bundle identifier.
- [ ] Determine authoritative RevenueCat iOS app bundle identifier.
- [ ] Reconcile `app.json` with the authoritative value.
- [ ] Reconcile Xcode `PRODUCT_BUNDLE_IDENTIFIER` with the authoritative value.
- [ ] Check any EAS config, build profiles, `.xcconfig`, environment overrides, and CI configuration for identifier overrides.
- [ ] Add a permanent build/release verifier that fails if Expo and native iOS bundle identities diverge.

### RevenueCat configuration contract

- [ ] Choose/verify an explicit KieliValmis offering ID in RevenueCat.
- [ ] Add the explicit offering ID to source/configuration.
- [ ] Ensure regular KieliValmis purchases do not silently fall back to arbitrary `offerings.current` state.
- [ ] Keep the separate Read offering behavior isolated unless intentionally unified.
- [ ] Add tests for missing offering.
- [ ] Add tests for missing package.
- [ ] Add tests for product identifier alias resolution.

### Billing preflight

- [ ] Fetch offering before purchase controls are considered ready.
- [ ] Validate the required package set.
- [ ] Surface a controlled unavailable state.
- [ ] Provide retry.
- [ ] Do not show raw RevenueCat exception strings to the end user.
- [ ] Preserve technical diagnostics in logs.

### Store price display

- [ ] Read localized price from the RevenueCat/StoreKit product.
- [ ] Use actual localized price text on the iOS paywall.
- [ ] Do not use static `EUR` estimates as the primary iOS purchase price when the StoreProduct is available.
- [ ] Add unit/integration tests for localized price propagation.

### Purchase lifecycle

- [ ] Test purchase success.
- [ ] Test user cancellation.
- [ ] Test pending/interrupted purchase if supported.
- [ ] Test RevenueCat purchase success followed by backend entitlement-sync failure.
- [ ] Ensure the UI clearly distinguishes “store purchase succeeded” from “backend access sync succeeded.”
- [ ] Test restore purchases.
- [ ] Test restore with no purchases.
- [ ] Test account switching so RevenueCat user identity does not leak access across accounts.
- [ ] Verify the canonical authenticated user ID is used where possible rather than falling back to email for new ownership identity.

---

## 17. Required physical-device IAP acceptance procedure

Do not call the IAP rejection fixed based only on TypeScript, a simulator, Expo web, or a unit test.

### Test environment

Use:

- physical iPhone;
- supported physical iPad if the app is submitted as iPad-compatible, or otherwise the exact device family Apple reviews;
- TestFlight or a release-like build signed against the actual App Store application;
- Apple Sandbox/TestFlight purchase account as appropriate.

### Preflight verification

- [ ] Launch the app from a clean install.
- [ ] Sign in with a new test account.
- [ ] Open Plans/Billing.
- [ ] Confirm there is no RevenueCat configuration exception.
- [ ] Confirm all intended plans show a real localized Apple price.
- [ ] Confirm the prices match App Store Connect/TestFlight product data.

### Purchase verification

For at least one plan in each sold pathway:

- [ ] YKI purchase button opens the native Apple purchase sheet.
- [ ] Professional purchase button opens the native Apple purchase sheet.
- [ ] Combined purchase button opens the native Apple purchase sheet.
- [ ] Successful purchase returns to the app.
- [ ] RevenueCat customer info reports expected entitlement(s).
- [ ] Backend sync reports the expected subscription/access state.
- [ ] The protected feature is accessible only after entitlement is active.

### Restore verification

- [ ] Reinstall or use another session.
- [ ] Sign in as the same app account.
- [ ] Tap Restore Purchases.
- [ ] RevenueCat restore succeeds.
- [ ] Backend entitlement sync succeeds.
- [ ] Access is restored.

### Negative tests

- [ ] Cancel the Apple purchase sheet.
- [ ] Confirm cancellation is not presented as an application error.
- [ ] Use an account with no prior purchases and tap Restore.
- [ ] Temporarily test a deliberately missing package in a test harness and confirm the UI shows a controlled unavailable state rather than a raw SDK message.

Record the build number and device/OS used for every acceptance test.

---

# PART C — APP STORE SCREENSHOT REJECTION

## 18. What Apple objected to

The screenshot rejection is different from the runtime defects.

Apple indicated that the screenshots contain non-iOS visual chrome/status-bar imagery. The screenshots must accurately represent the app on the Apple device family for which they are submitted.

This does not require changing the KieliValmis product UI merely because some icons or colors look cross-platform. The problem is the **submitted media showing non-iOS device/status-bar presentation**.

---

## 19. Screenshot remediation checklist

### Capture source

- [ ] Use the corrected iOS build, preferably the exact resubmission candidate or TestFlight build.
- [ ] Capture on actual iOS device/simulator dimensions that correspond to App Store Connect requirements.
- [ ] Ensure status bar/device chrome is genuine iOS presentation if included.
- [ ] Do not paste Android status bar imagery into an iPhone/iPad frame.

### Accuracy

- [ ] Screenshots must show functionality that exists in the submitted build.
- [ ] Do not advertise screens that are not reachable for the reviewer account.
- [ ] Do not use mock pricing that differs from the real App Store purchase surface.
- [ ] If subscription screens are shown, ensure displayed price/status is current and accurate.

### App Store Connect cleanup

- [ ] Open every screenshot slot for every device family.
- [ ] Use **View All Sizes in Media Manager**.
- [ ] Remove old Android/non-iOS screenshots from every hidden/legacy slot.
- [ ] Replace them with corrected iOS captures.
- [ ] Check iPhone screenshot sets.
- [ ] Check iPad screenshot sets if the app supports iPad.
- [ ] Check localized screenshot sets, if any.
- [ ] Preview the final listing before submission.

Do not assume replacing the first visible screenshot set removes old media from all device-size groups.

---

# PART D — END-TO-END REPAIR AND RESUBMISSION PLAN

## 20. Phase 0 — Freeze the diagnosis and prove release provenance

**Goal:** know exactly what Apple reviewed before altering source.

- [ ] Record the 2026-08-17 Apple rejection text/screenshots in the project’s release evidence.
- [ ] Record rejected build number 34 and version.
- [ ] Identify exact source SHA of build 34.
- [ ] Identify exact branch of build 34.
- [ ] Identify exact iOS bundle identifier embedded in build 34.
- [ ] Identify exact RevenueCat project/app/key used by build 34.
- [ ] Identify exact App Store Connect app and subscription products used by build 34.
- [ ] If any of these are unknown, classify them as unresolved release blockers.

**Gate:**

```text
BUILD34_PROVENANCE=PASS
```

Do not proceed to final release if this is unresolved.

---

## 21. Phase 1 — External Apple + RevenueCat reconciliation

**Goal:** prove the store catalog is coherent before source changes assume anything.

- [ ] Verify agreements/tax/banking status.
- [ ] Verify App Store app bundle ID.
- [ ] Verify all subscription product IDs/statuses/groups/prices/localizations.
- [ ] Verify RevenueCat iOS app bundle ID.
- [ ] Verify RevenueCat iOS public SDK key.
- [ ] Verify RevenueCat products.
- [ ] Verify RevenueCat entitlements.
- [ ] Verify offering/package structure.
- [ ] Complete the plan-to-package-to-product matrix from Section 11.

**Gate:**

```text
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PASS
```

---

## 22. Phase 2 — Create a narrow repair branch from the current production lineage

**Goal:** fix only the rejection/release defects without pulling unrelated Wave-1 product work into the release.

Before creating the branch:

```bash
git fetch origin --prune
```

Resolve the current approved production source SHA.

Create a narrowly named branch, for example:

```text
release/ios-app-review-remediation-20260818
```

The exact branch name can differ, but it must begin from the verified production lineage, not stale `main` and not the non-production Wave-1 UAT branch.

Record:

```text
REPAIR_BASE_SHA=<exact SHA>
```

**Gate:**

```text
REPAIR_BRANCH_FORWARD_BASE=PASS
```

---

## 23. Phase 3 — Implement account-deletion accessibility and truth fixes

Implement the Section 6 checklist.

Minimum expected source scope will likely include:

- `apps/client/state/AppShell.tsx`
- account/navigation regression tests
- `apps/backend/app/services/account_deletion_service.py`
- backend account deletion tests

Avoid broad navigation rewrites.

**Required outcome:**

```text
FREE_AUTHENTICATED_USER_CAN_OPEN_SETTINGS=PASS
FREE_USER_PAID_FEATURE_GUARDS_STILL_ENFORCED=PASS
ACCOUNT_DELETION_REACHABLE=PASS
ACCOUNT_DELETION_COMPLETION_TRUTH=PASS
```

---

## 24. Phase 4 — Implement iOS identity and RevenueCat hardening

Likely source/configuration scope includes:

- `app.json`
- native iOS project/config if the authoritative bundle identity requires correction
- `revenueCatService.ts`
- `storeBillingService.ts`
- `BillingRoute.tsx`
- billing tests/verifiers
- release identity verifier

Do not change the app’s bundle identifier casually. The authoritative Apple identity established in Phase 1 determines the correct value.

**Required outcome:**

```text
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE=PASS
REVENUECAT_EXPLICIT_OFFERING=PASS
REVENUECAT_PACKAGE_PREFLIGHT=PASS
IOS_LOCALIZED_STORE_PRICE=PASS
RAW_SDK_ERROR_NOT_USER_VISIBLE=PASS
```

---

## 25. Phase 5 — Run protected regression and release tests

The App Store remediation is not allowed to regress existing KieliValmis functionality.

Run all existing protected suites relevant to:

- authentication/session;
- navigation/back/deep links;
- subscription/access;
- Cards;
- Roleplay;
- microphone/STT;
- YKI protected flows;
- Everyday Finnish;
- KieliValmis branding;
- iOS release/native configuration;
- account deletion;
- billing/store mapping.

Add permanent regressions for every confirmed rejection defect.

Do not delete or weaken old tests simply to make the new candidate green.

**Gate:**

```text
PROTECTED_INVARIANT_GATES=PASS
IOS_REJECTION_REGRESSION_GATES=PASS
```

---

## 26. Phase 6 — Build one immutable iOS candidate from the exact tested SHA

Do not test one SHA and upload a different one.

Record:

```text
CANDIDATE_SHA=<exact commit>
IOS_BUILD_NUMBER=35-or-next-unused-build
IOS_VERSION=<version>
BUNDLE_IDENTIFIER=<authoritative bundle ID>
REVENUECAT_PROJECT=<project>
REVENUECAT_IOS_APP=<app>
REVENUECAT_OFFERING=<explicit offering>
ARTIFACT_ID=<ipa/archive/build identifier>
```

Verify the built artifact actually contains the expected bundle identifier and release configuration.

The repository production policy requires bidirectional source/artifact identity. Preserve that principle for the iOS candidate as well.

**Gate:**

```text
CANDIDATE_ARTIFACT_IDENTITY=PASS
```

---

## 27. Phase 7 — Physical-device user acceptance of the exact candidate

Use the exact artifact intended for submission.

### Account deletion

- [ ] New account/no purchase can open Settings.
- [ ] Delete Account is visible.
- [ ] Both confirmations work.
- [ ] Deletion completion is truthful.

### Billing

- [ ] Paywall opens.
- [ ] Offering loads.
- [ ] Localized Apple prices display.
- [ ] Apple purchase sheet opens.
- [ ] Purchase succeeds.
- [ ] Entitlements synchronize.
- [ ] Restore Purchases succeeds.
- [ ] Cancellation behaves normally.

### Regression smoke

- [ ] Login/logout.
- [ ] Navigation/back/menu.
- [ ] YKI entry.
- [ ] Professional entry if entitled.
- [ ] Roleplay microphone/STT.
- [ ] Cards.
- [ ] Basic subscription gate behavior.

Record exact device model and iOS version.

**Gate:**

```text
IOS_PHYSICAL_DEVICE_ACCEPTANCE=PASS
```

---

## 28. Phase 8 — Recreate App Store screenshots from the corrected candidate

- [ ] Capture new iPhone screenshots.
- [ ] Capture iPad screenshots if required/supported.
- [ ] Remove every non-iOS screenshot from every size group.
- [ ] Verify no Android status bar/device chrome remains.
- [ ] Verify screenshots match the candidate UI.

**Gate:**

```text
APP_STORE_SCREENSHOT_IOS_ONLY=PASS
```

---

## 29. Phase 9 — Prepare Apple reviewer notes and proof video

The reviewer should not need to guess how to exercise the repaired flows.

### Suggested reviewer-note content structure

Do not paste this blindly; update it with the final screen names/build number.

```text
This submission addresses the issues reported in the review received on August 17, 2026.

Account deletion:
1. Sign in or create an account.
2. Open Settings.
3. Under Account, choose Delete Account.
4. Confirm deletion twice.
Account deletion is reachable even when the account has no active subscription.

In-App Purchases:
The iOS subscription catalog has been reconciled with App Store Connect and RevenueCat. Subscription prices are loaded from the Apple store products and purchases open the native Apple purchase sheet.

Screenshots:
All submitted screenshots have been replaced with iOS captures; non-iOS status-bar imagery was removed.
```

### Video

Record a physical-device video showing:

1. fresh/free account;
2. Settings access;
3. Delete Account location and confirmation;
4. if useful, a separate clip showing Billing loading products and the Apple purchase sheet.

Do not expose passwords, personal information, API keys, internal admin tools, or private test credentials in the video.

---

## 30. Phase 10 — Submit the corrected build

Before pressing Submit for Review, require every gate below:

```text
BUILD34_PROVENANCE=PASS
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PASS
REPAIR_BRANCH_FORWARD_BASE=PASS
FREE_AUTHENTICATED_USER_CAN_OPEN_SETTINGS=PASS
ACCOUNT_DELETION_REACHABLE=PASS
ACCOUNT_DELETION_COMPLETION_TRUTH=PASS
IOS_BUNDLE_IDENTITY_SINGLE_SOURCE=PASS
REVENUECAT_EXPLICIT_OFFERING=PASS
REVENUECAT_PACKAGE_PREFLIGHT=PASS
IOS_LOCALIZED_STORE_PRICE=PASS
PROTECTED_INVARIANT_GATES=PASS
IOS_REJECTION_REGRESSION_GATES=PASS
CANDIDATE_ARTIFACT_IDENTITY=PASS
IOS_PHYSICAL_DEVICE_ACCEPTANCE=PASS
APP_STORE_SCREENSHOT_IOS_ONLY=PASS
```

If any gate is FAIL or UNKNOWN, do not resubmit yet.

---

# PART E — FINDING-TO-FIX TRACEABILITY

## 31. Root-cause / remediation matrix

| Rejection area | GitHub finding | Why it can cause Apple’s observed result | Required source action | Required external action | Release priority |
|---|---|---|---|---|---|
| Account deletion | Delete Account exists in Settings, but free authenticated users can be restricted to landing/auth/billing | Reviewer creates account, has no subscription, cannot reach Settings, therefore cannot find deletion | Allow account-management Settings for authenticated free users; retain paid-feature guards; add regression | None required to make Settings reachable, but reviewer instructions/video required | **Blocker** |
| Account deletion truth | DB cleanup can fail/partial while response still says `account_deleted: true` | App can overstate deletion completion | Make completion/failure semantics truthful; test partial failure | Confirm privacy/legal retention process matches product copy | **Blocker before claiming robust deletion** |
| IAP identity | `app.json` and Xcode project contain different bundle IDs | Uploaded binary, RevenueCat app, and App Store products may not refer to the same Apple app | Reconcile source/config to one authoritative ID; add verifier | Confirm App Store Connect + RevenueCat identities and build 34 embedded ID | **Blocker** |
| IAP offering | Normal KieliValmis purchases can use `offerings.current/default` | Dashboard “Current” change can break package discovery | Use explicit reviewed KieliValmis offering | Create/verify explicit offering in RevenueCat | **Blocker** |
| IAP package availability | UI does not prove offering/package readiness before purchase action | Reviewer taps Buy and receives runtime configuration failure | Add billing preflight and controlled unavailable state | Make every product/package real and available | **Blocker** |
| IAP errors | Raw purchase error can be surfaced in app alert | Reviewer sees SDK/configuration failure text | User-safe error copy + technical logging | Still fix underlying store config | **High** |
| IAP prices | iOS paywall uses static EUR estimates | Display can differ from StoreKit localized price | Display RevenueCat/StoreKit localized price | Confirm Apple price configuration | **High** |
| Screenshots | Submitted media contained non-iOS status-bar/device imagery | Violates screenshot representation expectations | No product-runtime fix required | Replace all screenshot sets, including hidden size groups | **Blocker** |

---

# PART F — IMPORTANT NON-GOALS / DO-NOT-DO LIST

## 32. Do not create new regressions while chasing App Review

The repair agent must **not**:

- reset production to stale `main`;
- deploy PR #33 merely because it contains newer features;
- merge all Wave-1 source into the App Store remediation without explicit authorization;
- change Apple Product IDs by guesswork;
- change bundle identifiers by guesswork;
- hardcode a new RevenueCat offering that has not been created/verified in the dashboard;
- suppress RevenueCat errors without fixing the catalog;
- remove subscription access controls from paid learning features merely to make Settings accessible;
- claim deletion completed when cleanup is partial;
- weaken authentication/session protections;
- delete regression tests to make CI green;
- upload a build produced from a different SHA than the one physically tested;
- reuse Android screenshots in the Apple listing;
- record reviewer videos using developer-only mock auth unless Apple is explicitly given and expected to use that environment.

---

# PART G — NEW AGENT STARTUP INSTRUCTIONS

## 33. How a new agent should begin this task

A new engineering agent assigned to fix the 2026-08-17 iOS rejection must start by reading this document and the production policy before writing code.

Required startup sequence:

```bash
git fetch origin --prune
```

Then identify the exact immutable commit containing this runbook (the coordinating conversation/issue should provide it) and read this exact file from that commit:

```bash
git show <RUNBOOK_COMMIT_SHA>:docs/release/IOS_APP_STORE_REJECTION_2026-08-17_RESUBMISSION_RUNBOOK.md
```

Then read:

```text
docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md
```

Then verify current production lineage and build-34 provenance before implementation.

### Mandatory initial report from the new agent

Before changing runtime source, report:

```text
RUNBOOK_READ=PASS
RUNBOOK_COMMIT_SHA=<sha supplied by coordinator>
CURRENT_PRODUCTION_REF=<ref>
CURRENT_PRODUCTION_SHA=<sha>
BUILD34_SOURCE_SHA=<sha or UNKNOWN>
BUILD34_BUNDLE_ID=<id or UNKNOWN>
APP_STORE_CONNECT_BUNDLE_ID=<id or UNKNOWN>
REVENUECAT_IOS_BUNDLE_ID=<id or UNKNOWN>
REVENUECAT_OFFERING_ID=<id or UNKNOWN>
REPAIR_BASE_ANCESTRY=PASS|BLOCKED
```

If build-34 source or the authoritative Apple/RevenueCat identity remains unknown, the agent should investigate rather than invent values.

---

# PART H — FINAL DEFINITION OF DONE

## 34. The rejection is not considered remediated merely because a new build compiles

The work is complete only when all of the following are true:

### Account deletion

- a brand-new authenticated user with zero paid entitlements can reach Settings;
- Delete Account is visible and usable;
- deletion confirmation works;
- deletion result is truthful;
- paid learning screens remain protected;
- permanent regression coverage exists;
- physical-device evidence exists.

### In-App Purchase

- one authoritative iOS bundle identity is used across App Store Connect, binary/source build configuration, and RevenueCat;
- every visible plan maps to a verified RevenueCat package and real Apple Product ID;
- the app uses an explicit reviewed KieliValmis offering;
- store availability is preflighted;
- actual localized Apple price is shown;
- raw SDK errors are not normal user-facing copy;
- purchase, cancellation, backend sync and restore are tested on a physical Apple device;
- the exact tested binary is the binary submitted.

### Screenshots

- every App Store screenshot is an iOS screenshot;
- no Android/non-iOS status-bar imagery remains in any size group;
- screenshots accurately represent the submitted build.

### Release integrity

- build 34 provenance is documented;
- repair candidate descends from the approved production lineage;
- protected regressions are green;
- candidate SHA and artifact identity are recorded;
- reviewer notes point clearly to the repaired flows;
- the resubmission explicitly states that it addresses the rejection received on 2026-08-17.

---

## 35. Summary for the engineer who will perform the fix

The most important source finding is **not** that account deletion is missing. It exists. The important defect is that the app’s subscription navigation guard can make Settings unreachable for the exact kind of fresh/free account an Apple reviewer is likely to create.

The most important billing finding is that RevenueCat is already implemented, but the release identity and product-discovery contract are not sufficiently deterministic: the repository contains two different iOS bundle identifiers, the normal subscription flow can depend on the RevenueCat Current/default offering, the paywall discovers missing products too late, and the UI displays static EUR prices rather than making the real Apple StoreProduct price authoritative.

The screenshot rejection is primarily App Store metadata/media cleanup, but it must be completed across **all** device-size groups.

Do not solve these by uploading another build immediately. First prove the rejected build’s provenance, reconcile Apple + RevenueCat identity/catalog data, implement narrow source fixes on the current production lineage, add permanent regressions, test the exact candidate on physical iOS hardware, replace every non-iOS screenshot, record reviewer evidence, and only then resubmit.

**This runbook is the authoritative engineering checklist for the KieliValmis iOS resubmission addressing the Apple rejection received on 2026-08-17.**
