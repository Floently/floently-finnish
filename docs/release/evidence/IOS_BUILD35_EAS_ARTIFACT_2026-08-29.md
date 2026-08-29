# KieliValmis iOS Build 35 — EAS Artifact Evidence

Date: 2026-08-29

## Frozen source used to start the build

- Git SHA: `13212827d31a82331e3440f55ca31eab9d538288`
- Release branch: `release/ios-wave1-combined-20260829`
- Build profile: `production`
- Platform: iOS

The build command was executed from a detached checkout at the exact fully-qualified SHA above. Package 04F source/config preflight had already passed on that same SHA.

## EAS / Apple build facts observed

- EAS account: `vitus-idi`
- EAS project: `@vitus-idi/client`
- Bundle identifier used by EAS/Apple credentials: `com.vitusidi.floently`
- Apple team: Komplyint Oy
- Remote iOS build number increment: `34 -> 35`
- Final build status observed from the EAS CLI: `Build finished`
- EAS build ID: `ca17b79a-b6cc-45a6-bb21-1681730849c0`
- IPA artifact URL: `https://expo.dev/artifacts/eas/-aePjc10SEV8ytncwi9W8z5cM9MrggKp3mplA6lfq1M.ipa`

The build command did not submit the artifact to App Store Connect.

## What this evidence proves now

- The next resubmission build number is `35`.
- An EAS production iOS artifact exists for this build invocation.
- The EAS build session used the authoritative bundle identifier `com.vitusidi.floently` and valid App Store distribution credentials.
- The EAS build identifier and IPA URL are durably recorded.

## Still required before `CANDIDATE_ARTIFACT_IDENTITY=PASS`

The following remain deliberately unclaimed until separately verified:

- EAS build metadata reports `gitCommitHash = 13212827d31a82331e3440f55ca31eab9d538288`.
- The downloaded IPA itself is inspected to prove its embedded bundle identifier is `com.vitusidi.floently`.
- Candidate RevenueCat project/app/offering identity is reconciled against the exact built artifact/runtime.
- Physical-device StoreKit/RevenueCat and account-deletion acceptance passes.

No production deployment, OTA update, App Store submission, database migration, or server restart is authorized by this evidence.