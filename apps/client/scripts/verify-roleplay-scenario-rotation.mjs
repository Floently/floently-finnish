import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(scriptDirectory, '..');
const repoRoot = path.resolve(clientRoot, '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

const screenSource = read('apps/client/features/speaking/screens/RoleplayConversationScreen.tsx');
const completionSource = read('apps/client/features/speaking/components/SessionCompletion.tsx');
const speakingRouteSource = read('apps/client/state/SpeakingRoute.tsx');
const appShellSource = read('apps/client/state/AppShell.tsx');
const apiSource = read('packages/core/api/roleplay.ts');
const backendSource = read('apps/backend/app/runtime/roleplay.py');
const routerSource = read('apps/backend/app/routers/v1_roleplay.py');

assert.ok(
  apiSource.includes("export type RoleplayMode = 'everyday' | 'workplace' | 'yki' | 'professional' | 'interview'"),
  'core API must expose the stable non-localized roleplay mode contract',
);

assert.ok(
  apiSource.includes('roleplay_mode: payload.roleplayMode'),
  'client API must transmit roleplay_mode explicitly',
);

assert.ok(
  screenSource.includes('roleplayMode,'),
  'conversation screen must receive roleplayMode as an explicit prop',
);

assert.ok(
  screenSource.includes('roleplayMode,\n        scenarioId: resolvedScenarioId'),
  'roleplay start must pass the explicit roleplay mode to the core API',
);

assert.ok(
  !screenSource.includes('pickRotatingRoleplayScenario'),
  'client must not own ordinary scenario rotation',
);

assert.ok(
  !screenSource.includes('scenarioIdForContext'),
  'translated context labels must not choose a scenario',
);

assert.ok(
  completionSource.includes('const primaryOnPress = () => onStartSession();'),
  'ordinary another-round action must delegate next-scenario selection to the server',
);

assert.ok(
  completionSource.includes('completedScenarioId ?? undefined'),
  'explicit Replay must still be able to request the same scenario',
);

assert.ok(
  speakingRouteSource.includes('roleplayMode={resolvedRoleplayMode}'),
  'SpeakingRoute must carry resolved roleplay mode into conversation runtime',
);

for (const mode of ['everyday', 'workplace', 'professional', 'interview', 'yki']) {
  assert.ok(
    appShellSource.includes(`roleplayMode: '${mode}'`) || speakingRouteSource.includes(`? '${mode}'`) || speakingRouteSource.includes(`: '${mode}'`),
    `route layer must explicitly represent ${mode} mode`,
  );
}

assert.ok(
  backendSource.includes('ROLEPLAY_MODES: tuple[str, ...]'),
  'backend must define the canonical roleplay mode set',
);

assert.ok(
  backendSource.includes('def select_roleplay_scenario('),
  'backend must own scenario selection',
);

assert.ok(
  backendSource.includes('ROLEPLAY_SCENARIO_OUTSIDE_POOL'),
  'backend must reject explicit scenario IDs from another mode/profession pool',
);

assert.ok(
  backendSource.includes('"scenarioPool": scenario_pool'),
  'session start must expose the eligible scenario pool for diagnostics',
);

assert.ok(
  backendSource.includes('"selectionReason": selection_reason'),
  'session start must expose why the scenario was selected',
);

assert.ok(
  backendSource.includes('del context_label'),
  'legacy display context must be explicitly ignored by scenario resolution',
);

assert.ok(
  routerSource.includes('roleplay_mode: str | None = None'),
  'HTTP contract must accept roleplay_mode during compatibility migration',
);

console.log('PASS: explicit roleplay mode crosses AppShell -> client API -> backend');
console.log('PASS: ordinary scenario selection is server-owned');
console.log('PASS: translated context labels no longer route content');
console.log('PASS: Replay remains an explicit same-scenario action');
console.log('ROLEPLAY_SCENARIO_ROTATION=PASS');
