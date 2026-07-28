import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  RoleplayProfession,
  RoleplayScenarioSummary,
} from '@core/api/roleplay';

import {
  selectNextRoleplayScenario,
  type RoleplayScenarioRotationState,
} from './roleplayScenarioRotationCore';

const STORAGE_PREFIX =
  '@floently/roleplay-scenario-rotation/v1';

const memoryState =
  new Map<string, RoleplayScenarioRotationState>();

function storageKey(
  profession: RoleplayProfession,
  scope: string,
): string {
  const normalizedScope =
    String(scope || 'workplace')
      .trim()
      .toLowerCase() || 'workplace';

  return [
    STORAGE_PREFIX,
    profession,
    normalizedScope,
  ].join(':');
}

function eligibleScenarioIds(
  profession: RoleplayProfession,
  scenarios: readonly RoleplayScenarioSummary[],
): string[] {
  return scenarios
    .filter(
      (scenario) =>
        scenario.profession === profession &&
        scenario.interviewMode !== true,
    )
    .map((scenario) =>
      String(scenario.id || '').trim(),
    )
    .filter(Boolean);
}

async function readRotationState(
  key: string,
): Promise<RoleplayScenarioRotationState | null> {
  const inMemory = memoryState.get(key);

  if (inMemory) {
    return inMemory;
  }

  try {
    const stored = await AsyncStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(
      stored,
    ) as Partial<RoleplayScenarioRotationState>;

    if (
      !Array.isArray(parsed.catalog) ||
      !Array.isArray(parsed.remaining)
    ) {
      return null;
    }

    return {
      catalog: parsed.catalog.map(String),
      remaining: parsed.remaining.map(String),
      lastScenarioId:
        typeof parsed.lastScenarioId === 'string'
          ? parsed.lastScenarioId
          : null,
    };
  } catch {
    return null;
  }
}

async function writeRotationState(
  key: string,
  state: RoleplayScenarioRotationState,
): Promise<void> {
  memoryState.set(key, state);

  try {
    await AsyncStorage.setItem(
      key,
      JSON.stringify(state),
    );
  } catch {
    // In-memory rotation still prevents immediate repetition
    // during the current app process if device storage fails.
  }
}

export async function pickRotatingRoleplayScenario(
  input: {
    profession: RoleplayProfession;
    scenarios: readonly RoleplayScenarioSummary[];
    scope?: string;
  },
): Promise<string | undefined> {
  const catalog = eligibleScenarioIds(
    input.profession,
    input.scenarios,
  );

  if (catalog.length === 0) {
    return undefined;
  }

  const key = storageKey(
    input.profession,
    input.scope ?? 'workplace',
  );

  const previousState =
    await readRotationState(key);

  const result = selectNextRoleplayScenario(
    catalog,
    previousState,
  );

  await writeRotationState(
    key,
    result.state,
  );

  return result.scenarioId ?? undefined;
}
