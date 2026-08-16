import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppScaffold, PageHeader, TaskCard } from '@ui/components';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';

import { useTranslator } from '../features/i18n';
import { usePreferencesStore } from './preferencesStore';

type Props = {
  onBack: () => void;
  onOpenBilling: () => void;
  onOpenSettings: () => void;
  onOpenYki: () => void;
  onOpenMenu: () => void;
};

export default function HelpRoute({ onBack, onOpenBilling, onOpenSettings, onOpenYki, onOpenMenu }: Props) {
  const { t } = useTranslator();
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const themeMode = usePreferencesStore((state) => state.themeMode);
  const palette = getFloentlyPalette(themeMode);

  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  return (
    <AppScaffold
      themeMode={themeMode}
      header={
        <PageHeader
          themeMode={themeMode}
          eyebrow="Utility"
          title="Help"
          subtitle="Help should get people unstuck fast, then send them back to the right path."
          actionLabel={t('commonBack')}
          onActionPress={onBack}
          onMenuPress={onOpenMenu}
        />
      }
    >
      <View style={[styles.pathCard, { backgroundColor: palette.accentSoft, borderColor: palette.accent }]}> 
        <Text style={[styles.pathTitle, { color: palette.text }]}>Stable paths</Text>
        <Text style={[styles.pathText, { color: palette.textMuted }]}>Home → Learn for review and study loops</Text>
        <Text style={[styles.pathText, { color: palette.textMuted }]}>Home → YKI for exam work and mock cycles</Text>
        <Text style={[styles.pathText, { color: palette.textMuted }]}>Home → Speak for short spoken turns</Text>
        <Text style={[styles.pathText, { color: palette.textMuted }]}>Home → Work for professional tasks</Text>
      </View>

      <View style={styles.stack}>
        <TaskCard themeMode={themeMode} title="Looking for YKI?" detail="Keep exam practice in one place so it stays easy to find later." meta="Home → YKI" actionLabel="Open" onPress={onOpenYki} />
        <TaskCard themeMode={themeMode} title="Account or access" detail="Use Settings for accessibility, profile, and account guidance." meta="Sidebar → Settings" actionLabel="Open" onPress={onOpenSettings} />
        <TaskCard themeMode={themeMode} accent="yellow" title="Plan or payment" detail="Billing is the correct secondary path for subscription and invoice work." meta="Sidebar → Billing" actionLabel="Open" onPress={onOpenBilling} />
      </View>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  pathCard: { borderRadius: 22, padding: 16, gap: 8, borderWidth: 1 },
  pathTitle: { fontSize: 16, fontWeight: '800' },
  pathText: { fontSize: 14 },
  stack: { gap: 12 },
});
