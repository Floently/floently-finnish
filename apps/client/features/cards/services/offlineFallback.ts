import type { RuntimeCard } from '@core/api/cards';

// ─── Local card entry (card + correct answer metadata) ────────────────────────

type OfflineEntry = {
  card: RuntimeCard;
  correctOptionId: string;
  correctText: string;
};

// ─── Session store (in-memory, reset on reload) ───────────────────────────────

type OfflineSession = {
  entries: OfflineEntry[];
  index: number;
};

const sessions = new Map<string, OfflineSession>();

function makeSessionId() {
  return 'offline_' + Math.random().toString(36).slice(2, 12);
}

// ─── Card builder ─────────────────────────────────────────────────────────────

function card(
  id: string,
  front: string,
  prompt: string,
  opts: Array<{ id: string; text: string }>,
  correctId: string,
  orderIndex: number,
): OfflineEntry {
  const correctText = opts.find((o) => o.id === correctId)?.text ?? '';
  return {
    card: {
      id,
      state: 'new',
      front_text: front,
      back_prompt: correctText,
      seen_count: 0,
      correct_rate: 0,
      order_index: orderIndex,
      audio: null,
      served_follow_up: {
        variant_type: 'multiple_choice',
        prompt,
        options: opts.map((o) => ({ option_id: o.id, text: o.text })),
      },
    },
    correctOptionId: correctId,
    correctText,
  };
}

// ─── Vocabulary cards ─────────────────────────────────────────────────────────

const VOCABULARY: OfflineEntry[] = [
  card('v01', 'talo', 'What does "talo" mean?', [{ id: 'a', text: 'house' }, { id: 'b', text: 'car' }, { id: 'c', text: 'tree' }, { id: 'd', text: 'street' }], 'a', 0),
  card('v02', 'koira', 'What does "koira" mean?', [{ id: 'a', text: 'cat' }, { id: 'b', text: 'dog' }, { id: 'c', text: 'bird' }, { id: 'd', text: 'fish' }], 'b', 1),
  card('v03', 'vesi', 'What does "vesi" mean?', [{ id: 'a', text: 'fire' }, { id: 'b', text: 'air' }, { id: 'c', text: 'water' }, { id: 'd', text: 'earth' }], 'c', 2),
  card('v04', 'ruoka', 'What does "ruoka" mean?', [{ id: 'a', text: 'food' }, { id: 'b', text: 'drink' }, { id: 'c', text: 'table' }, { id: 'd', text: 'plate' }], 'a', 3),
  card('v05', 'kirja', 'What does "kirja" mean?', [{ id: 'a', text: 'pen' }, { id: 'b', text: 'paper' }, { id: 'c', text: 'book' }, { id: 'd', text: 'letter' }], 'c', 4),
  card('v06', 'työ', 'What does "työ" mean?', [{ id: 'a', text: 'play' }, { id: 'b', text: 'work' }, { id: 'c', text: 'rest' }, { id: 'd', text: 'study' }], 'b', 5),
  card('v07', 'perhe', 'What does "perhe" mean?', [{ id: 'a', text: 'friend' }, { id: 'b', text: 'neighbour' }, { id: 'c', text: 'family' }, { id: 'd', text: 'colleague' }], 'c', 6),
  card('v08', 'ystävä', 'What does "ystävä" mean?', [{ id: 'a', text: 'enemy' }, { id: 'b', text: 'stranger' }, { id: 'c', text: 'teacher' }, { id: 'd', text: 'friend' }], 'd', 7),
  card('v09', 'kauppa', 'What does "kauppa" mean?', [{ id: 'a', text: 'school' }, { id: 'b', text: 'shop / store' }, { id: 'c', text: 'bank' }, { id: 'd', text: 'hospital' }], 'b', 8),
  card('v10', 'aurinko', 'What does "aurinko" mean?', [{ id: 'a', text: 'moon' }, { id: 'b', text: 'star' }, { id: 'c', text: 'cloud' }, { id: 'd', text: 'sun' }], 'd', 9),
  card('v11', 'kieli', 'What does "kieli" mean?', [{ id: 'a', text: 'language / tongue' }, { id: 'b', text: 'culture' }, { id: 'c', text: 'country' }, { id: 'd', text: 'city' }], 'a', 10),
  card('v12', 'aika', 'What does "aika" mean?', [{ id: 'a', text: 'place' }, { id: 'b', text: 'time' }, { id: 'c', text: 'money' }, { id: 'd', text: 'number' }], 'b', 11),
];

// ─── Grammar cards ────────────────────────────────────────────────────────────

const GRAMMAR: OfflineEntry[] = [
  card('g01', 'minulla on', 'What does "minulla on" mean?', [{ id: 'a', text: 'I want' }, { id: 'b', text: 'I need' }, { id: 'c', text: 'I have' }, { id: 'd', text: 'I give' }], 'c', 0),
  card('g02', 'en osaa', 'What does "en osaa" mean?', [{ id: 'a', text: "I don't know how / I can't" }, { id: 'b', text: "I don't want" }, { id: 'c', text: "I don't have" }, { id: 'd', text: "I don't go" }], 'a', 1),
  card('g03', 'talot', 'What is "talot" the plural of?', [{ id: 'a', text: 'talon' }, { id: 'b', text: 'talo (house)' }, { id: 'c', text: 'taloa' }, { id: 'd', text: 'talossa' }], 'b', 2),
  card('g04', 'Partitive: "auto" →', 'Which is the partitive form of "auto"?', [{ id: 'a', text: 'auton' }, { id: 'b', text: 'autoa' }, { id: 'c', text: 'autot' }, { id: 'd', text: 'autoissa' }], 'b', 3),
  card('g05', 'Genitive: "kirja" →', 'Which is the genitive form of "kirja" (book)?', [{ id: 'a', text: 'kirjaa' }, { id: 'b', text: 'kirjat' }, { id: 'c', text: 'kirjan' }, { id: 'd', text: 'kirjassa' }], 'c', 4),
  card('g06', 'Past: "olla" →', 'What is the 3rd person singular past tense of "olla" (to be)?', [{ id: 'a', text: 'on' }, { id: 'b', text: 'olen' }, { id: 'c', text: 'oli' }, { id: 'd', text: 'olisi' }], 'c', 5),
  card('g07', 'en ole', 'What does "en ole" mean?', [{ id: 'a', text: "I am" }, { id: 'b', text: "I am not" }, { id: 'c', text: "I was" }, { id: 'd', text: "I was not" }], 'b', 6),
  card('g08', 'hän menee', 'What does "hän menee" mean?', [{ id: 'a', text: 'he/she went' }, { id: 'b', text: 'he/she goes / is going' }, { id: 'c', text: 'he/she will go' }, { id: 'd', text: 'he/she would go' }], 'b', 7),
  card('g09', 'Inessive: "talossa"', 'What case ending is "-ssa / -ssä"?', [{ id: 'a', text: 'Elative (out of)' }, { id: 'b', text: 'Illative (into)' }, { id: 'c', text: 'Inessive (inside, at)' }, { id: 'd', text: 'Allative (onto)' }], 'c', 8),
  card('g10', 'voiko', 'What does "Voiko?" mean in context?', [{ id: 'a', text: 'Should?' }, { id: 'b', text: 'Can? / Is it possible?' }, { id: 'c', text: 'Must?' }, { id: 'd', text: 'Does?' }], 'b', 9),
  card('g11', 'minä vs. mä', '"Mä" is the _____ form of "minä".', [{ id: 'a', text: 'formal written' }, { id: 'b', text: 'colloquial / spoken' }, { id: 'c', text: 'plural' }, { id: 'd', text: 'past tense' }], 'b', 10),
  card('g12', 'Conditional: "olisin"', 'What mood is "olisin"?', [{ id: 'a', text: 'Past tense' }, { id: 'b', text: 'Future tense' }, { id: 'c', text: 'Imperative' }, { id: 'd', text: 'Conditional (would be)' }], 'd', 11),
];

// ─── Phrase cards ─────────────────────────────────────────────────────────────

const PHRASES: OfflineEntry[] = [
  card('p01', 'Hyvää huomenta', 'What does "Hyvää huomenta" mean?', [{ id: 'a', text: 'Good night' }, { id: 'b', text: 'Good evening' }, { id: 'c', text: 'Good morning' }, { id: 'd', text: 'Good afternoon' }], 'c', 0),
  card('p02', 'Anteeksi', 'What does "Anteeksi" mean?', [{ id: 'a', text: 'Thank you' }, { id: 'b', text: 'Please' }, { id: 'c', text: 'Excuse me / Sorry' }, { id: 'd', text: 'Welcome' }], 'c', 1),
  card('p03', 'Kuinka paljon tämä maksaa?', 'What does "Kuinka paljon tämä maksaa?" mean?', [{ id: 'a', text: 'Where is this?' }, { id: 'b', text: 'How much does this cost?' }, { id: 'c', text: 'What time is it?' }, { id: 'd', text: 'Can I have this?' }], 'b', 2),
  card('p04', 'En ymmärrä', 'What does "En ymmärrä" mean?', [{ id: 'a', text: "I don't speak Finnish" }, { id: 'b', text: "I don't hear you" }, { id: 'c', text: "I don't remember" }, { id: 'd', text: "I don't understand" }], 'd', 3),
  card('p05', 'Missä on WC?', 'What does "Missä on WC?" mean?', [{ id: 'a', text: 'What time does it close?' }, { id: 'b', text: 'Is this the right bus?' }, { id: 'c', text: 'Where is the toilet?' }, { id: 'd', text: 'Is there a pharmacy nearby?' }], 'c', 4),
  card('p06', 'Olen kotoisin Suomesta', 'What does "Olen kotoisin Suomesta" mean?', [{ id: 'a', text: 'I live in Finland' }, { id: 'b', text: 'I am from Finland' }, { id: 'c', text: 'I am visiting Finland' }, { id: 'd', text: 'I like Finland' }], 'b', 5),
  card('p07', 'Näkemiin', 'What does "Näkemiin" mean?', [{ id: 'a', text: 'Hello' }, { id: 'b', text: 'See you later' }, { id: 'c', text: 'Goodbye' }, { id: 'd', text: 'Good luck' }], 'c', 6),
  card('p08', 'Puhutko englantia?', 'What does "Puhutko englantia?" mean?', [{ id: 'a', text: 'Do you like English?' }, { id: 'b', text: 'Can you read English?' }, { id: 'c', text: 'Is English easy?' }, { id: 'd', text: 'Do you speak English?' }], 'd', 7),
  card('p09', 'Paljonko kello on?', 'What does "Paljonko kello on?" mean?', [{ id: 'a', text: 'How much does the clock cost?' }, { id: 'b', text: 'What time is it?' }, { id: 'c', text: 'Is the store open?' }, { id: 'd', text: 'When does the train leave?' }], 'b', 8),
  card('p10', 'Haluaisin tilata...', 'What does "Haluaisin tilata..." mean?', [{ id: 'a', text: 'I have already ordered...' }, { id: 'b', text: 'Can I pay for...' }, { id: 'c', text: 'I would like to order...' }, { id: 'd', text: 'Do you have...' }], 'c', 9),
  card('p11', 'Mihin aikaan?', 'What does "Mihin aikaan?" mean?', [{ id: 'a', text: 'How far?' }, { id: 'b', text: 'How long?' }, { id: 'c', text: 'At what time?' }, { id: 'd', text: 'How often?' }], 'c', 10),
  card('p12', 'Voinko maksaa kortilla?', 'What does "Voinko maksaa kortilla?" mean?', [{ id: 'a', text: 'Where can I withdraw cash?' }, { id: 'b', text: 'Is there a discount?' }, { id: 'c', text: 'Can I pay by card?' }, { id: 'd', text: 'Is service included?' }], 'c', 11),
];

// ─── Mode lookup ──────────────────────────────────────────────────────────────

function getEntries(mode: string): OfflineEntry[] {
  if (mode === 'grammar') return GRAMMAR;
  if (mode === 'phrases') return PHRASES;
  return VOCABULARY;
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const OFFLINE_SESSION_PREFIX = 'offline_';

export function offlineStart(mode: string) {
  const entries = shuffle(getEntries(mode));
  const sessionId = makeSessionId();
  sessions.set(sessionId, { entries, index: 0 });
  return {
    session: { session_id: sessionId, status: 'active', total_cards: entries.length },
    firstCard: entries[0].card,
  };
}

export function offlineAnswer(sessionId: string, answer: string) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Offline session not found');
  const entry = session.entries[session.index];
  if (!entry) throw new Error('No more cards in offline session');
  const correct =
    answer === entry.correctOptionId ||
    answer.trim().toLowerCase() === entry.correctText.toLowerCase();
  session.index += 1;
  const sessionCompleted = session.index >= session.entries.length;
  const nextCard = sessionCompleted ? null : session.entries[session.index].card;
  return {
    correct,
    explanation: correct
      ? 'Correct!'
      : `The correct answer is: ${entry.correctText}`,
    correctAnswer: entry.correctText,
    acceptedVariants: [entry.correctText, entry.correctOptionId],
    nextCard,
    sessionCompleted,
  };
}

export function offlineSkip(sessionId: string) {
  const session = sessions.get(sessionId);
  if (!session) throw new Error('Offline session not found');
  session.index += 1;
  const completed = session.index >= session.entries.length;
  return {
    nextCard: completed ? null : session.entries[session.index].card,
    completed,
  };
}

export function offlineDecks(mode: string): RuntimeCard[] {
  return getEntries(mode).map((e) => e.card);
}
