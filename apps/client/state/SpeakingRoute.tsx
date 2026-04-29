import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from './preferencesStore';
import { useSubscriptionStore } from './subscriptionStore';
import { useTranslator } from '../features/i18n';
import { LEVEL_BANDS, SPEAKING_TRACKS } from '../features/speaking/types';
import type { RoleplayLevelBand, RoleplayProfession } from '@core/api/roleplay';
import { resolveProfessionalDisplayName } from '@core/api/entitlements';
import RoleplayConversationScreen from '../features/speaking/screens/RoleplayConversationScreen';
import RecordedResponseScreen from '../features/speaking/screens/RecordedResponseScreen';
import type { SpeakingSurface } from '../features/speaking/types';

const T = {
  bg: '#0C1222', surface: '#111B30', surfaceRaised: '#16233E', surfaceMuted: '#101A2F', border: '#1E2E47', text: '#F0F5FF', muted: '#8EA3C3', soft: '#5C7299', speak: '#F0A436', pro: '#2DD4BF', yki: '#A78BFA', primary: '#4F7FFF',
};
const TRACK_ACCENTS: Record<string, string> = { general: T.speak, nurse: T.pro, doctor: T.yki, practical_nurse: T.primary };

type Props = {
  onBack: () => void;
  onOpenMenu: () => void;
  initialLevelBand?: RoleplayLevelBand;
  initialSurface?: SpeakingSurface;
  initialProfession?: RoleplayProfession;
  initialScenarioId?: string | null;
  lockProfession?: boolean;
  entryMode?: 'workplace' | 'interview';
  contextLabel?: string;
};

type ScenarioCard = { title: string; summary: string; label: string };

function scenarioCardsForProfession(profession: RoleplayProfession): ScenarioCard[] {
  switch (profession) {
    case 'nurse':
      return [
        { title: 'Shift handover', summary: 'Summarise changes, priorities, and safety details clearly.', label: 'handover' },
        { title: 'Patient update', summary: 'Describe observations, comfort, and next action in calm Finnish.', label: 'patient update' },
        { title: 'Interview beta', summary: 'Structured nurse interview practice with profession-specific prompts.', label: 'interview' },
      ];
    case 'doctor':
      return [
        { title: 'Patient interview', summary: 'Ask concise questions and check understanding before moving on.', label: 'interview' },
        { title: 'Explain next steps', summary: 'Give instructions and follow-up language in a structured way.', label: 'follow-up' },
        { title: 'Interview beta', summary: 'Structured doctor interview practice with profession-specific prompts.', label: 'beta' },
      ];
    case 'practical_nurse':
      return [
        { title: 'Daily-care report', summary: 'Describe routines, mobility, and observations with clear sequence.', label: 'daily care' },
        { title: 'Support and guidance', summary: 'Use reassuring Finnish while giving simple instructions.', label: 'support' },
        { title: 'Interview beta', summary: 'Structured practical nurse interview practice with role-specific prompts.', label: 'interview' },
      ];
    default:
      return [
        { title: 'Supervisor instructions', summary: 'Check task details and repeat the key instruction back clearly.', label: 'instructions' },
        { title: 'Shift handover', summary: 'Give a short, useful update that helps the next person start smoothly.', label: 'handover' },
        { title: 'Issue reporting', summary: 'Explain a problem, what you did, and what help you need next.', label: 'reporting' },
      ];
  }
}

function defaultInterviewScenario(profession: RoleplayProfession): string | null {
  switch (profession) {
    case 'doctor': return 'doctor_patient_interview';
    case 'nurse': return 'nurse_interview_beta';
    case 'practical_nurse': return 'practical_nurse_interview';
    default: return null;
  }
}

export default function SpeakingRoute({ onBack, onOpenMenu, initialLevelBand = 'B1-B2', initialSurface = 'menu', initialProfession = 'general', initialScenarioId = null, lockProfession = false, entryMode = 'workplace', contextLabel }: Props) {
  const { t } = useTranslator();
  const subscriptionStatus = useSubscriptionStore((s) => s.status);
  const activeContext = useSubscriptionStore((s) => s.activeContext);
  const [surface, setSurface] = useState<SpeakingSurface>(initialSurface);
  const [profession, setProfession] = useState<RoleplayProfession>(initialProfession);
  const [levelBand, setLevelBand] = useState<RoleplayLevelBand>(initialLevelBand);
  const [scenarioId, setScenarioId] = useState<string | null>(initialScenarioId);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';

  useEffect(() => { setLevelBand(initialLevelBand); }, [initialLevelBand]);

  // Do not continuously force `surface` back to `initialSurface`.
  // `initialSurface` is only the starting point from AppShell/navigation.
  // After the user enters conversation mode, local state must own the surface.
  // Otherwise a harmless parent route/status refresh can throw the user back
  // to the speaking menu while the roleplay backend session is already working.
  useEffect(() => {
    setSurface((current) => {
      if (current === "conversation" || current === "recorded") {
        return current;
      }
      return initialSurface;
    });
  }, [initialSurface]);

  useEffect(() => { setScenarioId(initialScenarioId); }, [initialScenarioId]);
  useEffect(() => {
    const derived = initialProfession !== 'general' ? initialProfession : (activeContext === 'doctor' || activeContext === 'nurse' || activeContext === 'practical_nurse' ? activeContext : 'general');
    setProfession(derived);
  }, [activeContext, initialProfession]);

  const entitledTracks = useMemo(() => {
    const professions = subscriptionStatus?.entitlements?.professions ?? [];
    const set = new Set<RoleplayProfession>();
    professions.forEach((p) => {
      if (p === 'doctor' || p === 'nurse' || p === 'practical_nurse') set.add(p);
    });
    return set;
  }, [subscriptionStatus?.entitlements?.professions]);

  // ── Roleplay UX restructuring (per-profession isolation) ────────────────
  // The user should NEVER see a track picker that mixes professions. They
  // are always in exactly one profession's area at a time. To switch
  // profession, they go back to the hub.
  //
  // Behavior:
  //   - The track picker is removed entirely. `availableTracks` is no longer
  //     used for rendering — kept in code only for backwards-compat with
  //     callers that read it.
  //   - The active profession is whichever was set as initialProfession
  //     (from navigation preset) or derived from activeContext.
  //   - The user can still see scenarios appropriate for their profession,
  //     but never scenarios from other professions.
  //
  // This was the cross-contamination bug: a nurse-entitled user would
  // sometimes see doctor and practical_nurse tracks because the picker
  // surfaced everything they were entitled to. Now they only see nurse
  // scenarios, and to access doctor or practical_nurse they navigate
  // through the appropriate hub entry.
  const availableTracks = useMemo(() => {
    if (lockProfession && (profession === 'doctor' || profession === 'nurse' || profession === 'practical_nurse')) {
      return SPEAKING_TRACKS.filter((track) => track.id === profession);
    }
    // Strict-isolation mode: only the current profession is in the list,
    // never multiple. The previous behavior (multi-track picker) is gone.
    return SPEAKING_TRACKS.filter((track) => track.id === profession);
  }, [lockProfession, profession]);

  const activeTrack = useMemo(() => availableTracks.find((t) => t.id === profession) ?? availableTracks[0] ?? SPEAKING_TRACKS[0], [availableTracks, profession]);
  const scenarios = scenarioCardsForProfession(profession);

  const bg = isDark ? T.bg : palette.background;
  const surface_ = isDark ? T.surface : palette.surface;
  const border = isDark ? T.border : palette.border;
  const textColor = isDark ? T.text : palette.text;
  const mutedColor = isDark ? T.muted : palette.textMuted;
  const softColor = isDark ? T.soft : palette.textSoft;
  const raisedBg = isDark ? T.surfaceRaised : palette.surfaceMuted;
  const accent = TRACK_ACCENTS[profession] ?? T.speak;
  const heading = profession === 'general' ? 'Workplace scenarios' : `${resolveProfessionalDisplayName(profession)} workplace scenarios`;

  if (surface === 'conversation') {
    return <RoleplayConversationScreen profession={profession} levelBand={levelBand} scenarioId={scenarioId ?? (entryMode === 'interview' ? defaultInterviewScenario(profession) : null)} onBack={() => setSurface('menu')} entryMode={entryMode} />;
  }
  if (surface === 'recorded') {
    return <RecordedResponseScreen profession={profession} levelBand={levelBand} onBack={() => setSurface('menu')} />;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={[styles.navBtn, { backgroundColor: raisedBg, borderColor: border }]}><Text style={[styles.navBtnText, { color: mutedColor }]}>{t('speakingBack')}</Text></Pressable>
          <Pressable onPress={onOpenMenu} style={[styles.navBtn, { backgroundColor: raisedBg, borderColor: border }]}><Text style={[styles.navBtnText, { color: mutedColor }]}>{t('speakingMenu')}</Text></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.headingBlock}>
            <Text style={[styles.eyebrow, { color: accent }]}>{entryMode === 'interview' ? 'Interview readiness' : 'Workforce readiness'}</Text>
            <Text style={[styles.pageTitle, { color: textColor }]}>{heading}</Text>
            <Text style={[styles.pageSub, { color: mutedColor }]}>{contextLabel ? `${contextLabel} — practise short workplace situations that connect language directly to real tasks in Finland.` : 'Use scenario practice for supervisor instructions, handovers, issue reporting, and everyday work communication.'}</Text>
          </View>
          <View style={[styles.section, { backgroundColor: surface_, borderColor: border }]}>
            <Text style={[styles.sectionTitle, { color: softColor }]}>Level</Text>
            <View style={styles.levelRow}>{LEVEL_BANDS.map((band) => (<Pressable key={band} onPress={() => setLevelBand(band)} style={[styles.levelPill, { borderColor: border, backgroundColor: raisedBg }, levelBand === band && { backgroundColor: accent, borderColor: accent }]}><Text style={[styles.levelText, { color: mutedColor }, levelBand === band && styles.levelTextActive]}>{band}</Text></Pressable>))}</View>
          </View>
          {/* Track picker removed in the per-profession isolation refactor.
              Previously this surfaced nurse/doctor/practical_nurse alongside
              each other when the user had multi-profession entitlements,
              which created cross-track confusion. Each profession now has
              its own dedicated area; switching profession is done via the
              navigation hub, not via an in-page picker. */}

          {/* ── Per-profession sub-nav ───────────────────────────────────────
              The user sees three (or two for general) prominent entry tiles:
                Roleplay  →  workplace dialogue scenarios
                Interview →  structured interview practice (skipped for general)
                Incident workflow → existing work-incidence-recording feature
              Each tile is a dedicated flow, not a sub-section of a single
              "speaking practice" surface. This matches the user's request
              that nurse should have its own UI with separate links for
              roleplay vs interview vs other tools. */}
          <View style={styles.subnavSection}>
            <Text style={[styles.sectionTitle, { color: softColor }]}>{t('speakingChooseActionTitle')}</Text>
            <View style={styles.subnavGrid}>
              <Pressable
                onPress={() => {
                  setScenarioId(null);
                  setSurface('conversation');
                }}
                style={[styles.subnavTile, { backgroundColor: surface_, borderColor: border }]}
                accessibilityRole="button"
                accessibilityLabel="Open roleplay"
              >
                <View style={[styles.subnavIconBadge, { backgroundColor: `${accent}18` }]}>
                  <Text style={[styles.subnavIconText, { color: accent }]}>💬</Text>
                </View>
                <View style={styles.subnavTileText}>
                  <Text style={[styles.subnavTileTitle, { color: textColor }]}>{t('speakingRoleplayTitle')}</Text>
                  <Text style={[styles.subnavTileSub, { color: mutedColor }]}>
                    {t('speakingWorkplaceDialoguesDetail')}
                  </Text>
                </View>
              </Pressable>

              {/* ── Interview tile — beta locked ────────────────
                  The full adaptive interview engine is part of Engine B
                  (Beta), which is in development. Rather than dropping the
                  user into a scripted "interview" that doesn't deliver on
                  the interview promise, we surface a clear locked-state label
                  state. When Beta launches, this tile becomes tappable.
              */}
              {profession !== 'general' ? (
                <View
                  style={[styles.subnavTile, styles.subnavTileLocked, { backgroundColor: surface_, borderColor: border }]}
                  accessibilityRole="text"
                  accessibilityLabel={t('speakingInterviewComingSoonAccessibility')}
                >
                  <View style={[styles.subnavIconBadge, { backgroundColor: `${accent}10` }]}>
                    <Text style={[styles.subnavIconText, { color: accent, opacity: 0.55 }]}>🎯</Text>
                  </View>
                  <View style={styles.subnavTileText}>
                    <View style={styles.subnavTitleRow}>
                      <Text style={[styles.subnavTileTitle, { color: textColor, opacity: 0.6 }]}>Interview</Text>
                      <View style={[styles.comingSoonBadge, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
                        <Text style={[styles.comingSoonText, { color: accent }]}>{t('speakingComingSoon')}</Text>
                      </View>
                    </View>
                    <Text style={[styles.subnavTileSub, { color: mutedColor, opacity: 0.7 }]}>
                      {t('speakingInterviewBetaDetailFull')}
                    </Text>
                  </View>
                </View>
              ) : null}

              <Pressable
                onPress={() => setSurface('recorded')}
                style={[styles.subnavTile, { backgroundColor: surface_, borderColor: border }]}
                accessibilityRole="button"
                accessibilityLabel="Record a work update"
              >
                <View style={[styles.subnavIconBadge, { backgroundColor: `${accent}18` }]}>
                  <Text style={[styles.subnavIconText, { color: accent }]}>🎙️</Text>
                </View>
                <View style={styles.subnavTileText}>
                  <Text style={[styles.subnavTileTitle, { color: textColor }]}>{t('speakingRecordedTitle')}</Text>
                  <Text style={[styles.subnavTileSub, { color: mutedColor }]}>
                    {t('speakingRecordedDetail')}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push('/professional/incidents' as never)}
                style={[styles.subnavTile, { backgroundColor: surface_, borderColor: border }]}
                accessibilityRole="button"
                accessibilityLabel={t('speakingIncidentLabTitle')}
              >
                <View style={[styles.subnavIconBadge, { backgroundColor: `${accent}18` }]}>
                  <Text style={[styles.subnavIconText, { color: accent }]}>🛠️</Text>
                </View>
                <View style={styles.subnavTileText}>
                  <Text style={[styles.subnavTileTitle, { color: textColor }]}>{t('speakingIncidentLabTitle')}</Text>
                  <Text style={[styles.subnavTileSub, { color: mutedColor }]}>
                    {t('speakingIncidentLabDetail')}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Scenario preview — what's inside Roleplay for this profession.
              Kept as a non-interactive "what to expect" list, since the
              Roleplay tile above is the actual entry point. */}
          <View style={styles.scenarioSection}>
            <Text style={[styles.sectionTitle, { color: softColor }]}>{t('speakingScenariosTitle')}</Text>
            <View style={styles.scenarioList}>{scenarios.filter((c) => c.label !== 'interview' && c.label !== 'beta').map((card) => (<View key={card.title} style={[styles.scenarioCard, { backgroundColor: surface_, borderColor: border }]}><View style={[styles.scenarioBadge, { backgroundColor: `${accent}18` }]}><Text style={[styles.scenarioBadgeText, { color: accent }]}>{card.label}</Text></View><Text style={[styles.scenarioTitle, { color: textColor }]}>{card.title}</Text><Text style={[styles.scenarioText, { color: mutedColor }]}>{card.summary}</Text></View>))}</View>
          </View>
          {/* Action row: in interview entry mode, show a single CTA to
              start. In normal workplace mode, sub-nav tiles above are the
              actions, so no redundant buttons here. */}
          {entryMode === 'interview' ? (
            <View
              style={[styles.subnavTile, styles.subnavTileLocked, { backgroundColor: surface_, borderColor: border }]}
              accessibilityRole="text"
              accessibilityLabel={t('speakingInterviewComingSoonAccessibility')}
            >
              <View style={[styles.subnavIconBadge, { backgroundColor: `${accent}10` }]}>
                <Text style={[styles.subnavIconText, { color: accent, opacity: 0.55 }]}>🎯</Text>
              </View>
              <View style={styles.subnavTileText}>
                <View style={styles.subnavTitleRow}>
                  <Text style={[styles.subnavTileTitle, { color: textColor, opacity: 0.6 }]}>Interview</Text>
                  <View style={[styles.comingSoonBadge, { backgroundColor: `${accent}18`, borderColor: `${accent}40` }]}>
                    <Text style={[styles.comingSoonText, { color: accent }]}>{t('speakingComingSoon')}</Text>
                  </View>
                </View>
                <Text style={[styles.subnavTileSub, { color: mutedColor, opacity: 0.7 }]}>
                  {t('speakingInterviewBetaDetailShort')}
                </Text>
              </View>
            </View>
          ) : null}
          <View style={[styles.grammarTip, { backgroundColor: raisedBg, borderColor: border }]}><Text style={[styles.grammarTipLabel, { color: softColor }]}>{t('speakingWhyRouteMattersTitle')}</Text><Text style={[styles.grammarTipText, { color: textColor }]}>{t('speakingWhyRouteMattersText')}</Text></View>
          <View style={[styles.grammarTip, { backgroundColor: raisedBg, borderColor: border }]}><Text style={[styles.grammarTipLabel, { color: softColor }]}>{t('speakingTrackFocusTitle')}</Text><Text style={[styles.grammarTipText, { color: textColor }]}>{activeTrack.scenarios.join(' · ')}</Text></View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, container: { flex: 1 }, headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }, navBtn: { minHeight: 36, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1 }, navBtnText: { fontSize: 13, fontWeight: '600' }, scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 }, headingBlock: { paddingTop: 12, gap: 3 }, eyebrow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 }, pageTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 }, pageSub: { fontSize: 13, lineHeight: 19 }, section: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 }, sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }, levelRow: { flexDirection: 'row', gap: 8 }, levelPill: { flex: 1, minHeight: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, levelText: { fontSize: 12, fontWeight: '700' }, levelTextActive: { color: '#FFFFFF' }, trackSection: { gap: 8 }, trackList: { gap: 8 }, trackCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 }, trackDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 }, trackText: { flex: 1, gap: 2 }, trackTitle: { fontSize: 14, fontWeight: '700' }, trackSub: { fontSize: 12, lineHeight: 17 }, checkBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, checkText: { fontSize: 13, fontWeight: '800' }, scenarioSection: { gap: 8 }, scenarioList: { gap: 8 }, scenarioCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 }, scenarioBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }, scenarioBadgeText: { fontSize: 11, fontWeight: '800' }, scenarioTitle: { fontSize: 14, fontWeight: '800' }, scenarioText: { fontSize: 12, lineHeight: 18 }, actionRow: { gap: 10 }, primaryBtn: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, secondaryBtn: { minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 }, secondaryBtnText: { fontSize: 14, fontWeight: '700' }, grammarTip: { borderRadius: 12, padding: 14, gap: 4, borderWidth: 1 }, grammarTipLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }, grammarTipText: { fontSize: 13, lineHeight: 18 },
  // ── Per-profession sub-nav tiles (UX restructuring) ──
  subnavSection: { gap: 10 },
  subnavGrid: { gap: 10 },
  subnavTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  subnavIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  subnavIconText: { fontSize: 22 },
  subnavTileText: { flex: 1, gap: 3 },
  subnavTileTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  subnavTileSub: { fontSize: 12, lineHeight: 17 },
  // ── Beta locked tile (Interview unavailable) ──
  subnavTileLocked: {
    opacity: 0.95, // slightly muted; main muting is on text via inline style
  },
  subnavTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  comingSoonBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
