# Apple App Store Submission Checklist

Last updated: 2026-10-03
Current rejection: App Review 2026-10-02, submission `cc16af90-8fce-4651-ae20-08c85d204a8d`, version `1.0 (47)`.

This is a release gate, not a historical checklist. Do not submit while any item marked **BLOCKING** remains unchecked.

## App identity and App Review information

- [x] Authoritative iOS bundle identifier in source is `com.vitusidi.floently`.
- [x] Customer-facing app name is KieliValmis.
- [ ] **BLOCKING** App Review contact information is current in App Store Connect.
- [ ] **BLOCKING** Dedicated reviewer account/credentials are current and tested.
- [ ] Privacy Policy, Terms, Support, and account-deletion URLs are live and match the metadata.
- [ ] App Privacy answers and export-compliance answers are current for the replacement binary.

## Guideline 2.3.10 — screenshot/media repair

The rejected screenshot contained Android/non-iOS status-bar and notification imagery inside an iPhone-style frame. Those Android icons must be removed, not reproduced.

- [ ] **BLOCKING** Recreate each affected marketing screenshot using a genuine capture from the iOS app.
- [ ] **BLOCKING** No Android notification icon, Android Wi-Fi/battery glyph, Android time/status presentation, Messenger-like notification icon, or other non-iOS status chrome remains.
- [ ] **BLOCKING** Screenshots accurately show the submitted app in use; the majority highlight main app features.
- [ ] **BLOCKING** In App Store Connect, open **View All Sizes in Media Manager** and inspect every applicable device-size set.
- [ ] **BLOCKING** Inspect every localization, not only the default language.
- [ ] Confirm each uploaded file uses an Apple-accepted screenshot dimension for its target slot.
- [ ] If using the repository's eight-image marketing set, verify all eight embedded screen captures came from iOS before upload.

Accepted examples used by this project:
- iPhone 6.9-inch: `1290 x 2796` portrait is accepted.
- iPhone 6.5-inch: `1284 x 2778` portrait is accepted.

Apple supports additional current dimensions. Follow the current App Store Connect screenshot specification for the exact device slot; do not resize a wrong-platform capture merely to match dimensions.

## Guideline 2.1(b) — subscriptions/IAP package

The current React Native candidate exposes eleven purchasable Apple subscription products: nine KieliValmis plans plus two Floently Read Reader plans:

- [ ] `floently_yki_monthly`
- [ ] `floently_yki_3months`
- [ ] `floently_yki_yearly`
- [ ] `floently_prof_monthly`
- [ ] `floently_prof_3months`
- [ ] `floently_prof_yearly`
- [ ] `floently_combo_monthly`
- [ ] `floently_combo_3months`
- [ ] `floently_combo_yearly`
- [ ] `floently_read_reader_monthly`
- [ ] `floently_read_reader_yearly`

For **each** checked product above, verify all of the following before marking it complete:

- localization/display metadata complete;
- pricing and availability configured;
- App Review screenshot present;
- review notes/information complete;
- product added to the draft App Review submission.

Additional package gates:

- [ ] **BLOCKING** Current App Store Connect state of the KieliValmis Premium subscription group has been reverified.
- [ ] **BLOCKING** If the subscription group is not already approved, the group is in the same draft submission.
- [ ] **BLOCKING** The draft App Review submission visibly contains every subscription exposed by the submitted app.
- [ ] **BLOCKING** No subscription is left only in App Store Connect inventory without being added for review.

Historical evidence records KieliValmis Premium group ID `22077944`, but current App Store Connect state must be checked again rather than inferred from August evidence. Also verify the current subscription group/status for `floently_read_reader_monthly` and `floently_read_reader_yearly`.

## Source/runtime billing verification

The 2026-10-02 Apple rejection itself was a submission-package defect, but the later release audit found and repaired an independent Floently Read billing-authority defect. Both the client and FlowReader server changes must therefore be present before the replacement binary is approved.

Repository-side protections that must stay green:

- [x] iOS bundle ID authority is `com.vitusidi.floently`.
- [x] RevenueCat/StoreKit package aliases exist for the nine KieliValmis plans and the visible Floently Read Reader plans.
- [x] The paywall preflights the named RevenueCat offering, exact product identifier, and localized store price.
- [x] Purchase and Restore Purchases paths exist.
- [x] Raw store failures are converted to user-safe messages.
- [x] React Native Read purchase/restore does not grant SDK-reported entitlement claims directly; only backend-verified Read access can elevate local access.
- [x] FlowReader PR #167 implements server-authoritative RevenueCat verification with provider-scoped grant/revocation and startup revalidation.
- [x] FlowReader exposes a non-secret readiness endpoint at `/api/v1/read/billing-readiness`.
- [ ] **BLOCKING** FlowReader PR #167 is merged/deployed to the production `flowreader-api` service.
- [ ] **BLOCKING** Production secret `REVENUECAT_SECRET_API_KEY` is configured on FlowReader.
- [ ] **BLOCKING** Production `GET https://flowreader-api.onrender.com/api/v1/read/billing-readiness` returns HTTP 200 with:
  - `authorityVersion = revenuecat-server-authoritative-v1`;
  - `serverVerificationConfigured = true`;
  - `readyForStorePurchases = true`.

The iOS release workflow now probes this production endpoint before EAS can be reached, and direct EAS execution additionally requires the typed `READ_BILLING_READY` gate.

## Replacement binary

Apple explicitly requested a new binary.

- [x] Active React Native release lane is PR #75 / `agent/build-48-native-read-release-20260929`.
- [x] iOS build workflow is manual/approval-gated; ordinary source pushes must not consume a mobile build.
- [ ] **BLOCKING** Media Manager repair is ready before consuming the scarce replacement build.
- [ ] **BLOCKING** All eleven currently purchasable subscription review packages are ready to add/are added to the draft submission before consuming the scarce replacement build.
- [ ] **BLOCKING** Exact candidate SHA has green client/backend/native-source CI and zero known release blockers.
- [ ] **BLOCKING** Production Read billing readiness endpoint passes the server-authority checks above.
- [ ] **BLOCKING** In-app account deletion cascades through the deployed FlowReader backend and the public deletion disclosure reflects Floently Read library/media deletion.
- [ ] **BLOCKING** Product owner has explicitly approved the iOS build from the exact candidate.
- [ ] Generate one replacement production iOS binary from the approved exact SHA.
- [ ] Record EAS build ID, Git SHA, iOS build number, bundle ID, and runtime version.
- [ ] Confirm Apple processing completed.
- [ ] Perform physical iPhone smoke/acceptance on the exact candidate.
- [ ] Select the replacement build in App Store Connect.

## Final draft-submission audit

Before clicking **Submit for Review**:

- [ ] App version/build is present in the draft.
- [ ] KieliValmis Premium subscription group is present if required.
- [ ] All eleven subscriptions purchasable in the exact release candidate are present.
- [ ] Every subscription has an App Review screenshot.
- [ ] Corrected screenshots are present in every applicable size/localization.
- [ ] No non-iOS status bar/device chrome is visible.
- [ ] Reviewer credentials work.
- [ ] Reviewer notes match the exact new build and do not claim unfinished work.
- [ ] Draft submission reviewed item-by-item, then submitted.

## Official references

- App Review Guidelines: https://developer.apple.com/appstore/resources/approval/guidelines.html
- Submit an In-App Purchase: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase
- In-App Purchase information: https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information
- Upload app previews and screenshots: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots
- Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications
