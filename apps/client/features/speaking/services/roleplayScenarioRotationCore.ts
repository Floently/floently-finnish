export type RoleplayScenarioRotationState = {
  catalog: string[];
  remaining: string[];
  lastScenarioId: string | null;
};

export type RoleplayScenarioRotationResult = {
  scenarioId: string | null;
  state: RoleplayScenarioRotationState;
};

function uniqueScenarioIds(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = String(value || '').trim();

    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function sameCatalog(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function safeRandomValue(random: () => number): number {
  const value = Number(random());

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(0.999999999999, value),
  );
}

function shuffleScenarioIds(
  values: readonly string[],
  random: () => number,
): string[] {
  const shuffled = [...values];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const swapIndex = Math.floor(
      safeRandomValue(random) * (index + 1),
    );

    const current = shuffled[index];
    shuffled[index] = shuffled[swapIndex];
    shuffled[swapIndex] = current;
  }

  return shuffled;
}

function moveDifferentScenarioFirst(
  remaining: string[],
  lastScenarioId: string | null,
): string[] {
  if (
    !lastScenarioId ||
    remaining.length <= 1 ||
    remaining[0] !== lastScenarioId
  ) {
    return remaining;
  }

  const alternativeIndex = remaining.findIndex(
    (scenarioId) => scenarioId !== lastScenarioId,
  );

  if (alternativeIndex <= 0) {
    return remaining;
  }

  const first = remaining[0];
  remaining[0] = remaining[alternativeIndex];
  remaining[alternativeIndex] = first;

  return remaining;
}

export function selectNextRoleplayScenario(
  catalogInput: readonly string[],
  previousState: RoleplayScenarioRotationState | null,
  random: () => number = Math.random,
): RoleplayScenarioRotationResult {
  const catalog = uniqueScenarioIds(catalogInput);

  if (catalog.length === 0) {
    return {
      scenarioId: null,
      state: {
        catalog: [],
        remaining: [],
        lastScenarioId: null,
      },
    };
  }

  const previousCatalog = uniqueScenarioIds(
    previousState?.catalog ?? [],
  );

  const previousLastScenarioId =
    previousState?.lastScenarioId &&
    catalog.includes(previousState.lastScenarioId)
      ? previousState.lastScenarioId
      : null;

  let remaining = sameCatalog(
    previousCatalog,
    catalog,
  )
    ? uniqueScenarioIds(
        previousState?.remaining ?? [],
      ).filter((scenarioId) =>
        catalog.includes(scenarioId),
      )
    : [];

  if (remaining.length === 0) {
    remaining = shuffleScenarioIds(
      catalog,
      random,
    );
  }

  remaining = moveDifferentScenarioFirst(
    remaining,
    previousLastScenarioId,
  );

  let scenarioId = remaining.shift() ?? null;

  if (
    scenarioId === previousLastScenarioId &&
    catalog.length > 1
  ) {
    const freshBag = moveDifferentScenarioFirst(
      shuffleScenarioIds(catalog, random),
      previousLastScenarioId,
    );

    scenarioId = freshBag.shift() ?? scenarioId;
    remaining = freshBag;
  }

  return {
    scenarioId,
    state: {
      catalog,
      remaining,
      lastScenarioId: scenarioId,
    },
  };
}
