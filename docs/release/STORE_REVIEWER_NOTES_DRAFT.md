# KieliValmis App Review Notes

Date: 2026-08-13
Purpose: replacement submission after previous App Review rejection.

## Product identity

The Finnish-learning product is now named KieliValmis.

KieliValmis is developed by Komplyint Oy and is part of the Floently product family.

The iOS bundle identifier remains com.vitusidi.floently for application continuity.

## Authentication

The iOS application provides KieliValmis email/password authentication.

Google Sign-In is not offered in the iOS user interface.

Reviewers can use the dedicated App Review account supplied securely in the App Review Information fields in App Store Connect.

Do not store the reviewer password in this repository.

The reviewer account must have access to all functionality required for review, including subscribed learning pathways.

## Account deletion

In-app deletion path:

Settings -> Delete Account

The app asks for confirmation before permanent deletion.

Public deletion information:
https://www.kielivalmis.com/delete-account

## Microphone and speech recognition

Microphone access is used for Finnish speaking practice, roleplay responses and YKI answers.

Speech recognition is used to transcribe the learner's spoken Finnish so the learner can review and improve the answer.

The application does not declare background audio playback or background audio recording for this release.

## Photo library

Photo-library access is requested only when the learner explicitly chooses a profile picture from the device library.

The application does not request camera permission for this profile-picture workflow.

## Subscriptions

Digital subscription purchases in the iOS application use the Apple in-app purchase flow.

Before App Review submission:

- all subscription products used by the submitted application must be complete in App Store Connect
- required subscription localizations must be complete
- pricing and availability must be configured
- App Review information must be complete
- App Review screenshots for the subscriptions must be provided where required
- subscriptions required for this release must be added to the App Review submission

## Previous rejection remediation

The replacement submission addresses the previous review findings as follows:

1. Accurate Metadata / other-platform references
   - other-platform store references were removed from the iOS-visible account-management copy
   - App Store metadata and screenshots use the KieliValmis identity

2. Login Services
   - Google Sign-In is not offered on iOS
   - email/password KieliValmis authentication remains available

3. Information Needed / reviewer access
   - a dedicated working reviewer account with required access will be supplied in App Store Connect

4. In-App Purchases / subscriptions
   - required Apple subscription products must be added to the review submission before the app version is submitted

5. Privacy purpose strings
   - photo-library, microphone and speech-recognition descriptions now explain the specific user-facing purposes
   - unused camera permission was removed

6. Background audio
   - background audio playback and background recording are disabled
   - the submitted iOS binary must have no audio entry in UIBackgroundModes

## Suggested reviewer test path

1. Sign in using the App Review credentials supplied in App Store Connect.
2. Open the learner home screen.
3. Open YKI practice.
4. Open a speaking or roleplay exercise.
5. Allow microphone access and complete a short speaking interaction.
6. Open professional Finnish content.
7. Open vocabulary or grammar practice.
8. Open Settings and verify legal links and Delete Account visibility.
9. Verify subscription-related functionality using the reviewer account's supplied access.

## Live support/legal pages

Privacy:
https://www.kielivalmis.com/privacy

Terms:
https://www.kielivalmis.com/terms

Support:
https://www.kielivalmis.com/support

Account deletion:
https://www.kielivalmis.com/delete-account
