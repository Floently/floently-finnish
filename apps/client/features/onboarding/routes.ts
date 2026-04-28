/**
 * Onboarding routes.
 *
 * Value-first flow (after the defer-paywall change):
 *
 *   welcome → intent → [profession if non-YKI] → frequency → register → /
 *                                                                       ↓
 *                                                              AppShell detects placement
 *                                                              should prompt, shows it
 *                                                                       ↓
 *                                                              On placement complete:
 *                                                                - if has learnAccess → home
 *                                                                - else → billing (trial start)
 *
 * `plan` is NOT in the pre-register path anymore; PlanSelectionScreen survives only as a
 * pricing-preview page reachable via deep link. The paywall surface is /billing/subscription
 * (features/billing/screens/SubscriptionScreen.tsx) which is still reached post-placement
 * via the AppShell's navigateTo('billing') handler.
 */
export const onboardingRoutes = {
  welcome: '/onboarding',
  intent: '/onboarding/intent',
  plan: '/onboarding/plan',
  profession: '/onboarding/profession',
  frequency: '/onboarding/frequency',
  login: '/auth/login',
  register: '/auth/register',
  subscription: '/billing/subscription',
} as const;
