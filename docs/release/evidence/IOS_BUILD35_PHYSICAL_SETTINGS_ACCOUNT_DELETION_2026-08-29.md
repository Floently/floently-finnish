# KieliValmis Build 35 — Physical iPhone Settings / Account Deletion Reachability Evidence

Date: 2026-08-29
Build under test: `1.0.0 (35)`
Exact candidate source: `13212827d31a82331e3440f55ca31eab9d538288`
EAS build ID: `ca17b79a-b6cc-45a6-bb21-1681730849c0`

## Observed on a real iPhone via TestFlight

The operator installed/updated to Build 35, logged in successfully, and supplied genuine iOS screenshots from the running app.

Observed facts:

- the signed-in profile shows `No active subscription`;
- Settings (`Asetukset`) opens without requiring a purchase;
- the signed-in account profile is visible in Settings;
- `Poista tili` / Delete Account is visible in Settings;
- tapping Delete Account opens the in-app deletion confirmation dialog;
- the dialog explains account/personal-data deletion and presents Cancel and Delete Account actions.

## Gate result

```text
PHYSICAL_FREE_ACCOUNT_SETTINGS_ACCESS=PASS
PHYSICAL_DELETE_ACCOUNT_REACHABILITY=PASS
DELETE_ACCOUNT_COMPLETION=PENDING
IOS_PHYSICAL_DEVICE_ACCEPTANCE=PENDING
```

The final destructive confirmation was not executed in this evidence step, so truthful deletion completion is not yet claimed.

The account shown in the screenshots is the historical `testuser@floently.com` test/reviewer-related account. Do not delete that account unless it is explicitly confirmed disposable; use a separate disposable free account for the destructive deletion proof and reviewer video.
