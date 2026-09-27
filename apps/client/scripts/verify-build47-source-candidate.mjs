import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const clientRoot = process.cwd().endsWith(path.join('apps', 'client'))
  ? process.cwd()
  : path.join(process.cwd(), 'apps', 'client');

function read(relativePath) {
  return fs.readFileSync(path.join(clientRoot, relativePath), 'utf8');
}

const navigation = read('scripts/verify-navigation-invariants.mjs');
const packageJson = JSON.parse(read('package.json'));
const sidebar = read('config/navigation/AppShell_sidebar_sections.ts');
const guided = read('features/speaking/screens/GuidedSpeakingScreen.tsx');
const missionChain = read('features/professional/professionalMissionChain.ts');
const professionalRoute = read('state/ProfessionalRoute.tsx');

const requiredVerifierImports = [
  './verify-guided-speaking-invariants.mjs',
  './verify-card-level-gate.mjs',
  './verify-practice-one-next-session.mjs',
  './verify-professional-mission-chain.mjs',
  './verify-reading-writing-progression.mjs',
  './verify-learning-experience-integration.mjs',
  './verify-professional-listening.mjs',
  './verify-voice-conversation-ui.mjs',
];

for (const verifier of requiredVerifierImports) {
  assert.ok(
    navigation.includes(`await import('${verifier}')`),
    `navigation qualification must include ${verifier}`,
  );
}

const requiredScripts = [
  'verify:navigation',
  'verify:guided-speaking',
  'verify:card-level-gate',
  'verify:practice-one-next',
  'verify:roleplay-scenarios',
  'verify:professional-mission-chain',
  'verify:reading-writing-progression',
  'verify:learning-experience-integration',
  'verify:professional-listening',
  'verify:voice-conversation-ui',
];

for (const script of requiredScripts) {
  assert.equal(typeof packageJson.scripts?.[script], 'string', `missing package verifier ${script}`);
}

for (const branchId of ["id: 'everyday'", "id: 'professional'", "id: 'yki'"]) {
  assert.ok(sidebar.includes(branchId), `progressive drawer is missing ${branchId}`);
}

assert.ok(
  sidebar.includes("id: 'everyday-speaking'") &&
    sidebar.includes("id: 'professional-speaking'"),
  'progressive drawer must retain nested speaking branches',
);

assert.ok(
  guided.includes('GUIDED_SPEAKING_MAX_STAGE') &&
    guided.includes('await resumePersistedFrontier()'),
  'Guided Speaking must retain deterministic frontier/replay authority',
);

assert.ok(
  missionChain.includes("pathname: '/professional/listening'") &&
    missionChain.includes("pathname: '/speaking/mission'") &&
    missionChain.includes("pathname: '/professional/reading'") &&
    missionChain.includes("pathname: '/professional/writing'"),
  'Professional mission must expose the complete four-skill chain',
);

assert.ok(
  professionalRoute.includes('Start mission · {missionStepLabel(missionChain.primaryStep)}'),
  'Professional route must retain one obvious current-mission action',
);

assert.ok(
  !professionalRoute.includes('Listening is not available yet'),
  'final candidate must not carry the obsolete listening-unavailable state',
);

console.log('BUILD47_PROGRESSIVE_DISCLOSURE_PRESENT=PASS');
console.log('BUILD47_GUIDED_SPEAKING_PRESENT=PASS');
console.log('BUILD47_CARDS_AND_PRACTICE_GATES_PRESENT=PASS');
console.log('BUILD47_PROFESSIONAL_FOUR_SKILL_CHAIN_PRESENT=PASS');
console.log('BUILD47_READING_WRITING_AND_EXPERIENCE_GATES_PRESENT=PASS');
console.log('BUILD47_SOURCE_CANDIDATE=PASS');
