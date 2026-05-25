import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { audioPlayer } from '../../exam/services/audioPlayer';
import { cardsService } from '../services/cardsService';
import type { CardBankBuckets, CardDeckScope, CardFeedback, CardMode, RuntimeCard } from '../types';
import { useStreakStore } from '../../../state/streakStore';

function defaultBanks(): CardBankBuckets { return { difficult: [], learned: [], learning: [] }; }
function nextReviewLabel(card: RuntimeCard | null) { if (!card) return null; if (card.state === 'mastered') return 'Strong recall'; if (card.state === 'difficult') return 'Needs extra repetition'; if (card.state === 'learning' && card.seen_count >= 2) return 'Still consolidating'; return 'Fresh card'; }
function buildHistorySnapshot(card: RuntimeCard, feedback: CardFeedback | null): RuntimeCard { if (!feedback) return card; if (feedback.correct) return { ...card, state: card.state === 'difficult' ? 'learning' : card.state }; return { ...card, state: card.seen_count >= 2 ? 'difficult' : 'learning' }; }

export function useCardPractice(mode: CardMode, scope?: CardDeckScope) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [current, setCurrent] = useState<RuntimeCard | null>(null);
  const [queuedNext, setQueuedNext] = useState<RuntimeCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<CardFeedback | null>(null);
  const [answer, setAnswer] = useState('');
  const [showBack, setShowBack] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [coachHint, setCoachHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [history, setHistory] = useState<RuntimeCard[]>([]);
  const [recallIndex, setRecallIndex] = useState<number | null>(null);
  const [banks, setBanks] = useState<CardBankBuckets>(defaultBanks);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [flagged, setFlagged] = useState(false);
  const streakHasHydrated = useStreakStore((state) => state.hasHydrated);
  const hydrateStreak = useStreakStore((state) => state.hydrate);
  const recordPractice = useStreakStore((state) => state.recordPractice);
  const streakRecordedRef = useRef(false);

  const loadBanks = useCallback(async () => { try { setBanks(await cardsService.banks(mode, scope)); } catch { setBanks(defaultBanks()); } }, [mode, scope]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const payload = await cardsService.start(mode, scope);
      setSessionId(payload.session.session_id); setCurrent(payload.firstCard); setQueuedNext(null); setFeedback(null); setAnswer(''); setShowBack(false); setShowHint(false); setCoachHint(null); setSessionCompleted(false); setHistory([]); setRecallIndex(null); setFlagged(false); streakRecordedRef.current = false; await loadBanks();
    } catch (err) { setError(err instanceof Error ? err.message : 'Card session failed to start'); setCurrent(null); setSessionId(null); }
    finally { setLoading(false); }
  }, [loadBanks, mode, scope]);

  useEffect(() => { void load(); }, [load, refreshKey]);

  useEffect(() => {
    if (!sessionCompleted || streakRecordedRef.current) return;
    streakRecordedRef.current = true;
    void (async () => {
      if (!streakHasHydrated) await hydrateStreak();
      await recordPractice();
    })();
  }, [hydrateStreak, recordPractice, sessionCompleted, streakHasHydrated]);
  const displayedCard = useMemo(() => recallIndex === null ? current : history[recallIndex] ?? current, [current, history, recallIndex]);
  const progress = useMemo(() => { if (!current) return { current: 0, total: 0, ratio: 0 }; const total = Math.max(current.order_index + 4, history.length + 1, 4); const currentPosition = current.order_index + 1; return { current: currentPosition, total, ratio: Math.min(1, currentPosition / total) }; }, [current, history.length]);
  const visibleHint = useMemo(() => showHint ? coachHint : null, [coachHint, showHint]);

  const playAudio = useCallback(async () => {
    const target = displayedCard?.audio?.segments?.[0]?.url;
    setError(null);
    try {
      if (target) { await audioPlayer.playAsync(target); return; }
      const text = displayedCard?.front_text;
      if (text) { await audioPlayer.playTextAsync(text, { onFail: () => setError('Audio playback is unavailable right now.') }); return; }
      setError('This card has no audio available.');
    } catch { setError('Audio playback is unavailable right now.'); }
  }, [displayedCard]);

  const flip = useCallback(() => { if (!current || recallIndex !== null) return; setShowBack((v) => !v); setShowHint(false); }, [current, recallIndex]);
  const revealHint = useCallback(async () => {
    if (!displayedCard || recallIndex !== null) return;
    setShowHint(true);
    if (coachHint) return;
    // ── Hint quality (#7.2) ────────────────────────────────────────────
    // Prefer the materialized card's hint (authored by content team or
    // synthesized by backend resolver). Both paths produce structurally
    // correct Finnish hints. Fall back to the service call only if the
    // card has no hint at all (defensive — the new backend always emits
    // a hint).
    const materializedHint = (displayedCard as { hint?: string } | null)?.hint;
    if (typeof materializedHint === 'string' && materializedHint.trim().length > 0) {
      setCoachHint(materializedHint.trim());
      return;
    }
    setHintLoading(true);
    try { setCoachHint(await cardsService.coachHint(displayedCard)); } catch { setCoachHint(displayedCard.hint || displayedCard.back_prompt || 'Read the card aloud, explain it in your own words, and make one simple example.'); }
    finally { setHintLoading(false); }
  }, [coachHint, displayedCard, recallIndex]);
  const hideHint = useCallback(() => setShowHint(false), []);

  const submit = useCallback(async () => {
    if (!sessionId || !current || !answer.trim() || recallIndex !== null) return;
    setSubmitting(true); setError(null);
    try {
      const result = await cardsService.answer(sessionId, answer.trim());
      const nextFeedback = { correct: result.correct, explanation: result.explanation, correctAnswer: result.correctAnswer, acceptedVariants: result.acceptedVariants };
      setFeedback(nextFeedback); setQueuedNext(result.nextCard ?? null); setHistory((existing) => [...existing, buildHistorySnapshot(current, nextFeedback)]); setSessionCompleted(result.sessionCompleted); await loadBanks();
    } catch (err) { setError(err instanceof Error ? err.message : 'Answer submission failed'); }
    finally { setSubmitting(false); }
  }, [answer, current, loadBanks, recallIndex, sessionId]);

  const advance = useCallback(async () => {
    if (recallIndex !== null) { setRecallIndex(null); return; }
    setFeedback(null); setAnswer(''); setShowBack(false); setShowHint(false); setCoachHint(null); setFlagged(false);
    if (queuedNext) { setCurrent(queuedNext); setQueuedNext(null); return; }
    if (sessionCompleted) { setCurrent(null); return; }
    if (!sessionId) return;
    try { const result = await cardsService.skip(sessionId); if (current) setHistory((e) => [...e, current]); setCurrent(result.nextCard ?? null); setSessionCompleted(result.completed); await loadBanks(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not move to the next card'); }
  }, [current, loadBanks, queuedNext, recallIndex, sessionCompleted, sessionId]);

  const skip = useCallback(async () => {
    if (!sessionId || !current || recallIndex !== null) return;
    try { const result = await cardsService.skip(sessionId); setHistory((e) => [...e, current]); setCurrent(result.nextCard ?? null); setFeedback(null); setAnswer(''); setShowBack(false); setShowHint(false); setCoachHint(null); setFlagged(false); setSessionCompleted(result.completed); await loadBanks(); } catch (err) { setError(err instanceof Error ? err.message : 'Skip failed'); }
  }, [current, loadBanks, recallIndex, sessionId]);

  const flagCurrent = useCallback(async (reason = 'malformed_card') => {
    if (!displayedCard) return false;
    try { await cardsService.flag(displayedCard, mode, scope, reason); setFlagged(true); return true; } catch { return false; }
  }, [displayedCard, mode, scope]);

  const recallBack = useCallback(() => { if (!history.length) return; setShowBack(false); setShowHint(false); setFeedback(null); setRecallIndex((i) => i === null ? Math.max(history.length - 1, 0) : Math.max(0, i - 1)); }, [history.length]);
  const recallForward = useCallback(() => { if (!history.length) return; setShowBack(false); setShowHint(false); setFeedback(null); setRecallIndex((i) => i === null ? Math.max(history.length - 1, 0) : i >= history.length - 1 ? null : i + 1); }, [history.length]);
  const refresh = useCallback(() => setRefreshKey((v) => v + 1), []);
  const currentLabel = nextReviewLabel(displayedCard);

  return { current, displayedCard, loading, submitting, feedback, progress, answer, setAnswer, showBack, showHint, visibleHint, hintLoading, playAudio, flip, revealHint, hideHint, submit, advance, skip, recallBack, recallForward, recallIndex, banks, sessionCompleted, refresh, error, currentLabel, flagCurrent, flagged };
}
