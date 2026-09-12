import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createReadProjectFromText, uploadReadProject } from '@core/api/read';
import { useAuthStore } from '../state/authStore';

export default function ReadUploadScreen() {
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('PDF, DOCX, EPUB, Markdown, HTML, and text files are supported.');
  const [error, setError] = useState<string | null>(null);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteText, setPasteText] = useState('');

  useEffect(() => { void hydrateSession(); }, [hydrateSession]);

  useEffect(() => {
    if (hasHydrated && !token) router.replace('/read-login' as never);
  }, [hasHydrated, token]);

  const openProject = (id: string) => {
    router.replace({ pathname: '/read-document', params: { id } } as never);
  };

  const chooseFile = async () => {
    if (!token || busy) return;
    setError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/epub+zip',
          'text/plain',
          'text/markdown',
          'text/html',
          'application/xhtml+xml',
          'application/octet-stream',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      setBusy(true);
      setStatus(`Uploading ${asset.name}…`);
      const project = await uploadReadProject(token, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType || undefined,
      });
      setStatus(`${project.title} is ready.`);
      openProject(project.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const savePastedText = async () => {
    if (!token || busy || !pasteText.trim()) return;
    setBusy(true);
    setError(null);
    setStatus('Saving pasted text to your Read library…');
    try {
      const project = await createReadProjectFromText(token, {
        text: pasteText.trim(),
        title: pasteTitle.trim() || undefined,
      });
      setStatus(`${project.title} is ready.`);
      openProject(project.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this text.');
    } finally {
      setBusy(false);
    }
  };

  if (!hasHydrated) {
    return <SafeAreaView style={styles.safe}><View style={styles.loading}><ActivityIndicator color="#7187FF" /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={styles.topCopy}><Text style={styles.kicker}>FLOENTLY READ</Text><Text style={styles.topTitle}>Add content</Text></View>
        <Pressable onPress={() => router.replace('/read-home' as never)} style={styles.homeButton}><Text style={styles.homeText}>F</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable disabled={busy} onPress={() => void chooseFile()} style={({ pressed }) => [styles.uploadCard, pressed && styles.pressed, busy && styles.disabled]}>
          <View style={styles.uploadIcon}><Text style={styles.uploadIconText}>↑</Text></View>
          <Text style={styles.uploadTitle}>Upload from this iPhone</Text>
          <Text style={styles.uploadBody}>Choose PDF, DOCX, EPUB, Markdown, HTML, or TXT. Floently extracts the readable text and saves it to your library.</Text>
          <View style={styles.uploadButton}>{busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.uploadButtonText}>Choose file</Text>}</View>
        </Pressable>

        <View style={styles.statusCard}>
          <View style={[styles.statusDot, error ? styles.statusDotError : null]} />
          <Text style={[styles.statusText, error ? styles.statusTextError : null]}>{error || status}</Text>
        </View>

        <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>OR PASTE TEXT</Text><View style={styles.divider} /></View>

        <View style={styles.pasteCard}>
          <Text style={styles.fieldLabel}>TITLE <Text style={styles.optional}>OPTIONAL</Text></Text>
          <TextInput
            value={pasteTitle}
            onChangeText={setPasteTitle}
            placeholder="Study notes, article, chapter…"
            placeholderTextColor="#5F6D82"
            style={styles.titleInput}
          />
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>TEXT</Text>
          <TextInput
            multiline
            value={pasteText}
            onChangeText={setPasteText}
            placeholder="Paste the text you want Floently to read…"
            placeholderTextColor="#5F6D82"
            style={styles.textArea}
            textAlignVertical="top"
          />
          <View style={styles.pasteFooter}>
            <Text style={styles.characterCount}>{pasteText.trim().length.toLocaleString()} characters</Text>
            <Pressable disabled={busy || !pasteText.trim()} onPress={() => void savePastedText()} style={[styles.saveButton, (busy || !pasteText.trim()) && styles.disabled]}>
              {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveButtonText}>Save & open</Text>}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060B15' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#182437' },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#111B2B', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#FFFFFF', fontSize: 30, lineHeight: 32 },
  topCopy: { flex: 1 },
  kicker: { color: '#7187FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  topTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 2 },
  homeButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#5364FF', alignItems: 'center', justifyContent: 'center' },
  homeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  content: { padding: 18, paddingBottom: 42, gap: 14 },
  uploadCard: { borderRadius: 26, padding: 22, alignItems: 'center', backgroundColor: '#0F1930', borderWidth: 1, borderColor: '#263A66' },
  uploadIcon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#21376C', marginBottom: 14 },
  uploadIconText: { color: '#FFFFFF', fontSize: 30, fontWeight: '500' },
  uploadTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900', textAlign: 'center' },
  uploadBody: { color: '#8D9AAF', fontSize: 12.5, lineHeight: 19, textAlign: 'center', marginTop: 7, marginBottom: 18 },
  uploadButton: { minWidth: 138, minHeight: 46, borderRadius: 15, backgroundColor: '#5364FF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  uploadButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  statusCard: { minHeight: 48, borderRadius: 16, backgroundColor: '#0C1523', borderWidth: 1, borderColor: '#17263A', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  statusDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: '#36D2B5' },
  statusDotError: { backgroundColor: '#FF6B7B' },
  statusText: { flex: 1, color: '#7F8DA2', fontSize: 11.5, lineHeight: 16 },
  statusTextError: { color: '#FF98A4' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 3 },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#223049' },
  dividerText: { color: '#69778E', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  pasteCard: { borderRadius: 24, backgroundColor: '#0D1625', borderWidth: 1, borderColor: '#1A293E', padding: 18 },
  fieldLabel: { color: '#8292AA', fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginBottom: 7 },
  optional: { color: '#536176' },
  titleInput: { minHeight: 48, borderRadius: 15, backgroundColor: '#111D30', borderWidth: 1, borderColor: '#213149', color: '#FFFFFF', paddingHorizontal: 13, fontSize: 13 },
  textArea: { minHeight: 190, borderRadius: 17, backgroundColor: '#111D30', borderWidth: 1, borderColor: '#213149', color: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 12, fontSize: 14, lineHeight: 21 },
  pasteFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 13 },
  characterCount: { color: '#64738A', fontSize: 10.5 },
  saveButton: { minHeight: 44, borderRadius: 14, minWidth: 116, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364FF' },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.42 },
});
