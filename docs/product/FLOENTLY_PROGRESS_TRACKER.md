# Floently Progress Tracker

## M20-E Read/Create web-parity native patch - 20260624T214230Z
- Branch expected: preview/enable-all-languages.
- Purpose: make mobile Read/Create follow the web product flow without using a WebView or website wrapper.
- Read flow: Floently Home -> Read landing -> Read auth -> login with returnTo -> native Read app.
- Create flow: Floently Home -> Create auth -> login with returnTo -> native Create Studio coming-soon screen.
- Changed areas: product gateway, Read landing, Read auth, protected Read app routes, native Read app UI, Create auth, Create coming soon, auth returnTo.
- Build status: not built by this patch. Inspect and verify before building.


## M20-R Temporary iOS Test Build Checkpoint — 2026-06-25 01:27:36 UTC

- Branch: `preview/enable-all-languages`
- Commit: `342f539e0 Add native Read Create back navigation`
- Build type: temporary iOS preview/ad hoc test build
- Apple team used: `Vitus Idi (Individual)` — temporary only
- Bundle ID: `com.vitusidi.floently`
- EAS build URL: `https://expo.dev/accounts/vitus-idi/projects/client/builds/134fd12f-044c-4029-ad73-b4aac1a09db4`
- Android build status: not started; Android remains postponed until iOS test passes
- Company Apple account status: pending review; final iOS build must be rebuilt later under company credentials
- Pre-build checks passed:
  - TypeScript passed
  - Expo Doctor passed 19/19
  - iOS Expo module autolinking passed
  - RevenueCat iOS autolinking passed
  - Read/Create native back navigation added and committed
- Next task: install on provisioned iPhone and manually test landing pages, auth pages, Read app, imports, reader/player behavior, Create auth, and Create coming-soon flow.
