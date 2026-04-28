/**
 * RegisterScreen — thin wrapper over AuthScreen.
 *
 * After the auth-collapse shipment, AuthScreen is the canonical email/password/Google
 * flow. RegisterScreen survives as a deep-link entrypoint that opens AuthScreen with
 * the signup tab selected. Users can switch back to sign-in via the segmented control.
 *
 * Post-register navigation is handled inside AuthScreen (routes to `/` home, which
 * triggers the placement prompt via AppShell under the value-first onboarding design).
 *
 * History: this file was previously 848 lines of near-duplicate of LoginScreen.
 * Removed as part of the auth-collapse shipment. If you need the legacy flow back,
 * check git history for the pre-collapse version.
 */

import React from 'react';
import AuthScreen from './AuthScreen';

export default function RegisterScreen() {
  return <AuthScreen />;
}
