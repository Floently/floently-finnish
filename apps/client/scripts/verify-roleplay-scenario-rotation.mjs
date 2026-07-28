import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDirectory = path.dirname(
  fileURLToPath(import.meta.url),
);

const clientRoot = path.resolve(
  scriptDirectory,
  '..',
);

const corePath = path.join(
  clientRoot,
  'features/speaking/services/roleplayScenarioRotationCore.ts',
);

const source = fs.readFileSync(
  corePath,
  'utf8',
);

const compiled = ts.transpileModule(
  source,
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      strict: true,
    },
  },
).outputText;

const moduleObject = {
  exports: {},
};

const context = {
  console,
  exports: moduleObject.exports,
  module: moduleObject,
};

vm.runInNewContext(
  compiled,
  context,
  {
    filename: corePath,
  },
);

const {
  selectNextRoleplayScenario,
} = moduleObject.exports;

assert.equal(
  typeof selectNextRoleplayScenario,
  'function',
  'rotation core must export selectNextRoleplayScenario',
);

const randomValues = [
  0.12,
  0.81,
  0.33,
  0.64,
  0.05,
  0.91,
  0.47,
  0.22,
];

let randomIndex = 0;

const deterministicRandom = () => {
  const value =
    randomValues[
      randomIndex % randomValues.length
    ];

  randomIndex += 1;
  return value;
};

const catalog = [
  'scenario-a',
  'scenario-b',
  'scenario-c',
];

let state = null;
const firstCycle = [];

for (let index = 0; index < catalog.length; index += 1) {
  const result = selectNextRoleplayScenario(
    catalog,
    state,
    deterministicRandom,
  );

  assert.ok(
    result.scenarioId,
    'every draw must return a scenario',
  );

  firstCycle.push(result.scenarioId);
  state = result.state;
}

assert.equal(
  new Set(firstCycle).size,
  catalog.length,
  'every scenario must appear before the bag repeats',
);

const fourth = selectNextRoleplayScenario(
  catalog,
  state,
  deterministicRandom,
);

assert.notEqual(
  fourth.scenarioId,
  firstCycle[firstCycle.length - 1],
  'a new bag must not immediately repeat the previous scenario',
);

state = fourth.state;
let previous = fourth.scenarioId;

for (let index = 0; index < 20; index += 1) {
  const result = selectNextRoleplayScenario(
    catalog,
    state,
    deterministicRandom,
  );

  assert.notEqual(
    result.scenarioId,
    previous,
    'consecutive sessions must differ when alternatives exist',
  );

  previous = result.scenarioId;
  state = result.state;
}

const changedCatalogResult =
  selectNextRoleplayScenario(
    [
      'scenario-b',
      'scenario-c',
      'scenario-d',
    ],
    state,
    deterministicRandom,
  );

assert.ok(
  [
    'scenario-b',
    'scenario-c',
    'scenario-d',
  ].includes(changedCatalogResult.scenarioId),
  'catalogue changes must discard removed scenario IDs',
);

const singleFirst =
  selectNextRoleplayScenario(
    ['only-scenario'],
    null,
    deterministicRandom,
  );

const singleSecond =
  selectNextRoleplayScenario(
    ['only-scenario'],
    singleFirst.state,
    deterministicRandom,
  );

assert.equal(
  singleFirst.scenarioId,
  'only-scenario',
  'single-scenario professions must remain usable',
);

assert.equal(
  singleSecond.scenarioId,
  'only-scenario',
  'single scenario may repeat because no alternative exists',
);

const screenSource = fs.readFileSync(
  path.join(
    clientRoot,
    'features/speaking/screens/RoleplayConversationScreen.tsx',
  ),
  'utf8',
);

const completionSource = fs.readFileSync(
  path.join(
    clientRoot,
    'features/speaking/components/SessionCompletion.tsx',
  ),
  'utf8',
);

const alternativesSource = fs.readFileSync(
  path.join(
    clientRoot,
    'features/speaking/data/alternativeScenarios.ts',
  ),
  'utf8',
);

assert.ok(
  screenSource.includes(
    'await listRoleplayScenarios(',
  ),
  'screen must retrieve the live backend scenario catalogue',
);

assert.ok(
  screenSource.includes(
    'await pickRotatingRoleplayScenario({',
  ),
  'ordinary roleplay start must use persistent rotation',
);

assert.ok(
  !screenSource.includes(
    "if (profession === 'nurse') return 'nurse_shift_handover';",
  ),
  'nurse roleplay must not have a permanently fixed default',
);

assert.ok(
  !screenSource.includes(
    "if (profession === 'doctor') return 'doctor_patient_interview';",
  ),
  'doctor roleplay must not have a permanently fixed default',
);

assert.ok(
  !screenSource.includes(
    "return 'general_everyday_conversation';",
  ),
  'general roleplay must not have a permanently fixed ordinary default',
);

assert.ok(
  completionSource.includes(
    'completedScenarioId ?? undefined',
  ),
  'the explicit Replay button must still repeat the same scenario',
);

for (const requiredScenario of [
  'general_everyday_conversation',
  'general_supervisor_instruction',
  'general_issue_report',
]) {
  assert.ok(
    alternativesSource.includes(requiredScenario),
    `general alternative catalogue must include ${requiredScenario}`,
  );
}

console.log(
  'PASS: every scenario appears before repetition',
);

console.log(
  'PASS: immediate repeats are prevented',
);

console.log(
  'PASS: catalogue changes are reconciled',
);

console.log(
  'PASS: explicit replay-same behaviour remains',
);

console.log(
  'ROLEPLAY_SCENARIO_ROTATION=PASS',
);
