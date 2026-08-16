import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const baseRef = process.env.WAVE1_BASE_REF || 'origin/integration/wave1-shared-base-20260816';
const branch = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME || '';

const agentMatch = branch.match(/^agent\/([b-g])-([a-z0-9-]+)-20260816$/i);
if (!agentMatch) {
  console.log(`WAVE1_FEATURE_BRANCH_SAFETY=SKIP branch=${branch || 'unknown'}`);
  process.exit(0);
}

const letter = agentMatch[1].toUpperCase();

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

try {
  git(['rev-parse', '--verify', baseRef]);
} catch {
  throw new Error(`Wave-1 shared base ref is unavailable: ${baseRef}`);
}

const mergeBase = git(['merge-base', baseRef, 'HEAD']);
const expectedBase = git(['rev-parse', baseRef]);
if (mergeBase !== expectedBase) {
  throw new Error(
    `Branch does not descend from the immutable Wave-1 shared base. merge-base=${mergeBase} expected=${expectedBase}`,
  );
}

const changed = git(['diff', '--name-only', `${expectedBase}...HEAD`])
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean);

const exactForbidden = new Set([
  '.github/AGENTS.md',
  'docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md',
  'docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md',
  'packages/core/schemas/learning.ts',
  'apps/client/package.json',
  'package.json',
  'pnpm-lock.yaml',
  'package-lock.json',
  'apps/client/state/AppShell.tsx',
  'apps/client/state/navigationModel.ts',
  'apps/backend/main.py',
  'apps/backend/app/router.py',
  'apps/backend/app/routers/v1_roleplay.py',
  'apps/backend/app/routers/v1_yki.py',
]);

const forbiddenPrefixes = [
  '.github/workflows/',
  'docs/agents/WAVE1_',
  'apps/backend/app/services/tts/',
  'apps/backend/app/services/roleplay_',
  'apps/backend/app/runtime/roleplay',
  'apps/backend/app/services/auth',
  'apps/backend/app/routers/auth',
  'apps/backend/app/services/subscription',
  'apps/backend/app/routers/subscription',
  'apps/backend/app/services/billing',
  'apps/backend/app/routers/billing',
  'apps/backend/app/services/yki',
  'apps/backend/app/runtime/yki',
  'apps/client/features/exam/',
  'apps/client/features/roleplay/',
  'apps/client/features/cards/',
  'apps/client/android/',
  'apps/client/ios/',
  'infra/',
  'deploy/',
  'deployment/',
  'docker/',
  'scripts/deploy',
  'scripts/production',
];

const forbiddenBasenames = new Set([
  'Dockerfile',
  'docker-compose.yml',
  'docker-compose.yaml',
  'eas.json',
]);

const forbiddenPatterns = [
  /(^|\/)\.env($|\.)/,
  /(^|\/)secrets?\//i,
  /(^|\/)production\.(ya?ml|json|toml)$/i,
];

function isForbidden(file) {
  if (exactForbidden.has(file)) return true;
  if (forbiddenPrefixes.some((prefix) => file.startsWith(prefix))) return true;
  if (forbiddenBasenames.has(path.basename(file))) return true;
  return forbiddenPatterns.some((pattern) => pattern.test(file));
}

const violations = changed.filter(isForbidden);
if (violations.length) {
  throw new Error(
    `Agent ${letter} changed integration-owned/protected paths:\n${violations.map((file) => ` - ${file}`).join('\n')}`,
  );
}

const researchPath = `docs/agents/research/AGENT_${letter}_RESEARCH.md`;
const runtimeChanges = changed.filter(
  (file) => !file.startsWith('docs/') && !file.toLowerCase().includes('readme'),
);

if (runtimeChanges.length) {
  const absoluteResearch = path.join(root, researchPath);
  if (!fs.existsSync(absoluteResearch)) {
    throw new Error(`Runtime changes require research first: missing ${researchPath}`);
  }
  const research = fs.readFileSync(absoluteResearch, 'utf8');
  if (!research.includes('RESEARCH_GATE=PASS')) {
    throw new Error(`Runtime changes require RESEARCH_GATE=PASS in ${researchPath}`);
  }
}

console.log(`WAVE1_FEATURE_BRANCH_SAFETY=PASS agent=${letter}`);
console.log(`WAVE1_SHARED_BASE=${expectedBase}`);
console.log(`WAVE1_CHANGED_FILES=${changed.length}`);
console.log(`WAVE1_PRODUCTION_ACTIONS=NONE`);
