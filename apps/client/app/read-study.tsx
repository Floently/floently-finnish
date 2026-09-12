import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { generateReadInsight, getReadProject, type ReadProject } from '@core/api/read';
import { useAuthStore } from '../state/authStore';

type Tool = 'summary' | 'key_points' | 'assistant';

export default function ReadStudyScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const projectId = Array.isArray(params.id) ? params.id[0] ?? '' : params.id ?? '';
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  const [project, setProject] = useState<ReadProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<Tool | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => { void hydrateSession(); }, [hydrateSession]);
  useEffect(() => {
    if (hasHydrated && !token) router.replace('/read-login' as never);
  }, [hasHydrated, token]);
  useEffect(() => {
    if (!token || !projectId) return;
    let cancelled = false;
    setLoading(true);
    void getReadProject(token, projectId)
      .then((value) => { if (!cancelled) setProject(value); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Could not open this reading.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, token]);

  const run = async (tool: Tool) => {
    if (!token || !project?.rawText || busy) return;
    setBusy(tool);
    setError(null);
    try {
      const result = await generateReadInsight(token, {
        action: tool === 'summary' ? 'summarize' : tool,
        text: project.rawText,
        title: project.title,
        question: tool === 'assistant' ? question.trim() : undefined,
      });
      if (tool === 'summary') setSummary(result);
      else if (tool === 'key_points') setKeyPoints(result);
      else setAnswer(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Study tool failed.');
    } finally {
      setBusy(null);
    }
  };

  if (!hasHydrated || loading) {
    return <SafeAreaView style={styles.safe}><View style={styles.loading}><ActivityIndicator color="#7187FF" /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>
        <View style={{ flex: 1 }}><Text style={styles.kicker}>READ · UNDERSTAND</Text><Text numberOfLines={1} style={styles.topTitle}>{project?.title ?? 'Study'}</Text></View>
        <Pressable onPress={() => router.replace('/read-home' as never)} style={styles.homeButton}><Text style={styles.homeText}>F</Text></Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}><Text style={styles.heroKicker}>STUDY WORKSPACE</Text><Text style={styles.heroTitle}>Understand what you read.</Text><Text style={styles.heroBody}>Turn this reading into a concise explanation, key ideas, and answers grounded in the source text.</Text></View>
        {error ? <View style={styles.errorCard}><Text style={styles.errorText}>{error}</Text></View> : null}

        <View style={styles.card}>
          <View style={styles.cardHeader}><View><Text style={styles.cardKicker}>UNDERSTAND</Text><Text style={styles.cardTitle}>Summary</Text></View><Pressable disabled={Boolean(busy)} onPress={() => void run('summary')} style={styles.action}>{busy === 'summary' ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionText}>{summary ? 'Refresh' : 'Generate'}</Text>}</Pressable></View>
          <Text style={summary ? styles.result : styles.placeholder}>{summary || 'Create a focused explanation of the reading.'}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}><View><Text style={styles.cardKicker}>REMEMBER</Text><Text style={styles.cardTitle}>Key points</Text></View><Pressable disabled={Boolean(busy)} onPress={() => void run('key_points')} style={styles.action}>{busy === 'key_points' ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionText}>{keyPoints ? 'Refresh' : 'Generate'}</Text>}</Pressable></View>
          <Text style={keyPoints ? styles.result : styles.placeholder}>{keyPoints || 'Extract the ideas worth remembering from this source.'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardKicker}>ASK FLOENTLY</Text><Text style={styles.cardTitle}>Ask about this reading</Text>
          <TextInput value={question} onChangeText={setQuestion} multiline placeholder="What does this section mean? What should I remember for an exam?" placeholderTextColor="#5E6D83" style={styles.question} />
          <View style={styles.askRow}><Pressable disabled={Boolean(busy) || !question.trim()} onPress={() => void run('assistant')} style={[styles.action, (!question.trim() || Boolean(busy)) && styles.disabled]}>{busy === 'assistant' ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actionText}>Ask</Text>}</Pressable>{answer ? <Pressable onPress={() => void Share.share({ message: answer, title: project?.title })} style={styles.share}><Text style={styles.shareText}>Share answer</Text></Pressable> : null}</View>
          {answer ? <Text style={styles.result}>{answer}</Text> : null}
        </View>

        {project?.rawText ? <Pressable onPress={() => void Share.share({ message: project.rawText ?? '', title: project.title })} style={styles.reuseButton}><Text style={styles.reuseKicker}>REUSE</Text><Text style={styles.reuseTitle}>Share source text</Text><Text style={styles.reuseArrow}>→</Text></Pressable> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060B15' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1B283B' },
  backButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#111B2B', alignItems: 'center', justifyContent: 'center' }, backText: { color: '#fff', fontSize: 30, lineHeight: 32 },
  kicker: { color: '#7187FF', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.2 }, topTitle: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 2 },
  homeButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: '#5364FF', alignItems: 'center', justifyContent: 'center' }, homeText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  content: { padding: 17, paddingBottom: 42, gap: 12 }, hero: { borderRadius: 25, padding: 20, backgroundColor: '#101A31', borderWidth: 1, borderColor: '#24385F' },
  heroKicker: { color: '#7187FF', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, heroTitle: { color: '#fff', fontSize: 25, lineHeight: 30, fontWeight: '900', marginTop: 6 }, heroBody: { color: '#8F9BAE', fontSize: 12, lineHeight: 18, marginTop: 7 },
  card: { borderRadius: 22, padding: 17, backgroundColor: '#0D1625', borderWidth: 1, borderColor: '#1A293E' }, cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, cardKicker: { color: '#7187FF', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.15 }, cardTitle: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 3 },
  action: { minHeight: 39, minWidth: 82, borderRadius: 13, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#5364FF' }, actionText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  result: { color: '#D8DEE9', fontSize: 14, lineHeight: 22, marginTop: 13 }, placeholder: { color: '#6E7C91', fontSize: 12.5, lineHeight: 19, marginTop: 13 },
  question: { minHeight: 92, borderRadius: 16, backgroundColor: '#111D30', borderWidth: 1, borderColor: '#213149', color: '#fff', paddingHorizontal: 12, paddingVertical: 10, marginTop: 13, fontSize: 13, lineHeight: 19, textAlignVertical: 'top' }, askRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 10 }, share: { minHeight: 39, borderRadius: 13, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#172338' }, shareText: { color: '#C7D0DE', fontSize: 10.5, fontWeight: '800' }, disabled: { opacity: 0.4 },
  reuseButton: { borderRadius: 20, minHeight: 68, paddingHorizontal: 17, backgroundColor: '#0C1E20', borderWidth: 1, borderColor: '#16443F', flexDirection: 'row', alignItems: 'center', gap: 10 }, reuseKicker: { color: '#50D5BC', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.1 }, reuseTitle: { flex: 1, color: '#E9FFFA', fontSize: 14, fontWeight: '900' }, reuseArrow: { color: '#50D5BC', fontSize: 20, fontWeight: '900' },
  errorCard: { borderRadius: 16, padding: 13, backgroundColor: '#2A131B', borderWidth: 1, borderColor: '#542432' }, errorText: { color: '#FF9AAA', fontSize: 11.5, lineHeight: 17 },
});
