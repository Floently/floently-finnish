import AppShell from '../../../state/AppShell';

/**
 * Dedicated route screen for /billing/subscription.
 *
 * For now this reuses the existing billing state route through AppShell,
 * but keeping this file gives us a clean place to split subscription
 * management away from pricing later without changing the route path again.
 */
export default function SubscriptionManagementScreen() {
  return <AppShell requestedScreen="billing" />;
}
