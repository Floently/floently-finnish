import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import { EmptyState } from '../../shared/EmptyState';
import { ActionBar } from '../../shared/FeatureScaffold';
import { usePersonalPhraseBank } from '../hooks/usePersonalPhraseBank';

const STRENGTH_COLORS: Record<string, string> = {
  new:    '#5C7299',
  learning: '#F0A436',
  ready:  '#3EC58A',
};

export default function PersonalPhraseBankScreen() {
  const { items, loading, error, refresh, addPhrase } = usePersonalPhraseBank();
  const [phrase, setPhrase] = useState('');
  const [translation, setTranslation] = useState('');
  const [context, setContext] = useState('');
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);

  const bg      = palette.background;
  const surface = palette.surface;
  const raised  = palette.surfaceMuted;
  const border  = palette.border;
  const text    = palette.text;
  const muted   = palette.textMuted;
  const soft    = palette.textSoft;
  const primary = palette.primary;

  const readyCount = useMemo(() => items.filter((i) => i.strength === 'ready').length, [items]);
  const canSave = phrase.trim().length > 0 && translation.trim().length > 0;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    await addPhrase({
      phrase: phrase.trim(),
      translation: translation.trim(),
      context: context.trim() || 'Saved manually',
      tags: ['saved'],
      strength: 'new',
      source: 'saved',
      nextReviewLabel: 'New phrase',
    });
    setPhrase('');
    setTranslation('');
    setContext('');
    setSaving(false);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bg }]}>
      {/* Back bar */}
      <View style={[styles.backBar, { backgroundColor: bg }]}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: raised, borderColor: border }]}>
          <Text style={[styles.backBtnText, { color: primary }]}>← Takaisin</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]}>
        {/* Header */}
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: primary }]}>Oppiminen · Fraasipankki</Text>
          <Text style={[styles.pageTitle, { color: text }]}>Oma fraasipankki</Text>
          <Text style={[styles.pageSub, { color: muted }]}>
            Tallenna hyödyllisiä suomen ilmaisuja ja palaa niihin myöhemmin harjoittelussa.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCell, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.statVal, { color: text }]}>{items.length}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>Tallennettu</Text>
          </View>
          <View style={[styles.statCell, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.statVal, { color: '#3EC58A' }]}>{readyCount}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>Valmis</Text>
          </View>
          <View style={[styles.statCell, { backgroundColor: surface, borderColor: border }]}>
            <Text style={[styles.statVal, { color: '#F0A436' }]}>{items.length - readyCount}</Text>
            <Text style={[styles.statLabel, { color: muted }]}>Opetellaan</Text>
          </View>
        </View>

        {/* Action bar — only when there are items to practice */}
        {items.length > 0 && (
          <ActionBar
            buttons={[
              {
                label: readyCount > 0 ? `Drill ${readyCount} ready ${readyCount === 1 ? 'phrase' : 'phrases'}` : 'Drill saved phrases',
                hint: readyCount > 0 ? 'Card-style spaced review' : `${items.length} saved · none marked ready yet`,
                onPress: () => router.push('/cards' as never),
              },
              {
                label: 'Use in roleplay',
                variant: 'secondary',
                onPress: () => router.push('/speaking' as never),
              },
            ]}
          />
        )}

        {/* Add phrase form */}
        <View style={[styles.formCard, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.formTitle, { color: text }]}>Lisää fraasi</Text>

          {[
            { key: 'phrase', label: 'Fraasi suomeksi', value: phrase, setter: setPhrase, placeholder: 'Kirjoita suomeksi…' },
            { key: 'translation', label: 'Merkitys englanniksi', value: translation, setter: setTranslation, placeholder: 'Write meaning…' },
            { key: 'context', label: 'Konteksti (valinnainen)', value: context, setter: setContext, placeholder: 'Missä käyttäisit tätä?' },
          ].map(({ key, label, value, setter, placeholder }) => (
            <View key={key} style={styles.field}>
              <Text style={[styles.fieldLabel, { color: soft }]}>{label}</Text>
              <TextInput
                value={value}
                onChangeText={setter}
                onFocus={() => setFocusedField(key)}
                onBlur={() => setFocusedField(null)}
                placeholder={placeholder}
                placeholderTextColor={soft}
                style={[
                  styles.input,
                  { backgroundColor: raised, borderColor: border, color: text },
                  focusedField === key && { borderColor: primary },
                ]}
              />
            </View>
          ))}

          <Pressable
            onPress={() => void handleSave()}
            disabled={!canSave || saving}
            style={[styles.saveBtn, { backgroundColor: primary }, (!canSave || saving) && { opacity: 0.5 }]}
            accessibilityRole="button"
          >
            <Text style={styles.saveBtnText}>{saving ? 'Tallennetaan…' : 'Tallenna fraasi'}</Text>
          </Pressable>
        </View>

        {/* Error / loading */}
        {error && <Text style={[styles.errorText]}>{error}</Text>}
        {loading && <Text style={[styles.loadingText, { color: soft }]}>Ladataan…</Text>}

        {/* Empty state — shown on first visit when no phrases saved yet */}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            icon="📝"
            title="No saved phrases yet"
            description="Save your first phrase using the form above, or collect phrases from a roleplay to start a spaced-review schedule."
            actionLabel="Try a roleplay to collect phrases"
            onAction={() => router.push('/speaking' as never)}
          />
        )}

        {/* Phrase list */}
        {items.length > 0 && (
          <View style={styles.list}>
            <Text style={[styles.listHeader, { color: soft }]}>Tallennetut fraasit</Text>
            {items.map((item) => {
              const strengthColor = STRENGTH_COLORS[item.strength] ?? soft;
              return (
                <View key={item.id} style={[styles.phraseCard, { backgroundColor: surface, borderColor: border }]}>
                  <View style={styles.phraseTop}>
                    <Text style={[styles.phraseText, { color: text }]}>{item.phrase}</Text>
                    <View style={[styles.strengthBadge, { backgroundColor: `${strengthColor}18` }]}>
                      <Text style={[styles.strengthText, { color: strengthColor }]}>{item.strength}</Text>
                    </View>
                  </View>
                  <Text style={[styles.phraseTranslation, { color: muted }]}>{item.translation}</Text>
                  {item.context && item.context !== 'Saved manually' && (
                    <Text style={[styles.phraseContext, { color: soft }]}>{item.context}</Text>
                  )}
                  <Text style={[styles.phraseMeta, { color: soft }]}>{item.source} · {item.nextReviewLabel}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  backBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 },
  backBtn: { minHeight: 36, borderRadius: 999, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1 },
  backBtnText: { fontSize: 13, fontWeight: '700' },
  scroll: { padding: 16, gap: 16 },
  heading: { gap: 4 },
  eyebrow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  pageTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  pageSub: { fontSize: 13, lineHeight: 19 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCell: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center', gap: 2 },
  statVal: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  formCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 14 },
  formTitle: { fontSize: 16, fontWeight: '700' },
  field: { gap: 5 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, fontSize: 14 },
  saveBtn: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  errorText: { color: '#FF6B6B', fontSize: 13 },
  loadingText: { fontSize: 13 },
  list: { gap: 10 },
  listHeader: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  phraseCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  phraseTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  phraseText: { flex: 1, fontSize: 15, fontWeight: '700' },
  strengthBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  strengthText: { fontSize: 11, fontWeight: '700' },
  phraseTranslation: { fontSize: 13, lineHeight: 18 },
  phraseContext: { fontSize: 12, fontStyle: 'italic' },
  phraseMeta: { fontSize: 11 },
});
