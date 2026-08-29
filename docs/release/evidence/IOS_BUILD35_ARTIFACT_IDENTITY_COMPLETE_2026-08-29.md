# KieliValmis Build 35 — Completed Artifact Identity Evidence

Date: 2026-08-29

This evidence supersedes the earlier provisional artifact note for the identity gate.

## Exact EAS metadata

- EAS build ID: `ca17b79a-b6cc-45a6-bb21-1681730849c0`
- Status: `FINISHED`
- Platform: `IOS`
- Distribution: `STORE`
- Build profile: `production`
- Update channel: `production`
- App identifier: `com.vitusidi.floently`
- App version/build: `1.0.0 (35)`
- EAS `gitCommitHash`: `13212827d31a82331e3440f55ca31eab9d538288`
- EAS project ID: `fa02c141-0a3b-4dbc-9122-7c1cf31ba42c`

The EAS Git SHA exactly equals the source SHA that passed the complete local release qualification.

## Independent IPA inspection

The exact EAS IPA was downloaded and inspected locally.

- IPA SHA-256: `aa7bd93e22eecb7ff2535c6a22409f2739ab10a184f4d781f2b26b4538defb10`
- App bundle: `Payload/KieliValmis.app`
- `CFBundleDisplayName=KieliValmis`
- `CFBundleName=KieliValmis`
- `CFBundleIdentifier=com.vitusidi.floently`
- `CFBundleShortVersionString=1.0.0`
- `CFBundleVersion=35`

The tested source and the built artifact are therefore the same immutable candidate. The built bundle identity also matches the RevenueCat/App Store identity already proven by source/dashboard evidence.

## Gate

```text
IOS_BUILD_NUMBER=35
TESTED_SHA_EQUALS_BUILT_SHA=PASS
IPA_BUNDLE_IDENTITY=PASS
EAS_IPA_ARTIFACT_RECORDED=PASS
REVENUECAT_CANDIDATE_CONTRACT_RECORDED=PASS
CANDIDATE_ARTIFACT_IDENTITY=PASS
```

Build 35 has also been uploaded successfully to App Store Connect for TestFlight. This did not submit the app for App Review.

Physical-device StoreKit/RevenueCat/account-deletion acceptance, genuine iOS screenshots, reviewer video/notes, and remaining Apple/RevenueCat catalog-detail gates remain pending.