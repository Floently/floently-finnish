# KieliValmis Build 35 — App Store Connect Upload Evidence

Date: 2026-08-29

## Artifact identity carried into upload

- App: KieliValmis
- Version: `1.0.0`
- Build: `35`
- Bundle ID: `com.vitusidi.floently`
- EAS build ID: `ca17b79a-b6cc-45a6-bb21-1681730849c0`
- Exact tested/built Git SHA: `13212827d31a82331e3440f55ca31eab9d538288`
- IPA SHA-256: `aa7bd93e22eecb7ff2535c6a22409f2739ab10a184f4d781f2b26b4538defb10`

## Upload result

Command used:

```text
npx eas-cli submit --platform ios --id ca17b79a-b6cc-45a6-bb21-1681730849c0 --profile production
```

Observed result:

```text
Submitted your app to Apple App Store Connect!
Your binary has been successfully uploaded to App Store Connect!
It is now being processed by Apple.
```

The CLI directed to the existing App Store Connect app ID `6767821805` TestFlight iOS page.

## Release boundary

This proves upload of Build 35 to App Store Connect/TestFlight processing only. It does **not** prove TestFlight processing completion, physical-device acceptance, StoreKit/RevenueCat behavior, account-deletion reviewer proof, screenshot remediation, or App Review resubmission.

`APP_STORE_REVIEW_SUBMISSION=NOT_PERFORMED`
`IOS_PHYSICAL_DEVICE_ACCEPTANCE=PENDING`
`APP_STORE_SCREENSHOT_IOS_ONLY=PENDING`
