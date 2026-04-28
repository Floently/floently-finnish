import registry from './finnishPersonas.json';

export type Gender = 'female' | 'male';
export type AgeBand = 'young' | 'adult' | 'senior';

export type FinnishPersona = {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  title: string | null;
  scenarios: string[];
  professions: string[];
  voiceProfile: string;
  ageBand: AgeBand;
};

export type PersonaPick = {
  id: string;
  displayName: string; // "Tohtori Mikko Nieminen" or "Liisa Korhonen"
  shortName: string;   // "Tohtori Nieminen" or "Liisa"
  firstName: string;
  lastName: string;
  gender: Gender;
  title: string | null;
  voiceProfile: string;
};

const PERSONAS: FinnishPersona[] = (registry as { personas: FinnishPersona[] }).personas;

/** Deterministic 32-bit hash (FNV-1a) so the same seed yields the same persona. */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildDisplay(persona: FinnishPersona): PersonaPick {
  const display = persona.title
    ? `${persona.title} ${persona.firstName} ${persona.lastName}`
    : `${persona.firstName} ${persona.lastName}`;
  const short = persona.title
    ? `${persona.title} ${persona.lastName}`
    : persona.firstName;
  return {
    id: persona.id,
    displayName: display,
    shortName: short,
    firstName: persona.firstName,
    lastName: persona.lastName,
    gender: persona.gender,
    title: persona.title,
    voiceProfile: persona.voiceProfile,
  };
}

/**
 * Pick a persona for a scenario + profession combination.
 * Matching precedence: exact scenario match > profession match > fallback to any general-tagged persona.
 * If `seed` is provided (recommended: `userId:sessionId`), selection is deterministic within that seed,
 * so mid-session reloads don't change the persona.
 */
export function pickPersonaForScenario(input: {
  scenarioId?: string | null;
  profession?: string | null;
  preferGender?: Gender | null;
  seed?: string | null;
}): PersonaPick {
  const scenarioId = (input.scenarioId || '').trim();
  const profession = (input.profession || '').trim().toLowerCase();
  const preferGender = input.preferGender ?? null;

  const scenarioMatches = scenarioId
    ? PERSONAS.filter((p) => p.scenarios.includes(scenarioId))
    : [];
  const professionMatches = profession
    ? PERSONAS.filter((p) => p.professions.includes(profession))
    : [];
  let pool = scenarioMatches.length ? scenarioMatches : professionMatches;
  if (!pool.length) {
    pool = PERSONAS.filter((p) => p.professions.includes('general'));
  }
  if (!pool.length) pool = PERSONAS;

  const genderFiltered = preferGender
    ? pool.filter((p) => p.gender === preferGender)
    : pool;
  const finalPool = genderFiltered.length ? genderFiltered : pool;

  const seed = input.seed || `${scenarioId}:${profession}:${Date.now()}`;
  const index = hashSeed(seed) % finalPool.length;
  return buildDisplay(finalPool[index]);
}

/** Exported for tests and admin tools. */
export function listPersonas(): FinnishPersona[] {
  return PERSONAS.slice();
}

export function getPersonaById(id: string): PersonaPick | null {
  const match = PERSONAS.find((p) => p.id === id);
  return match ? buildDisplay(match) : null;
}
