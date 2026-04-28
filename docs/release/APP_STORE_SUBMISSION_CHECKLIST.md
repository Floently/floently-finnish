# Apple App Store Submission Checklist

Last updated: 2026-04-23

## App Setup

- [ ] App created in App Store Connect for bundle ID `com.vitusidi.floentlyfinnish`
- [ ] App name/subtitle/final category set
- [ ] Privacy Policy URL set (required)
- [ ] App Privacy questionnaire completed and accurate
- [ ] Export compliance answered for encryption usage
- [ ] App Review contact/test account info completed

## Binary and Build

- [ ] Production iOS build generated with EAS (`eas build --platform ios --profile production`)
- [ ] Build has unique build number and version
- [ ] Build uploaded to App Store Connect / TestFlight
- [ ] No startup crash/regression in smoke tests

## Policy/Compliance

- [ ] Account deletion can be initiated in-app (required when account creation exists)
- [ ] Subscription purchase model compliant with App Review Guideline 3.1.1 (IAP for digital features unless specific entitlement path applies)
- [ ] Permission usage descriptions are clear and user-facing (microphone)
- [ ] Privacy/legal/support links are valid and public

## Listing Assets

- [ ] iPhone screenshots (required sizes for current devices)
- [ ] App description, keywords, promotional text
- [ ] “What’s New” release notes
- [ ] Review notes explain microphone/speech workflow and fallback paths

## Current Status (Repo Reality)

- Blocked:
  - in-app account deletion not implemented
  - current subscription checkout flow points to external URL for digital access
  - final privacy/support/legal URLs not finalized
- Prepared:
  - bundle identifier configured
  - EAS production profile exists

Official references:
- App Review Guidelines: https://developer.apple.com/appstore/resources/approval/guidelines.html
- Account deletion guidance: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- App privacy in App Store Connect: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Export compliance overview: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/

