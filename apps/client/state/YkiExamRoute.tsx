import React, { useEffect } from 'react';

import type { YkiLevelBand } from '@core/api/ykiExam';
import YkiExamScreen from '../features/yki-exam/screens/YkiExamScreen';
import { audioPlayer } from '../features/exam/services/audioPlayer';

type Props = {
  onExit: () => void;
  onOpenMenu?: () => void;
  onOpenPractice?: (levelBand?: YkiLevelBand) => void;
  onOpenSpeakingConversation?: (levelBand: YkiLevelBand) => void;
  onOpenSpeakingRecording?: (levelBand: YkiLevelBand) => void;
  initialLevelBand?: YkiLevelBand;
};

export default function YkiExamRoute(props: Props) {
  // YKI_AUDIO_STOP_ON_EXIT_GUARD
  useEffect(() => {
    return () => {
      void audioPlayer.stopAsync();
    };
  }, []);


  useEffect(() => {
    return () => {
      void audioPlayer.stopAsync();
    };
  }, []);

  return <YkiExamScreen {...props} />;
}
