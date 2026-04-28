import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import type { CardBankBuckets, RuntimeCard } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  banks: CardBankBuckets;
};

function toneColor(card: RuntimeCard) {
  if (card.state === 'mastered') return '#4E8F6A';
  if (card.state === 'difficult') return '#D64545';
  if (card.state === 'learning') return '#B88A1A';
  return '#3A5FA0';
}

function Section({ title, subtitle, items, textColor, mutedColor }: { title: string; subtitle: string; items: RuntimeCard[]; textColor?: string; mutedColor?: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, textColor ? { color: textColor } : undefined]}>{title}</Text>
        <Text style={[styles.sectionSubtitle, mutedColor ? { color: mutedColor } : undefined]}>{subtitle}</Text>
      </View>
      {items.length ? items.slice(0, 20).map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: toneColor(item) }]} />
          <View style={styles.textBlock}>
            <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.88} style={[styles.primaryText, textColor ? { color: textColor } : undefined]}>{item.front_text}</Text>
            <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.9} style={[styles.secondaryText, mutedColor ? { color: mutedColor } : undefined]}>
              Seen {item.seen_count} • accuracy {Math.round(item.correct_rate * 100)}%
            </Text>
          </View>
          <Text style={[styles.stateTag, { color: toneColor(item) }]}>{item.state}</Text>
        </View>
      )) : <Text style={[styles.empty, mutedColor ? { color: mutedColor } : undefined]}>No items yet.</Text>}
    </View>
  );
}

export function CardBanksPanel({ visible, onClose, banks }: Props) {
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, isDark && { backgroundColor: palette.surfaceRaised }]}>
          <View style={styles.topBar}>
            <View>
              <Text style={[styles.title, isDark && { color: palette.text }]}>Review banks</Text>
              <Text style={[styles.subtitle, isDark && { color: palette.textMuted }]}>Use colour-coded recall to revisit difficult and easy items.</Text>
            </View>
            <Pressable onPress={onClose} style={[styles.closeButton, isDark && { backgroundColor: palette.primarySurface, borderColor: palette.border }]}>
              <Text style={[styles.closeLabel, isDark && { color: palette.primary }]}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>
            <Section title="Difficult" subtitle="Repeatedly wrong or still unstable." items={banks.difficult} textColor={isDark ? palette.text : undefined} mutedColor={isDark ? palette.textMuted : undefined} />
            <Section title="Learned" subtitle="Repeatedly correct and ready for lighter review." items={banks.learned} textColor={isDark ? palette.text : undefined} mutedColor={isDark ? palette.textMuted : undefined} />
            <Section title="Learning" subtitle="Seen and improving, but not yet stable." items={banks.learning} textColor={isDark ? palette.text : undefined} mutedColor={isDark ? palette.textMuted : undefined} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 18, 34, 0.18)',
    justifyContent: 'center',
    padding: 18,
  },
  sheet: {
    maxHeight: '82%',
    borderRadius: 28,
    backgroundColor: '#F9FBFF',
    padding: 18,
    shadowColor: '#123056',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A2A49',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#667B9F',
    maxWidth: 260,
  },
  closeButton: {
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    justifyContent: 'center',
    backgroundColor: '#EDF3FF',
    borderWidth: 1,
    borderColor: 'rgba(70, 102, 173, 0.14)',
  },
  closeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3157A5',
  },
  content: {
    gap: 16,
    paddingBottom: 12,
  },
  section: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(78, 107, 164, 0.1)',
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2A49',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6C7F9C',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(78, 107, 164, 0.14)',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#243552',
  },
  secondaryText: {
    fontSize: 12,
    color: '#7385A5',
  },
  stateTag: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  empty: {
    fontSize: 13,
    color: '#70819E',
  },
});
