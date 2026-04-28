/**
 * LoginScreen — thin wrapper over AuthScreen.
 *
 * After the auth-collapse shipment, AuthScreen is the canonical email/password/Google
 * flow with a segmented control for switching between sign-in and create-account modes.
 * LoginScreen and RegisterScreen survive as deep-link entrypoints that just pick the
 * starting tab; the underlying screen is identical.
 *
 * History: this file was previously 852 lines of near-duplicate of RegisterScreen.
 * Removed as part of the auth-collapse shipment. If you need the legacy flow back,
 * check git history for the pre-collapse version.
 */

import React from 'react';
import AuthScreen from './AuthScreen';

export default function LoginScreen() {
  return <AuthScreen initialTab="signin" />;
}
