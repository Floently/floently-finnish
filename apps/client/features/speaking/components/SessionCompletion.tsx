/**
 * SessionCompletion
 *
 * Renders at the end of a roleplay session, below the existing feedback report.
 * Replaces the previous minimal "Download report + Restart" button pair with a
 * retention surface: streak display, next-action CTA with Finnish persona preview,
 * share moment, and preserved secondary actions (download + restart same scenario).
 *
 * Design principles:
 *   • Streak first — the "I came back tomorrow" reason starts with making today count.
 *   • One primary CTA — "Practice with [persona]" routes to a DIFFERENT scenario so
 *     the next session feels fresh; if the profession only has one scenario, primary
 *     falls back to "Another round."
 *   • Share is opt-in, one tap, no friction. Uses the completed session's persona name
 *     to produce copy that's specific and sharable without being cringe.
 *
 * No new dependencies. Uses the streakStore shipped alongside this, existing React
 * Native Share API, and the existing palette.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useStreakStore, type StreakUpdateResult } from '../../../state/streakStore';
import { pickAlternativeScenario, type ScenarioOption } from '../data/alternativeScenarios';
import { useTranslator } from '../../i18n';

export type SessionCompletionProps = {
  /** Name shown in copy — e.g. "Tohtori Mikko Nieminen" or "AI" fallback. */
  personaName: string | null | undefined;
  /** The profession being practiced; used for alternative-scenario lookup. */
  profession: string;
  /** Scenario just completed, so we don't re-suggest the same one. */
  completedScenarioId: string | null | undefined;
  /** Title of the scenario just completed, used for share copy. */
  completedScenarioTitle?: string | null;
  /**
   * Start a new session. If `scenarioId` is passed, the session uses that scenario;
   * otherwise the screen's default resolution runs (typically the same one again).
   */
  onStartSession: (scenarioId?: string) => void;
  /** Existing download-report handler from the parent screen. */
  onDownloadReport: () => void;
  /** Theme-aware colors from the parent (dark mode is default for roleplay). */
  palette: {
    text: string;
    muted: string;
    primary: string;
    border: string;
    surface: string;
    success: string;
    /** Text color for content placed on top of a `primary`-filled surface.
     * Differs between modes: dark mode → palette.background (navy on lighter blue);
     * light mode → #FFFFFF (white on deep blue). Parent computes and passes. */
    textOnPrimary: string;
  };
};

export function SessionCompletion({
  personaName,
  profession,
  completedScenarioId,
  completedScenarioTitle,
  onStartSession,
  onDownloadReport,
  palette,
}: SessionCompletionProps) {
  const { t } = useTranslator();
  const hasHydrated = useStreakStore((s) => s.hasHydrated);
  const hydrate = useStreakStore((s) => s.hydrate);
  const recordPractice = useStreakStore((s) => s.recordPractice);

  const [streakResult, setStreakResult] = useState<StreakUpdateResult | null>(null);

  // Hydrate the streak store once and record this completion exactly once.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!hasHydrated) await hydrate();
      if (cancelled) return;
      const result = await recordPractice();
      if (!cancelled) setStreakResult(result);
    })();
    return () => {
      cancelled = true;
    };
    // Intentionally run exactly once per mount — a new mount means a new completed session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const alternative: ScenarioOption | null = useMemo(
    () =>
      pickAlternativeScenario({
        profession,
        justCompletedScenarioId: completedScenarioId,
      }),
    [profession, completedScenarioId],
  );

  const streakHeadline = useMemo(() => {
    if (!streakResult) return null;
    const { currentStreak, change } = streakResult;
    if (change === 'first_ever') return { big: t('roleplayDay1Label'), sub: t('roleplayFirstSessionDoneSub') };
    if (change === 'new_record') return { big: t('roleplayDayLabel').replace('{count}', String(currentStreak)), sub: t('roleplayNewRecordSub') };
    if (change === 'extended') return { big: t('roleplayDayLabel').replace('{count}', String(currentStreak)), sub: t('roleplayExtendedStreakSub').replace('{count}', String(currentStreak)) };
    if (change === 'resumed_after_gap') return { big: t('roleplayBackAtItLabel'), sub: t('roleplayResumedSub') };
    // same_day
    return { big: t('roleplayDayLabel').replace('{count}', String(currentStreak)), sub: t('roleplayKeepingStreakSub') };
  }, [streakResult, t]);

  const handleShare = async () => {
    const speakerName = personaName && personaName !== 'AI' ? personaName : 'a Finnish conversation partner';
    const scenarioText = completedScenarioTitle ? ` (${completedScenarioTitle})` : '';
    const message = t('roleplayShareMessage')
      .replace('{speakerName}', speakerName)
      .replace('{scenarioText}', scenarioText);
    try {
      await Share.share({ message });
    } catch {
      // User cancelled or share sheet unavailable — silent no-op is fine.
    }
  };

  const primaryLabel = alternative
    ? `${t('roleplayNextPrefix')} ${alternative.title}`
    : t('roleplayAnotherRoundLabel');
  const primaryHint = alternative
    ? t('roleplayDifferentScenarioHint').replace('{profession}', profession.replace('_', ' '))
    : undefined;
  const primaryOnPress = () => onStartSession(alternative?.id);

  return (
    <View style={styles.root}>
      {/* Streak banner */}
      {streakHeadline ? (
        <View style={[styles.streakBanner, { borderColor: palette.border, backgroundColor: palette.surface }]}>
          <View style={styles.streakTextCol}>
            <Text style={[styles.streakBig, { color: palette.primary }]}>{streakHeadline.big}</Text>
            <Text style={[styles.streakSub, { color: palette.muted }]}>{streakHeadline.sub}</Text>
          </View>
          {streakResult ? (
            <View style={[styles.streakRecord, { borderColor: palette.border }]}>
              <Text style={[styles.streakRecordValue, { color: palette.text }]}>{streakResult.longestStreak}</Text>
              <Text style={[styles.streakRecordLabel, { color: palette.muted }]}>{t('roleplayBestLabel')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Primary CTA — next scenario with persona preview */}
      <Pressable
        onPress={primaryOnPress}
        style={({ pressed }) => [
          styles.primaryCta,
          { backgroundColor: palette.primary, opacity: pressed ? 0.9 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={primaryLabel}
      >
        <Text style={[styles.primaryLabel, { color: palette.textOnPrimary }]}>{primaryLabel}</Text>
        {primaryHint ? <Text style={[styles.primaryHint, { color: palette.textOnPrimary, opacity: 0.7 }]}>{primaryHint}</Text> : null}
      </Pressable>

      {/* Secondary row: share + download + restart-same */}
      <View style={styles.secondaryRow}>
        <Pressable
          onPress={() => void handleShare()}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('roleplayShareSession')}
        >
          <Text style={[styles.secondaryLabel, { color: palette.text }]}>{t('commonShare')}</Text>
        </Pressable>

        <Pressable
          onPress={() => onStartSession()}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('roleplayReplaySession')}
        >
          <Text style={[styles.secondaryLabel, { color: palette.text }]}>{t('commonReplay')}</Text>
        </Pressable>

        <Pressable
          onPress={onDownloadReport}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: palette.border, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('roleplayDownloadReport')}
        >
          <Text style={[styles.secondaryLabel, { color: palette.text }]}>{t('commonReport')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
    marginTop: 4,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  streakTextCol: {
    flex: 1,
    gap: 2,
  },
  streakBig: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  streakSub: {
    fontSize: 13,
    fontWeight: '600',
  },
  streakRecord: {
    minWidth: 56,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  streakRecordValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  streakRecordLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  primaryCta: {
    minHeight: 60,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  primaryLabel: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryHint: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default SessionCompletion;
