import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { FeatureScaffold, Card, ActionBar } from '../../shared/FeatureScaffold';
import { EmptyState } from '../../shared/EmptyState';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useWorkplaceIncident } from '../hooks/useWorkplaceIncident';

export default function WorkplaceIncidentLabScreen() {
  const { scenarios, loading, error, refresh } = useWorkplaceIncident();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const textOnPrimary = themeMode === 'dark' ? palette.background : '#FFFFFF';

  const hasScenarios = scenarios.length > 0;
  const highestUrgency = hasScenarios
    ? scenarios.find((s) => (s.urgency || '').toLowerCase() === 'high')
      ?? scenarios[0]
    : null;

  const actions = hasScenarios ? (
    <ActionBar
      themeMode={themeMode}
      buttons={[
        {
          label: highestUrgency ? `Practice: ${highestUrgency.title}` : 'Start a workplace roleplay',
          hint: highestUrgency ? `${highestUrgency.profession} · ${highestUrgency.urgency} urgency` : undefined,
          onPress: () => router.push('/professional' as never),
        },
      ]}
    />
  ) : null;

  return (
    <FeatureScaffold
      title="Workplace Incident Lab"
      subtitle="Practice short, realistic Finnish decisions where safety, politeness, and clarity matter more than memorized textbook answers."
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
      themeMode={themeMode}
      actions={actions}
    >
      {!loading && !error && !hasScenarios ? (
        <EmptyState
          icon="🩺"
          title="No incidents yet"
          description="Your profession-specific incidents will appear here after your first workplace roleplay. Each one builds on situations you've handled."
          actionLabel="Try a workplace roleplay"
          onAction={() => router.push('/professional' as never)}
          themeMode={themeMode}
        />
      ) : null}

      {scenarios.map((scenario) => (
        <View key={scenario.id} style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Card themeMode={themeMode} title={scenario.title} body={scenario.prompt} meta={`${scenario.profession} • ${scenario.urgency} urgency`} />
          <TextInput
            value={drafts[scenario.id] ?? ''}
            onChangeText={(value) => setDrafts((current) => ({ ...current, [scenario.id]: value }))}
            placeholder="Write your first Finnish response"
            placeholderTextColor={palette.textSoft}
            multiline
            style={[styles.input, { borderColor: palette.border, backgroundColor: palette.surfaceMuted, color: palette.text }]}
          />
          <Text style={[styles.hint, { color: palette.textMuted }]}>Best-action hint: {scenario.bestActionHint}</Text>
          <View style={styles.buttonRow}>
            <Pressable accessibilityRole="button" style={[styles.secondaryButton, { borderColor: palette.border }]}>
              <Text style={[styles.secondaryButtonLabel, { color: palette.text }]}>Save draft</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/professional' as never)}
              style={[styles.primaryButton, { backgroundColor: palette.primary }]}
            >
              <Text style={[styles.primaryButtonLabel, { color: textOnPrimary }]}>Practice live →</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </FeatureScaffold>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  input: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  hint: {
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonLabel: {
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1.4,
    minHeight: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonLabel: {
    fontWeight: '800',
  },
});
