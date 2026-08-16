import type { LearningSkill } from '../../core/schemas/learning';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FloentlyPalette } from '../theme/floentlyPalette';
import { SkillMark } from './identity';
import { learningRadius, learningSpacing, learningTouchTarget, skillIdentity } from './tokens';

export type PracticePathNodeState = 'pending' | 'current' | 'complete' | 'skipped' | 'error';

export type PracticePathNode = {
  id: string;
  label: string;
  skill: LearningSkill;
  state: PracticePathNodeState;
};

export type PracticeProgressPathProps = {
  nodes: PracticePathNode[];
  palette: FloentlyPalette;
  accessibilityLabel?: string;
  onStepPress?: (node: PracticePathNode, index: number) => void;
};

function stateLabel(state: PracticePathNodeState): string {
  switch (state) {
    case 'pending': return 'upcoming';
    case 'current': return 'current';
    case 'complete': return 'completed';
    case 'skipped': return 'skipped';
    case 'error': return 'needs attention';
  }
}

function nodeColor(state: PracticePathNodeState, palette: FloentlyPalette): string {
  switch (state) {
    case 'complete': return palette.success;
    case 'current': return palette.primary;
    case 'error': return palette.danger;
    case 'skipped': return palette.textMuted;
    case 'pending': return palette.borderStrong;
  }
}

export function PracticeProgressPath({
  nodes,
  palette,
  accessibilityLabel = 'Practice progress',
  onStepPress,
}: PracticeProgressPathProps) {
  const currentNodeIndex = nodes.findIndex((node) => node.state === 'current');
  const completedCount = nodes.filter((node) => node.state === 'complete').length;
  const progressNow = nodes.length === 0 ? 0 : currentNodeIndex >= 0 ? currentNodeIndex + 1 : Math.min(nodes.length, completedCount);
  const progressText = nodes.length === 0 ? 'No steps' : `Step ${progressNow} of ${nodes.length}`;

  return (
    <View style={styles.container}>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: 0, max: nodes.length, now: progressNow, text: progressText }}
        style={styles.progressSummary}
      >
        <Text style={[styles.progressSummaryText, { color: palette.textMuted }]}>{progressText}</Text>
      </View>
      <View style={styles.path}>
        {nodes.map((node, index) => {
          const color = nodeColor(node.state, palette);
          const content = (
            <>
              <View style={[styles.mark, { borderColor: color, backgroundColor: node.state === 'current' ? palette.primarySurface : palette.surfaceMuted }]}>
                <SkillMark skill={node.skill} color={color} size={17} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.label, { color: palette.text }]}>{node.label}</Text>
                <Text style={[styles.meta, { color: node.state === 'error' ? palette.danger : palette.textMuted }]}>
                  {skillIdentity[node.skill].label} · {stateLabel(node.state)}
                </Text>
              </View>
            </>
          );
          const nodeAccessibilityLabel = `${node.label}, ${skillIdentity[node.skill].label}, ${stateLabel(node.state)}`;

          if (onStepPress) {
            return (
              <Pressable
                key={node.id}
                accessibilityRole="button"
                accessibilityLabel={nodeAccessibilityLabel}
                accessibilityState={{ selected: node.state === 'current' }}
                hitSlop={learningTouchTarget.compactHitSlop}
                onPress={() => onStepPress(node, index)}
                style={({ pressed }) => [
                  styles.node,
                  { borderColor: node.state === 'current' ? palette.primary : palette.border, backgroundColor: pressed ? palette.surfaceRaised : palette.surface },
                ]}
              >
                {content}
              </Pressable>
            );
          }

          return (
            <View
              key={node.id}
              accessible
              accessibilityRole="text"
              accessibilityLabel={nodeAccessibilityLabel}
              style={[styles.node, { borderColor: node.state === 'current' ? palette.primary : palette.border, backgroundColor: palette.surface }]}
            >
              {content}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: learningSpacing.xs,
  },
  progressSummary: {
    alignSelf: 'flex-start',
  },
  progressSummaryText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  path: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: learningSpacing.xs,
    width: '100%',
  },
  node: {
    minHeight: learningTouchTarget.minimum,
    minWidth: 104,
    flexBasis: 132,
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: learningSpacing.xs,
    paddingHorizontal: learningSpacing.sm,
    paddingVertical: learningSpacing.xs,
    borderWidth: 1,
    borderRadius: learningRadius.medium,
  },
  mark: {
    width: 32,
    height: 32,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
  },
  copy: {
    minWidth: 0,
    flex: 1,
  },
  label: {
    flexShrink: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
  },
  meta: {
    flexShrink: 1,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
});
