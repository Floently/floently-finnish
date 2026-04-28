# Google Play Submission Checklist

Last updated: 2026-04-23

## Play Console Setup

- [ ] App created in Play Console for package `com.vitusidi.floentlyfinnish`
- [ ] Store listing contact details set (email required)
- [ ] Data safety form completed and kept in sync with app behavior
- [ ] Privacy policy URL set in Play Console and accessible publicly
- [ ] App content declarations complete (including account deletion URL if required)
- [ ] Content rating questionnaire completed

## Binary and Build

- [ ] AAB built using EAS (`eas build --platform android --profile production`)
- [ ] Unique version code
- [ ] Signing key strategy finalized and backed up
- [ ] Uploaded to internal testing first, then closed/open, then production
- [ ] Target API level policy verified as compliant at submission time

## Policy/Compliance

- [ ] In-app account deletion path exists if account creation exists
- [ ] External web deletion URL submitted in Play Console if required
- [ ] Payments policy compliant:
  - digital subscriptions/features sold in app use Google Play Billing unless specific policy exception applies
- [ ] Microphone permission and data handling accurately disclosed
- [ ] In-app privacy policy link/text is present

## Listing Assets

- [ ] Short description
- [ ] Full description
- [ ] Feature graphic
- [ ] Phone screenshots (and tablet if applicable)
- [ ] App icon
- [ ] Release notes

## Current Status (Repo Reality)

- Blocked:
  - account deletion flow not implemented in app
  - digital subscription flow currently uses external checkout URL
  - final legal/support URLs pending
- Prepared:
  - package ID configured
  - production EAS profile exists

Official references:
- User data policy (privacy policy + in-app privacy disclosure): https://support.google.com/googleplay/android-developer/answer/10144311
- Account deletion requirement: https://support.google.com/googleplay/android-developer/answer/13327111
- Payments policy: https://support.google.com/googleplay/android-developer/answer/9858738
- Data safety form: https://support.google.com/googleplay/android-developer/answer/10787469
- Content rating: https://support.google.com/googleplay/android-developer/answer/9898843
- Target API level: https://support.google.com/googleplay/android-developer/answer/11926878

