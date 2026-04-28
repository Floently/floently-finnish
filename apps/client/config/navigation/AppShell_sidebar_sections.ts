export type DrawerRoute =
  | 'learning'
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
};


export function createDrawerSections(navigateTo: NavigateTo, entitlements?: DrawerEntitlements): DrawerSection[] {
  const sections: DrawerSection[] = [];

  if (entitlements?.isPreview) {
    const previewLabel = entitlements.previewPath === 'yki' ? 'YKI pathway preview' : entitlements.previewPath === 'doctor' ? 'Doctor pathway preview' : entitlements.previewPath === 'nurse' ? 'Nurse pathway preview' : 'Practical Nurse pathway preview';
    sections.push({
      label: 'My Pathway',
      items: [
        {
          icon: '👀',
          label: previewLabel,
          accentColor: '#4F7FFF',
          hint: 'Preview mode is intentionally limited so learners can sample YKI or workplace Finnish before unlocking the full pathway.',
          onPress: () => void navigateTo(entitlements.previewPath === 'yki' ? 'yki-practice' : 'professional-finnish'),
        },
        {
          icon: '💳',
          label: 'Choose a pathway',
          accentColor: '#8EA3C3',
          hint: 'Unlock the full YKI pathway, one profession track, or a combined route for work and life in Finland.',
          onPress: () => void navigateTo('billing'),
        },
      ],
    });
    sections.push({
      label: 'Account',
      items: [{ icon: '⚙', label: 'Settings', accentColor: '#8EA3C3', hint: 'Theme, profile, audio, and pathway preferences.', onPress: () => void navigateTo('settings') }],
    });
    return sections;
  }

  if (entitlements?.learnAccess || entitlements?.professionalAccess) {
    sections.push({
      label: 'Workplace Readiness',
      items: [
        {
          icon: '🗂',
          label: 'Workplace Finnish',
          accentColor: '#4F7FFF',
          hint: 'Choose either Everyday Finnish or My Profession from one workplace hub.',
          onPress: () => void navigateTo('learning'),
        },
      ],
    });
  }

  if (entitlements?.ykiAccess) {
    sections.push({
      label: 'YKI and Settlement Goals',
      items: [
        {
          icon: '◎',
          label: 'YKI Prep',
          accentColor: '#A78BFA',
          hint: 'Guided, skill-by-skill YKI preparation that also supports citizenship, permanent residence, and work readiness goals.',
          onPress: () => void navigateTo('yki-practice'),
        },
        {
          icon: '◈',
          label: 'YKI Exam',
          accentColor: '#A78BFA',
          hint: 'Full simulation route for formal exam readiness and timing pressure.',
          onPress: () => void navigateTo('yki-exam'),
        },
      ],
    });
  }



  if (!sections.length) {
    sections.push({
      label: 'My Pathway',
      items: [
        {
          icon: '🔒',
          label: 'Choose a pathway',
          accentColor: '#4F7FFF',
          hint: 'Unlock YKI Prep, a profession track, or a combined pathway for work, citizenship, and life in Finland.',
          onPress: () => void navigateTo('billing'),
        },
      ],
    });
  }

  sections.push({
    label: 'Account and Access',
    items: [
      {
        icon: '💳',
        label: 'Plans and access',
        accentColor: '#8EA3C3',
        hint: 'Individual, employer, and city access options for pathways, programmes, and scaled rollout.',
        onPress: () => void navigateTo('billing'),
      },
      {
        icon: '⚙',
        label: 'Settings',
        accentColor: '#8EA3C3',
        hint: 'Theme, profile, pathway preferences, and study settings.',
        onPress: () => void navigateTo('settings'),
      },
    ],
  });

  return sections;
}

export default createDrawerSections;
