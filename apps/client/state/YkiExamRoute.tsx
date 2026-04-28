import React from 'react';

import type { YkiLevelBand } from '@core/api/ykiExam';
import YkiExamScreen from '../features/yki-exam/screens/YkiExamScreen';

type Props = {
  onExit: () => void;
  onOpenMenu?: () => void;
  onOpenPractice?: (levelBand?: YkiLevelBand) => void;
  onOpenSpeakingConversation?: (levelBand: YkiLevelBand) => void;
  onOpenSpeakingRecording?: (levelBand: YkiLevelBand) => void;
  initialLevelBand?: YkiLevelBand;
};

export default function YkiExamRoute(props: Props) {
  return <YkiExamScreen {...props} />;
}
