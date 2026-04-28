/**
 * Finnish placement item bank — IRT calibrated.
 *
 * Each item has a difficulty (theta) on the CEFR logit scale:
 *   A1 ≈ -2.0, A2 ≈ -1.0, B1 ≈ 0.0, B2 ≈ +1.0, C1 ≈ +2.0, C2 ≈ +3.0
 * and a discrimination (a) parameter; higher = more informative per item.
 *
 * Items are hand-calibrated against CEFR can-do descriptors and the four
 * high-discrimination Finnish morphological signals from the DIALUKI (2009-2013)
 * Finnish diagnostic research:
 *   1. Consonant gradation (astevaihtelu) — separates A2 from B1
 *   2. Partitive vs. nominative object — separates B1 from B2
 *   3. Verb rection (verb-required cases) — separates B2 from C1
 *   4. Clitic particles (-han, -pa, -kin) — separates C1 from C2
 *
 * Items are `itemType`-tagged so the adaptive engine can balance the skill mix
 * and the result screen can report per-skill profile.
 *
 * Re-calibrate `theta` and `a` after collecting a few hundred real user responses
 * (fit a 2PL Rasch-family model; scipy / R `ltm`, etc).
 */

export type ItemType = 'vocabulary' | 'morphology_gradation' | 'object_case' | 'verb_rection' | 'clitics' | 'reading_comprehension' | 'register' | 'word_order';
export type SkillArea = 'reading' | 'listening' | 'vocabulary' | 'grammar';

export type PlacementItem = {
  id: string;
  itemType: ItemType;
  skills: SkillArea[];        // which skill area(s) this item contributes to in the final profile
  theta: number;               // IRT difficulty (logit scale)
  a: number;                   // IRT discrimination
  prompt: string;
  helperText?: string;         // shown under the prompt in smaller text, e.g. translation hints
  options: string[];
  answer: string;
  rationale?: string;          // not shown to user, for admin/debugging
};

export const PLACEMENT_ITEMS: PlacementItem[] = [
  // --- A1 level (theta ≈ -2.0) ---
  {
    id: 'fi-a1-greet',
    itemType: 'vocabulary',
    skills: ['vocabulary'],
    theta: -2.0,
    a: 1.0,
    prompt: 'Which is a polite greeting in Finnish?',
    options: ['Hyvää päivää', 'Tietokone', 'Kirjasto', 'Maanantai'],
    answer: 'Hyvää päivää',
    rationale: 'Basic survival vocabulary, A1.',
  },
  {
    id: 'fi-a1-conj-olla',
    itemType: 'morphology_gradation',
    skills: ['grammar'],
    theta: -1.8,
    a: 1.4,
    prompt: 'Fill the blank: Minä ___ Helsingistä.',
    helperText: '"I ___ from Helsinki."',
    options: ['olen', 'olet', 'on', 'ovat'],
    answer: 'olen',
    rationale: 'Olla conjugation 1sg — A1 threshold skill.',
  },
  {
    id: 'fi-a1-numbers',
    itemType: 'reading_comprehension',
    skills: ['reading', 'vocabulary'],
    theta: -1.8,
    a: 0.9,
    prompt: '"Kello on kaksikymmentä yli seitsemän." — what time is it?',
    options: ['7:20', '2:07', '7:02', '20:07'],
    answer: '7:20',
    rationale: 'Time-telling comprehension, A1.',
  },

  // --- A2 level (theta ≈ -1.0) ---
  {
    id: 'fi-a2-past',
    itemType: 'morphology_gradation',
    skills: ['grammar'],
    theta: -1.0,
    a: 1.5,
    prompt: 'Choose the correct past tense: "Eilen minä ___ kahvilassa."',
    helperText: '"Yesterday I ___ at a café."',
    options: ['olin', 'olen', 'olisin', 'ollut'],
    answer: 'olin',
    rationale: 'Past tense imperfect 1sg of olla — A2.',
  },
  {
    id: 'fi-a2-gradation-basic',
    itemType: 'morphology_gradation',
    skills: ['grammar'],
    theta: -0.8,
    a: 1.7,
    prompt: 'Which is the genitive of "kauppa" (shop)?',
    helperText: 'Test of consonant gradation.',
    options: ['kaupan', 'kauppan', 'kauppaan', 'kaupassa'],
    answer: 'kaupan',
    rationale: 'Consonant gradation pp→p; high-discrimination A2/B1 boundary.',
  },
  {
    id: 'fi-a2-everyday-read',
    itemType: 'reading_comprehension',
    skills: ['reading'],
    theta: -1.0,
    a: 1.0,
    prompt: '"Asema on kiinni sunnuntaina." means:',
    options: ['The station is closed on Sunday', 'The station opens early', 'The station is busy', 'The station is near'],
    answer: 'The station is closed on Sunday',
    rationale: 'Everyday reading, A2.',
  },

  // --- B1 level (theta ≈ 0.0) ---
  {
    id: 'fi-b1-gradation-advanced',
    itemType: 'morphology_gradation',
    skills: ['grammar'],
    theta: 0.2,
    a: 1.8,
    prompt: 'Complete: "Otan kupin ___." (kahvi)',
    helperText: 'Insert the noun in its correct form.',
    options: ['kahvia', 'kahvi', 'kahvin', 'kahvilla'],
    answer: 'kahvia',
    rationale: 'Partitive case for indefinite quantity — B1 hinge.',
  },
  {
    id: 'fi-b1-object-partitive',
    itemType: 'object_case',
    skills: ['grammar'],
    theta: 0.3,
    a: 1.9,
    prompt: 'Which is correct? "Luen ___ joka ilta."',
    helperText: '"I read ___ every evening." — choose the correct case for the ongoing action.',
    options: ['kirjaa', 'kirjan', 'kirja', 'kirjassa'],
    answer: 'kirjaa',
    rationale: 'Partitive object for ongoing/atelic action — classic B1/B2 discriminator.',
  },
  {
    id: 'fi-b1-work-read',
    itemType: 'reading_comprehension',
    skills: ['reading'],
    theta: 0.1,
    a: 1.1,
    prompt: '"Pyydän teitä seuraamaan vointia yön aikana." means:',
    options: [
      'Please monitor the condition during the night',
      'Please leave during the night',
      'Please return in a week',
      'Please call the doctor now',
    ],
    answer: 'Please monitor the condition during the night',
    rationale: 'Professional reading comprehension, B1.',
  },

  // --- B2 level (theta ≈ +1.0) ---
  {
    id: 'fi-b2-object-completed',
    itemType: 'object_case',
    skills: ['grammar'],
    theta: 0.9,
    a: 1.9,
    prompt: 'Which is correct? "Söin ___ eilen illalla."',
    helperText: '"I ate ___ last night." — the action is completed.',
    options: ['omenan', 'omenaa', 'omena', 'omenassa'],
    answer: 'omenan',
    rationale: 'Accusative/genitive object for completed action — B1→B2 boundary.',
  },
  {
    id: 'fi-b2-rection-pitaa',
    itemType: 'verb_rection',
    skills: ['grammar'],
    theta: 1.1,
    a: 1.7,
    prompt: 'Which is correct? "Pidän ___."',
    helperText: '"I like ___." Choose the correct case the verb requires.',
    options: ['kahvista', 'kahvia', 'kahvin', 'kahvissa'],
    answer: 'kahvista',
    rationale: 'Pitää + elative rection — high-discrimination B2.',
  },
  {
    id: 'fi-b2-word-order',
    itemType: 'word_order',
    skills: ['grammar', 'reading'],
    theta: 1.0,
    a: 1.3,
    prompt: 'Most natural Finnish sentence for "If the patient feels worse, report it immediately":',
    options: [
      'Jos potilas voi huonommin, ilmoita heti.',
      'Jos potilas huonommin voi, heti ilmoita.',
      'Jos voi potilas huonommin, ilmoita.',
      'Potilas jos huonommin voi, heti.',
    ],
    answer: 'Jos potilas voi huonommin, ilmoita heti.',
    rationale: 'Natural SVO + adjunct word order in conditional, B2.',
  },

  // --- C1 level (theta ≈ +2.0) ---
  {
    id: 'fi-c1-rection-rakastaa',
    itemType: 'verb_rection',
    skills: ['grammar', 'vocabulary'],
    theta: 1.9,
    a: 1.8,
    prompt: 'Which is correct? "Hän rakastaa ___."',
    helperText: '"He/she loves ___." — choose the correct case.',
    options: ['musiikkia', 'musiikista', 'musiikin', 'musiikissa'],
    answer: 'musiikkia',
    rationale: 'Rakastaa + partitive rection — C1 control of verb-case pairings.',
  },
  {
    id: 'fi-c1-register',
    itemType: 'register',
    skills: ['reading', 'vocabulary'],
    theta: 2.0,
    a: 1.5,
    prompt: 'Most natural sentence in professional written Finnish:',
    options: [
      'Tilanne edellyttää jatkoseurantaa.',
      'Tilanne tarvitsee seurata lisää.',
      'Tilanne on seurata lisää.',
      'Tilanne seuranta pitää.',
    ],
    answer: 'Tilanne edellyttää jatkoseurantaa.',
    rationale: 'Nominalization + formal register — C1.',
  },
  {
    id: 'fi-c1-reading-professional',
    itemType: 'reading_comprehension',
    skills: ['reading', 'vocabulary'],
    theta: 2.1,
    a: 1.3,
    prompt: '"Hoidon vaste jäi odotettua heikommaksi." means:',
    options: [
      'The treatment response was weaker than expected',
      'The treatment started earlier than expected',
      'The treatment response was excellent',
      'The treatment was cancelled',
    ],
    answer: 'The treatment response was weaker than expected',
    rationale: 'Translative case + comparative + professional vocab, C1.',
  },

  // --- C2 level (theta ≈ +3.0) ---
  {
    id: 'fi-c2-clitic-han',
    itemType: 'clitics',
    skills: ['grammar', 'listening'],
    theta: 2.8,
    a: 1.6,
    prompt: 'What nuance does "-han" add in "Tämähän on hienoa!"?',
    options: [
      'Mild surprise or a reminder of shared knowledge',
      'Strong doubt',
      'A direct question',
      'A formal greeting',
    ],
    answer: 'Mild surprise or a reminder of shared knowledge',
    rationale: 'Clitic -han pragmatic function — C2 level awareness.',
  },
];

/**
 * Pick the next item adaptively given current ability estimate.
 * Prefers items whose difficulty is close to theta (maximally informative under IRT).
 * Breaks ties by highest discrimination (a). Excludes already-used ids.
 * Also tries to balance the item-type mix so the skill profile reports stay meaningful.
 */
export function pickNextItem(params: {
  abilityTheta: number;
  usedIds: string[];
  usedTypes: ItemType[];
}): PlacementItem | null {
  const { abilityTheta, usedIds, usedTypes } = params;
  const used = new Set(usedIds);
  const pool = PLACEMENT_ITEMS.filter((it) => !used.has(it.id));
  if (!pool.length) return null;

  // Under-represented types get a mild preference, to avoid 6 morphology items in a row.
  const typeCounts = usedTypes.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const maxUses = 2; // soft cap per item type across the 9 items

  const scored = pool.map((it) => {
    const distance = Math.abs(it.theta - abilityTheta);
    const typeUsed = typeCounts[it.itemType] ?? 0;
    const overcapPenalty = typeUsed >= maxUses ? 100 : 0;
    // Lower score = better pick. Distance dominates; discrimination tiebreaker; type cap hard-penalizes.
    const score = distance * 10 - it.a + overcapPenalty;
    return { item: it, score };
  });
  scored.sort((a, b) => a.score - b.score);
  return scored[0]?.item ?? null;
}

/**
 * Pick the first item — a slightly-below-B1 starter so most users get a fair mid-range start
 * regardless of their true level. Research shows a mid-level anchor converges faster than
 * always starting at the mean or at A1.
 */
export function pickFirstItem(): PlacementItem {
  return pickNextItem({ abilityTheta: 0.0, usedIds: [], usedTypes: [] }) ?? PLACEMENT_ITEMS[0];
}
