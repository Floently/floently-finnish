# Mobile Release Readiness Audit

Last updated: 2026-04-23

## Build System and IDs

- Build system: Expo + EAS (`apps/client/eas.json`)
- Android package: `com.vitusidi.floentlyfinnish`
- iOS bundle ID: `com.vitusidi.floentlyfinnish`
- App version: `1.0.0` (from `apps/client/app.json`)
- Android versionCode in native gradle: `1`
- iOS native project: not committed (`apps/client/ios` missing) -> managed/EAS iOS build path

## Android Readiness

### Verified
- `android/` project exists and compiles in dev workflow.
- Manifest includes `RECORD_AUDIO` and app deep-link scheme `floently://`.
- `allowBackup=false` is set.

### Gaps / Blockers
1. **Release signing not configured** in `android/app/build.gradle` (`release` uses debug keystore).
2. **Payments compliance blocker** (digital subscriptions currently open external checkout URL).
3. **Account deletion blocker** for apps with account creation.
4. **Privacy/disclosure gap**: no final in-app privacy surface + production policy URL not yet wired.
5. `usesCleartextTraffic=true` in `app.json` is not ideal for production release posture.

## iOS Readiness

### Verified
- `app.json` includes bundle identifier.
- `NSMicrophoneUsageDescription` present (required for microphone features).
- EAS production profile exists.

### Gaps / Blockers
1. No committed `ios/` native project; release must rely on EAS managed generation.
2. In-app purchase policy risk same as Android (external digital subscription checkout).
3. Account deletion flow missing.
4. Privacy policy URL/support/legal assets are not yet finalized for store metadata.
5. Purpose strings are generic; production-quality user-facing permission rationale should be finalized.

## API Base URL Strategy

- Runtime client base URL defaults to `https://learn-api.floently.com` via `packages/core/api/apiConfig.ts`.
- Local override exists in `apps/client/.env.local`.
- This is acceptable for release separation if EAS env is explicitly set and verified before production build.

## Signing and Submission Readiness

### Prepared
- `eas.json` has production profile with `autoIncrement`.
- Repo has package/bundle identifiers configured.

### Still Required (Credential-boundary)
- Apple Developer account + App Store Connect app setup.
- Google Play Console app setup + service account for EAS submit.
- Android release signing key strategy finalization (keystore ownership and backup).
- Final store listing metadata and legal URLs.

## Verdict

- Technical build path exists.
- Store submission readiness is **blocked** by policy/compliance items (billing model, account deletion, privacy/legal finalization) and by external credential/setup actions.

