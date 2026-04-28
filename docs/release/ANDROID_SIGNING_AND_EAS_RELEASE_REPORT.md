# Android Signing and EAS Release Report

Date: 2026-04-24

## Implemented
- Updated Android release signing configuration to stop using debug signing for release builds.
- Added required release signing properties:
  - `FLOENTLY_UPLOAD_STORE_FILE`
  - `FLOENTLY_UPLOAD_STORE_PASSWORD`
  - `FLOENTLY_UPLOAD_KEY_ALIAS`
  - `FLOENTLY_UPLOAD_KEY_PASSWORD`
- Added fail-fast guard in `release` build when signing credentials are missing.
- Removed checked-in `android/app/debug.keystore`.
- Updated `app.json`:
  - `android.usesCleartextTraffic` set to `false`.
  - `NSMicrophoneUsageDescription` changed to explicit speech-practice rationale.
- Updated `eas.json` for internal/beta flow:
  - `build.preview` internal distribution + app-bundle.
  - `submit.preview.android.track = internal`.
  - `submit.production.android.track = beta`.

## Files
- `apps/client/android/app/build.gradle`
- `apps/client/android/app/debug.keystore` (deleted)
- `apps/client/app.json`
- `apps/client/eas.json`

## Remaining Credential Boundary
- Upload keystore and secrets in EAS credentials/CI secrets.
- Confirm Play App Signing enrollment and upload key registration.
- Perform first manual Play Console upload for API-based submit readiness if needed.
