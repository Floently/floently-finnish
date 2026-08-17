import React from 'react';
import { Text } from 'react-native';
import { getFloentlyPalette } from '../../theme/floentlyPalette';
import { IllustrationFrame } from '../illustration';
import { getLearningMotionSpec } from '../motion';
import { PracticeProgressPath, type PracticePathNode } from '../progress';

const palette = getFloentlyPalette('dark');
const nodes: PracticePathNode[] = [
  { id: 'read', label: 'Read a workplace handover message with a deliberately long label', skill: 'reading', state: 'current' },
  { id: 'write', label: 'Write the reply', skill: 'writing', state: 'pending' },
];

export const validSemanticIllustration = (
  <IllustrationFrame palette={palette} accessibilityLabel="A bus stop timetable used for the reading task">
    <Text>Context</Text>
  </IllustrationFrame>
);

export const validDecorativeIllustration = (
  <IllustrationFrame palette={palette} decorative>
    <Text>Decoration</Text>
  </IllustrationFrame>
);

// @ts-expect-error Semantic illustrations intentionally require an accessibility label.
export const invalidUnlabelledIllustration = <IllustrationFrame palette={palette}><Text>Missing label</Text></IllustrationFrame>;

export const smallScreenLongLabelContract = <PracticeProgressPath nodes={nodes} palette={palette} />;

const reducedSpec = getLearningMotionSpec('milestone', true);
const regularSpec = getLearningMotionSpec('task-enter', false);

const reducedDurationIsZero: 0 | number = reducedSpec.duration;
const regularDurationIsNumber: number = regularSpec.duration;

void reducedDurationIsZero;
void regularDurationIsNumber;
