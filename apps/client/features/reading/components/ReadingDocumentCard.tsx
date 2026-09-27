import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { FloentlyPalette } from '@ui/theme/floentlyPalette';

import type {
  ReadingScaffolding,
  ReadingTask,
} from '../readingEngine';

type ReadingDocumentCardProps = {
  palette: FloentlyPalette;
  task: ReadingTask;
  scaffolding: ReadingScaffolding;
  vocabularyOpen: boolean;
  onToggleVocabulary: () => void;
};

export function ReadingDocumentCard({
  palette,
  task,
  scaffolding,
  vocabularyOpen,
  onToggleVocabulary,
}: ReadingDocumentCardProps) {
  return (
    <View style={styles.stack}>
      {scaffolding.showContext || scaffolding.showReadingGoal ? (
        <View
          style={[
            styles.orientationCard,
            { backgroundColor: palette.primarySurface, borderColor: palette.border },
          ]}
        >
          {scaffolding.showContext ? (
            <View style={styles.orientationBlock}>
              <Text style={[styles.orientationLabel, { color: palette.primary }]}>Tilanne</Text>
              <Text style={[styles.orientationText, { color: palette.text }]}>{task.context}</Text>
            </View>
          ) : null}
          {scaffolding.showReadingGoal ? (
            <View style={styles.orientationBlock}>
              <Text style={[styles.orientationLabel, { color: palette.primary }]}>Lukutavoite</Text>
              <Text style={[styles.orientationText, { color: palette.text }]}>
                {task.readingGoal}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.document,
          { backgroundColor: palette.surface, borderColor: palette.border },
        ]}
      >
        <View style={styles.documentHeader}>
          <Text style={[styles.documentType, { color: palette.accent }]}>Luettava teksti</Text>
          <Text accessibilityRole="header" style={[styles.documentTitle, { color: palette.text }]}>
            {task.document.title}
          </Text>
          {task.document.metadata ? (
            <Text style={[styles.metadata, { color: palette.textMuted }]}>
              {task.document.metadata}
            </Text>
          ) : null}
        </View>
        <View style={scaffolding.chunkDocument ? styles.chunkedBody : styles.documentBody}>
          {task.document.segments.map((segment) => (
            <Text
              key={segment.id}
              style={[
                styles.segment,
                { color: palette.text },
                segment.emphasis === 'heading' ? styles.segmentHeading : null,
                segment.emphasis === 'metadata' ? { color: palette.textMuted } : null,
              ]}
            >
              {segment.text}
            </Text>
          ))}
        </View>
      </View>

      {task.vocabulary.length ? (
        <View
          style={[
            styles.vocabularyCard,
            { backgroundColor: palette.surfaceMuted, borderColor: palette.border },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              vocabularyOpen ? 'Piilota sanasto' : 'Näytä tekstin sanasto'
            }
            accessibilityState={{ expanded: vocabularyOpen }}
            onPress={onToggleVocabulary}
            style={({ pressed }) => [
              styles.vocabularyButton,
              { backgroundColor: pressed ? palette.primarySurface : 'transparent' },
            ]}
          >
            <Text style={[styles.vocabularyButtonText, { color: palette.primary }]}>
              {scaffolding.vocabularyLabel} {vocabularyOpen ? '−' : '+'}
            </Text>
          </Pressable>
          {vocabularyOpen ? (
            <View style={styles.vocabularyList} accessibilityLiveRegion="polite">
              {task.vocabulary.map((item) => (
                <View key={item.id} style={styles.vocabularyItem}>
                  <Text style={[styles.vocabularyTerm, { color: palette.text }]}>
                    {item.term} — {item.meaning}
                  </Text>
                  <Text style={[styles.vocabularyNote, { color: palette.textMuted }]}>
                    {item.contextNote}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    width: '100%',
    gap: 16,
  },
  orientationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  orientationBlock: {
    gap: 4,
  },
  orientationLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  orientationText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  document: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 22,
  },
  documentHeader: {
    gap: 7,
  },
  documentType: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  documentTitle: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '800',
  },
  metadata: {
    fontSize: 14,
    lineHeight: 21,
  },
  documentBody: {
    gap: 17,
  },
  chunkedBody: {
    gap: 24,
  },
  segment: {
    fontSize: 18,
    lineHeight: 29,
    fontWeight: '400',
  },
  segmentHeading: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  vocabularyCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  vocabularyButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  vocabularyButtonText: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
  },
  vocabularyList: {
    gap: 15,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  vocabularyItem: {
    gap: 3,
  },
  vocabularyTerm: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
  },
  vocabularyNote: {
    fontSize: 15,
    lineHeight: 23,
  },
});
