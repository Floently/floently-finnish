# Privacy and Terms Requirements

Last updated: 2026-04-23

## Purpose

Define production-ready legal/compliance content requirements for App Store + Google Play submission and in-app disclosure.

## Required Public Documents

1. Privacy Policy (required by Apple and Google)
2. Terms of Use / Terms & Conditions (strongly recommended for subscriptions/account platform)
3. Support/Contact page (required for store listing quality and user support)
4. Account deletion page (required for Google Play if account creation exists; linked in Play Console)

## Minimum Privacy Policy Content

1. Data categories collected/processed:
   - account identifiers (email, auth identifiers)
   - voice recordings and transcriptions (when user uses speaking features)
   - usage/session analytics (if applicable)
2. Processing purposes:
   - authentication
   - feature delivery (roleplay/speaking/cards)
   - reliability and abuse prevention
3. Third-party processors/subprocessors (OpenAI, Google Cloud, hosting providers, etc. as applicable)
4. Retention and deletion policy:
   - account data
   - audio/transcript data
   - logs
5. User rights:
   - access/correction/deletion
   - support contact path
6. Security practices summary:
   - TLS in transit
   - credential handling
7. Jurisdiction/legal entity info and privacy contact.

## Terms of Use Minimum Content

1. Service description and acceptable use.
2. Subscription/billing terms:
   - renewal terms
   - cancellation
   - refund process references
3. Account lifecycle and termination.
4. Disclaimers and limitation of liability.
5. Governing law and dispute process.

## Account Deletion Requirements

## Apple
- If app supports account creation, app must allow initiating account deletion in-app.

## Google Play
- If app supports account creation, app must provide:
  - in-app deletion path
  - external web deletion path URL in Play Console

## Required In-App Surfaces

1. Settings -> Privacy Policy (link)
2. Settings -> Terms (link)
3. Settings -> Delete Account (entry point)
4. Auth screens footer: Privacy + Terms links

## Repo Gaps (Current)

- No finalized legal docs in public-hosted form.
- No in-app account deletion implementation found.
- No backend account deletion endpoint found.

## Decision Owners Needed

- Legal owner:
  - final retention durations
  - jurisdiction terms language
  - lawful-basis positioning where applicable
- Product owner:
  - deletion UX wording
  - grace period vs immediate deletion policy
- Engineering owner:
  - hard-delete vs soft-delete mechanics
  - background deletion job behavior

## Official References

- Apple app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy
- Apple account deletion guidance: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Google user data/privacy policy: https://support.google.com/googleplay/android-developer/answer/10144311
- Google account deletion requirement: https://support.google.com/googleplay/android-developer/answer/13327111

