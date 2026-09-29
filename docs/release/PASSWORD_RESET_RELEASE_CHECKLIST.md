# Password Reset Release Checklist

Date: 2026-04-24

## Backend Configuration

- [ ] Set `PASSWORD_RESET_EMAIL_FROM` to a verified sender address.
- [ ] Configure **one** real production delivery path:
  - [ ] Existing webhook: set `PASSWORD_RESET_EMAIL_WEBHOOK_URL` to the production email dispatch endpoint; **or**
  - [ ] SMTP: set `PASSWORD_RESET_SMTP_HOST`, `PASSWORD_RESET_SMTP_PORT`, and optional username/password required by the provider.
  - [ ] For SMTP, use exactly one transport mode: STARTTLS (`PASSWORD_RESET_SMTP_USE_TLS=true`) or implicit SSL (`PASSWORD_RESET_SMTP_USE_SSL=true`), not both.
- [ ] Confirm `GET /api/v1/health/password-reset-delivery` returns HTTP 200 with `ready=true` and the expected non-secret provider name.
- [ ] Confirm `PASSWORD_RESET_WEB_BASE_URL` points to hosted app reset page.
- [ ] Confirm `PASSWORD_RESET_DEEP_LINK_BASE` matches app scheme/path (`floently://auth/reset-password`).
- [ ] Review/adjust rate limits:
  - [ ] `PASSWORD_RESET_RATE_LIMIT_PER_EMAIL`
  - [ ] `PASSWORD_RESET_RATE_LIMIT_PER_IP`
  - [ ] `PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS`
- [ ] Review/adjust token TTL: `PASSWORD_RESET_TOKEN_TTL_MINUTES`.

## Mobile App / Client

- [ ] Verify login screen shows `Forgot password?`.
- [ ] Verify `/auth/forgot-password` loads and submits.
- [ ] Verify `/auth/reset-password` loads token from link query.
- [ ] Verify reset success returns user to sign-in path.

## Deep Link + Fallback

- [ ] Test app deep link:
  - [ ] `floently://auth/reset-password?token=<token>`
- [ ] Test fallback web URL:
  - [ ] `https://<public-site>/auth/reset-password?token=<token>`
- [ ] Ensure links in reset emails include both deep link and fallback URL.

## Security Validation

- [ ] Reset request response does not reveal account existence.
- [ ] Token is random and stored hashed only.
- [ ] Token expires as configured.
- [ ] Token is single-use.
- [ ] Prior outstanding tokens are invalidated after new request.
- [ ] Reset request abuse limits are active (email + IP).
- [ ] Password policy enforced at reset completion.
- [ ] Existing auth flow still works (login/register/provider login).

## End-to-End Test Plan

0. Check delivery readiness:
   - Expected: HTTP 200, `ready=true`, and no credential/provider-secret material in the response.
1. Request reset for existing email:
   - Expected: neutral success copy.
2. Request reset for non-existing email:
   - Expected: identical neutral success copy.
3. Open reset link and set new password:
   - Expected: success message.
4. Attempt to reuse same token:
   - Expected: invalid/expired token error.
5. Attempt expired token:
   - Expected: invalid/expired token error.
6. Sign in with old password:
   - Expected: fails.
7. Sign in with new password:
   - Expected: succeeds.

## Release Sign-off

- [ ] Backend deployed with config above.
- [ ] Password-reset delivery readiness gate is green in the deployed environment.
- [ ] A real reset email has been received from the configured production provider.
- [ ] App build includes new auth routes/screens.
- [ ] QA pass complete.
- [ ] Product/support copy approved.
