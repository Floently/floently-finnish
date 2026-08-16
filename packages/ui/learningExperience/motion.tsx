import type { PropsWithChildren } from 'react';
import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { learningMotionDuration } from './tokens';

export type LearningMotionKind =
  | 'task-enter'
  | 'task-complete'
  | 'next-task'
  | 'feedback-reveal'
  | 'success'
  | 'milestone';

type MotionSpec = {
  duration: number;
  enter: boolean;
  exit: boolean;
  layout: boolean;
};

export function getLearningMotionSpec(kind: LearningMotionKind, reduceMotion: boolean): MotionSpec {
  if (reduceMotion) {
    return { duration: 0, enter: false, exit: false, layout: false };
  }

  switch (kind) {
    case 'task-enter':
      return { duration: learningMotionDuration.standard, enter: true, exit: false, layout: true };
    case 'task-complete':
      return { duration: learningMotionDuration.success, enter: false, exit: true, layout: true };
    case 'next-task':
      return { duration: learningMotionDuration.deliberate, enter: true, exit: true, layout: true };
    case 'feedback-reveal':
      return { duration: learningMotionDuration.quick, enter: true, exit: false, layout: true };
    case 'success':
      return { duration: learningMotionDuration.success, enter: true, exit: false, layout: true };
    case 'milestone':
      return { duration: learningMotionDuration.milestone, enter: true, exit: false, layout: true };
  }
}

export type ReducedMotionAwareProps = PropsWithChildren<{
  kind?: LearningMotionKind;
  style?: StyleProp<ViewStyle>;
  testReduceMotionOverride?: boolean;
  accessibilityLabel?: string;
}>;

export function ReducedMotionAwareMotion({
  children,
  kind = 'task-enter',
  style,
  testReduceMotionOverride,
  accessibilityLabel,
}: ReducedMotionAwareProps) {
  const systemReduceMotion = useReducedMotion();
  const reduceMotion = testReduceMotionOverride ?? systemReduceMotion;
  const spec = getLearningMotionSpec(kind, reduceMotion);

  const entering = spec.enter
    ? FadeIn.duration(spec.duration).reduceMotion(ReduceMotion.System)
    : undefined;
  const exiting = spec.exit
    ? FadeOut.duration(spec.duration).reduceMotion(ReduceMotion.System)
    : undefined;
  const layout = spec.layout
    ? LinearTransition.duration(spec.duration).reduceMotion(ReduceMotion.System)
    : undefined;

  return (
    <Animated.View
      entering={entering}
      exiting={exiting}
      layout={layout}
      style={style}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Animated.View>
  );
}
