import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@ui/theme';

import type { WritingSession } from '../model';

type Props = {
  session: WritingSession;
  onRevise: () => void;
};

function PriorityList({ session }: { session: WritingSession }) {
  const feedback = session.latestFeedback;
  if (!feedback) return null;

  return (
    <View style={styles.block}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Your revision focus</Text>
      {feedback.priorities.length ? feedback.priorities.map((priority, index) => (
        <View key={priority.id} style={styles.priorityCard}>
          <Text style={styles.priorityNumber}>{index + 1}</Text>
          <View style={styles.priorityBody}>
            <Text style={styles.priorityTitle}>{priority.title}</Text>
            <Text style={styles.body}>{priority.explanation}</Text>
            <Text style={styles.retry}>{priority.retryInstruction}</Text>
          </View>
        </View>
      )) : (
        <Text style={styles.body}>No priority correction this time. Make one careful clarity revision before finishing.</Text>
      )}
    </View>
  );
}

function BeforeAfter({ session }: { session: WritingSession }) {
  const comparison = session.comparison;
  if (!comparison) return null;

  const deltaLabel = comparison.wordDelta === 0
    ? 'The revision has the same word count.'
    : comparison.wordDelta > 0
      ? `You added ${comparison.wordDelta} word${comparison.wordDelta === 1 ? '' : 's'}.`
      : `You removed ${Math.abs(comparison.wordDelta)} word${comparison.wordDelta === -1 ? '' : 's'}.`;

  return (
    <View style={styles.block}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>Compare your improvement</Text>
      <Text accessibilityLiveRegion="polite" style={styles.improvementSummary}>
        {comparison.addressedPriorityIds.length
          ? `You addressed ${comparison.addressedPriorityIds.length} previous priority ${comparison.addressedPriorityIds.length === 1 ? 'point' : 'points'}.`
          : 'This revision is recorded. Review the remaining focus before another attempt.'}
      </Text>
      <Text style={styles.meta}>{deltaLabel}</Text>

      <View style={styles.comparisonCard}>
        <Text style={styles.comparisonLabel}>Before</Text>
        <Text selectable style={styles.comparisonText}>{comparison.beforeText}</Text>
      </View>
      <View style={[styles.comparisonCard, styles.afterCard]}>
        <Text style={styles.comparisonLabel}>After</Text>
        <Text selectable style={styles.comparisonText}>{comparison.afterText}</Text>
      </View>
    </View>
  );
}

export function WritingFeedbackPanel({ session, onRevise }: Props) {
  const feedback = session.latestFeedback;
  if (!feedback) return null;

  const comparing = session.stage === 'compare';

  return (
    <View style={styles.panel}>
      <View style={styles.block}>
        <Text style={styles.eyebrow}>{comparing ? 'Revision compared' : 'Focused feedback'}</Text>
        <Text accessibilityRole="header" style={styles.title}>What worked communicatively</Text>
        <Text accessibilityLiveRegion="polite" style={styles.success}>{feedback.communicativeSuccess}</Text>
        {feedback.acknowledgements.map((item) => (
          <Text key={item} style={styles.acknowledgement}>✓ {item}</Text>
        ))}
      </View>

      {comparing ? <BeforeAfter session={session} /> : <PriorityList session={session} />}

      {comparing && feedback.priorities.length ? (
        <View style={styles.block}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Still worth improving</Text>
          {feedback.priorities.map((priority) => (
            <Text key={priority.id} style={styles.body}>• {priority.retryInstruction}</Text>
          ))}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={comparing ? 'Revise the Finnish text again' : 'Revise the Finnish draft'}
        onPress={onRevise}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>{comparing ? 'Revise again' : 'Revise my draft'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2F5C57',
    backgroundColor: '#102723',
    padding: 18,
    gap: 18,
  },
  block: { gap: 10 },
  eyebrow: { color: '#5EEAD4', fontSize: 12, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: '800' },
  sectionTitle: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '800' },
  success: { color: '#D7FFF7', fontSize: 15, lineHeight: 23 },
  acknowledgement: { color: '#B8E8DF', fontSize: 14, lineHeight: 21 },
  priorityCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#315F59',
    backgroundColor: '#132F2A',
    padding: 14,
  },
  priorityNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#5EEAD4',
    color: '#07231F',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '900',
  },
  priorityBody: { flex: 1, gap: 6 },
  priorityTitle: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '800' },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
  retry: { color: '#D7FFF7', fontSize: 14, lineHeight: 22, fontWeight: '700' },
  improvementSummary: { color: '#D7FFF7', fontSize: 16, lineHeight: 24, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  comparisonCard: { borderRadius: 18, backgroundColor: '#0C1918', borderWidth: 1, borderColor: '#294943', padding: 14, gap: 8 },
  afterCard: { borderColor: '#5EEAD4' },
  comparisonLabel: { color: '#5EEAD4', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  comparisonText: { color: colors.text, fontSize: 15, lineHeight: 23 },
  primaryButton: { minHeight: 50, borderRadius: 999, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.78 },
});

