import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScaffold, PageHeader } from '@ui/components';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { authService } from '@core/api/auth';
import { LEGAL_URLS } from '../config/legalUrls';
import { useTranslator } from '../features/i18n';

import { useAuthStore } from './authStore';
import { SPEECH_RATE_PRESETS, usePreferencesStore } from './preferencesStore';
import { useSubscriptionStore } from './subscriptionStore';

const LOGO = require('../assets/images/kielivalmis-app-icon.png');

type ImagePickerModule = {
  MediaTypeOptions?: { Images?: unknown };
  MediaType?: { Images?: unknown };
  requestMediaLibraryPermissionsAsync?: () => Promise<{ granted?: boolean }>;
  launchImageLibraryAsync?: (opts: Record<string, unknown>) => Promise<{
    canceled?: boolean;
    cancelled?: boolean;
    assets?: Array<{ uri?: string }>;
  }>;
};

function Toggle({ value, onValueChange, activeColor, inactiveColor }: { value: boolean; onValueChange: (v: boolean) => void; activeColor: string; inactiveColor: string }) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[styles.toggleTrack, { backgroundColor: value ? activeColor : inactiveColor }]}
    >
      <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 18 : 2 }] }]} />
    </Pressable>
  );
}

type Props = {
  onBack: () => void;
  onOpenBilling: () => void;
  onOpenHelp: () => void;
  onOpenMenu: () => void;
};

function SettingRow({
  label,
  value,
  hint,
  actionLabel,
  onPress,
  palette,
}: {
  label: string;
  value?: string;
  hint?: string;
  actionLabel?: string;
  onPress?: () => void;
  palette: ReturnType<typeof getFloentlyPalette>;
}) {
  return (
    <View style={[styles.rowCard, { backgroundColor: palette.surface, borderColor: palette.border }]}> 
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
        {hint ? <Text style={[styles.rowHint, { color: palette.textMuted }]}>{hint}</Text> : null}
      </View>
      {value ? <Text style={[styles.rowValue, { color: palette.textSoft }]}>{value}</Text> : null}
      {actionLabel && onPress ? (
        <Pressable onPress={onPress} style={[styles.inlineButton, { backgroundColor: palette.primarySurface }]}> 
          <Text style={[styles.inlineButtonText, { color: palette.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function speechRateLabel(id: string, language: string) {
  const labels: Record<string, Record<string, string>> = {
    very_slow: { en: 'Very slow', fi: 'Erittäin hidas', sv: 'Mycket långsam' },
    slow: { en: 'Slow', fi: 'Hidas', sv: 'Långsam' },
    normal: { en: 'Normal', fi: 'Normaali', sv: 'Normal' },
    natural: { en: 'Natural', fi: 'Luonnollinen', sv: 'Naturlig' },
  };
  return labels[id]?.[language] ?? labels[id]?.en ?? id;
}

function speechRateHint(language: string) {
  if (language === 'fi') {
    return 'Erittäin hidas sopii aloittelijan roolipeliin. Luonnollinen sopii vapaampaan keskusteluun.';
  }
  if (language === 'sv') {
    return 'Mycket långsam passar nybörjarrollspel. Naturlig passar friare samtal.';
  }
  return 'Very slow is best for beginner roleplay. Natural is better for freer conversations.';
}

function resolveMediaTypes(ImagePicker: ImagePickerModule) {
  if (ImagePicker.MediaTypeOptions?.Images) return ImagePicker.MediaTypeOptions.Images;
  if (ImagePicker.MediaType?.Images) return [ImagePicker.MediaType.Images];
  return ['images'];
}

async function pickPhotoFromDevice(): Promise<{ uri: string | null; reason?: 'cancelled' | 'unavailable' | 'permission' }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ImagePicker = require('expo-image-picker') as ImagePickerModule;

    if (!ImagePicker?.launchImageLibraryAsync) {
      return { uri: null, reason: 'unavailable' };
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync?.();
    if (permission && permission.granted === false) {
      return { uri: null, reason: 'permission' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: resolveMediaTypes(ImagePicker),
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      selectionLimit: 1,
    });

    if (!result || result.canceled || result.cancelled) {
      return { uri: null, reason: 'cancelled' };
    }

    return { uri: result.assets?.[0]?.uri ?? null };
  } catch {
    return { uri: null, reason: 'unavailable' };
  }
}

export default function SettingsRoute({ onBack, onOpenBilling, onOpenHelp, onOpenMenu }: Props) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const setTheme = usePreferencesStore((state) => state.setTheme);
  const language = usePreferencesStore((state) => state.language);
  const speechRate = usePreferencesStore((state) => state.speechRate);
  const setSpeechRate = usePreferencesStore((state) => state.setSpeechRate);
  const hintsEnabled = usePreferencesStore((state) => state.hintsEnabled);
  const setHintsEnabled = usePreferencesStore((state) => state.setHintsEnabled);
  const clockFormat = usePreferencesStore((state) => state.clockFormat);
  const setClockFormat = usePreferencesStore((state) => state.setClockFormat);
  const profilePhotoUri = usePreferencesStore((state) => state.profilePhotoUri);
  const subscriptionStatus = useSubscriptionStore((state) => state.status);
  const avatarMode = usePreferencesStore((state) => state.avatarMode);
  const setProfilePhotoUri = usePreferencesStore((state) => state.setProfilePhotoUri);
  const setAvatarMode = usePreferencesStore((state) => state.setAvatarMode);
  const resetAvatar = usePreferencesStore((state) => state.resetAvatar);
  const palette = getFloentlyPalette(themeMode);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const { t } = useTranslator();

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  const displayName =
    (user as { name?: string; displayName?: string; email?: string } | null)?.displayName ??
    (user as { name?: string; displayName?: string; email?: string } | null)?.name ??
    user?.email ??
    'KieliValmis learner';

  const initials = useMemo(() => {
    const source = displayName.trim() || user?.email || 'F';
    const parts = source.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'F';
  }, [displayName, user?.email]);

  const pathwaySummary = [
    {
      label: t('settingsMainGoal'),
      value: subscriptionStatus?.ykiAccess && subscriptionStatus?.professionalAccess
        ? (language === 'sv' ? 'YKI, arbete och livet i Finland' : language === 'en' ? 'YKI, work, and life in Finland' : 'YKI, työ ja elämä Suomessa')
        : subscriptionStatus?.ykiAccess
          ? (language === 'sv' ? 'YKI-förberedelse' : language === 'en' ? 'YKI preparation' : 'YKI-valmistautuminen')
          : subscriptionStatus?.professionalAccess
            ? (language === 'sv' ? 'Arbetsliv i Finland' : language === 'en' ? 'Work in Finland' : 'Työelämä Suomessa')
            : t('drawerChoosePathway'),
    },
    {
      label: t('settingsCurrentProfession'),
      value: subscriptionStatus?.professions?.length
        ? subscriptionStatus.professions.map((item) => item.replace('_', ' ')).join(', ')
        : language === 'sv' ? 'Inte vald ännu' : language === 'en' ? 'Not selected yet' : 'Ei vielä valittu',
    },
    {
      label: t('settingsCurrentPathway'),
      value: subscriptionStatus?.planLabel ?? (language === 'sv' ? 'Ingen aktiv väg' : language === 'en' ? 'No active pathway' : 'Ei aktiivista polkua'),
    },
    {
      label: t('settingsAccessType'),
      value: subscriptionStatus?.accessLabel ?? (language === 'sv' ? 'Individ' : language === 'en' ? 'Individual' : 'Yksilö'),
    },
  ];

  const showPhoto = avatarMode === 'photo' && Boolean(profilePhotoUri);

  async function handleChooseFromGallery() {
    setIsPickingPhoto(true);
    const result = await pickPhotoFromDevice();
    setIsPickingPhoto(false);

    if (result.uri) {
      await setProfilePhotoUri(result.uri);
      await setAvatarMode('photo');
      return;
    }

    if (result.reason === 'permission') {
      Alert.alert(
        t('settingsChooseFromGallery'),
        language === 'sv'
          ? 'Tillåt åtkomst till fotobiblioteket för att välja en profilbild.'
          : language === 'en'
            ? 'Allow gallery access to choose a profile picture.'
            : 'Salli gallerian käyttö profiilikuvan valitsemiseksi.',
      );
      return;
    }

    if (result.reason === 'unavailable') {
      Alert.alert(
        t('settingsChooseFromGallery'),
        'Photo library access is not available in this build yet. Install and configure expo-image-picker to enable gallery selection.',
      );
    }
  }

  async function openExternalUrl(url: string, label: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Link unavailable', `Could not open ${label} at the moment.`);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      t('commonDeleteAccount'),
      'This deletes your account and associated personal data, subject to legal retention requirements. Deletion is usually completed within 24 hours. Active subscriptions must be managed separately in the app store on your device.',
      [
        { text: t('commonCancel'), style: 'cancel' },
        {
          text: t('commonDeleteAccount'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final confirmation',
              'This action is permanent. Do you want to continue?',
              [
                { text: t('commonCancel'), style: 'cancel' },
                {
                  text: 'Yes, delete',
                  style: 'destructive',
                  onPress: () => {
                    void (async () => {
                      try {
                        await authService.deleteAccount({ deletionReason: 'in_app_settings' });
                        await logout();
                        Alert.alert('Account deleted', 'Your deletion request was submitted. Sign in is now disabled for this account.');
                      } catch (error) {
                        Alert.alert('Deletion failed', error instanceof Error ? error.message : 'Account deletion could not be completed.');
                      }
                    })();
                  },
                },
              ],
            );
          },
        },
      ],
    );
  }

  return (
    <AppScaffold
      allowScroll
      themeMode={themeMode}
      header={
        <PageHeader
          themeMode={themeMode}
          eyebrow={t('settingsEyebrow')}
          title={t('settingsTitle')}
          subtitle={t('settingsSubtitle')}
          actionLabel={t('commonBack')}
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
        />
      }
    >
      <View style={[styles.profileCard, { backgroundColor: palette.primary, shadowColor: palette.shadow }]}> 
        <View style={styles.profileTopRow}>
          {showPhoto ? (
            <Image source={{ uri: profilePhotoUri ?? undefined }} style={styles.profileAvatar} />
          ) : avatarMode === 'initials' ? (
            <View style={[styles.profileAvatar, styles.avatarFallback]}>
              <Text style={[styles.avatarInitials, { color: palette.primary }]}>{initials}</Text>
            </View>
          ) : (
            <Image source={LOGO} style={styles.profileAvatar} />
          )}
          <Pressable
            onPress={() => {
              void handleChooseFromGallery();
            }}
            style={[styles.smallBlueButton, { backgroundColor: 'rgba(255,255,255,0.16)' }]}
          > 
            <Text style={styles.smallBlueButtonText}>{isPickingPhoto ? t('settingsOpening') : t('settingsChooseFromGallery')}</Text>
          </Pressable>
        </View>
        <Text style={styles.profileName}>{displayName}</Text>
        <Text style={styles.profileEmail}>{user?.email ?? t('settingsSignedOut')}</Text>

        <View style={styles.avatarOptionsRow}>
          <Pressable
            onPress={() => {
              void setAvatarMode('initials');
            }}
            style={[styles.avatarOptionButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          >
            <Text style={styles.avatarOptionText}>{t('settingsUseInitials')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void resetAvatar();
            }}
            style={[styles.avatarOptionButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
          >
            <Text style={styles.avatarOptionText}>{t('settingsUseLogo')}</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.groupCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}>
        <Text style={[styles.groupTitle, { color: palette.text }]}>{t('settingsMyPathway')}</Text>
        <Text style={[styles.groupHint, { color: palette.textMuted }]}>{t('settingsPathwayHint')}</Text>
        <View style={styles.pathwaySummaryGrid}>
          {pathwaySummary.map((item) => (
            <View key={item.label} style={[styles.pathwaySummaryCard, { backgroundColor: palette.surface, borderColor: palette.border }]}>
              <Text style={[styles.pathwaySummaryLabel, { color: palette.textMuted }]}>{item.label}</Text>
              <Text style={[styles.pathwaySummaryValue, { color: palette.text }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <View style={[styles.sectionHeadingChip, { backgroundColor: palette.primarySurface }]}>
          <Text style={[styles.sectionHeadingText, { color: palette.primary }]}>{t('settingsAudio')}</Text>
        </View>
        <View style={[styles.groupCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}> 
          <Text style={[styles.groupTitle, { color: palette.text }]}>{t('settingsSpeakingSpeed')}</Text>
          <Text style={[styles.groupHint, { color: palette.textMuted }]}>{speechRateHint(language)}</Text>
          <View style={styles.speedRow}>
            {SPEECH_RATE_PRESETS.map((preset) => {
              const active = speechRate === preset.value;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => { void setSpeechRate(preset.value); }}
                  style={[styles.ratePill, { backgroundColor: active ? palette.primary : palette.surface, borderColor: active ? palette.primary : palette.border }]}
                >
                  <Text style={[styles.ratePillText, { color: active ? '#FFFFFF' : palette.text }]}>{speechRateLabel(preset.id, language)}</Text>
                  <Text style={[styles.ratePillMetaText, { color: active ? '#FFFFFF' : palette.textMuted }]}>{preset.value.toFixed(preset.value === 1 ? 0 : 2)}×</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <View style={[styles.sectionHeadingChip, { backgroundColor: palette.primarySurface }]}> 
          <Text style={[styles.sectionHeadingText, { color: palette.primary }]}>{t('settingsAppearance')}</Text>
        </View>
        <View style={[styles.groupCard, { backgroundColor: palette.surfaceMuted, borderColor: palette.border }]}> 
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={[styles.groupTitle, { color: palette.text }]}>{t('settingsDarkMode')}</Text>
              <Text style={[styles.groupHint, { color: palette.textMuted }]}>Switch the shell between light and dark.</Text>
            </View>
            <Toggle value={themeMode === 'dark'} onValueChange={(value) => { void setTheme(value ? 'dark' : 'light'); }} activeColor={palette.primary} inactiveColor={palette.surface} />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={[styles.groupTitle, { color: palette.text }]}>{t('settingsHintPopups')}</Text>
              <Text style={[styles.groupHint, { color: palette.textMuted }]}>Keep navigation help visible while you learn the app.</Text>
            </View>
            <Toggle value={hintsEnabled} onValueChange={(value) => { void setHintsEnabled(value); }} activeColor={palette.primary} inactiveColor={palette.surface} />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleCopy}>
              <Text style={[styles.groupTitle, { color: palette.text }]}>{t('settingsClockFormat')}</Text>
              <Text style={[styles.groupHint, { color: palette.textMuted }]}>Choose how the visible clock is shown in the app shell.</Text>
            </View>
            <View style={styles.clockFormatRow}>
              <Pressable onPress={() => { void setClockFormat('24h'); }} style={[styles.tinyButton, { backgroundColor: clockFormat === '24h' ? palette.accentSoft : palette.surface, borderColor: clockFormat === '24h' ? palette.accent : palette.border }]}> 
                <Text style={[styles.tinyButtonText, { color: clockFormat === '24h' ? palette.accent : palette.text }]}>24h</Text>
              </Pressable>
              <Pressable onPress={() => { void setClockFormat('12h'); }} style={[styles.tinyButton, { backgroundColor: clockFormat === '12h' ? palette.accentSoft : palette.surface, borderColor: clockFormat === '12h' ? palette.accent : palette.border }]}> 
                <Text style={[styles.tinyButtonText, { color: clockFormat === '12h' ? palette.accent : palette.text }]}>12h</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionBlock}>
        <View style={[styles.sectionHeadingChip, { backgroundColor: palette.primarySurface }]}> 
          <Text style={[styles.sectionHeadingText, { color: palette.primary }]}>{t('settingsAccount')}</Text>
        </View>
        <SettingRow label={t('settingsBillingAndPlan')} hint={t('drawerPlansAndAccessHint')} actionLabel={t('commonOpen')} onPress={onOpenBilling} palette={palette} />
        <SettingRow label={t('settingsHelpAndSupport')} hint="Get route guidance and quick support answers." actionLabel={t('commonOpen')} onPress={onOpenHelp} palette={palette} />
        <SettingRow label={t('settingsPrivacyPolicy')} hint="Review how KieliValmis handles account, voice, and transcript data." actionLabel={t('commonOpen')} onPress={() => { void openExternalUrl(LEGAL_URLS.privacyPolicy, 'privacy policy'); }} palette={palette} />
        <SettingRow label={t('settingsTermsOfUse')} hint="Read subscription and acceptable use terms." actionLabel={t('commonOpen')} onPress={() => { void openExternalUrl(LEGAL_URLS.termsOfUse, 'terms of use'); }} palette={palette} />
        <SettingRow label={t('settingsSupportAndContact')} hint="Public support page for response and escalation." actionLabel={t('commonOpen')} onPress={() => { void openExternalUrl(LEGAL_URLS.support, 'support page'); }} palette={palette} />
        <SettingRow label={t('settingsAccountDeletionPage')} hint="Public account deletion policy and request page." actionLabel={t('commonOpen')} onPress={() => { void openExternalUrl(LEGAL_URLS.accountDeletion, 'account deletion page'); }} palette={palette} />
        <SettingRow label={t('settingsProfile')} value={user?.email ?? t('settingsSignedOut')} hint={t('settingsProfileSync')} palette={palette} />
        <Pressable onPress={handleDeleteAccount} style={[styles.deleteButton, { borderColor: '#D93D3D', backgroundColor: '#FFF5F5' }]}>
      <Text style={styles.deleteText}>{t('commonDeleteAccount')}</Text>
        </Pressable>
        <Pressable onPress={() => { void logout(); }} style={[styles.logoutButton, { borderColor: palette.borderStrong, backgroundColor: palette.surface }]}> 
          <Text style={[styles.logoutText, { color: palette.text }]}>{t('settingsLogout')}</Text>
        </Pressable>
      </View>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    borderRadius: 26,
    padding: 18,
    gap: 8,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  profileTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFFFFF' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 20, fontWeight: '800' },
  smallBlueButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, flexShrink: 0 },
  smallBlueButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  profileName: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  profileEmail: { color: 'rgba(255,255,255,0.82)', fontSize: 13 },
  avatarOptionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  avatarOptionButton: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  avatarOptionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  sectionBlock: { gap: 10 },
  sectionHeadingChip: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  sectionHeadingText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  groupCard: { borderRadius: 22, borderWidth: 1, padding: 14, gap: 14 },
  groupTitle: { fontSize: 15, fontWeight: '800' },
  groupHint: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  pathwaySummaryGrid: { gap: 8 },
  pathwaySummaryCard: { borderRadius: 16, borderWidth: 1, padding: 10, gap: 4 },
  pathwaySummaryLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  pathwaySummaryValue: { fontSize: 13, fontWeight: '700' },
  speedRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  ratePill: { minHeight: 34, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  ratePillText: { fontSize: 12, fontWeight: '800' },
  ratePillMetaText: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  toggleCopy: { flex: 1, minWidth: 0 },
  clockFormatRow: { flexDirection: 'row', gap: 8, flexShrink: 0, width: 126, justifyContent: 'flex-end' },
  tinyButton: { minHeight: 34, width: 58, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tinyButtonText: { fontSize: 11, fontWeight: '700' },
  rowCard: { borderRadius: 20, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowCopy: { flex: 1, minWidth: 0, gap: 4 },
  rowLabel: { fontSize: 15, fontWeight: '800' },
  rowHint: { fontSize: 12, lineHeight: 18 },
  rowValue: { fontSize: 12, fontWeight: '600' },
  inlineButton: { minHeight: 32, borderRadius: 999, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  inlineButtonText: { fontSize: 11, fontWeight: '800' },
  logoutButton: { alignSelf: 'flex-start', minHeight: 36, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontSize: 12, fontWeight: '800' },
  deleteButton: { alignSelf: 'flex-start', minHeight: 36, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  deleteText: { fontSize: 12, fontWeight: '800', color: '#B12222' },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', flexShrink: 0 },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', position: 'absolute' },
});
