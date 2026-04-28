import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import PageContainer from '../components/PageContainer';
import AppHeader from '../components/AppHeader';
import { colors, spacing, typography } from '@ui/theme';

export default function ExamScreenScaffold({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>
      <PageContainer>
        <AppHeader title={title} subtitle={subtitle} />
        <View style={{ gap: spacing.md }}>
          {children ?? <Text style={{ color: colors.text, ...typography.body }}>Tämä näyttö on valmis liitettäväksi nykyiseen kokeen ohjaukseen.</Text>}
        </View>
      </PageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FBFF' },
  backBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8FBFF' },
  backButton: { minHeight: 36, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', backgroundColor: '#E8F0FF' },
  backButtonText: { fontSize: 13, fontWeight: '700', color: '#2453D4' },
});
