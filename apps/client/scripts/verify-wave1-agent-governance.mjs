import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.cwd());

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function requireText(source, expected, label) {
  if (!source.includes(expected)) {
    throw new Error(`${label}: missing required contract text: ${expected}`);
  }
}

const agentRules = read('.github/AGENTS.md');
const forwardPolicy = read('docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md');
const branchMatrix = read('docs/agents/WAVE1_BRANCH_MATRIX.md');
const protectedRules = read('docs/agents/WAVE1_PROTECTED_FILES_AND_CAPABILITIES.md');
const researchStandard = read('docs/agents/WAVE1_RESEARCH_AND_QUALITY_STANDARD.md');
const sharedContractDoc = read('docs/agents/WAVE1_SHARED_LEARNING_CONTRACT.md');
const testMatrix = read('docs/agents/WAVE1_TEST_MATRIX.md');
const learningTypes = read('packages/core/schemas/learning.ts');
const featureSafety = read('apps/client/scripts/verify-wave1-feature-branch-safety.mjs');
const featureSafetyWorkflow = read('.github/workflows/wave1-feature-branch-safety.yml');

for (const marker of [
  'PRODUCTION_ANCESTRY_GATE=PASS',
  'PROTECTED_INVARIANT_GATES=PASS',
  'CANDIDATE_ARTIFACT_IDENTITY=PASS',
  'POST_DEPLOY_CANARY=PASS',
  'TRACKED_SOURCE_MISSING_OR_DIFFERENT=0',
  'UNEXPLAINED_RUNTIME_SOURCE=0',
]) {
  requireText(forwardPolicy, marker, 'forward-only policy');
}

for (const marker of [
  'No Wave-1 agent is authorized to deploy',
  'RESEARCH_GATE=PASS',
  'PRODUCTION_ACTIONS=NONE',
  'force-push',
]) {
  requireText(agentRules, marker, 'agent rules');
}

for (const agent of ['Agent A', 'Agent B', 'Agent C', 'Agent D', 'Agent E', 'Agent F', 'Agent G']) {
  requireText(branchMatrix, agent, 'branch matrix');
}

for (const marker of [
  'SSH to the live server',
  'may not add native dependencies',
  'Do not present learner-specific weakness',
  'YKI',
  'Roleplay',
  'Cards',
]) {
  requireText(protectedRules, marker, 'protected rules');
}

for (const marker of [
  'RESEARCH_GATE=PASS|FAIL',
  'Teach',
  'Orient',
  'Respond',
  'Reward',
  'reduced-motion',
]) {
  requireText(researchStandard, marker, 'research standard');
}

for (const marker of [
  'Practice orchestrates; task runtimes execute.',
  '`learner` means selection/reasoning is supported by durable learner-specific evidence.',
  '`curriculum` means the product is making a safe curriculum/balance decision',
  '/learn/reading',
  '/professional/writing',
]) {
  requireText(sharedContractDoc, marker, 'shared contract documentation');
}

for (const marker of [
  "export const LEARNING_CONTRACT_VERSION = 'learning.v1' as const;",
  'export type TaskDescriptor =',
  'export type TaskCapability =',
  'export type TaskResult =',
  'export type LearnerEvent =',
  'export type SkillEvidence =',
  'export type PracticeSessionManifest =',
  "export type LearningEvidenceMode = 'learner' | 'curriculum';",
  "export type YkiTaskMode = 'practice' | 'mock' | 'full_exam';",
]) {
  requireText(learningTypes, marker, 'learning contract types');
}

for (const marker of [
  'FEATURE_TESTS=PASS',
  'NEGATIVE_PATH_TESTS=PASS',
  'AGENT_A_REVIEW=ACCEPT_SOURCE',
  'USER_ACCEPTANCE=PASS',
  'PRODUCTION_ACTIONS=NONE',
]) {
  requireText(testMatrix, marker, 'test matrix');
}

for (const marker of [
  'integration/wave1-shared-base-20260816',
  'docs/agents/research/AGENT_${letter}_RESEARCH.md',
  'RESEARCH_GATE=PASS',
  'WAVE1_FEATURE_BRANCH_SAFETY=PASS',
  'WAVE1_PROTECTED_PATH_SCAN=PASS',
  'WAVE1_DEPENDENCY_AND_DEPLOYMENT_SCAN=PASS',
  'docker-compose',
  'requirements',
  'apps/backend/app/routers/v1_roleplay.py',
  'apps/backend/app/routers/v1_yki.py',
]) {
  requireText(featureSafety, marker, 'feature branch safety verifier');
}

for (const marker of [
  'agent/b-learning-platform-events-20260816',
  'agent/c-reading-engine-20260816',
  'agent/d-writing-revision-engine-20260816',
  'agent/e-practice-hub-composer-20260816',
  'agent/f-professional-missions-20260816',
  'agent/g-experience-motion-20260816',
  'fetch-depth: 0',
  'verify-wave1-feature-branch-safety.mjs',
]) {
  requireText(featureSafetyWorkflow, marker, 'feature branch safety workflow');
}

console.log('WAVE1_AGENT_GOVERNANCE=PASS');
console.log('WAVE1_SHARED_LEARNING_CONTRACT=PASS');
console.log('WAVE1_PRODUCTION_FIREWALL=PASS');
console.log('WAVE1_FEATURE_BRANCH_FIREWALL=PASS');
