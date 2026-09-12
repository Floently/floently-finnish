import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { prerenderReadAudio, type ReadAudioSegment, type ReadVoice } from '@core/api/read';

export type ReadNarrationSourceSegment = string | {
  text: string;
  pauseAfterMs?: number;
};

export type ReadNarrationSnapshot = {
  active: boolean;
  buffering: boolean;
  interSegmentPause: boolean;
  currentSegment: number;
  currentTime: number;
  currentWord: string | null;
  duration: number;
  error: string | null;
  paused: boolean;
  playing: boolean;
  progress: number;
  totalSegments: number;
};

export function splitReadText(text: string, maxChars = 520): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [clean];
  const result: string[] = [];
  let current = '';
  for (const rawSentence of sentences) {
    const sentence = rawSentence.trim();
    if (!sentence) continue;
    const next = current ? `${current} ${sentence}` : sentence;
    if (current && next.length > maxChars) {
      result.push(current);
      current = sentence;
    } else {
      current = next;
    }
  }
  if (current) result.push(current);
  return result;
}

export function formatReadTime(seconds: number): string {
  const safe = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function useReadNarrator(input: {
  token: string | null;
  voice: ReadVoice | null;
  rate: number;
}) {
  const player = useAudioPlayer(null, {
    updateInterval: 180,
    keepAudioSessionActive: true,
    preferredForwardBufferDuration: 8,
  });
  const playerStatus = useAudioPlayerStatus(player);
  const segmentsRef = useRef<string[]>([]);
  const pauseAfterRef = useRef<number[]>([]);
  const cacheRef = useRef(new Map<string, ReadAudioSegment>());
  const revisionRef = useRef(0);
  const finishHandledRef = useRef(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(input.token);
  const voiceRef = useRef(input.voice);
  const rateRef = useRef(input.rate);
  const currentAudioRef = useRef<ReadAudioSegment | null>(null);
  const [active, setActive] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [interSegmentPause, setInterSegmentPause] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { tokenRef.current = input.token; }, [input.token]);
  useEffect(() => { voiceRef.current = input.voice; }, [input.voice]);
  useEffect(() => {
    rateRef.current = input.rate;
    try { player.setPlaybackRate(input.rate, 'high'); } catch { /* source may not be loaded yet */ }
  }, [input.rate, player]);

  const clearInterSegmentPause = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
    setInterSegmentPause(false);
  }, []);

  useEffect(() => {
    void setIsAudioActiveAsync(true);
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
    player.volume = 1;
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }
      try { player.pause(); } catch { /* no-op */ }
    };
  }, [player]);

  const audioKey = useCallback((index: number) => {
    const voiceId = voiceRef.current?.id ?? '';
    return `${voiceId}:${index}:${segmentsRef.current[index] ?? ''}`;
  }, []);

  const getAudio = useCallback(async (index: number, revision: number): Promise<ReadAudioSegment> => {
    const key = audioKey(index);
    const cached = cacheRef.current.get(key);
    if (cached) return cached;
    const token = tokenRef.current?.trim() ?? '';
    const voice = voiceRef.current;
    if (!token) throw new Error('Sign in to Floently Read before starting audio.');
    if (!voice) throw new Error('Choose a Read voice before starting audio.');
    const text = segmentsRef.current[index];
    if (!text) throw new Error('This reading segment is empty.');
    const result = await prerenderReadAudio(token, {
      text,
      voiceId: voice.id,
      locale: voice.locale,
      language: voice.language,
      voiceName: voice.voiceName,
    });
    if (revision === revisionRef.current) cacheRef.current.set(key, result);
    return result;
  }, [audioKey]);

  const prefetch = useCallback((index: number, revision: number) => {
    if (index < 0 || index >= segmentsRef.current.length) return;
    void getAudio(index, revision).catch(() => undefined);
  }, [getAudio]);

  const playSegment = useCallback(async (index: number, revision: number) => {
    if (revision !== revisionRef.current) return;
    if (index >= segmentsRef.current.length) {
      setActive(false);
      setBuffering(false);
      setCurrentSegment(Math.max(segmentsRef.current.length - 1, 0));
      return;
    }
    setError(null);
    setBuffering(true);
    setCurrentSegment(index);
    finishHandledRef.current = true;
    try {
      const audio = await getAudio(index, revision);
      if (revision !== revisionRef.current) return;
      currentAudioRef.current = audio;
      player.pause();
      player.replace(audio.audioUrl);
      player.volume = 1;
      player.setPlaybackRate(rateRef.current, 'high');
      setBuffering(false);
      setActive(true);
      player.play();
      prefetch(index + 1, revision);
    } catch (cause) {
      if (revision !== revisionRef.current) return;
      setBuffering(false);
      setActive(false);
      setError(cause instanceof Error ? cause.message : 'Could not start Read audio.');
    }
  }, [getAudio, player, prefetch]);

  const startSegments = useCallback(async (sourceSegments: ReadNarrationSourceSegment[], startIndex = 0) => {
    const normalized = sourceSegments
      .map((segment) => typeof segment === 'string'
        ? { text: segment.replace(/\s+/g, ' ').trim(), pauseAfterMs: 0 }
        : { text: String(segment.text || '').replace(/\s+/g, ' ').trim(), pauseAfterMs: Math.max(0, Number(segment.pauseAfterMs || 0)) })
      .filter((segment) => Boolean(segment.text));
    const segments = normalized.map((segment) => segment.text);
    const revision = revisionRef.current + 1;
    revisionRef.current = revision;
    clearInterSegmentPause();
    try { player.pause(); } catch { /* no-op */ }
    void player.seekTo(0).catch(() => undefined);
    segmentsRef.current = segments;
    pauseAfterRef.current = normalized.map((segment) => segment.pauseAfterMs);
    cacheRef.current.clear();
    currentAudioRef.current = null;
    const normalizedStartIndex = segments.length > 0 ? Math.min(Math.max(0, Math.floor(startIndex)), segments.length - 1) : 0;
    setCurrentSegment(normalizedStartIndex);
    setError(null);
    setActive(Boolean(segments.length));
    if (!segments.length) {
      setBuffering(false);
      setError('No readable text was found.');
      return;
    }
    await playSegment(normalizedStartIndex, revision);
  }, [clearInterSegmentPause, playSegment, player]);

  const start = useCallback(async (text: string, startIndex = 0) => {
    await startSegments(splitReadText(text), startIndex);
  }, [startSegments]);

  const stop = useCallback(() => {
    revisionRef.current += 1;
    finishHandledRef.current = true;
    clearInterSegmentPause();
    try { player.pause(); } catch { /* no-op */ }
    void player.seekTo(0).catch(() => undefined);
    currentAudioRef.current = null;
    setActive(false);
    setBuffering(false);
    setError(null);
  }, [clearInterSegmentPause, player]);

  const togglePause = useCallback(() => {
    if (!active || buffering || interSegmentPause) return;
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [active, buffering, interSegmentPause, player, playerStatus.playing]);

  const jumpToSegment = useCallback((index: number) => {
    if (!segmentsRef.current.length) return;
    const next = Math.min(segmentsRef.current.length - 1, Math.max(0, index));
    const revision = revisionRef.current + 1;
    revisionRef.current = revision;
    clearInterSegmentPause();
    try { player.pause(); } catch { /* no-op */ }
    void player.seekTo(0).catch(() => undefined);
    setActive(true);
    void playSegment(next, revision);
  }, [clearInterSegmentPause, playSegment, player]);

  const skipBackward = useCallback(() => {
    if (!segmentsRef.current.length) return;
    if (playerStatus.currentTime > 4) {
      void player.seekTo(0).catch(() => undefined);
      return;
    }
    jumpToSegment(currentSegment - 1);
  }, [currentSegment, jumpToSegment, player, playerStatus.currentTime]);

  const skipForward = useCallback(() => {
    if (!segmentsRef.current.length) return;
    jumpToSegment(currentSegment + 1);
  }, [currentSegment, jumpToSegment]);

  const seekCurrent = useCallback((seconds: number) => {
    const duration = playerStatus.duration || currentAudioRef.current?.duration || 0;
    if (!duration) return;
    void player.seekTo(Math.min(duration, Math.max(0, seconds))).catch(() => undefined);
  }, [player, playerStatus.duration]);

  useEffect(() => {
    if (playerStatus.playing) {
      finishHandledRef.current = false;
    }
  }, [playerStatus.playing]);

  useEffect(() => {
    if (!active || buffering || !playerStatus.didJustFinish || finishHandledRef.current) return;
    finishHandledRef.current = true;
    const next = currentSegment + 1;
    if (next >= segmentsRef.current.length) {
      setActive(false);
      setBuffering(false);
      setInterSegmentPause(false);
      return;
    }
    const pauseAfterMs = Math.max(0, pauseAfterRef.current[currentSegment] || 0);
    if (pauseAfterMs > 0) {
      const revision = revisionRef.current;
      setInterSegmentPause(true);
      pauseTimerRef.current = setTimeout(() => {
        pauseTimerRef.current = null;
        if (revision !== revisionRef.current) return;
        setInterSegmentPause(false);
        void playSegment(next, revision);
      }, pauseAfterMs);
      return;
    }
    void playSegment(next, revisionRef.current);
  }, [active, buffering, currentSegment, playSegment, playerStatus.didJustFinish]);

  const duration = playerStatus.duration || currentAudioRef.current?.duration || 0;
  const currentTime = playerStatus.currentTime || 0;
  const segmentProgress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const totalSegments = segmentsRef.current.length;
  const progress = totalSegments > 0 ? Math.min(1, (currentSegment + segmentProgress) / totalSegments) : 0;
  const currentWord = useMemo(() => {
    const timings = currentAudioRef.current?.wordTimings ?? [];
    if (!timings.length) return null;
    const timing = timings.find((item) => currentTime >= item.start && currentTime < item.end)
      ?? timings.find((item) => item.start > currentTime);
    return timing?.word ?? null;
  }, [currentTime, currentSegment]);

  const snapshot: ReadNarrationSnapshot = {
    active,
    buffering: buffering || (active && playerStatus.isBuffering),
    interSegmentPause,
    currentSegment,
    currentTime,
    currentWord,
    duration,
    error,
    paused: active && !buffering && !interSegmentPause && !playerStatus.playing,
    playing: active && playerStatus.playing,
    progress,
    totalSegments,
  };

  return {
    ...snapshot,
    start,
    startSegments,
    jumpToSegment,
    stop,
    togglePause,
    skipBackward,
    skipForward,
    seekCurrent,
    currentText: segmentsRef.current[currentSegment] ?? '',
  };
}
