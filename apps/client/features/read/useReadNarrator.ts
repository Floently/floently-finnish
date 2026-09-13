import { clearPreloadedSource, preload, setAudioModeAsync, setIsAudioActiveAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
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
  currentWordIndex: number;
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
  nowPlaying?: {
    title?: string;
    artist?: string;
    albumTitle?: string;
  };
}) {
  const player = useAudioPlayer(null, {
    updateInterval: 180,
    keepAudioSessionActive: true,
    preferredForwardBufferDuration: 8,
  });
  const playerStatus = useAudioPlayerStatus(player);
  const segmentsRef = useRef<string[]>([]);
  const cacheRef = useRef(new Map<string, ReadAudioSegment>());
  const revisionRef = useRef(0);
  const finishHandledRef = useRef(false);
  const desiredPlayingRef = useRef(false);
  const tokenRef = useRef(input.token);
  const voiceRef = useRef(input.voice);
  const rateRef = useRef(input.rate);
  const currentAudioRef = useRef<ReadAudioSegment | null>(null);
  const preloadedRef = useRef(new Map<number, string>());
  const transitionRetryRef = useRef<{ revision: number; deadline: number; lastAttempt: number } | null>(null);
  const lockScreenActiveRef = useRef(false);
  const [active, setActive] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [interSegmentPause, setInterSegmentPause] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [desiredPlaying, setDesiredPlaying] = useState(false);
  const lockScreenMetadata = useMemo(() => ({
    title: input.nowPlaying?.title?.trim() || 'Floently Read',
    artist: input.nowPlaying?.artist?.trim() || input.voice?.name || 'Floently Read',
    albumTitle: input.nowPlaying?.albumTitle?.trim() || 'Floently Read',
  }), [input.nowPlaying?.albumTitle, input.nowPlaying?.artist, input.nowPlaying?.title, input.voice?.name]);

  const setPlaybackIntent = useCallback((value: boolean) => {
    desiredPlayingRef.current = value;
    setDesiredPlaying(value);
  }, []);

  useEffect(() => { tokenRef.current = input.token; }, [input.token]);
  useEffect(() => { voiceRef.current = input.voice; }, [input.voice]);
  useEffect(() => {
    rateRef.current = input.rate;
    try { player.setPlaybackRate(input.rate, 'high'); } catch { /* source may not be loaded yet */ }
  }, [input.rate, player]);

  useEffect(() => {
    void setIsAudioActiveAsync(true);
    void setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldPlayInBackground: true,
      shouldRouteThroughEarpiece: false,
    });
    player.volume = 1;
    return () => {
      desiredPlayingRef.current = false;
      transitionRetryRef.current = null;
      try { player.clearLockScreenControls(); } catch { /* unsupported platform */ }
      lockScreenActiveRef.current = false;
      for (const audioUrl of preloadedRef.current.values()) {
        void clearPreloadedSource(audioUrl).catch(() => undefined);
      }
      preloadedRef.current.clear();
      try { player.pause(); } catch { /* no-op */ }
    };
  }, [player]);

  useEffect(() => {
    if (!active) {
      if (lockScreenActiveRef.current) {
        try { player.clearLockScreenControls(); } catch { /* unsupported platform */ }
        lockScreenActiveRef.current = false;
      }
      return;
    }
    try {
      if (!lockScreenActiveRef.current) {
        player.setActiveForLockScreen(true, lockScreenMetadata, { showSeekBackward: true, showSeekForward: true });
        lockScreenActiveRef.current = true;
      } else {
        player.updateLockScreenMetadata(lockScreenMetadata);
      }
    } catch { /* lock-screen controls are best-effort */ }
  }, [active, lockScreenMetadata, player]);

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

  const clearTrackedPreloads = useCallback((beforeIndex = Number.POSITIVE_INFINITY) => {
    for (const [index, audioUrl] of preloadedRef.current.entries()) {
      if (index >= beforeIndex) continue;
      preloadedRef.current.delete(index);
      void clearPreloadedSource(audioUrl).catch(() => undefined);
    }
  }, []);

  const prefetch = useCallback((index: number, revision: number) => {
    if (index < 0 || index >= segmentsRef.current.length) return;
    void (async () => {
      const audio = await getAudio(index, revision);
      if (revision !== revisionRef.current) return;
      if (preloadedRef.current.get(index) === audio.audioUrl) return;
      const previous = preloadedRef.current.get(index);
      if (previous && previous !== audio.audioUrl) {
        void clearPreloadedSource(previous).catch(() => undefined);
      }
      await preload(audio.audioUrl, { preferredForwardBufferDuration: 10 });
      if (revision !== revisionRef.current) {
        void clearPreloadedSource(audio.audioUrl).catch(() => undefined);
        return;
      }
      preloadedRef.current.set(index, audio.audioUrl);
    })().catch(() => undefined);
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
    setPlaybackIntent(true);
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
      setPlaybackIntent(true);
      const now = Date.now();
      transitionRetryRef.current = { revision, deadline: now + 4500, lastAttempt: now };
      player.play();
      prefetch(index + 1, revision);
      clearTrackedPreloads(Math.max(0, index - 1));
    } catch (cause) {
      if (revision !== revisionRef.current) return;
      setBuffering(false);
      setActive(false);
      setError(cause instanceof Error ? cause.message : 'Could not start Read audio.');
    }
  }, [clearTrackedPreloads, getAudio, player, prefetch, setPlaybackIntent]);

  const startSegments = useCallback(async (sourceSegments: ReadNarrationSourceSegment[], startIndex = 0) => {
    const normalized = sourceSegments
      .map((segment) => typeof segment === 'string'
        ? { text: segment.replace(/\s+/g, ' ').trim(), pauseAfterMs: 0 }
        : { text: String(segment.text || '').replace(/\s+/g, ' ').trim(), pauseAfterMs: Math.max(0, Number(segment.pauseAfterMs || 0)) })
      .filter((segment) => Boolean(segment.text));
    const segments = normalized.map((segment) => segment.text);
    const revision = revisionRef.current + 1;
    revisionRef.current = revision;
    setPlaybackIntent(true);
    transitionRetryRef.current = null;
    clearTrackedPreloads();
    try { player.pause(); } catch { /* no-op */ }
    void player.seekTo(0).catch(() => undefined);
    segmentsRef.current = segments;
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
  }, [clearTrackedPreloads, playSegment, player, setPlaybackIntent]);

  const start = useCallback(async (text: string, startIndex = 0) => {
    await startSegments(splitReadText(text), startIndex);
  }, [startSegments]);

  const stop = useCallback(() => {
    revisionRef.current += 1;
    finishHandledRef.current = true;
    setPlaybackIntent(false);
    transitionRetryRef.current = null;
    clearTrackedPreloads();
    try { player.clearLockScreenControls(); } catch { /* unsupported platform */ }
    lockScreenActiveRef.current = false;
    try { player.pause(); } catch { /* no-op */ }
    void player.seekTo(0).catch(() => undefined);
    currentAudioRef.current = null;
    setActive(false);
    setBuffering(false);
    setError(null);
  }, [clearTrackedPreloads, player, setPlaybackIntent]);

  const togglePause = useCallback(() => {
    if (!active || buffering) return;
    if (playerStatus.playing) {
      setPlaybackIntent(false);
      transitionRetryRef.current = null;
      player.pause();
    } else {
      setPlaybackIntent(true);
      transitionRetryRef.current = null;
      player.play();
    }
  }, [active, buffering, player, playerStatus.playing, setPlaybackIntent]);

  const jumpToSegment = useCallback((index: number) => {
    if (!segmentsRef.current.length) return;
    const next = Math.min(segmentsRef.current.length - 1, Math.max(0, index));
    const revision = revisionRef.current + 1;
    revisionRef.current = revision;
    setPlaybackIntent(true);
    transitionRetryRef.current = null;
    try { player.pause(); } catch { /* no-op */ }
    void player.seekTo(0).catch(() => undefined);
    setActive(true);
    void playSegment(next, revision);
  }, [playSegment, player, setPlaybackIntent]);

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
      setPlaybackIntent(false);
      transitionRetryRef.current = null;
      setActive(false);
      setBuffering(false);
      setInterSegmentPause(false);
      try { player.clearLockScreenControls(); } catch { /* unsupported platform */ }
      lockScreenActiveRef.current = false;
      return;
    }
    void playSegment(next, revisionRef.current);
  }, [active, buffering, currentSegment, playSegment, player, playerStatus.didJustFinish, setPlaybackIntent]);

  useEffect(() => {
    if (playerStatus.playing) {
      finishHandledRef.current = false;
      transitionRetryRef.current = null;
      if (!desiredPlayingRef.current) setPlaybackIntent(true);
      return;
    }
    if (!active || buffering || playerStatus.didJustFinish) return;

    const transition = transitionRetryRef.current;
    if (transition && transition.revision === revisionRef.current && desiredPlayingRef.current) {
      if (playerStatus.isLoaded === false) return;
      const now = Date.now();
      if (now >= transition.deadline) {
        transitionRetryRef.current = null;
        setPlaybackIntent(false);
        setError('Audio could not continue automatically. Tap Resume to retry.');
        return;
      }
      if (now - transition.lastAttempt < 450) return;
      const retry = setTimeout(() => {
        const pending = transitionRetryRef.current;
        if (!pending || pending.revision !== revisionRef.current || !desiredPlayingRef.current) return;
        pending.lastAttempt = Date.now();
        try { player.play(); } catch { /* next status update can retry */ }
      }, 120);
      return () => clearTimeout(retry);
    }

    if (!desiredPlayingRef.current || !playerStatus.isLoaded || playerStatus.isBuffering) return;
    const settle = setTimeout(() => {
      const status = player.currentStatus;
      if (!active || transitionRetryRef.current || status.playing || status.didJustFinish || status.isBuffering || !status.isLoaded) return;
      // A pause after a source has already played is a real user/system pause, not a failed source transition.
      setPlaybackIntent(false);
    }, 260);
    return () => clearTimeout(settle);
  }, [active, buffering, player, playerStatus.didJustFinish, playerStatus.isBuffering, playerStatus.isLoaded, playerStatus.playing, setPlaybackIntent]);

  const duration = playerStatus.duration || currentAudioRef.current?.duration || 0;
  const currentTime = playerStatus.currentTime || 0;
  const segmentProgress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
  const totalSegments = segmentsRef.current.length;
  const progress = totalSegments > 0 ? Math.min(1, (currentSegment + segmentProgress) / totalSegments) : 0;
  const currentWordState = useMemo(() => {
    const text = segmentsRef.current[currentSegment] ?? '';
    const words = text.match(/\S+/g) ?? [];
    if (!words.length) return { word: null as string | null, index: -1 };
    const timings = currentAudioRef.current?.wordTimings ?? [];
    if (timings.length) {
      let index = timings.findIndex((item) => currentTime >= item.start && currentTime < item.end);
      if (index < 0) index = timings.findIndex((item) => item.start > currentTime);
      if (index < 0) index = timings.length - 1;
      return { word: timings[index]?.word ?? words[Math.min(index, words.length - 1)] ?? null, index: Math.min(index, words.length - 1) };
    }
    const safeDuration = Math.max(duration, 0.001);
    const ratio = Math.min(0.999999, Math.max(0, currentTime / safeDuration));
    const index = Math.min(words.length - 1, Math.floor(ratio * words.length));
    return { word: words[index] ?? null, index };
  }, [currentTime, currentSegment, duration]);

  const snapshot: ReadNarrationSnapshot = {
    active,
    buffering: buffering || (active && playerStatus.isBuffering),
    interSegmentPause,
    currentSegment,
    currentTime,
    currentWord: currentWordState.word,
    currentWordIndex: currentWordState.index,
    duration,
    error,
    paused: active && !buffering && !playerStatus.playing && !desiredPlaying,
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
