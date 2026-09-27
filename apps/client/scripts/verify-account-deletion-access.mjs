import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');

function read(relativePath) {
  return fs.readFileSync(path.join(clientRoot, relativePath), 'utf8');
}

function requireText(source, text, label) {
  if (!source.includes(text)) {
    throw new Error(`Account deletion access invariant failed: ${label}`);
  }
}

function forbidText(source, text, label) {
  if (source.includes(text)) {
    throw new Error(`Account deletion access invariant failed: ${label}`);
  }
}

const appShell = read('state/AppShell.tsx');
const settingsRoute = read('state/SettingsRoute.tsx');
const sidebar = read('config/navigation/AppShell_sidebar_sections.ts');

const accountManagementHelper = appShell.match(
  /function isAccountManagementScreen\([\s\S]*?\n}\n/,
)?.[0];

if (!accountManagementHelper) {
  throw new Error(
    'Account deletion access invariant failed: explicit account-management route helper is missing',
  );
}

requireText(
  accountManagementHelper,
  'screen === "settings"',
  'Settings must remain an account-management route',
);
requireText(
  accountManagementHelper,
  'screen === "help"',
  'Help must remain an account-management route',
);
requireText(
  accountManagementHelper,
  'screen === "billing"',
  'Billing/restore access must remain an account-management route',
);

for (const protectedRoute of [
  'learning',
  'daily-practice',
  'speaking-practice',
  'yki-practice',
  'yki-exam',
  'professional-finnish',
  'read',
  'create',
  'progress',
]) {
  forbidText(
    accountManagementHelper,
    `screen === "${protectedRoute}"`,
    `paid/protected route ${protectedRoute} must not be classified as account management`,
  );
}

requireText(
  appShell,
  'if (user && isAccountManagementScreen(screen)) {\n      return true;\n    }',
  'a signed-in user must be allowed through the entitlement guard for account management',
);

requireText(
  appShell,
  "if (!hasUnlockedAccess) {\n      return screen === 'landing' || screen === 'auth' || screen === 'billing';\n    }",
  'the paid-access guard must remain in place for non-account learning routes',
);

requireText(
  sidebar,
  "onPress: () => void navigateTo('settings')",
  'Settings must remain discoverable from the signed-in drawer',
);

requireText(
  settingsRoute,
  'function handleDeleteAccount()',
  'Settings must retain an in-app Delete Account handler',
);
requireText(
  settingsRoute,
  "await authService.deleteAccount({ deletionReason: 'in_app_settings' });",
  'Delete Account must call the authenticated account-deletion API',
);
requireText(
  settingsRoute,
  'onPress={handleDeleteAccount}',
  'the visible Delete Account control must remain wired to the deletion handler',
);

console.log('PASS: authenticated free users can reach account-management routes.');
console.log('PASS: paid learning routes are not reclassified as account management.');
console.log('PASS: Settings remains discoverable from the drawer.');
console.log('PASS: Settings retains an in-app account-deletion action.');
console.log('ACCOUNT_DELETION_ACCESS_INVARIANTS=PASS');
