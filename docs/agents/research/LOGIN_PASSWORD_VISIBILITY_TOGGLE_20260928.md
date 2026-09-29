# Login password visibility toggle research — 2026-09-28

Scope: sign-in password field only.
Branch: `fix/login-password-visibility-toggle-20260928`

## Product requirement

On the login form, the learner must be able to reveal the password they have typed by pressing an eye control on the right side of the password field, and hide it again with the same control.

The requirement is intentionally limited to sign-in. Create-account and reset-password fields remain masked-only for now.

## Existing implementation

`apps/client/features/auth/screens/AuthScreen.tsx` uses one shared password field for Sign in / Create account and currently sets `secureTextEntry` unconditionally.

The project already depends on `@expo/vector-icons` and already uses `Ionicons`, so no dependency or native configuration change is needed.

## Implementation decision

- add local `passwordVisible` state;
- render the eye control only when `tab === 'signin'`;
- set `secureTextEntry={tab === 'signin' ? !passwordVisible : true}`;
- reset visibility to hidden whenever the user switches tabs;
- keep the eye inside the password input container on the right;
- use `eye-outline` / `eye-off-outline` from the already-installed Ionicons package;
- provide explicit button accessibility labels: `Show password` and `Hide password`;
- preserve autofill, current-password/new-password content types, validation, submit behavior, and registration behavior.

## Acceptance criteria

1. Sign-in password starts masked.
2. Pressing the eye reveals the exact typed password.
3. Pressing it again masks the password.
4. The control is positioned at the right edge of the login password field.
5. Switching to Create account always returns to a masked password field and no eye control is rendered there.
6. Switching back to Sign in starts masked again.
7. No password value is persisted or logged by this change.
8. No auth API, backend, billing, native dependency, or production action changes.

`RESEARCH_GATE=PASS`
`PRODUCTION_ACTIONS=NONE`
