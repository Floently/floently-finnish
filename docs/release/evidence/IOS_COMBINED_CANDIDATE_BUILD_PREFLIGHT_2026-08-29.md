# KieliValmis exact-candidate iOS build preflight — 2026-08-29

## Scope

This evidence records Package 04F resolved Expo/EAS production preflight for the fully qualified combined release candidate.

- Repository: `Floently/floently-finnish`
- Release branch: `release/ios-wave1-combined-20260829`
- Exact candidate SHA: `13212827d31a82331e3440f55ca31eab9d538288`
- Local and remote release-branch SHA matched before preflight.
- Qualification toolchain: Node `v22.23.2`, pnpm `10.34.0`.
- No EAS build was started by this preflight.

## Verified resolved Expo configuration

```text
SOURCE_IDENTITY=PASS
CANDIDATE_SHA=13212827d31a82331e3440f55ca31eab9d538288
EXPO_RESOLVED_CONFIG=PASS
APP_NAME=KieliValmis
IOS_BUNDLE_IDENTITY=com.vitusidi.floently
IOS_SUPPORTS_TABLET=false
EAS_PROJECT_ID=fa02c141-0a3b-4dbc-9122-7c1cf31ba42c
EXPO_UPDATES_CONFIG=PASS
```

## Verified EAS production profile contract

```text
EAS_APP_VERSION_SOURCE_REMOTE=PASS
EAS_PRODUCTION_AUTOINCREMENT=PASS
EAS_PRODUCTION_CHANNEL=production
ASC_APP_ID=6767821805
EAS_PRODUCTION_PROFILE=PASS
IOS_BUILD_PREFLIGHT=PASS
FINAL_PREFLIGHT_SHA=13212827d31a82331e3440f55ca31eab9d538288
```

## Completion state

- [x] Exact source identity matched the frozen candidate.
- [x] Resolved Expo app name is `KieliValmis`.
- [x] Resolved iOS bundle ID is `com.vitusidi.floently`.
- [x] Resolved iOS configuration is iPhone-only (`supportsTablet=false`).
- [x] EAS project identity is `fa02c141-0a3b-4dbc-9122-7c1cf31ba42c`.
- [x] Production channel is `production`.
- [x] Build version source is remote.
- [x] Production iOS build auto-increment is enabled.
- [x] App Store Connect app ID is `6767821805`.
- [x] Package 04F iOS build preflight passes on the exact candidate.
- [ ] Next unused iOS build number recorded — pending actual EAS build allocation.
- [ ] Candidate bundle ID artifact-verified — pending actual EAS artifact.
- [ ] EAS/IPA artifact identifier recorded — pending actual EAS artifact.
- [ ] Tested SHA exactly equals built SHA — pending artifact provenance reconciliation.

**Gate:** `IOS_BUILD_PREFLIGHT=PASS`.

This does not authorize App Store submission, production deployment, OTA publication, server restart, database migration, or production promotion. Artifact identity and physical-device acceptance remain required.