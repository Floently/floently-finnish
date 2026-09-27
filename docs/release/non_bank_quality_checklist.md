# Floently non-bank quality checklist

## Auth and session
- [ ] Google sign-in completes and stays signed in.
- [ ] `/api/v1/auth/session` returns 200 after login.
- [ ] Expired session shows a clear message, not a silent redirect.
- [ ] Device limit errors show a clear explanation.

## Subscription management
- [ ] `/billing/subscription` opens as Subscription management.
- [ ] Expired/past-due users do not see "subscription active".
- [ ] Trial-used users see "Trial already used".
- [ ] Trial-used users cannot start another free trial.
- [ ] Payment failed users see access paused/payment failed.
- [ ] Stripe update-payment action is inside management UI.
- [ ] Paid plans remain visible when access is expired.

## Device/account sharing
- [ ] Trial users: one active browser/app installation.
- [ ] Paid users: two active browser/app installations.
- [ ] Login and billing management are never blocked by device guard.
- [ ] Product access is blocked clearly when device limit is exceeded.
- [ ] Device management API exists and can remove stale devices.

## Card hints
- [ ] Hint button calls `/cards/coach/hint`.
- [ ] Backend logs provider/model.
- [ ] Hint is card-specific.
- [ ] Fallback is acceptable if OpenAI fails.

## Navigation
- [ ] Home can be reached from every major screen.
- [ ] Menu/sidebar can be opened from every major screen.
- [ ] Android back behavior is predictable.

## Build readiness
- [ ] `scripts/validate-release-fast.sh` passes.
- [ ] Backend health endpoint passes.
- [ ] Web bundle points to production API.
- [ ] APK test build only after bank cleanup strategy is clear.
