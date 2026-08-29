# KieliValmis Build 35 — Physical account-deletion video evidence

Date: 2026-08-29
Build: `1.0.0 (35)`
Exact built/tested source: `13212827d31a82331e3440f55ca31eab9d538288`
EAS build ID: `ca17b79a-b6cc-45a6-bb21-1681730849c0`

## Evidence reviewed

A 42.7-second native iPhone screen recording from the TestFlight Build 35 artifact was reviewed frame by frame.

The recording shows, in sequence:

1. Launch of KieliValmis on the iPhone.
2. Entry into the authentication flow and creation/sign-in of a disposable account.
3. The account-management screen showing `No active subscription`.
4. Navigation through the signed-in menu to `Asetukset` / Settings.
5. `Poista tili` / Delete Account visible without any purchase requirement.
6. The first deletion confirmation dialog.
7. The explicit final confirmation dialog (`Final confirmation` / `Yes, delete`).
8. An `Account deleted` success dialog stating that the deletion request was submitted and sign-in is disabled for the account.
9. Return to an unauthenticated/landing state.
10. A subsequent login attempt with the deleted account being rejected with `Incorrect email or password.`

## Observed post-deletion transient

Immediately after acknowledging the success dialog, the app briefly shows a `Something went wrong` / `401` expired-session screen during logout/session cleanup. It then recovers to the unauthenticated landing/login flow. Because the app had already reported successful deletion and the deleted credentials subsequently fail authentication, this transient is recorded as a non-blocking post-deletion UX blemish rather than a deletion-completion failure.

## Gate result

```text
PHYSICAL_FREE_ACCOUNT_SETTINGS_ACCESS=PASS
PHYSICAL_DELETE_ACCOUNT_REACHABILITY=PASS
PHYSICAL_DELETE_ACCOUNT_COMPLETION=PASS
PHYSICAL_DELETED_ACCOUNT_CANNOT_REAUTHENTICATE=PASS
ACCOUNT_DELETION_REVIEWER_VIDEO_RECORDED=PASS
IOS_PHYSICAL_DEVICE_ACCEPTANCE=PENDING
```

The full Phase-7 physical-device gate remains pending because StoreKit/RevenueCat purchase, entitlement-sync, restore, cancellation and broader exact-candidate smoke checks are not yet complete.
