# Google Play Submission Checklist

Last updated: 2026-10-04

> Current source authority supersedes the April 2026 checklist. The existing KieliValmis Android upgrade identity is **`com.vitusidi.floently`**. Do not create, build, submit, or migrate this release under the historical `com.vitusidi.floentlyfinnish` package.

## Play Console Setup

- [ ] Existing Play Console app for package `com.vitusidi.floently` selected
- [ ] Store listing contact details set (email required)
- [ ] Data safety form completed and synchronized with current app behavior
- [ ] Privacy policy URL set and publicly reachable
- [ ] App content declarations complete, including account deletion information
- [ ] Content rating questionnaire complete
- [ ] Current production/internal-testing tracks inspected before uploading a replacement build

## Binary and Build

- [ ] Exact release-candidate SHA recorded in issue #77
- [ ] Exact-head client/backend CI green
- [ ] GitHub Android native-source gate green:
  - Expo Android prebuild succeeds
  - generated package is `com.vitusidi.floently`
  - `android:allowBackup="false"`
  - no `SYSTEM_ALERT_WINDOW` permission
  - foreground media-playback service/permissions present
  - patched Expo Audio logical document media session present
  - generated Android app compiles with Gradle
- [ ] Android runtime identity is `1.0.5` for the logical document media-session capability
- [ ] Physical Android qualification completed before production submission
- [ ] Production AAB built only after explicit product-owner build approval
- [ ] Unique version code / remote EAS version confirmed
- [ ] Existing signing-key lineage confirmed; do not create a new incompatible signing identity
- [ ] Upload to internal testing first, then promote deliberately
- [ ] Target API policy verified at submission time

## Floently Read Android Qualification

- [ ] Browser Reader renders websites locally in Android WebView
- [ ] Pressing **Read** narrates the unchanged webpage in place
- [ ] Login/password flows remain usable and Reader yields to visible authentication
- [ ] Whole-document duration is shown by Android system media UI rather than the current hidden TTS clip duration
- [ ] Android system Play/Pause works while backgrounded
- [ ] Android system ±10 second commands seek the logical document timeline across hidden segment boundaries
- [ ] Android system scrub/absolute seek resumes at the requested document position
- [ ] Speed changes keep system-media duration/elapsed time coherent
- [ ] Pause/background/system-interruption progress persists accurately
- [ ] Stop/navigation/auth teardown removes stale media notification/session state
- [ ] Reopening/starting another reading does not duplicate system media listeners or controls
- [ ] Long reading remains continuous across hidden segment transitions
- [ ] Browser Reader long-session stability and renderer recovery validated

## Billing and Policy

- [ ] Digital subscriptions/features sold in Android use Google Play Billing through the current RevenueCat/Play integration
- [ ] Restore-purchases path works
- [ ] Current product IDs/entitlements match RevenueCat and Play Console configuration
- [ ] In-app account deletion remains reachable
- [ ] Public account-deletion URL remains reachable
- [ ] Microphone usage and data handling match the Data safety declaration
- [ ] Privacy policy and Terms remain reachable from the app
- [ ] Background playback declaration matches Floently Read's user-started narration behavior
- [ ] Background microphone recording remains disabled

## Listing Assets

- [ ] Short description
- [ ] Full description
- [ ] Feature graphic
- [ ] Phone screenshots
- [ ] App icon
- [ ] Release notes
- [ ] Screenshots reflect the current KieliValmis/Floently Read UI and Android system chrome only

## Current React Native Release State

Prepared in source:
- package ID is `com.vitusidi.floently`;
- production EAS profile exists;
- account-deletion and store-billing release invariants are covered by CI;
- Android local WebView Browser Reader is implemented;
- Android logical whole-document media-session patch is implemented in source;
- GitHub-only Android prebuild/compile validation is configured and does **not** consume an EAS mobile build.

Still required:
- exact latest SHA CI must complete successfully;
- physical Android qualification of the new logical media-session behavior;
- Play Console state/signing/version verification immediately before the eventual approved build;
- explicit product-owner approval before consuming a scarce EAS mobile build.

## Build Freeze

The product owner has constrained monthly mobile builds. **Do not run `eas build --platform android` merely to debug known source defects.** Source CI and GitHub-hosted Android Gradle compilation are allowed. A new EAS Android build should be a deliberate physical/release qualification candidate after source gates are green and explicit approval is given.
