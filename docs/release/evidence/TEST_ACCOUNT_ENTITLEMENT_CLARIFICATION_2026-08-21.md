# Tester Account Entitlement Clarification — 2026-08-21

**Context:** iOS rejection remediation for Apple review received 2026-08-17, build 34.

The historical commit title `Remove App Review account from shared test entitlements` can be misread as an account-deactivation action. It was not.

The commit changed only `packages/core/api/entitlements.ts` by removing `testuser@floently.com` from a hard-coded Floently Read test-access email list. It did not delete an authentication account, disable credentials, revoke a backend user record, or terminate sessions.

Current behavior keeps `vitus.idi@floently.com` plus any emails provided through `EXPO_PUBLIC_READ_ACCESS_TEST_EMAILS` in that Read test-access path.

Therefore:

- the tester account itself was not deactivated by that commit;
- if `testuser@floently.com` relied solely on the old hard-coded Read bypass, its special Read access may have changed;
- a normal backend subscription/entitlement can still grant access independently of the hard-coded test-email fallback;
- tester access should be provisioned deliberately and separately from the Apple reviewer account so App Review exercises normal customer behavior.

## Definition-of-done status

- [x] Historical commit meaning documented.
- [ ] Current tester entitlement provisioning audited for all human testers.

The second item remains open until the actual tester accounts/access method are verified.