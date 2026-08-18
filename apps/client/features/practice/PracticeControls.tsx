import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { PracticeSessionTask } from '@core/schemas/learning';
import Text from '@ui/primitives/Text';

import { formatPracticeSkills } from './fixtureRegistry';

export function ChoiceChip({
  label,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text variant="body" style={selected ? styles.choiceTextSelected : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ActionButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text variant="body">{label}</Text>
    </Pressable>
  );
}

export function SessionPath({
  completedCount,
  current,
  upcoming,
}: {
  completedCount: number;
  current?: PracticeSessionTask;
  upcoming: readonly PracticeSessionTask[];
}) {
  const labels = [
    ...Array.from({ length: completedCount }, (_, index) => `✓ ${index + 1}`),
    ...(current ? [`Now · ${formatPracticeSkills(current.task.skills)}`] : []),
    ...upcoming.map((item) => `Next · ${formatPracticeSkills(item.task.skills)}`),
  ];

  return (
    <View
      accessible
      accessibilityLabel={`Practice path. ${labels.join('. ')}`}
      style={styles.path}
    >
      {labels.map((label, index) => (
        <View key={`${label}-${index}`} style={styles.pathNode}>
          <Text variant="caption">{label}</Text>
        </View>
      ))}
    </View>
  );
}

export const practiceLayoutStyles = StyleSheet.create({
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionGrid: {
    gap: 10,
  },
  statusText: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});

const styles = StyleSheet.create({
  choice: {
    borderWidth: 1,
    borderColor: '#8EA3C3',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  choiceSelected: {
    backgroundColor: '#21365D',
    borderColor: '#21365D',
  },
  choiceTextSelected: {
    color: '#FFFFFF',
  },
  path: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pathNode: {
    borderWidth: 1,
    borderColor: '#B9C6D8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  action: {
    borderWidth: 1,
    borderColor: '#8EA3C3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
});
