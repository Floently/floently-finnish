import { translate, type AppLanguage } from '../../features/i18n';

export type DrawerRoute =
  | 'learning'
  | 'daily-practice'
  | 'yki-practice'
  | 'yki-exam'
  | 'professional-finnish'
  | 'speaking-practice'
  | 'help'
  | 'progress'
  | 'settings'
  | 'billing';

export type DrawerActivity =
  | 'everyday-guided'
  | 'everyday-roleplay'
  | 'everyday-recorded'
  | 'everyday-cards-vocabulary'
  | 'everyday-cards-phrases'
  | 'everyday-cards-grammar'
  | 'everyday-reading'
  | 'everyday-writing'
  | 'professional-guided'
  | 'professional-roleplay'
  | 'professional-interview'
  | 'professional-recorded'
  | 'professional-incident-lab'
  | 'professional-cards-vocabulary'
  | 'professional-cards-phrases'
  | 'professional-cards-grammar'
  | 'professional-reading'
  | 'professional-writing';

export type DrawerItem = {
  id: string;
  icon: string;
  label: string;
  accentColor: string;
  hint: string;
  onPress?: () => void;
  children?: DrawerItem[];
};

export type DrawerSection = {
  label: string;
  items: DrawerItem[];
};

export type DrawerNavigationOptions = {
  learningBranch?: 'everyday';
  activity?: DrawerActivity;
};

export type NavigateTo = (
  route: DrawerRoute,
  options?: DrawerNavigationOptions,
) => void;

export type DrawerEntitlements = {
  isPreview?: boolean;
  previewPath?: string | null;
  learnAccess?: boolean;
  ykiAccess?: boolean;
  professionalAccess?: boolean;
  readAccess?: boolean;
  createAccess?: boolean;
  professions?: string[];
  activeContext?: string;
  isInternalAllAccess?: boolean;
  hasAnySubscription?: boolean;
  isActive?: boolean;
};

function everydayItems(
  navigateTo: NavigateTo,
  language: AppLanguage,
): DrawerItem[] {
  return [
    {
      id: 'everyday-overview',
      icon: '⌂',
      label: translate(language, 'drawerEverydayFinnish'),
      accentColor: '#4F7FFF',
      hint: translate(language, 'drawerEverydayFinnishHint'),
      onPress: () =>
        void navigateTo('learning', {
          learningBranch: 'everyday',
        }),
    },
    {
      id: 'everyday-speaking',
      icon: '🎙',
      label: translate(language, 'ykiRouteSkillSpeaking'),
      accentColor: '#F0A436',
      hint: translate(language, 'learningDailyRoleplayDetail'),
      children: [
        {
          id: 'everyday-guided',
          icon: '↗',
          label: `${translate(language, 'ykiPracticeGuidedPracticeLabel')} · ${translate(language, 'ykiRouteSkillSpeaking')}`,
          accentColor: '#F0A436',
          hint: translate(language, 'learningDailyRoleplayDetail'),
          onPress: () =>
            void navigateTo('learning', {
              learningBranch: 'everyday',
              activity: 'everyday-guided',
            }),
        },
        {
          id: 'everyday-roleplay',
          icon: '💬',
          label: translate(language, 'learningDailyRoleplayTitle'),
          accentColor: '#F0A436',
          hint: translate(language, 'learningDailyRoleplayDetail'),
          onPress: () =>
            void navigateTo('learning', {
              learningBranch: 'everyday',
              activity: 'everyday-roleplay',
            }),
        },
        {
          id: 'everyday-recorded',
          icon: '🎙',
          label: translate(language, 'speakingRecordedTitle'),
          accentColor: '#F0A436',
          hint: translate(language, 'speakingRecordedDetail'),
          onPress: () =>
            void navigateTo('learning', {
              learningBranch: 'everyday',
              activity: 'everyday-recorded',
            }),
        },
      ],
    },
    {
      id: 'everyday-cards',
      icon: '🃏',
      label: translate(language, 'learningEverydayFlashcardsTitle'),
      accentColor: '#4F7FFF',
      hint: translate(language, 'learningEverydayFlashcardsDetail'),
      children: [
        {
          id: 'everyday-cards-vocabulary',
          icon: 'Aa',
          label: translate(language, 'cardsVocabularyLabel'),
          accentColor: '#4F7FFF',
          hint: translate(language, 'learningEverydayFlashcardsMeta'),
          onPress: () =>
            void navigateTo('learning', {
              learningBranch: 'everyday',
              activity: 'everyday-cards-vocabulary',
            }),
        },
        {
          id: 'everyday-cards-phrases',
          icon: '💬',
          label: translate(language, 'cardsSentencesLabel'),
          accentColor: '#4F7FFF',
          hint: translate(language, 'learningEverydayFlashcardsMeta'),
          onPress: () =>
            void navigateTo('learning', {
              learningBranch: 'everyday',
              activity: 'everyday-cards-phrases',
            }),
        },
        {
          id: 'everyday-cards-grammar',
          icon: '§',
          label: translate(language, 'cardsGrammarLabel'),
          accentColor: '#4F7FFF',
          hint: translate(language, 'learningEverydayFlashcardsMeta'),
          onPress: () =>
            void navigateTo('learning', {
              learningBranch: 'everyday',
              activity: 'everyday-cards-grammar',
            }),
        },
      ],
    },
    {
      id: 'everyday-reading',
      icon: '📖',
      label: translate(language, 'ykiRouteSkillReading'),
      accentColor: '#4F7FFF',
      hint: translate(language, 'learningEverydaySubtitle'),
      onPress: () =>
        void navigateTo('learning', {
          learningBranch: 'everyday',
          activity: 'everyday-reading',
        }),
    },
    {
      id: 'everyday-writing',
      icon: '✍',
      label: translate(language, 'ykiRouteSkillWriting'),
      accentColor: '#4F7FFF',
      hint: translate(language, 'learningEverydaySubtitle'),
      onPress: () =>
        void navigateTo('learning', {
          learningBranch: 'everyday',
          activity: 'everyday-writing',
        }),
    },
  ];
}

function professionalItems(
  navigateTo: NavigateTo,
  language: AppLanguage,
): DrawerItem[] {
  return [
    {
      id: 'professional-overview',
      icon: '⌂',
      label: translate(language, 'drawerWorkplaceFinnish'),
      accentColor: '#2DD4BF',
      hint: translate(language, 'drawerWorkplaceFinnishHint'),
      onPress: () => void navigateTo('professional-finnish'),
    },
    {
      id: 'professional-speaking',
      icon: '🎙',
      label: translate(language, 'ykiRouteSkillSpeaking'),
      accentColor: '#F0A436',
      hint: translate(language, 'professionalRoleplayDetail'),
      children: [
        {
          id: 'professional-guided',
          icon: '↗',
          label: `${translate(language, 'ykiPracticeGuidedPracticeLabel')} · ${translate(language, 'ykiRouteSkillSpeaking')}`,
          accentColor: '#F0A436',
          hint: translate(language, 'professionalRoleplayDetail'),
          onPress: () =>
            void navigateTo('professional-finnish', {
              activity: 'professional-guided',
            }),
        },
        {
          id: 'professional-roleplay',
          icon: '💬',
          label: translate(language, 'professionalRoleplayTitle'),
          accentColor: '#F0A436',
          hint: translate(language, 'professionalRoleplayDetail'),
          onPress: () =>
            void navigateTo('professional-finnish', {
              activity: 'professional-roleplay',
            }),
        },
        {
          id: 'professional-interview',
          icon: '◫',
          label: translate(language, 'professionalInterviewTitle'),
          accentColor: '#F0A436',
          hint: translate(language, 'professionalInterviewDetail'),
          onPress: () =>
            void navigateTo('professional-finnish', {
              activity: 'professional-interview',
            }),
        },
        {
          id: 'professional-recorded',
          icon: '🎙',
          label: translate(language, 'speakingRecordedTitle'),
          accentColor: '#F0A436',
          hint: translate(language, 'speakingRecordedDetail'),
          onPress: () =>
            void navigateTo('professional-finnish', {
              activity: 'professional-recorded',
            }),
        },
      ],
    },
    {
      id: 'professional-incident-lab',
      icon: '🛠',
      label: translate(language, 'speakingIncidentLabTitle'),
      accentColor: '#2DD4BF',
      hint: translate(language, 'speakingIncidentLabDetail'),
      onPress: () =>
        void navigateTo('professional-finnish', {
          activity: 'professional-incident-lab',
        }),
    },
    {
      id: 'professional-cards',
      icon: '🃏',
      label: translate(language, 'professionalFlashcardsTitle'),
      accentColor: '#2DD4BF',
      hint: translate(language, 'professionalFlashcardsDetail'),
      children: [
        {
          id: 'professional-cards-vocabulary',
          icon: 'Aa',
          label: translate(language, 'cardsVocabularyLabel'),
          accentColor: '#2DD4BF',
          hint: translate(language, 'professionalFlashcardsDetail'),
          onPress: () =>
            void navigateTo('professional-finnish', {
              activity: 'professional-cards-vocabulary',
            }),
        },
        {
          id: 'professional-cards-phrases',
          icon: '💬',
          label: translate(language, 'cardsSentencesLabel'),
          accentColor: '#2DD4BF',
          hint: translate(language, 'professionalFlashcardsDetail'),
          onPress: () =>
            void navigateTo('professional-finnish', {
              activity: 'professional-cards-phrases',
            }),
        },
        {
          id: 'professional-cards-grammar',
          icon: '§',
          label: translate(language, 'cardsGrammarLabel'),
          accentColor: '#2DD4BF',
          hint: translate(language, 'professionalFlashcardsDetail'),
          onPress: () =>
            void navigateTo('professional-finnish', {
              activity: 'professional-cards-grammar',
            }),
        },
      ],
    },
    {
      id: 'professional-reading',
      icon: '📖',
      label: translate(language, 'ykiRouteSkillReading'),
      accentColor: '#2DD4BF',
      hint: translate(language, 'professionalSubtitle'),
      onPress: () =>
        void navigateTo('professional-finnish', {
          activity: 'professional-reading',
        }),
    },
    {
      id: 'professional-writing',
      icon: '✍',
      label: translate(language, 'ykiRouteSkillWriting'),
      accentColor: '#2DD4BF',
      hint: translate(language, 'professionalSubtitle'),
      onPress: () =>
        void navigateTo('professional-finnish', {
          activity: 'professional-writing',
        }),
    },
  ];
}

export function createDrawerSections(
  navigateTo: NavigateTo,
  entitlements?: DrawerEntitlements,
  language: AppLanguage = 'fi',
): DrawerSection[] {
  const sections: DrawerSection[] = [];
  const hasLearnAccess = Boolean(
    entitlements?.isInternalAllAccess ||
    entitlements?.learnAccess ||
    entitlements?.ykiAccess ||
    entitlements?.professionalAccess
  );
  const hasProfessionalAccess = Boolean(
    entitlements?.isInternalAllAccess ||
    entitlements?.professionalAccess
  );

  if (entitlements?.isPreview) {
    const previewLabel =
      entitlements.previewPath === 'yki'
        ? translate(language, 'drawerPreviewYki')
        : entitlements.previewPath === 'doctor'
          ? translate(language, 'drawerPreviewDoctor')
          : entitlements.previewPath === 'nurse'
            ? translate(language, 'drawerPreviewNurse')
            : translate(language, 'drawerPreviewPracticalNurse');
    sections.push({
      label: translate(language, 'drawerMyPathway'),
      items: [
        {
          id: 'preview-pathway',
          icon: '👀',
          label: previewLabel,
          accentColor: '#4F7FFF',
          hint: translate(language, 'drawerPreviewHint'),
          onPress: () =>
            void navigateTo(
              entitlements.previewPath === 'yki'
                ? 'yki-practice'
                : 'professional-finnish',
            ),
        },
        {
          id: 'preview-billing',
          icon: '💳',
          label: translate(language, 'drawerChoosePathway'),
          accentColor: '#8EA3C3',
          hint: translate(language, 'drawerChoosePathwayHint'),
          onPress: () => void navigateTo('billing'),
        },
      ],
    });
    sections.push({
      label: translate(language, 'drawerAccount'),
      items: [
        {
          id: 'preview-settings',
          icon: '⚙',
          label: translate(language, 'drawerSettings'),
          accentColor: '#8EA3C3',
          hint: translate(language, 'drawerSettingsHint'),
          onPress: () => void navigateTo('settings'),
        },
        {
          id: 'preview-help',
          icon: '?',
          label: translate(language, 'settingsHelpAndSupport'),
          accentColor: '#8EA3C3',
          hint: translate(language, 'settingsHelpAndSupport'),
          onPress: () => void navigateTo('help'),
        },
      ],
    });
    return sections;
  }

  const learnerPaths: DrawerItem[] = [];

  if (hasLearnAccess) {
    learnerPaths.push({
      id: 'everyday',
      icon: '📘',
      label: translate(language, 'drawerEverydayFinnish'),
      accentColor: '#4F7FFF',
      hint: translate(language, 'drawerEverydayFinnishHint'),
      children: everydayItems(navigateTo, language),
    });
  }

  if (hasProfessionalAccess) {
    learnerPaths.push({
      id: 'professional',
      icon: '🗂',
      label: translate(language, 'drawerWorkplaceFinnish'),
      accentColor: '#2DD4BF',
      hint: translate(language, 'drawerWorkplaceFinnishHint'),
      children: professionalItems(navigateTo, language),
    });
  }

  if (entitlements?.ykiAccess) {
    learnerPaths.push({
      id: 'yki',
      icon: '◎',
      label: translate(language, 'drawerYkiGoals'),
      accentColor: '#A78BFA',
      hint: translate(language, 'drawerYkiPrepHint'),
      children: [
        {
          id: 'yki-practice',
          icon: '◎',
          label: translate(language, 'drawerYkiPrep'),
          accentColor: '#A78BFA',
          hint: translate(language, 'drawerYkiPrepHint'),
          onPress: () => void navigateTo('yki-practice'),
        },
        {
          id: 'yki-exam',
          icon: '◈',
          label: translate(language, 'drawerYkiExam'),
          accentColor: '#A78BFA',
          hint: translate(language, 'drawerYkiExamHint'),
          onPress: () => void navigateTo('yki-exam'),
        },
      ],
    });
  }

  if (learnerPaths.length) {
    sections.push({
      label: translate(language, 'drawerMainPaths'),
      items: learnerPaths,
    });
  } else {
    sections.push({
      label: translate(language, 'drawerMyPathway'),
      items: [
        {
          id: 'choose-pathway',
          icon: '🔒',
          label: translate(language, 'drawerChoosePathway'),
          accentColor: '#4F7FFF',
          hint: translate(language, 'drawerChoosePathwayHint'),
          onPress: () => void navigateTo('billing'),
        },
      ],
    });
  }

  sections.push({
    label: translate(language, 'drawerMyPathway'),
    items: [
      ...(hasLearnAccess
        ? [
            {
              id: 'practice',
              icon: '▶',
              label: translate(language, 'ykiPracticeGuidedPracticeLabel'),
              accentColor: '#3EC58A',
              hint: translate(language, 'ykiPracticeOverviewDetail'),
              onPress: () => void navigateTo('daily-practice'),
            },
          ]
        : []),
      {
        id: 'progress',
        icon: '📈',
        label: translate(language, 'progressTitle'),
        accentColor: '#3EC58A',
        hint: translate(language, 'progressSubtitle'),
        onPress: () => void navigateTo('progress'),
      },
    ],
  });

  sections.push({
    label: translate(language, 'drawerAccountAndAccess'),
    items: [
      {
        id: 'billing',
        icon: '💳',
        label: translate(language, 'drawerPlansAndAccess'),
        accentColor: '#8EA3C3',
        hint: translate(language, 'drawerPlansAndAccessHint'),
        onPress: () => void navigateTo('billing'),
      },
      {
        id: 'settings',
        icon: '⚙',
        label: translate(language, 'drawerSettings'),
        accentColor: '#8EA3C3',
        hint: translate(language, 'drawerSettingsHint'),
        onPress: () => void navigateTo('settings'),
      },
      {
        id: 'help',
        icon: '?',
        label: translate(language, 'settingsHelpAndSupport'),
        accentColor: '#8EA3C3',
        hint: translate(language, 'settingsHelpAndSupport'),
        onPress: () => void navigateTo('help'),
      },
    ],
  });

  return sections;
}

export default createDrawerSections;
