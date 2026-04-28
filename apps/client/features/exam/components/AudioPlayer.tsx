import React from 'react';
import { Pressable, Text } from 'react-native';
import { audioPlayer } from '../services/audioPlayer';
import { colors, radius, spacing } from '@ui/theme';
export default function AudioPlayer({ uri }: { uri: string }) { return <Pressable onPress={() => void audioPlayer.playAsync(uri)} style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.panelSoft }}><Text style={{ color: colors.text }}>Toista ääni</Text></Pressable>; }
