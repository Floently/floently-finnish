import { apiClient } from './client';
import { resolveApiUrl } from './apiConfig';

function friendlyCardError(error: unknown): string {
  const raw = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : '';

  const message = raw.trim();

  if (
    !message ||
    /\{\{.*\}\}/.test(message) ||
    /card unavailable/i.test(message) ||
    /session_invalid/i.test(message) ||
    /network/i.test(message)
  ) {
    return 'Network problem. Cards could not be loaded. Please check your connection and try again.';
  }

  return message;
}

export type CardMode = 'vocabulary' | 'grammar' | 'phrases';
export type CardDomain = 'general' | 'professional';
export type CardProfession = 'none' | 'general_workplace' | 'doctor' | 'nurse' | 'practical_nurse' | 'other';
export type RuntimeCardState = 'new' | 'learning' | 'mastered' | 'difficult';

export type CardPrompt = {
  id: string;
  mode: CardMode;
  front: string;
  prompt: string;
  choices?: string[];
  acceptedAnswers?: string[];
  hint?: string;
  explanation?: string;
  dueAt?: string;
};

export type CardFilters = {
  mode: CardMode;
  domain: CardDomain;
  profession?: CardProfession | null;
  level?: string | null;
  adaptive?: boolean;
  source?: string | null;
};

function contentTypeForMode(mode: CardMode): 'vocabulary_card' | 'sentence_card' | 'grammar_card' {
  if (mode === 'phrases') return 'sentence_card';
  if (mode === 'grammar') return 'grammar_card';
  return 'vocabulary_card';
}

export type ServedOption = { option_id: string; text: string };
export type ServedFollowUp = {
  variant_type: string;
  prompt: string;
  options: ServedOption[];
  blank_template?: string | null;
  context_text?: string | null;
  stimulus_text?: string | null;
};
export type CardAudioSegment = { url: string; sequence_index: number };
export type CardAudio = { segments: CardAudioSegment[] };

export type RuntimeCard = {
  id: string;
  state: RuntimeCardState;
  front_text: string;
  back_prompt: string;
  seen_count: number;
  correct_rate: number;
  order_index: number;
  audio?: CardAudio | null;
  served_follow_up: ServedFollowUp;
  explanation?: string | null;
  hint?: string | null;
};

type SessionState = { session_id: string; status: string; total_cards: number };
type BackendCard = RuntimeCard;

function mapCard(card: BackendCard | null | undefined): RuntimeCard | null {
  if (!card) return null;
  return {
    ...card,
    state: (card.state as RuntimeCardState) ?? 'new',
    audio: card.audio
      ? { ...card.audio, segments: (card.audio.segments ?? []).map((segment) => ({ ...segment, url: resolveApiUrl(segment.url) })) }
      : card.audio ?? null,
  };
}
function requireCard(card: BackendCard | null | undefined, context: string): RuntimeCard { const mapped = mapCard(card); if (!mapped) throw new Error(`${context}: no card data returned`); return mapped; }

export async function startCardSession(filters: CardFilters): Promise<{ session: SessionState; firstCard: RuntimeCard }> {
  const params = new URLSearchParams({ domain: filters.domain, content_type: contentTypeForMode(filters.mode), ...(filters.profession ? { profession: filters.profession } : {}), ...(filters.level ? { level: filters.level } : {}), ...(filters.source ? { source: filters.source } : {}) });
  const res = await apiClient.get<{ session: SessionState; first_card: BackendCard }>(`/cards/session/adaptive/start?${params.toString()}`);
  if (!res.ok || !res.data) throw new Error(friendlyCardError(res.error));
  return { session: res.data.session, firstCard: requireCard(res.data.first_card, 'startCardSession') };
}

export async function submitCardAnswer(payload: { sessionId: string; userAnswer: string }): Promise<{ correct: boolean; explanation?: string | null; correctAnswer: string; acceptedVariants: string[]; nextCard: RuntimeCard | null; sessionCompleted: boolean }> {
  const res = await apiClient.post<any>(`/cards/session/${payload.sessionId}/answer`, { user_answer: payload.userAnswer });
  if (!res.ok || !res.data) throw new Error(res.error ?? 'Answer submission failed');
  return { correct: res.data.correct, explanation: res.data.explanation ?? null, correctAnswer: res.data.correct_answer?.value ?? '', acceptedVariants: res.data.accepted_variants ?? [], nextCard: mapCard(res.data.next_card ?? null), sessionCompleted: res.data.session_completed };
}

export async function skipCard(sessionId: string): Promise<{ nextCard: RuntimeCard | null; completed: boolean }> {
  const res = await apiClient.get<{ card?: BackendCard | null; completed: boolean }>(`/cards/session/${sessionId}/next`);
  if (!res.ok || !res.data) throw new Error(res.error ?? 'Could not advance to next card');
  return { nextCard: mapCard(res.data.card ?? null), completed: res.data.completed };
}

export async function getDeckCards(filters: CardFilters): Promise<RuntimeCard[]> {
  const params = new URLSearchParams({ domain: filters.domain, content_type: contentTypeForMode(filters.mode), ...(filters.profession ? { profession: filters.profession } : {}), ...(filters.level ? { level: filters.level } : {}), ...(filters.source ? { source: filters.source } : {}) });
  const res = await apiClient.get<{ cards: BackendCard[] }>(`/cards/deck?${params.toString()}`);
  if (!res.ok || !res.data) return [];
  return (res.data.cards ?? []).map((c) => mapCard(c)).filter((c): c is RuntimeCard => c !== null);
}

function fallbackCoachHint(card: RuntimeCard): string {
  const front = String(card.front_text || '').trim();
  const prompt = String(card.back_prompt || '').trim();
  const variant = String(card.served_follow_up?.variant_type || 'recognition');
  if (variant === 'grammar_card' || /taiv|verbi|sija|rakenne/i.test(prompt)) {
    return `Grammar coach: “${front}”. Focus on why this form appears in context. Say one short Finnish example sentence, then make another similar sentence of your own.`;
  }
  if (variant === 'sentence_card' || /lause/i.test(prompt)) {
    return `Sentence coach: read the sentence aloud slowly, then explain in simple Finnish what it means. Example pattern: what happened, who it concerns, and what comes next.`;
  }
  return `Word coach: “${front}”. Say the word aloud, give the closest meaning in your own words, then use it in one simple Finnish example and one work-related example.`;
}

export async function requestCardCoachHint(card: RuntimeCard): Promise<string> {
  const res = await apiClient.post<any>('/cards/coach/hint', { card_id: card.id, front_text: card.front_text, prompt: card.back_prompt, content_type: card.served_follow_up?.variant_type || null });
  if (res.ok && typeof res.data?.hint === 'string' && res.data.hint.trim()) return res.data.hint.trim();
  return fallbackCoachHint(card);
}

export async function flagCardIssue(input: { cardId: string; mode: CardMode; domain?: CardDomain | null; profession?: CardProfession | null; reason: string; note?: string | null }): Promise<boolean> {
  const res = await apiClient.post<any>('/cards/flag', { card_id: input.cardId, reason: input.reason, note: input.note ?? null });
  return res.ok;
}
