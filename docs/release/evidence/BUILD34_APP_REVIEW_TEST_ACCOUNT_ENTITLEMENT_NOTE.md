# Build 34 — App Review Test Account Entitlement Clarification

**Related rejected build:** iOS build 34  
**Exact build source SHA:** `4ce381deefa79b1b202d1483498f52a11d0c006c`  
**Commit title:** `Remove App Review account from shared test entitlements`

## What the commit actually changed

The commit changed exactly one source file: `packages/core/api/entitlements.ts`.

It removed `testuser@floently.com` from the hard-coded return value of `getReadAccessTestEmails()`.

Before the commit, the hard-coded Read test-access set included:

```text
vitus.idi@floently.com
testuser@floently.com
```

After the commit, the hard-coded Read test-access set includes:

```text
vitus.idi@floently.com
```

plus any emails supplied through `EXPO_PUBLIC_READ_ACCESS_TEST_EMAILS`.

## What the commit did NOT do

- It did **not** delete `testuser@floently.com` from the authentication database.
- It did **not** disable the account.
- It did **not** change the account password.
- It did **not** revoke sessions directly.
- It did **not** edit backend authentication persistence.
- It did **not** remove Apple/RevenueCat subscription products.

The commit therefore must not be described as an account deactivation.

## Functional impact

The removed hard-coded email was a fallback used when resolving **Floently Read access**. The client first honors explicit Read-access data returned by the backend, then recognized Read tiers, and only then falls back to the test-email list.

Therefore a tester using `testuser@floently.com` can still have Read access if the account receives a real backend Read entitlement/tier or if an appropriate environment-specific `EXPO_PUBLIC_READ_ACCESS_TEST_EMAILS` value is intentionally configured.

If the tester relied only on the old hard-coded email bypass, builds at/after `4ce381deefa79b1b202d1483498f52a11d0c006c` no longer grant that bypass automatically.

The supplied build-34 EAS environment does not show `EXPO_PUBLIC_READ_ACCESS_TEST_EMAILS`, so build 34 should be treated as having no environment override for this email unless separately proven.

## Remediation safety rule

Do **not** reintroduce a shared App Review account as a permanent hard-coded production entitlement simply to support internal testers.

Preferred pattern:

1. keep the Apple reviewer account representative of a normal customer state;
2. use dedicated internal tester accounts;
3. grant internal-only test access through controlled preview/internal environment configuration or real backend test entitlements;
4. keep production App Store builds free of broad shared-account entitlement bypasses unless explicitly required and reviewed.

This separation prevents internal testing needs from masking subscription/account-access defects during Apple review.