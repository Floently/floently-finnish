import type { PropsWithChildren, ReactNode } from 'react';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { FloentlyPalette } from '../theme/floentlyPalette';
import { ReducedMotionAwareMotion } from './motion';
import { learningRadius, learningSpacing } from './tokens';

export type SemanticFeedbackTone = 'success' | 'error' | 'attention' | 'info';

function feedbackColor(tone: SemanticFeedbackTone, palette: FloentlyPalette): string {
  switch (tone) {
    case 'success': return palette.success;
    case 'error': return palette.danger;
    case 'attention': return palette.warning;
    case 'info': return palette.primary;
  }
}

function feedbackSymbol(tone: SemanticFeedbackTone): string {
  switch (tone) {
    case 'success': return '✓';
    case 'error': return '!';
    case 'attention': return '•';
    case 'info': return 'i';
  }
}

export type SemanticFeedbackProps = PropsWithChildren<{
  tone: SemanticFeedbackTone;
  title: string;
  message?: string;
  palette: FloentlyPalette;
  reveal?: boolean;
  testReduceMotionOverride?: boolean;
}>;

export function SemanticFeedback({
  tone,
  title,
  message,
  palette,
  reveal = true,
  testReduceMotionOverride,
  children,
}: SemanticFeedbackProps) {
  const semanticRole = tone === 'error' ? 'alert' : 'status';
  const liveRegion = tone === 'error' ? 'assertive' : 'polite';
  const color = feedbackColor(tone, palette);
  const content = (
    <View style={[styles.feedback, { backgroundColor: palette.surfaceMuted, borderColor: color }]}>
      <View
        accessible
        role={semanticRole}
        accessibilityLiveRegion={liveRegion}
        accessibilityLabel={[title, message].filter(Boolean).join('. ')}
        style={styles.feedbackSummary}
      >
        <View style={[styles.symbol, { borderColor: color }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Text style={[styles.symbolText, { color }]}>{feedbackSymbol(tone)}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
          {message ? <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );

  return reveal ? (
    <ReducedMotionAwareMotion kind={tone === 'success' ? 'success' : 'feedback-reveal'} testReduceMotionOverride={testReduceMotionOverride}>
      {content}
    </ReducedMotionAwareMotion>
  ) : content;
}

export type LearningStatePanelKind = 'loading' | 'empty' | 'error';

export type LearningStatePanelProps = {
  kind: LearningStatePanelKind;
  title: string;
  message: string;
  palette: FloentlyPalette;
  illustration?: ReactNode;
};

export function LearningStatePanel({ kind, title, message, palette, illustration }: LearningStatePanelProps) {
  const isError = kind === 'error';
  return (
    <View
      accessible
      accessibilityRole={isError ? 'alert' : 'text'}
      accessibilityLabel={`${title}. ${message}`}
      style={[styles.state, { backgroundColor: palette.surface, borderColor: isError ? palette.danger : palette.border }]}
    >
      {kind === 'loading' ? <ActivityIndicator accessibilityLabel="Loading" color={palette.primary} /> : illustration}
      <Text style={[styles.stateTitle, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.stateMessage, { color: palette.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  feedback: {
    width: '100%',
    gap: learningSpacing.sm,
    padding: learningSpacing.md,
    borderRadius: learningRadius.medium,
    borderWidth: 1,
  },
  feedbackSummary: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: learningSpacing.sm,
  },
  symbol: {
    width: 28,
    height: 28,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
  },
  symbolText: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '900',
  },
  copy: {
    minWidth: 0,
    flex: 1,
    gap: learningSpacing.xxs,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
  },
  state: {
    width: '100%',
    minHeight: 152,
    alignItems: 'center',
    justifyContent: 'center',
    gap: learningSpacing.xs,
    padding: learningSpacing.lg,
    borderWidth: 1,
    borderRadius: learningRadius.large,
  },
  stateTitle: {
    textAlign: 'center',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  stateMessage: {
    maxWidth: 520,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
  },
});
