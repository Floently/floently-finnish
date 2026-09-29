# Password reset delivery readiness research — 2026-09-28

Issue: #51
Branch: `fix/password-reset-delivery-readiness-20260928`
Base: `main@f2ebe1c390cf164dd7c3a526ac31ebab4d5ad4bb`

## Current defect

The secure reset-token lifecycle already exists, but delivery is operationally optional:

- `password_reset_email_service.py` only sends through `PASSWORD_RESET_EMAIL_WEBHOOK_URL`;
- if no webhook is configured, `send_password_reset_email(...)` returns `False`;
- `request_password_reset(...)` intentionally returns the same neutral public response for valid, invalid and unknown accounts, but it currently ignores the `False` delivery result;
- production can therefore appear healthy while no password-reset message can ever be sent.

The public neutral response is correct and must remain unchanged because it avoids account enumeration. The defect is internal operational truth and provider availability.

## Provider research

Python 3.12 already ships a standards-based SMTP client and structured email-message API, so a provider-neutral SMTP path can be added without a new package or native dependency.

Primary references:
- Python `smtplib`: https://docs.python.org/3.12/library/smtplib.html
- Python `EmailMessage`: https://docs.python.org/3.12/library/email.message.html
- Python `ssl.create_default_context()` for certificate validation/hostname checking: https://docs.python.org/3.12/library/ssl.html

Relevant platform facts:
- `SMTP.starttls(context=...)` upgrades an SMTP connection to TLS.
- `SMTP.send_message(...)` sends an `EmailMessage` using standard message headers.
- `ssl.create_default_context()` is the recommended client default for trusted CA validation and hostname checking.

## Design

Preserve the existing webhook integration and add a provider-neutral SMTP fallback.

### Delivery provider selection

1. Existing webhook remains first priority when both webhook URL and sender address are configured.
2. SMTP is used when webhook is unavailable and SMTP host + sender configuration is complete.
3. Partial/missing configuration is reported as unavailable; delivery returns `False`.
4. No secret, URL, username, recipient address or reset token is emitted in readiness/log output.

### SMTP configuration

New server-only settings:

- `PASSWORD_RESET_SMTP_HOST`
- `PASSWORD_RESET_SMTP_PORT` (default 587)
- `PASSWORD_RESET_SMTP_USERNAME`
- `PASSWORD_RESET_SMTP_PASSWORD`
- `PASSWORD_RESET_SMTP_USE_TLS` (default true)
- `PASSWORD_RESET_SMTP_USE_SSL` (default false)
- existing `PASSWORD_RESET_EMAIL_FROM` remains the sender authority.

Username/password must be supplied together when authentication is used. STARTTLS and implicit SSL must not both be enabled.

### Readiness / observability

Add a provider status snapshot that reports only:

- ready boolean;
- selected provider (`webhook`, `smtp`, or `none`);
- non-secret reason code.

Add a dedicated health endpoint for password-reset delivery. It returns a failure status when delivery is unavailable so deployment/release checks can gate on it without changing the existing liveness endpoint.

At startup, log only provider + readiness + reason. During requests, log accepted/unavailable/provider-error outcomes without logging email addresses or reset links/tokens.

### Public behavior

The password-reset request endpoint must continue returning the existing neutral response regardless of:
- unknown account;
- rate limit;
- provider unavailable;
- provider exception;
- delivery accepted.

This preserves anti-enumeration behavior while making the operational failure visible to operators/release gates.

## Acceptance criteria

1. Existing webhook delivery remains supported.
2. SMTP delivery works using only Python standard-library APIs.
3. STARTTLS uses `ssl.create_default_context()`.
4. SMTP credentials are never logged.
5. Readiness detects complete, absent and partially configured delivery.
6. Dedicated readiness endpoint is non-secret and fails when no delivery provider is ready.
7. Startup/request logs expose only non-sensitive delivery outcome.
8. Public reset response remains identical for unknown accounts and delivery failures.
9. Full backend tests pass.
10. No client, billing, subscription, schema, native dependency, OTA or production action.

## External dependency that remains

GitHub source changes cannot create or verify a real production mailbox/SMTP service or provide credentials. Production readiness can only become **PASS** after an operator supplies a verified sender and either:
- the existing production webhook endpoint, or
- transactional SMTP credentials.

That external credential/configuration step must be completed before issue #51 can be closed.

`RESEARCH_GATE=PASS`
`PRODUCTION_ACTIONS=NONE`
