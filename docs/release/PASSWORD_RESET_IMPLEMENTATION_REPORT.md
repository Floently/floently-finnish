# Password Reset Implementation Report

Date: 2026-04-24  
Repo: `/home/vitus/floently-finnish`

## Scope Delivered

Implemented a production-safe password reset/account recovery flow across backend and app UI:

1. Sign-in entry point (`Forgot password?`)
2. Reset request endpoint (neutral response)
3. Secure token lifecycle (random token, hashed-at-rest, expiry, single-use)
4. Email reset link generation (deep link + web fallback URL)
5. Reset completion endpoint
6. App reset request and reset completion screens
7. Deep-link route support via Expo Router path (`/auth/reset-password`)
8. Abuse protection (email/IP rate limiting)
9. Release documentation and verification notes

## Files Changed

Backend:

- `apps/backend/app/models/api_models.py`
- `apps/backend/app/core/state_store.py`
- `apps/backend/app/core/config.py`
- `apps/backend/app/services/auth_service.py`
- `apps/backend/app/services/password_reset_email_service.py` (new)
- `apps/backend/app/routers/v1_auth.py`

Client/Core API:

- `packages/core/api/auth.ts`

Client UI/Routes:

- `apps/client/features/auth/screens/LoginScreen.tsx`
- `apps/client/features/auth/screens/ForgotPasswordScreen.tsx` (new)
- `apps/client/features/auth/screens/ResetPasswordScreen.tsx` (new)
- `apps/client/app/auth/forgot-password.tsx` (new)
- `apps/client/app/auth/reset-password.tsx` (new)

Docs:

- `docs/release/PASSWORD_RESET_IMPLEMENTATION_REPORT.md` (new)
- `docs/release/PASSWORD_RESET_RELEASE_CHECKLIST.md` (new)

## Implemented Flow

1. User taps `Forgot password?` on login screen.
2. App opens `/auth/forgot-password`.
3. App calls `POST /api/v1/auth/password-reset/request` with email.
4. Backend always returns neutral message:
   - `If an account exists for this email, we have sent password reset instructions.`
5. If account exists and request is within rate limits, backend:
   - generates strong random token (`secrets.token_urlsafe(48)`)
   - stores only SHA-256 hash of token
   - sets expiry (`PASSWORD_RESET_TOKEN_TTL_MINUTES`, default 30)
   - invalidates prior unused reset tokens for same user
   - builds deep link + web fallback reset URLs
6. User opens reset link to `/auth/reset-password?token=...` (app deep link or web path).
7. App submits token + new password + confirm password to:
   - `POST /api/v1/auth/password-reset/confirm`
8. Backend validates token, expiry, single-use, and password policy.
9. Backend updates password, marks token consumed, and invalidates active auth sessions for that user.
10. User signs in with new password.

## Security Protections Included

- Non-enumerating reset request response.
- Token generated with cryptographically secure randomness.
- Token never persisted in plaintext (hash-only storage).
- Expiry enforced.
- Single-use enforced.
- Previous outstanding reset tokens invalidated per user.
- Active auth sessions invalidated on successful password reset.
- Basic abuse protection:
  - per-email rate limit
  - per-IP rate limit
- Password policy reused from existing auth policy (8-128 chars).
- No token logging added.

## Config Added

Environment/config keys:

- `PASSWORD_RESET_TOKEN_TTL_MINUTES` (default `30`)
- `PASSWORD_RESET_RATE_LIMIT_WINDOW_SECONDS` (default `900`)
- `PASSWORD_RESET_RATE_LIMIT_PER_EMAIL` (default `3`)
- `PASSWORD_RESET_RATE_LIMIT_PER_IP` (default `20`)
- `PASSWORD_RESET_DEEP_LINK_BASE` (default `floently://auth/reset-password`)
- `PASSWORD_RESET_WEB_BASE_URL` (default `https://learn.floently.com/auth/reset-password`)
- `PASSWORD_RESET_EMAIL_FROM` (optional)
- `PASSWORD_RESET_EMAIL_WEBHOOK_URL` (optional provider integration endpoint)

## Email Infrastructure Status

Current implementation includes a production-ready integration point:

- `password_reset_email_service.py` sends email payloads to `PASSWORD_RESET_EMAIL_WEBHOOK_URL` if configured.
- If provider is not configured, backend still returns neutral success and does not crash.

Remaining provider step:

1. Connect your transactional email provider to a webhook endpoint and set:
   - `PASSWORD_RESET_EMAIL_WEBHOOK_URL`
   - `PASSWORD_RESET_EMAIL_FROM`

## Deep Link + Web Fallback Status

- Deep link path is supported through app scheme + Expo Router route:
  - `floently://auth/reset-password?token=...`
- Web fallback route path is prepared:
  - `/auth/reset-password?token=...`
  - host should map this path on the public app web domain.

## Verification Performed

Backend:

- Imported updated auth modules successfully.
- Verified reset routes are present in router.
- Verified reset request path returns neutral response.
- Verified token lifecycle semantics in service layer:
  - invalid token rejected
  - expired token rejected
  - reused token rejected
  - successful token consumption works once

Client:

- Added forgot/reset screens and login entry point.
- Added API client methods for reset request/confirm.
- Linted touched TS files (`eslint`) with no blocking errors.
- Full project `tsc` currently has pre-existing unrelated errors outside password-reset scope.

## Notes / Constraints

- This change does **not** implement plaintext password retrieval (by design and security policy).
- Users must reset passwords; stored password hashes cannot be reversed.
