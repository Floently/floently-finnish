import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { FeatureScaffold, Card, MetricRow, ActionBar } from '../../shared/FeatureScaffold';
import { EmptyState } from '../../shared/EmptyState';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { useRevisionVault } from '../hooks/useRevisionVault';
import { goToLearn, isLearnHost } from '../../../state/learnRouting';

export default function RevisionVaultScreen() {
  const { summary, loading, error, refresh } = useRevisionVault();
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);

  const hasData = !!summary && summary.buckets.length > 0;
  const dueNow = summary?.dueNow ?? 0;

  const actions = hasData ? (
    <ActionBar
      themeMode={themeMode}
      buttons={
        dueNow > 0
          ? [
              {
                label: `Start today's review`,
                hint: `${dueNow} ${dueNow === 1 ? 'item' : 'items'} due`,
                onPress: () => router.push('/cards' as never),
              },
              {
                label: 'Add more',
                variant: 'secondary',
                onPress: () => {
                  if (typeof window !== 'undefined' && !isLearnHost()) {
                    goToLearn('/learn');
                    return;
                  }
                  router.push('/learn' as never);
                },
              },
            ]
          : [
              {
                label: 'Add items to the vault',
                hint: 'Nothing due yet — keep the schedule going',
                onPress: () => {
                  if (typeof window !== 'undefined' && !isLearnHost()) {
                    goToLearn('/learn');
                    return;
                  }
                  router.push('/learn' as never);
                },
              },
            ]
      }
    />
  ) : null;

  return (
    <FeatureScaffold
      title="Revision Vault"
      subtitle="Protect important language with spaced review buckets so useful vocabulary, grammar, and phrases survive beyond one good session."
      loading={loading}
      error={error}
      onRefresh={() => void refresh()}
      themeMode={themeMode}
      actions={actions}
    >
      {!loading && !error && !hasData ? (
        <EmptyState
          icon="🗂️"
          title="Your vault is empty"
          description="Save phrases, words, or grammar points to the vault and we'll schedule them for spaced review so they stick."
          actionLabel="Add to your phrase bank"
          onAction={() => {
            if (typeof window !== 'undefined' && !isLearnHost()) {
              goToLearn('/learn');
              return;
            }
            router.push('/learn' as never);
          }}
          themeMode={themeMode}
        />
      ) : null}

      {summary && hasData ? (
        <View style={[styles.panel, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <MetricRow label="Due now" value={summary.dueNow} themeMode={themeMode} />
          <MetricRow label="Protected items" value={summary.protectedItems} themeMode={themeMode} />
          <Text style={[styles.text, { color: palette.textMuted }]}>{summary.nextAction}</Text>
        </View>
      ) : null}

      {summary?.buckets.map((bucket) => (
        <Card key={bucket.label} themeMode={themeMode} title={bucket.label} body={bucket.focus} meta={`${bucket.count} items`} />
      ))}
    </FeatureScaffold>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  text: {
    marginTop: 8,
    lineHeight: 22,
  },
});
