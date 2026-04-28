import React, { useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getFloentlyPalette } from '@ui/theme/floentlyPalette';
import { usePreferencesStore } from '../../../state/preferencesStore';
import type { TranscriptMessage } from '../types';

type Props = {
  messages: TranscriptMessage[];
  personaName?: string;
};

export default function RoleplayTranscriptList({ messages, personaName = 'AI' }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const palette = getFloentlyPalette(themeMode);
  const isDark = themeMode === 'dark';

  const aiBubbleBg = isDark ? '#111B30' : palette.surfaceMuted;
  const aiBubbleBorder = isDark ? '#1E2E47' : palette.border;
  const aiTextColor = isDark ? '#E8F0FF' : palette.text;
  const aiSpeakerColor = isDark ? '#5C7299' : palette.textSoft;
  const systemBg = isDark ? '#0C1222' : palette.background;
  const systemBorder = isDark ? '#1E2E47' : palette.border;
  const systemText = isDark ? '#5C7299' : palette.textSoft;

  useEffect(() => {
    // Use a microtask + animation frame to ensure layout is committed before
    // we ask the ScrollView to scroll. Without this, during fast turn-taking
    // (especially with speech-to-text submitting messages quickly) the scroll
    // can be issued before the new message is laid out, leaving the user
    // looking at a stale top of the list.
    const id = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.list}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((msg) => {
        if (msg.speaker === 'system') {
          return (
            <View key={msg.id} style={[styles.systemRow]}>
              <View style={[styles.systemBubble, { backgroundColor: systemBg, borderColor: systemBorder }]}>
                <Text style={[styles.systemText, { color: systemText }]}>{msg.text}</Text>
              </View>
            </View>
          );
        }

        const isUser = msg.speaker === 'user';
        return (
          <View key={msg.id} style={[styles.row, isUser ? styles.userRow : styles.aiRow]}>
            {!isUser && (
              <View style={styles.avatarWrap}>
                <View style={[styles.avatar, { backgroundColor: '#1E2E47' }]}>
                  <Text style={styles.avatarText}>{(personaName ?? 'AI').slice(0, 1)}</Text>
                </View>
              </View>
            )}
            <View style={styles.bubbleGroup}>
              <Text style={[styles.speakerLabel, isUser ? styles.userSpeakerLabel : [styles.aiSpeakerLabel, { color: aiSpeakerColor }]]}>
                {isUser ? 'Sinä' : personaName}
              </Text>
              <View style={[
                styles.bubble,
                isUser ? styles.userBubble : [styles.aiBubble, { backgroundColor: aiBubbleBg, borderColor: aiBubbleBorder }],
              ]}>
                <Text style={[styles.bubbleText, isUser ? styles.userText : { color: aiTextColor }]}>
                  {msg.text}
                </Text>
              </View>
              {msg.timeLabel && (
                <Text style={styles.timeLabel}>{msg.timeLabel}</Text>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingVertical: 8, gap: 14 },

  systemRow: { alignItems: 'center', paddingHorizontal: 8 },
  systemBubble: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8, maxWidth: '90%' },
  systemText: { fontSize: 12, lineHeight: 17, textAlign: 'center' },

  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 2 },
  aiRow: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end', alignItems: 'flex-end' },

  avatarWrap: { paddingBottom: 4 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#8EA3C3', fontSize: 12, fontWeight: '700' },

  bubbleGroup: { maxWidth: '78%', gap: 3 },

  speakerLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  aiSpeakerLabel: {},
  userSpeakerLabel: { textAlign: 'right', color: 'rgba(220,235,255,0.6)' },

  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  aiBubble: { borderWidth: 1, borderBottomLeftRadius: 6 },
  userBubble: { backgroundColor: '#2B52E8', borderBottomRightRadius: 6 },

  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFFFFF' },

  timeLabel: { fontSize: 10, color: '#5C7299', alignSelf: 'flex-end' },
});
