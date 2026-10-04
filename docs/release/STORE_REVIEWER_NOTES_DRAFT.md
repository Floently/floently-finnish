# KieliValmis App Review Notes

Date: 2026-10-03
Purpose: resubmission after the App Review rejection dated 2026-10-02.
Submission ID: `cc16af90-8fce-4651-ae20-08c85d204a8d`
Rejected version/build: `1.0 (47)`

> Release gate: this draft must not be represented to Apple as completed until the App Store Connect media, subscription, and replacement-binary checks in `IOS_APP_STORE_REJECTION_2026-10-02_REMEDIATION.md` are all complete.

## Product identity

The Finnish-learning product is named KieliValmis.

KieliValmis is developed by Komplyint Oy and is part of the Floently product family.

The authoritative iOS bundle identifier is `com.vitusidi.floently`.

## Authentication

The iOS application provides KieliValmis email/password authentication.

Reviewers can use the dedicated App Review account supplied securely in the App Review Information fields in App Store Connect.

Do not store reviewer credentials in this repository.

The reviewer account must have the access needed to exercise paid learning functionality that Apple needs to review.

## Account deletion

In-app deletion path:

`Settings -> Delete Account`

The app asks for confirmation before permanent deletion.

Public deletion information:
https://www.kielivalmis.com/delete-account

## Microphone, speech recognition, and background narration

Microphone access is used for Finnish speaking practice, roleplay responses, and YKI answers.

Speech recognition is used to transcribe the learner's spoken Finnish so the learner can review and improve the answer.

Floently Read can continue user-started narration while the app is backgrounded and exposes media controls for that narration. This is playback of content the user explicitly started reading. The application does not perform background microphone recording.

## Photo library

Photo-library access is requested only when the learner explicitly chooses a profile picture from the device library.

The application does not request camera permission for this profile-picture workflow.

## Subscriptions

Digital subscriptions visible in the iOS application use Apple's in-app purchase flow through the app's StoreKit/RevenueCat integration.

The current iOS release candidate exposes these purchasable Apple Product IDs:

- `floently_yki_monthly`
- `floently_yki_3months`
- `floently_yki_yearly`
- `floently_prof_monthly`
- `floently_prof_3months`
- `floently_prof_yearly`
- `floently_combo_monthly`
- `floently_combo_3months`
- `floently_combo_yearly`
- `floently_read_reader_monthly`
- `floently_read_reader_yearly`

Before the replacement app version is submitted:

- verify every subscription's localization, pricing, availability, and review information in App Store Connect;
- provide the required App Review screenshot for every subscription;
- add every subscription used by the submitted app to the draft App Review submission;
- if either required subscription group is not already approved, add the required KieliValmis and/or Floently Read group to the same submission;
- add the replacement iOS app version/build to that same draft submission;
- inspect the final draft and verify the app version, every required group, and all eleven subscriptions currently purchasable in the candidate are present before clicking Submit for Review.

## 2026-10-02 rejection remediation

### Guideline 2.3.10 — Accurate Metadata

Apple reported non-iOS status-bar imagery in the App Store screenshots.

The rejected marketing screenshot supplied with the review contains Android-style notification/status icons inside the phone image. Those icons — including the Messenger-like notification icon and the other Android status symbols — are the problem. **They must not be reproduced in the corrected iOS screenshots.**

For the resubmission:

- replace the embedded app capture with a genuine iOS capture from the app;
- preserve the marketing artwork only around the genuine iOS capture;
- do not synthesize or transplant Android notification/status-bar imagery into an iPhone frame;
- inspect every localization and every screenshot size under **View All Sizes in Media Manager**;
- verify that the majority of screenshots show actual KieliValmis/Floently app functionality.

### Guideline 2.1(b) — App Completeness

Apple reported that the app references subscriptions but one or more associated In-App Purchase products were not submitted for review.

For the resubmission:

- all subscriptions used by the submitted app must be included in the App Review submission;
- each subscription must have its App Review screenshot and required metadata;
- a **new iOS binary** must be uploaded and selected, as requested by App Review.

## Suggested reviewer test path

1. Sign in using the App Review credentials supplied in App Store Connect.
2. Open the learner home screen.
3. Open YKI practice.
4. Open a speaking or roleplay exercise.
5. Allow microphone access and complete a short speaking interaction.
6. Open professional Finnish content.
7. Open vocabulary or grammar practice.
8. Open Settings and verify legal links and Delete Account visibility.
9. Open the subscription surface and verify the Apple-native purchase flow / localized store pricing.
10. Use Restore Purchases if the reviewer wishes to test restoration.
11. Open Floently Read and open the Read access screen; verify Reader Monthly/Yearly use Apple-native localized store pricing and unavailable products cannot be purchased.
12. Start Floently Read narration and verify the user-controlled reading/player experience.

## Reply to App Review — send only after all gates are complete

```text
Hello App Review,

Thank you for the review.

We have addressed both issues reported for submission cc16af90-8fce-4651-ae20-08c85d204a8d.

Guideline 2.3.10:
We replaced the affected App Store screenshots with genuine iOS app captures and removed the non-iOS/Android status-bar and notification imagery. We also reviewed the screenshot sets in Media Manager across the applicable device sizes and localizations.

Guideline 2.1(b):
We completed the App Review information for the subscriptions used by the app, including the required review screenshots, and added the associated subscriptions to the same App Review submission as the replacement app version. A new iOS binary, build <NEW_BUILD_NUMBER>, has been uploaded and selected for review.

The iOS app uses Apple's in-app purchase flow for these digital subscriptions and provides Restore Purchases.

Thank you.
```

Do not replace `<NEW_BUILD_NUMBER>` or send the reply until App Store Connect proves the statement is true.

## Live support/legal pages

Privacy:
https://www.kielivalmis.com/privacy

Terms:
https://www.kielivalmis.com/terms

Support:
https://www.kielivalmis.com/support

Account deletion:
https://www.kielivalmis.com/delete-account
