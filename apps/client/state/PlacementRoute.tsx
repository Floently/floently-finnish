import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from './preferencesStore';
import { usePlacementStore } from './placementStore';
import type {
  PlacementBand,
  PlacementResult,
  PlacementSkillProfile,
  PlacementTrack,
  RefinedCefr,
} from '@core/schemas/onboarding';
import {
  PLACEMENT_ITEMS,
  type PlacementItem,
  pickFirstItem,
  pickNextItem,
  type ItemType,
  type SkillArea,
} from '../features/placement/data/items';
import {
  INITIAL_ABILITY,
  type AbilityState,
  bandFromTheta,
  confidenceFromState,
  refinedCefrFromTheta,
  updateAbility,
} from '../features/placement/engine/ability';

const SELF_ASSESS = [
  'I can introduce myself and handle simple everyday situations in Finnish.',
  'I can understand and respond to basic work instructions in Finnish.',
  'I can explain a problem or change clearly in Finnish.',
  'I can follow longer spoken or written Finnish without translating every word.',
];

const TOTAL_ITEMS = 9;

type ItemResponse = {
  itemId: string;
  chosen: string | null; // null = "I don't know"
  correct: boolean;
  latencyMs: number;
  theta: number; // item difficulty, cached for skill profile derivation
  skills: SkillArea[];
  itemType: ItemType;
};

function recommendationFor(
  track: PlacementTrack,
  band: PlacementBand,
  confidence: 'light' | 'good' | 'high',
): PlacementResult['recommendation'] {
  if (track === 'workplace_professional' && (band === 'A0' || band === 'A1-A2')) {
    return {
      startTrack: 'everyday_yki',
      startLevel: 'A1-A2',
      confidence,
      rationale:
        'Your profession path stays open, but everyday Finnish foundations will make workplace practice safer and more effective.',
      nextStep: 'Start with Everyday Finnish foundations, then move back into your profession route.',
    };
  }
  return {
    startTrack: track,
    startLevel: band === 'A0' ? 'A1-A2' : band,
    confidence,
    rationale: 'This quick adaptive placement balances speed, accuracy, and a fair start.',
    nextStep:
      track === 'everyday_yki'
        ? 'Begin with Everyday Finnish and YKI-style practice.'
        : 'Start in your current pathway with adaptive review turned on.',
  };
}

/**
 * Derive a per-skill profile from actual items answered + correctness.
 * For each skill area, we collect the items that contributed to it and compute
 * a weighted average theta (weighted by item discrimination), then map to band.
 */
function buildSkillProfile(responses: ItemResponse[], overallBand: PlacementBand): PlacementSkillProfile {
  const skillAreas: SkillArea[] = ['reading', 'listening', 'vocabulary', 'grammar'];
  const perSkill: Record<SkillArea, { weightedTheta: number; weight: number }> = {
    reading: { weightedTheta: 0, weight: 0 },
    listening: { weightedTheta: 0, weight: 0 },
    vocabulary: { weightedTheta: 0, weight: 0 },
    grammar: { weightedTheta: 0, weight: 0 },
  };

  for (const r of responses) {
    for (const skill of r.skills) {
      // If correct, user demonstrated at least the item's difficulty; if wrong, below.
      const demonstratedTheta = r.correct ? r.theta + 0.3 : r.theta - 0.5;
      perSkill[skill].weightedTheta += demonstratedTheta;
      perSkill[skill].weight += 1;
    }
  }

  const skillBand = (skill: SkillArea): PlacementBand => {
    const entry = perSkill[skill];
    if (entry.weight === 0) return overallBand;
    return bandFromTheta(entry.weightedTheta / entry.weight);
  };

  return {
    reading: skillBand('reading'),
    listening: skillBand('listening'),
    vocabulary: skillBand('vocabulary'),
    grammar: skillBand('grammar'),
    speakingConfidence: overallBand === 'C1-C2' ? 'B1-B2' : overallBand,
  };
}

export default function PlacementRoute({ onDone }: { onDone: () => void }) {
  const complete = usePlacementStore((s) => s.complete);
  const skipPlacement = usePlacementStore((s) => s.skip);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';

  const [step, setStep] = useState<'intro' | 'goal' | 'self' | 'quiz' | 'result'>('intro');
  const [track, setTrack] = useState<PlacementTrack>('everyday_yki');
  const [selfScores, setSelfScores] = useState<number[]>(Array(SELF_ASSESS.length).fill(2));

  // Adaptive quiz state
  const [ability, setAbility] = useState<AbilityState>(INITIAL_ABILITY);
  const [currentItem, setCurrentItem] = useState<PlacementItem | null>(null);
  const [responses, setResponses] = useState<ItemResponse[]>([]);
  const itemStartRef = useRef<number>(0);
  const fadeAnim = useSharedValue(1);

  // Prime the first item when entering the quiz step
  useEffect(() => {
    if (step === 'quiz' && !currentItem) {
      setCurrentItem(pickFirstItem());
      itemStartRef.current = Date.now();
    }
  }, [step, currentItem]);

  const itemFadeStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: (1 - fadeAnim.value) * 10 }],
  }));

  const bg = isDark ? palette.background : '#F4F8FF';
  const cardBg = isDark ? palette.surface : '#FFFFFF';
  const border = isDark ? palette.border : '#D7E1F1';
  const accent = isDark ? palette.primary : '#3565F5';
  const accentSurface = isDark ? palette.primarySurface : '#EEF4FF';
  const text = isDark ? palette.text : '#10213F';
  const muted = isDark ? palette.textMuted : '#5B6E90';
  const success = isDark ? palette.success : '#12B981';

  async function handleSkip() {
    await skipPlacement();
    onDone();
  }

  function handleAnswer(chosen: string | null) {
    if (!currentItem) return;
    const latencyMs = Date.now() - itemStartRef.current;
    const correct = chosen === currentItem.answer;
    const response: ItemResponse = {
      itemId: currentItem.id,
      chosen,
      correct,
      latencyMs,
      theta: currentItem.theta,
      skills: currentItem.skills,
      itemType: currentItem.itemType,
    };
    const newResponses = [...responses, response];
    // If "I don't know" (chosen=null), treat as incorrect but give a smaller ability drop
    // by halving the item's discrimination for this update only.
    const effectiveItem = chosen === null
      ? { ...currentItem, a: currentItem.a * 0.5 }
      : currentItem;
    const nextAbility = updateAbility(ability, effectiveItem, correct, { latencyMs });
    setResponses(newResponses);
    setAbility(nextAbility);

    // Animate out, then pick next or finish.
    fadeAnim.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.ease) }, (finished) => {
      if (!finished) return;
    });
    setTimeout(() => {
      if (newResponses.length >= TOTAL_ITEMS) {
        setCurrentItem(null);
        setStep('result');
        return;
      }
      const next = pickNextItem({
        abilityTheta: nextAbility.theta,
        usedIds: newResponses.map((r) => r.itemId),
        usedTypes: newResponses.map((r) => r.itemType),
      });
      if (!next) {
        setCurrentItem(null);
        setStep('result');
        return;
      }
      setCurrentItem(next);
      itemStartRef.current = Date.now();
      fadeAnim.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.ease) });
    }, 200);
  }

  const result = useMemo<PlacementResult | null>(() => {
    if (step !== 'result' || responses.length === 0) return null;
    const band = bandFromTheta(ability.theta);
    const refinedCefr: RefinedCefr = refinedCefrFromTheta(ability.theta);
    const confidence = confidenceFromState(ability);
    const selfAssessmentScore = selfScores.reduce((a, b) => a + b, 0);
    // Legacy adaptiveScore kept for backward compat: 2pts per correct answer.
    const adaptiveScore = responses.reduce((t, r) => t + (r.correct ? 2 : 0), 0);
    const profile = buildSkillProfile(responses, band);
    const averageLatencyMs = Math.round(
      responses.reduce((t, r) => t + r.latencyMs, 0) / responses.length,
    );
    return {
      track,
      selfAssessmentScore,
      adaptiveScore,
      optionalSpeakingCompleted: false,
      profile,
      recommendation: recommendationFor(track, band, confidence),
      adaptive: {
        theta: Number(ability.theta.toFixed(3)),
        stdError: Number(ability.stdError.toFixed(3)),
        refinedCefr,
        itemsAdministered: responses.length,
        itemsCorrect: responses.filter((r) => r.correct).length,
        averageLatencyMs,
        itemsUsed: responses.map((r) => r.itemId),
      },
    };
  }, [step, responses, ability, selfScores, track]);

  async function handleComplete() {
    if (!result) return;
    await complete(result);
    onDone();
  }

  const progress = Math.min(responses.length / TOTAL_ITEMS, 1);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bg }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {step === 'intro' && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.eyebrow, { color: accent }]}>QUICK PLACEMENT</Text>
            <Text style={[styles.title, { color: text }]}>Find your Finnish starting point</Text>
            <Text style={[styles.body, { color: muted }]}>
              Nine adaptive questions, about two minutes. The test adjusts to your level so we start you
              not too easy, not too hard. You can skip and take it later anytime.
            </Text>
            <Pressable onPress={() => setStep('goal')} style={[styles.primary, { backgroundColor: accent }]}>
              <Text style={styles.primaryText}>Take quick placement</Text>
            </Pressable>
            <Pressable onPress={() => void handleSkip()} style={styles.secondary}>
              <Text style={[styles.secondaryText, { color: muted }]}>Skip for now</Text>
            </Pressable>
          </View>
        )}

        {step === 'goal' && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.eyebrow, { color: accent }]}>STEP 1 OF 3</Text>
            <Text style={[styles.title, { color: text }]}>What are you aiming for?</Text>
            {([
              ['everyday_yki', 'Everyday Finnish / YKI', 'Daily life, travel, YKI exam preparation.'],
              ['workplace_professional', 'Workplace Finnish', 'Professional contexts: healthcare, service, office.'],
              ['both', 'Both', 'Balanced route covering everyday and work.'],
            ] as const).map(([id, label, sub]) => {
              const active = track === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => setTrack(id as PlacementTrack)}
                  style={[
                    styles.choice,
                    { borderColor: active ? accent : border, backgroundColor: active ? accentSurface : 'transparent' },
                  ]}
                >
                  <Text style={[styles.choiceText, { color: text }]}>{label}</Text>
                  <Text style={[styles.choiceSub, { color: muted }]}>{sub}</Text>
                </Pressable>
              );
            })}
            <Pressable onPress={() => setStep('self')} style={[styles.primary, { backgroundColor: accent }]}>
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
          </View>
        )}

        {step === 'self' && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.eyebrow, { color: accent }]}>STEP 2 OF 3</Text>
            <Text style={[styles.title, { color: text }]}>Quick self-check</Text>
            <Text style={[styles.body, { color: muted }]}>
              How well do each of these describe you today? (1 = not yet, 4 = confidently)
            </Text>
            {SELF_ASSESS.map((statement, idx) => (
              <View key={statement} style={styles.selfBlock}>
                <Text style={[styles.body, { color: text }]}>{statement}</Text>
                <View style={styles.scaleRow}>
                  {[1, 2, 3, 4].map((score) => {
                    const active = selfScores[idx] === score;
                    return (
                      <Pressable
                        key={score}
                        onPress={() => setSelfScores((v) => v.map((item, i) => (i === idx ? score : item)))}
                        style={[
                          styles.scaleButton,
                          { borderColor: active ? accent : border, backgroundColor: active ? accent : 'transparent' },
                        ]}
                      >
                        <Text style={[styles.scaleText, { color: active ? '#fff' : muted }]}>{score}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
            <Pressable onPress={() => setStep('quiz')} style={[styles.primary, { backgroundColor: accent }]}>
              <Text style={styles.primaryText}>Start diagnostic ({TOTAL_ITEMS} questions)</Text>
            </Pressable>
          </View>
        )}

        {step === 'quiz' && currentItem && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <View style={styles.progressRow}>
              <Text style={[styles.label, { color: muted }]}>
                Question {responses.length + 1} / {TOTAL_ITEMS}
              </Text>
              <Text style={[styles.label, { color: muted }]}>STEP 3 OF 3</Text>
            </View>
            <View style={[styles.progressBarTrack, { backgroundColor: border }]}>
              <View style={[styles.progressBarFill, { backgroundColor: accent, width: `${progress * 100}%` }]} />
            </View>

            <Animated.View style={[itemFadeStyle, { gap: 14, marginTop: 8 }]}>
              <Text style={[styles.title, { color: text, fontSize: 22 }]}>{currentItem.prompt}</Text>
              {currentItem.helperText ? (
                <Text style={[styles.helperText, { color: muted }]}>{currentItem.helperText}</Text>
              ) : null}
              {currentItem.options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => handleAnswer(option)}
                  style={({ pressed }) => [
                    styles.choice,
                    {
                      borderColor: border,
                      backgroundColor: pressed ? accentSurface : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.choiceText, { color: text }]}>{option}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => handleAnswer(null)} style={styles.dontKnow}>
                <Text style={[styles.dontKnowText, { color: muted }]}>I'm not sure — skip this one</Text>
              </Pressable>
            </Animated.View>
          </View>
        )}

        {step === 'result' && result && result.adaptive && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: border }]}>
            <Text style={[styles.eyebrow, { color: success }]}>PLACEMENT COMPLETE</Text>
            <Text style={[styles.title, { color: text }]}>Your recommended start</Text>

            <View style={[styles.resultBox, { borderColor: border, backgroundColor: accentSurface }]}>
              <Text style={[styles.resultTrack, { color: text }]}>
                {result.recommendation.startTrack === 'everyday_yki'
                  ? 'Everyday Finnish / YKI'
                  : result.recommendation.startTrack === 'workplace_professional'
                  ? 'Workplace Finnish'
                  : 'Combined route'}
              </Text>
              <Text style={[styles.resultLevel, { color: accent }]}>
                {result.adaptive.refinedCefr}
              </Text>
              <Text style={[styles.resultBand, { color: muted }]}>
                {result.recommendation.startLevel} band · {result.recommendation.confidence} confidence
              </Text>
            </View>

            <View style={styles.skillRow}>
              {(['reading', 'listening', 'vocabulary', 'grammar'] as const).map((skill) => (
                <View key={skill} style={[styles.skillCard, { borderColor: border }]}>
                  <Text style={[styles.skillLabel, { color: muted }]}>{skill}</Text>
                  <Text style={[styles.skillValue, { color: text }]}>{result.profile[skill]}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.body, { color: muted }]}>{result.recommendation.rationale}</Text>
            <Text style={[styles.body, { color: text }]}>{result.recommendation.nextStep}</Text>

            <Text style={[styles.diagnosticNote, { color: muted }]}>
              Based on {result.adaptive.itemsCorrect} of {result.adaptive.itemsAdministered} correct,
              average {(result.adaptive.averageLatencyMs / 1000).toFixed(1)}s per question.
            </Text>

            <Pressable onPress={() => void handleComplete()} style={[styles.primary, { backgroundColor: accent }]}>
              <Text style={styles.primaryText}>Use this recommendation</Text>
            </Pressable>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 20, gap: 16 },
  card: { borderRadius: 24, borderWidth: 1, padding: 20, gap: 14 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 26, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 22 },
  helperText: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  primary: { minHeight: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 14, fontWeight: '700' },
  choice: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  choiceText: { fontSize: 16, fontWeight: '700' },
  choiceSub: { fontSize: 13, lineHeight: 18 },
  selfBlock: { gap: 10 },
  scaleRow: { flexDirection: 'row', gap: 8 },
  scaleButton: { width: 44, height: 44, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  scaleText: { fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBarTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 999 },
  dontKnow: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  dontKnowText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  resultBox: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 4, alignItems: 'center' },
  resultTrack: { fontSize: 14, fontWeight: '700' },
  resultLevel: { fontSize: 52, fontWeight: '900', letterSpacing: -1 },
  resultBand: { fontSize: 13, fontWeight: '600' },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillCard: { flexBasis: '48%', flexGrow: 1, borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  skillLabel: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  skillValue: { fontSize: 18, fontWeight: '800' },
  diagnosticNote: { fontSize: 12, fontStyle: 'italic' },
});
