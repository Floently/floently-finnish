# M20 Native Read Rebuild Status

Current decision:
- iOS build 19 must not be submitted or used as final testing build.
- Learn is still preserved.
- Create must remain coming soon.
- Read must be rebuilt as a real native app module, not a temporary shell.

Last app commit before rebuild:
- f67c84e71 Open real Read app from public Read entry

Problem:
- Read route opens, but the mobile Read UI is not the real Read product.
- It does not match read.floently.com theme.
- It exposes technical/API wording.
- Import/upload and several buttons are incomplete.
- The app must be rebuilt properly for iOS and Android.

Next implementation target:
- Native Read app shell matching Floently Read theme.
- Real Reader, Library, Import, Preferences, Analytics, Account/Pricing screens.
- Real paste text and URL import.
- Real native file import path, with backend support if required.
- Real TTS/player flow using the Read backend as infrastructure.
- Mobile RevenueCat subscription screen for Read.
- No placeholder behavior except Create.

## M20-B completed
- Repaired native Read API contract so backend `project/projects` responses map correctly.
- Added real native Read URL import through `/api/v1/documents/from-url`.
- Added delete support in the Read store/API client.
- Removed user-facing technical API wording from native Read screens.
- This is not final yet: native file upload and full Read visual rebuild still continue before any new iOS/Android release build.
