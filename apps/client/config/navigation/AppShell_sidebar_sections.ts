import { translate, type AppLanguage } from '../../features/i18n';

export type DrawerRoute =
  | 'learning'
  | 'daily-practice'
  | 'yki-practice'
  | 'yki-exam'
  | 'professional-finnish'
  | 'settings'
  | 'billing';

export type DrawerItem = {
  icon: string;
  label: string;
  accentColor: string;
  hint: string;
  onPress: () => void;
};

export type DrawerSection = {
  label: string;
  items: DrawerItem[];
};

export type NavigateTo = (route: DrawerRoute) => void;

export type DrawerEntitlements = {
  isPreview?: boolean;
  previewPath?: string | null;
  learnAccess?: boolean;
  ykiAccess?: boolean;
  professionalAccess?: boolean;
  professions?: string[];
  activeContext?: string;
  isInternalAllAccess?: boolean;
  hasAnySubscription?: boolean;
  isActive?: boolean;
};


export function createDrawerSections(
  navigateTo: NavigateTo,
  entitlements?: DrawerEntitlements,
  language: AppLanguage = 'fi',
): DrawerSection[] {
  const sections: DrawerSection[] = [];
  const hasSubscriptionAccess = Boolean(
    entitlements?.isInternalAllAccess ||
    entitlements?.hasAnySubscription ||
    entitlements?.isActive
  );
  const hasLearnAccess = Boolean(entitlements?.learnAccess || hasSubscriptionAccess);
  const hasProfessionalAccess = Boolean(entitlements?.professionalAccess || hasSubscriptionAccess);

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
          icon: '👀',
          label: previewLabel,
          accentColor: '#4F7FFF',
          hint: translate(language, 'drawerPreviewHint'),
          onPress: () => void navigateTo(entitlements.previewPath === 'yki' ? 'yki-practice' : 'professional-finnish'),
        },
        {
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
      items: [{ icon: '⚙', label: translate(language, 'drawerSettings'), accentColor: '#8EA3C3', hint: translate(language, 'drawerSettingsHint'), onPress: () => void navigateTo('settings') }],
    });
    return sections;
  }

  if (hasLearnAccess || hasProfessionalAccess) {
    sections.push({
      label: translate(language, 'drawerWorkplaceReadiness'),
      items: [
        ...(hasLearnAccess
          ? [
              {
                icon: '📘',
                label: translate(language, 'drawerEverydayFinnish'),
                accentColor: '#4F7FFF',
                hint: translate(language, 'drawerEverydayFinnishHint'),
                onPress: () => void navigateTo('learning'),
              },
            ]
          : []),
        ...(hasProfessionalAccess
          ? [
              {
                icon: '🗂',
                label: translate(language, 'drawerWorkplaceFinnish'),
                accentColor: '#4F7FFF',
                hint: translate(language, 'drawerWorkplaceFinnishHint'),
                onPress: () => void navigateTo('professional-finnish'),
              },
            ]
          : []),
      ],
    });
  }

  if (entitlements?.ykiAccess) {
    sections.push({
      label: translate(language, 'drawerYkiGoals'),
      items: [
        {
          icon: '◎',
          label: translate(language, 'drawerYkiPrep'),
          accentColor: '#A78BFA',
          hint: translate(language, 'drawerYkiPrepHint'),
          onPress: () => void navigateTo('yki-practice'),
        },
        {
          icon: '◈',
          label: translate(language, 'drawerYkiExam'),
          accentColor: '#A78BFA',
          hint: translate(language, 'drawerYkiExamHint'),
          onPress: () => void navigateTo('yki-exam'),
        },
      ],
    });
  }



  if (!sections.length) {
    sections.push({
      label: translate(language, 'drawerMyPathway'),
      items: [
        {
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
    label: translate(language, 'drawerAccountAndAccess'),
    items: [
      {
        icon: '💳',
        label: translate(language, 'drawerPlansAndAccess'),
        accentColor: '#8EA3C3',
        hint: translate(language, 'drawerPlansAndAccessHint'),
        onPress: () => void navigateTo('billing'),
      },
      {
        icon: '⚙',
        label: translate(language, 'drawerSettings'),
        accentColor: '#8EA3C3',
        hint: translate(language, 'drawerSettingsHint'),
        onPress: () => void navigateTo('settings'),
      },
    ],
  });

  return sections;
}

export default createDrawerSections;
