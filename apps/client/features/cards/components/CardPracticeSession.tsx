import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { CardBanksPanel } from './CardBanksPanel';
import { CardModeTabs } from './CardModeTabs';
import { useCardPractice } from '../hooks/useCardPractice';
import type { CardDeckScope, CardMode, RuntimeCard } from '../types';

const COLORS = {
  backgroundTop: '#F4F7FB',
  backgroundBottom: '#E9EEF6',
  backgroundCard: '#FFFFFF',
  paleBorder: 'rgba(85, 114, 176, 0.12)',
  shadow: 'rgba(20, 34, 84, 0.09)',
  text: '#243552',
  muted: '#6E82A4',
  primary: '#345EC3',
  primaryDeep: '#2D4FA5',
  mastered: '#4E8F6A',
  difficult: '#D64545',
  learning: '#B88A1A',
  softBlue: '#EDF3FF',
  softBlueStrong: '#DFEAFF',
  barTrack: '#D8E0EE',
  accentEdge: '#F4D38A',
};

function toneColor(card: RuntimeCard | null) {
  if (!card) return COLORS.primary;
  if (card.state === 'mastered') return COLORS.mastered;
  if (card.state === 'difficult') return COLORS.difficult;
  if (card.state === 'learning') return COLORS.learning;
  return COLORS.primary;
}

function headerLabel(mode: CardMode) {
  if (mode === 'phrases') return 'Sentences';
  if (mode === 'grammar') return 'Grammar';
  return 'Vocabulary';
}

function parseScope(params: ReturnType<typeof useLocalSearchParams>): CardDeckScope {
  const domain = typeof params.domain === 'string' && (params.domain === 'general' || params.domain === 'professional')
    ? params.domain
    : 'general';
  const profession = typeof params.profession === 'string' ? params.profession : null;
  const level = typeof params.level === 'string' ? params.level : null;
  const source = typeof params.source === 'string' ? params.source : null;
  return { domain, profession: profession as CardDeckScope['profession'], level, adaptive: true, source };
}


type AdaptiveCardCopyProps = {
  text: string;
  variant: 'front' | 'prompt' | 'context' | 'option' | 'hint';
  color?: string;
  // ── Issue #1.iii fix ──────────────────────────────────────────────────
  // Sentence cards carry longer Finnish text than vocabulary cards (often
  // 8-15+ words including compounds like 'sairaanhoitopiiri'), so they
  // need a wider shrink range to avoid getting cut off. The `mode` hint
  // lets adaptiveTypography pick a more aggressive shrink profile — up
  // to 50% of base size — for sentence content.
  mode?: 'vocabulary' | 'phrases' | 'grammar';
};

function adaptiveTypography(
  text: string,
  variant: AdaptiveCardCopyProps['variant'],
  mode?: AdaptiveCardCopyProps['mode'],
) {
  const length = text.trim().length;
  const isSentence = mode === 'phrases';

  if (variant === 'front') {
    // For sentence cards, more aggressive shrinking: minScale 0.5 means the
    // text can compress to half-size before clipping (effective 2x reduction).
    // We also raise maxLines so the layout can wrap onto a fourth+ line if it
    // helps the system find a feasible scale before reducing further.
    if (isSentence) {
      if (length > 220) return { fontSize: 22, lineHeight: 30, maxLines: 8, minimumFontScale: 0.5 };
      if (length > 160) return { fontSize: 24, lineHeight: 32, maxLines: 7, minimumFontScale: 0.5 };
      if (length > 100) return { fontSize: 26, lineHeight: 34, maxLines: 6, minimumFontScale: 0.55 };
      if (length > 60)  return { fontSize: 30, lineHeight: 38, maxLines: 5, minimumFontScale: 0.6 };
      return { fontSize: 34, lineHeight: 42, maxLines: 4, minimumFontScale: 0.7 };
    }
    // Vocabulary front (single word, short) keeps its original buckets.
    if (length > 160) return { fontSize: 22, lineHeight: 30, maxLines: 6, minimumFontScale: 0.58 };
    if (length > 100) return { fontSize: 26, lineHeight: 34, maxLines: 5, minimumFontScale: 0.62 };
    if (length > 60) return { fontSize: 32, lineHeight: 40, maxLines: 4, minimumFontScale: 0.7 };
    return { fontSize: 40, lineHeight: 48, maxLines: 3, minimumFontScale: 0.8 };
  }
  if (variant === 'prompt') {
    // Sentence-card prompts are also longer (translation hints, context).
    // Same logic: bump maxLines and drop minScale so the prompt can fit
    // without truncation.
    if (isSentence) {
      if (length > 220) return { fontSize: 15, lineHeight: 22, maxLines: 9, minimumFontScale: 0.55 };
      if (length > 140) return { fontSize: 16, lineHeight: 23, maxLines: 7, minimumFontScale: 0.6 };
      return { fontSize: 18, lineHeight: 24, maxLines: 6, minimumFontScale: 0.65 };
    }
    if (length > 220) return { fontSize: 15, lineHeight: 22, maxLines: 7, minimumFontScale: 0.78 };
    if (length > 140) return { fontSize: 16, lineHeight: 23, maxLines: 6, minimumFontScale: 0.82 };
    return { fontSize: 18, lineHeight: 24, maxLines: 5, minimumFontScale: 0.88 };
  }
  if (variant === 'option') {
    if (length > 110) return { fontSize: 13, lineHeight: 18, maxLines: 4, minimumFontScale: 0.86 };
    return { fontSize: 15, lineHeight: 20, maxLines: 3, minimumFontScale: 0.9 };
  }
  if (variant === 'hint') {
    if (length > 180) return { fontSize: 12, lineHeight: 17, maxLines: 5, minimumFontScale: 0.9 };
    return { fontSize: 13, lineHeight: 18, maxLines: 4, minimumFontScale: 0.9 };
  }
  if (length > 220) return { fontSize: 12, lineHeight: 18, maxLines: 6, minimumFontScale: 0.9 };
  return { fontSize: 14, lineHeight: 20, maxLines: 5, minimumFontScale: 0.92 };
}

function AdaptiveCardCopy({ text, variant, color, mode }: AdaptiveCardCopyProps) {
  const metrics = adaptiveTypography(text, variant, mode);
  const baseStyle = variant === 'front'
    ? styles.mainWord
    : variant === 'prompt'
      ? styles.promptLabel
      : variant === 'option'
        ? styles.optionText
        : variant === 'hint'
          ? styles.hintText
          : styles.contextText;

  return (
    <Text
      adjustsFontSizeToFit
      minimumFontScale={metrics.minimumFontScale}
      numberOfLines={metrics.maxLines}
      style={[
        baseStyle,
        {
          fontSize: metrics.fontSize,
          lineHeight: metrics.lineHeight,
          color,
        },
      ]}
    >
      {text}
    </Text>
  );
}

function renderPrompt(card: RuntimeCard | null, textColor?: string, mutedColor?: string, mode?: CardMode) {
  if (!card) return null;
  const followUp = card.served_follow_up;
  return (
    <View style={styles.promptBlock}>
      <AdaptiveCardCopy text={followUp.prompt} variant="prompt" color={textColor} mode={mode} />
      {followUp.context_text ? <AdaptiveCardCopy text={followUp.context_text} variant="context" color={mutedColor} mode={mode} /> : null}
      {followUp.blank_template ? <AdaptiveCardCopy text={followUp.blank_template} variant="context" color={mutedColor} mode={mode} /> : null}
      {followUp.stimulus_text ? <AdaptiveCardCopy text={followUp.stimulus_text} variant="context" color={mutedColor} mode={mode} /> : null}
    </View>
  );
}

export function CardPracticeSession() {
  const params = useLocalSearchParams();
  const requestedMode = typeof params.mode === 'string' ? params.mode : 'vocabulary';
  const normalizedRequestedMode = requestedMode === 'sentences' ? 'phrases' : requestedMode;
  const initialMode: CardMode = normalizedRequestedMode === 'grammar' || normalizedRequestedMode === 'phrases' ? normalizedRequestedMode : 'vocabulary';
  const [mode, setMode] = useState<CardMode>(initialMode);
  const [banksVisible, setBanksVisible] = useState(false);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';

  // Extract primitive values so scope object reference stays stable across renders.
  // useLocalSearchParams() returns a new object each render, which would cause
  // scope → loadBanks → load to all get new references and trigger an infinite loop.
  const paramDomain = typeof params.domain === 'string' ? params.domain : 'general';
  const paramProfession = typeof params.profession === 'string' ? params.profession : '';
  const paramLevel = typeof params.level === 'string' ? params.level : '';
  const paramSource = typeof params.source === 'string' ? params.source : '';

  const scope = useMemo<CardDeckScope>(() => ({
    domain: paramDomain === 'professional' ? 'professional' : 'general',
    profession: (paramProfession || null) as CardDeckScope['profession'],
    level: paramLevel || null,
    adaptive: true,
    source: paramSource || null,
  }), [paramDomain, paramProfession, paramLevel, paramSource]);
  const {
    displayedCard,
    loading,
    submitting,
    feedback,
    progress,
    answer,
    setAnswer,
    showBack,
    showHint,
    visibleHint,
    playAudio,
    flip,
    revealHint,
    hideHint,
    submit,
    advance,
    skip,
    recallBack,
    recallForward,
    recallIndex,
    banks,
    sessionCompleted,
    refresh,
    error,
    currentLabel,
  } = useCardPractice(mode, scope);

  const cardTone = toneColor(displayedCard ?? null);
  const header = headerLabel(mode);
  const followUp = displayedCard?.served_follow_up;
  const isRecallView = recallIndex !== null;
  const isChoiceMode = Boolean(followUp?.options?.length);
  const indicatorCount = 4;
  const activeIndicator = Math.min(indicatorCount - 1, Math.floor(progress.ratio * indicatorCount));

  return (
    <View style={[styles.screen, { backgroundColor: isDark ? palette.background : COLORS.backgroundTop }]}>
      <View style={[styles.backgroundGlowOne, isDark && { backgroundColor: 'rgba(30,50,90,0.35)' }]} />
      <View style={[styles.backgroundGlowTwo, isDark && { backgroundColor: 'rgba(20,40,80,0.30)' }]} />
      <View style={styles.waveOne} />
      <View style={styles.waveTwo} />

      <CardBanksPanel visible={banksVisible} onClose={() => setBanksVisible(false)} banks={banks} />

      <CardModeTabs value={mode} onChange={(nextMode) => setMode(nextMode)} />

      <View style={styles.headerRow}>
        <Pressable onPress={recallBack} style={[styles.recallButton, isDark && { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
          <Text style={[styles.recallText, isDark && { color: palette.textMuted }]}>↺ Recall</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: isDark ? palette.textSoft : '#5E789F' }]}>{header}</Text>
        <Pressable onPress={recallForward} style={[styles.recallButton, isDark && { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
          <Text style={[styles.recallText, isDark && { color: palette.textMuted }]}>Recall ↻</Text>
        </Pressable>
      </View>

      <View style={styles.progressLineTrack}>
        <View style={[styles.progressLineFill, { width: `${Math.max(10, progress.ratio * 100)}%` }]} />
      </View>

      <View style={styles.cardShell}>
        <View style={[styles.cardOuter, isDark && { backgroundColor: palette.surfaceMuted, shadowColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.cardInner, isDark && { backgroundColor: palette.surface, borderColor: palette.border }]}>
            {/* ── Issue #1.i fix ────────────────────────────────────────────
                TTS is meaningful for vocabulary cards (hear the word) and
                sentence cards (hear the phrase in context). For grammar
                cards the front is a rule explanation or pattern — speaking
                it aloud doesn't help the learner and can be distracting.
                Hide the speaker entirely in grammar mode.
            */}
            {mode !== 'grammar' ? (
              <Pressable
                onPress={() => void playAudio()}
                style={[styles.iconButton, styles.speakerIconButton, isDark && { backgroundColor: palette.surfaceRaised }]}
                accessibilityRole="button"
                accessibilityLabel="Kuuntele"
              >
                <Text style={[styles.iconLabel, { color: isDark ? palette.primary : COLORS.primary }]}>🔊</Text>
              </Pressable>
            ) : null}

            {!showBack ? (
              <Pressable
                onPress={() => void skip()}
                style={[
                  styles.iconButton,
                  styles.skipIconButton,
                  styles.iconActionButton,
                  isDark && { backgroundColor: palette.surfaceRaised, borderColor: palette.border },
                  (isRecallView || !displayedCard) && styles.iconActionButtonDisabled,
                ]}
                disabled={isRecallView || !displayedCard}
              >
                <Text style={[styles.iconActionText, { color: isDark ? palette.textMuted : '#5B7DB1' }]}>Skip</Text>
              </Pressable>
            ) : null}

            {loading ? (
              <View style={styles.centerBlock}>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading cards…</Text>
              </View>
            ) : displayedCard ? (
              <View style={styles.centerBlock}>
                {!showBack ? (
                  <>
                    <AdaptiveCardCopy text={displayedCard.front_text} variant="front" color={cardTone} mode={mode} />
                    {currentLabel ? <Text style={[styles.stateNote, isDark && { color: palette.textSoft }]}>{currentLabel}</Text> : null}
                    {showHint && visibleHint ? <View style={[styles.hintBubble, isDark && { backgroundColor: palette.surfaceMuted }]}><AdaptiveCardCopy text={visibleHint} variant="hint" color={isDark ? palette.textMuted : '#5A6F95'} /></View> : null}
                  </>
                ) : (
                  <>
                    {renderPrompt(displayedCard, isDark ? palette.text : undefined, isDark ? palette.textMuted : undefined, mode)}
                    {isChoiceMode ? (
                      <View style={styles.optionList}>
                        {followUp?.options.map((option) => {
                          const selected = answer === option.option_id;
                          return (
                            <Pressable key={option.option_id} onPress={() => setAnswer(option.option_id)} style={[styles.optionButton, selected && styles.optionButtonSelected, isDark && { backgroundColor: palette.surfaceMuted, borderColor: palette.border }, isDark && selected && { backgroundColor: palette.primarySurface, borderColor: palette.primary }]}>
                              <AdaptiveCardCopy text={option.text} variant="option" color={selected ? (isDark ? palette.primary : '#3158AC') : (isDark ? palette.text : COLORS.text)} />
                            </Pressable>
                          );
                        })}
                      </View>
                    ) : (
                      <TextInput
                        value={answer}
                        onChangeText={setAnswer}
                        placeholder="Type your answer"
                        placeholderTextColor={isDark ? palette.textSoft : '#8A9BB7'}
                        style={[styles.textInput, isDark && { backgroundColor: palette.surfaceMuted, borderColor: palette.border, color: palette.text }]}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    )}
                  </>
                )}
              </View>
            ) : (
              <View style={styles.centerBlock}>
                <Text style={styles.errorText}>No cards matched this mode yet.</Text>
                <Pressable onPress={refresh} style={styles.retryChip}>
                  <Text style={styles.retryChipText}>Reload</Text>
                </Pressable>
              </View>
            )}

            <View style={[styles.cardFooter, isDark && { borderTopColor: palette.border }]}>
              <Pressable onPress={() => { if (showHint) hideHint(); else void revealHint(); }} style={[styles.footerGhostButton, isDark && { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
                <Text style={[styles.footerGhostText, isDark && { color: palette.textMuted }]}>{showHint ? 'Hide ?' : '?'}</Text>
              </Pressable>

              {showBack ? (
                <Pressable onPress={() => void submit()} style={[styles.primaryActionButton, (!answer || submitting || isRecallView) && styles.primaryActionDisabled]} disabled={!answer || submitting || isRecallView}>
                  <Text style={styles.primaryActionText}>{feedback ? 'Checked' : submitting ? 'Checking…' : 'Check'}</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={flip}
                  style={[
                    styles.skipButton,
                    styles.reverseButton,
                    isDark && { backgroundColor: palette.surfaceRaised, borderColor: palette.border },
                    (isRecallView || !displayedCard) && styles.primaryActionDisabled,
                  ]}
                  disabled={isRecallView || !displayedCard}
                >
                  <Text style={[styles.skipText, styles.reverseButtonText, isDark && { color: palette.textMuted }]}>
                    {showBack ? '↻' : '⟳'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>

      {feedback ? (
        <View style={[styles.feedbackPanel, { borderColor: feedback.correct ? 'rgba(78,143,106,0.28)' : 'rgba(214,69,69,0.22)' }, isDark && { backgroundColor: palette.surfaceRaised }]}>
          <Text style={[styles.feedbackTitle, { color: feedback.correct ? COLORS.mastered : COLORS.difficult }]}>
            {feedback.correct ? 'Correct' : 'Strengthen this one'}
          </Text>
          <Text style={[styles.feedbackBody, isDark && { color: palette.text }]}>{feedback.explanation ?? `Correct answer: ${feedback.correctAnswer}`}</Text>
          {!feedback.correct ? <Text style={[styles.feedbackAnswer, isDark && { color: palette.textMuted }]}>Expected: {feedback.correctAnswer}</Text> : null}
          <Pressable onPress={() => void advance()} style={[styles.nextButton, isDark && { backgroundColor: palette.primarySurface }]}>
            <Text style={[styles.nextButtonText, isDark && { color: palette.primary }]}>{sessionCompleted ? 'Finish session' : 'Next card'}</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.inlineError}>{error}</Text> : null}

      <View style={styles.dotsRow}>
        {Array.from({ length: indicatorCount }).map((_, index) => {
          const active = index === activeIndicator;
          return <View key={index} style={[styles.dot, isDark && { backgroundColor: palette.border }, active && styles.dotActive, active && isDark && { backgroundColor: palette.primary }]} />;
        })}
      </View>

      <View style={styles.bottomBar}>
        <Pressable onPress={() => setBanksVisible(true)} style={[styles.bankButton, isDark && { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}>
          <Text style={[styles.bankButtonText, isDark && { color: palette.textMuted }]}>Review banks</Text>
        </Pressable>
        <Pressable
          onPress={sessionCompleted ? refresh : () => router.back()}
          style={[styles.endSessionButton, isDark && { backgroundColor: palette.surfaceRaised, borderColor: palette.border }]}
        >
          <Text style={[styles.endSessionText, isDark && { color: palette.textMuted }]}>
            {sessionCompleted ? 'Restart Session' : 'End Session'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.backgroundTop,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  backgroundGlowOne: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.78)',
    top: -120,
    left: -80,
  },
  backgroundGlowTwo: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(234, 242, 255, 0.88)',
    bottom: -40,
    right: -90,
  },
  waveOne: {
    position: 'absolute',
    right: -100,
    bottom: 70,
    width: 360,
    height: 180,
    borderRadius: 120,
    borderWidth: 18,
    borderColor: 'rgba(74, 144, 226, 0.18)',
    transform: [{ rotate: '-18deg' }],
  },
  waveTwo: {
    position: 'absolute',
    left: -120,
    bottom: 40,
    width: 360,
    height: 180,
    borderRadius: 120,
    borderWidth: 14,
    borderColor: 'rgba(74, 144, 226, 0.12)',
    transform: [{ rotate: '12deg' }],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  recallButton: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(55, 85, 143, 0.08)',
  },
  recallText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B7DB1',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#5E789F',
  },
  progressLineTrack: {
    alignSelf: 'center',
    width: '74%',
    height: 4,
    borderRadius: 999,
    backgroundColor: '#DCE3EE',
    overflow: 'hidden',
    marginTop: 18,
  },
  progressLineFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#BFD3F8',
  },
  cardShell: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 20,
  },
  cardOuter: {
    alignSelf: 'center',
    width: '86%',
    minHeight: 430,
    borderRadius: 30,
    padding: 8,
    backgroundColor: '#F2F6FD',
    shadowColor: '#274681',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  cardInner: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.paleBorder,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  iconButton: {
    position: 'absolute',
    top: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E3D79',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    zIndex: 1,
  },
  speakerIconButton: {
    left: 16,
  },
  skipIconButton: {
    right: 16,
  },
  iconLabel: {
    fontSize: 20,
  },
  iconActionButton: {
    width: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(87,116,176,0.14)',
  },
  iconActionButtonDisabled: {
    opacity: 0.45,
  },
  iconActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 26,
    gap: 14,
  },
  mainWord: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.6,
    width: '100%',
    flexShrink: 1,
  },
  stateNote: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: 'center',
  },
  hintText: {
    color: '#5A6F95',
    textAlign: 'center',
    width: '100%',
  },
  hintBubble: {
    marginTop: 6,
    borderRadius: 16,
    backgroundColor: '#F5F9FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: '100%',
  },
  promptBlock: {
    width: '100%',
    gap: 10,
  },
  promptLabel: {
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
  },
  contextText: {
    color: COLORS.muted,
    textAlign: 'center',
    width: '100%',
  },
  optionList: {
    width: '100%',
    gap: 10,
  },
  optionButton: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: 'rgba(83,110,167,0.14)',
  },
  optionButtonSelected: {
    backgroundColor: '#E6EEFF',
    borderColor: '#88A7E8',
  },
  optionText: {
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
  },
  optionTextSelected: {
    color: '#3158AC',
  },
  textInput: {
    width: '100%',
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(83,110,167,0.18)',
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 16,
    color: COLORS.text,
    fontSize: 16,
  },
  cardFooter: {
    minHeight: 68,
    borderTopWidth: 1,
    borderTopColor: 'rgba(82,111,171,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
  },
  footerGhostButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: 'rgba(87,116,176,0.12)',
  },
  footerGhostText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5E78A6',
  },
  skipButton: {
    minWidth: 118,
    minHeight: 54,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: '#1C3D89',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reverseButton: {
    backgroundColor: '#F6FAFF',
    borderWidth: 1,
    borderColor: 'rgba(87,116,176,0.16)',
    shadowOpacity: 0,
    elevation: 0,
  },
  reverseButtonText: {
    color: '#5A78AB',
    fontSize: 20,
  },
  primaryActionButton: {
    minWidth: 118,
    minHeight: 54,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  primaryActionDisabled: {
    opacity: 0.45,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedbackPanel: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.88)',
    padding: 14,
    gap: 8,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  feedbackBody: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },
  feedbackAnswer: {
    fontSize: 13,
    color: COLORS.muted,
  },
  nextButton: {
    alignSelf: 'flex-start',
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    backgroundColor: COLORS.softBlueStrong,
  },
  nextButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3456A3',
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.muted,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    color: COLORS.text,
  },
  retryChip: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: COLORS.softBlue,
  },
  retryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  inlineError: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.difficult,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
    marginTop: 18,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#C5CEDA',
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  bottomBar: {
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 4,
  },
  bankButton: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(83,110,167,0.12)',
  },
  bankButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5D7BAB',
  },
  endSessionButton: {
    width: '54%',
    minHeight: 54,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    borderWidth: 1,
    borderColor: 'rgba(93, 123, 171, 0.16)',
    shadowColor: '#274681',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  endSessionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6580AA',
  },
});
