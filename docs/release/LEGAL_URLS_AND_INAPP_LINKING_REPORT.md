# Legal URLs and In-App Linking Report

Date: 2026-04-24

## Implemented
- Added release-ready legal/support draft pages:
  - `docs/release/legal/PRIVACY_POLICY.md`
  - `docs/release/legal/TERMS_OF_USE.md`
  - `docs/release/legal/SUPPORT.md`
  - `docs/release/legal/ACCOUNT_DELETION.md`
- Added app-configurable legal URL constants:
  - `EXPO_PUBLIC_PRIVACY_POLICY_URL`
  - `EXPO_PUBLIC_TERMS_URL`
  - `EXPO_PUBLIC_SUPPORT_URL`
  - `EXPO_PUBLIC_ACCOUNT_DELETION_URL`
- Wired Settings links:
  - Privacy Policy
  - Terms of Use
  - Support and contact
  - Account deletion page

## Files
- `apps/client/config/legalUrls.ts`
- `apps/client/state/SettingsRoute.tsx`
- `docs/release/legal/*.md`

## URL Publication Targets
- Privacy: `https://learn.floently.com/legal/privacy-policy`
- Terms: `https://learn.floently.com/legal/terms-of-use`
- Support: `https://learn.floently.com/support`
- Deletion: `https://learn.floently.com/legal/account-deletion`

## Owner Fill Items
- Legal entity name/address/contact.
- Privacy and support contact emails.
- Processor inventory details.
