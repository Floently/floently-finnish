# Store Reviewer Notes Draft

Date: 2026-04-24

## Apple App Review Notes (Draft)
- The app includes account creation and in-app account deletion.
- Deletion path: **Settings -> Delete Account**.
- Deletion removes account and associated personal data from active stores, subject to legal retention obligations.
- Deletion timeline: typically within 24 hours.
- Microphone access is used only for spoken Finnish practice, roleplay recording, and transcript feedback.
- Mobile digital purchases use store billing flows (Apple IAP / Google Play Billing pathing). Web-only checkout remains web-scoped.

## Google Play Review Notes (Draft)
- In-app account deletion path is implemented at **Settings -> Delete Account**.
- Public deletion information URL: `https://learn.floently.com/legal/account-deletion`.
- Privacy policy URL: `https://learn.floently.com/legal/privacy-policy`.
- Support URL: `https://learn.floently.com/support`.
- Mobile app does not expose external digital checkout from native purchase flow.

## Reviewer Test Guidance
- Use a test account with standard learner role.
- Verify Settings legal links and deletion action visibility.
- Verify billing screen on mobile does not open web checkout.
