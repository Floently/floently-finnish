# Store Policy Compliance Report

Last updated: 2026-04-23

## Method

Policy conclusions in this report were checked against official sources only (Apple Developer, Google Play/Android Developer, Expo docs).

## Applicability Matrix

### 1) Privacy policy requirement
- Applies: **Yes** (both Apple + Google)
- Current repo status: **Not fully satisfied**
  - no finalized hosted policy URL in release docs/config
  - no confirmed in-app privacy link surface

### 2) Account deletion requirement
- Applies: **Yes** (app supports account creation)
- Current repo status: **Not satisfied**
  - no in-app deletion initiation path found
  - no backend deletion endpoint found

### 3) Data safety / App privacy declarations
- Applies: **Yes**
- Current repo status: **Not yet completed**
  - declarations must be completed in App Store Connect and Play Console based on final production behavior

### 4) Microphone disclosure
- Applies: **Yes**
- Current repo status: **Partially satisfied**
  - iOS microphone usage string exists
  - final human-readable rationale and policy disclosures should be tightened

### 5) Payments / subscriptions policy
- Applies: **Yes**
- Current repo status: **High risk / likely non-compliant**
  - app opens external checkout URL for digital subscription access
  - Apple and Google generally require native in-app billing mechanisms for digital goods/services in-app

### 6) Support/contact requirements
- Applies: **Yes**
- Current repo status: **Not yet finalized**
  - store listing support contact not captured in repo release package

### 7) Age rating/content declaration
- Applies: **Yes**
- Current repo status: **Pending console action**
  - Play content rating questionnaire must be completed
  - App Store age rating questions must be completed

### 8) Encryption/export compliance (Apple)
- Applies: **Yes** (must answer per submission)
- Current repo status: **Pending App Store Connect step**

## Findings by Severity

## High
1. No account deletion flow despite account creation.
2. External checkout flow for digital subscriptions is a major rejection risk (Apple/Google payments rules).
3. Privacy policy and legal URLs not finalized in release materials.

## Medium
1. In-app privacy/legal/help surface not finalized.
2. Permission disclosure copy quality and consistency still generic.

## Low
1. Reviewer notes and test credentials package not fully drafted for first submission.

## Required Fixes Before Submission

1. Implement and expose account deletion:
   - in-app entry point (Settings/Account)
   - backend endpoint and deletion job
   - user-facing confirmation and retention explanation
2. Rework mobile subscription purchase flow for store compliance:
   - iOS: StoreKit/IAP-compliant path
   - Android: Google Play Billing path
3. Publish final legal pages:
   - privacy policy
   - terms
   - support/contact
4. Add in-app legal links (at minimum in Settings + auth surfaces).
5. Complete App Store Connect and Play Console declarations.

## Official Sources Used

- Apple App Review Guidelines: https://developer.apple.com/appstore/resources/approval/guidelines.html
- Apple account deletion guidance: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Apple app privacy requirements: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Apple export compliance: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/
- Apple NSMicrophoneUsageDescription: https://developer.apple.com/documentation/bundleresources/information-property-list/nsmicrophoneusagedescription

- Google Play User Data policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google Play account deletion requirement: https://support.google.com/googleplay/android-developer/answer/13327111
- Google Play payments policy: https://support.google.com/googleplay/android-developer/answer/9858738
- Google Play data safety form: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play content ratings: https://support.google.com/googleplay/android-developer/answer/9898843
- Google Play target API policy: https://support.google.com/googleplay/android-developer/answer/11926878

