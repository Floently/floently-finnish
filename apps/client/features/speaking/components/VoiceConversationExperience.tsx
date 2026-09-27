import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { TranscriptMessage } from '../types';

export type VoiceConversationUiState =
  | 'idle'
  | 'aiSpeaking'
  | 'userListening'
  | 'userSpeaking'
  | 'processing'
  | 'completed'
  | 'error';

type ConversationTurn = {
  id: string;
  speaker: 'assistant' | 'user';
  text: string;
};

type Props = {
  amplitude: number;
  assistantLabel: string;
  canSendManual: boolean;
  completionSummary?: string | null;
  headerSubtitle: string;
  headerTitle: string;
  manualText: string;
  messages: TranscriptMessage[];
  micDisabled: boolean;
  onBack: () => void;
  onMenu: () => void;
  onChangeManualText: (value: string) => void;
  onDownloadTranscript?: () => void;
  onEnterTextMode: () => void;
  onExitTextMode: () => void;
  onMicPress: () => void;
  onNextConversation: () => void;
  onReplayAudio?: () => void;
  onReplayConversation: () => void;
  onSendManual: () => void;
  state: VoiceConversationUiState;
  statusMessage?: string | null;
  textMode: boolean;
};

function conversationalMessages(messages: TranscriptMessage[]) {
  return messages.filter(
    (message): message is TranscriptMessage & { speaker: 'assistant' | 'user' } =>
      message.speaker === 'assistant' || message.speaker === 'user',
  );
}

function useActiveConversationTurn(
  messages: TranscriptMessage[],
  state: VoiceConversationUiState,
  textMode: boolean,
) {
  return useMemo<ConversationTurn | null>(() => {
    const turns = conversationalMessages(messages);
    if (!turns.length) return null;

    const assistantTurns = turns.filter((turn) => turn.speaker === 'assistant');
    const userTurns = turns.filter((turn) => turn.speaker === 'user');
    const latest = turns[turns.length - 1];

    if (state === 'idle') {
      return null;
    }

    if (state === 'userListening' || state === 'userSpeaking') {
      if (textMode && latest.speaker === 'assistant') {
        return {
          id: `assistant-turn-${assistantTurns.length}`,
          speaker: 'assistant',
          text: latest.text,
        };
      }

      const nextUserIndex =
        latest.speaker === 'user'
          ? userTurns.length
          : userTurns.length + 1;
      return {
        id: `user-turn-${nextUserIndex}`,
        speaker: 'user',
        text: latest.speaker === 'user' ? latest.text : '',
      };
    }

    if (latest.speaker === 'assistant') {
      return {
        id: `assistant-turn-${assistantTurns.length}`,
        speaker: 'assistant',
        text: latest.text,
      };
    }

    return {
      id: `user-turn-${userTurns.length}`,
      speaker: 'user',
      text: latest.text,
    };
  }, [messages, state, textMode]);
}

function useProgressiveAssistantText(
  turn: ConversationTurn | null,
  state: VoiceConversationUiState,
  textMode: boolean,
) {
  const [displayText, setDisplayText] = useState(turn?.text ?? '');

  useEffect(() => {
    if (!turn) {
      setDisplayText('');
      return;
    }

    if (turn.speaker !== 'assistant' || state !== 'aiSpeaking' || textMode) {
      setDisplayText(turn.text);
      return;
    }

    const words = turn.text.split(/\s+/).filter(Boolean);
    if (words.length <= 1) {
      setDisplayText(turn.text);
      return;
    }

    let visible = 1;
    setDisplayText(words[0]);

    const cadence = Math.max(105, Math.min(185, Math.round(1700 / words.length)));
    const timer = setInterval(() => {
      visible += Math.max(1, words.length > 18 ? 2 : 1);
      setDisplayText(words.slice(0, visible).join(' '));
      if (visible >= words.length) clearInterval(timer);
    }, cadence);

    return () => clearInterval(timer);
  }, [state, textMode, turn?.id, turn?.speaker, turn?.text]);

  if (!turn) return null;
  return { ...turn, text: displayText };
}

function AmbientBackground({ dark }: { dark: boolean }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bg-blue" cx="28%" cy="18%" rx="62%" ry="52%">
            <Stop offset="0%" stopColor={dark ? '#20355A' : '#DFF1FF'} stopOpacity={dark ? 0.34 : 0.76} />
            <Stop offset="100%" stopColor={dark ? '#0A1020' : '#F8FBFF'} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="bg-lilac" cx="82%" cy="38%" rx="52%" ry="52%">
            <Stop offset="0%" stopColor={dark ? '#452C68' : '#F0E7FF'} stopOpacity={dark ? 0.28 : 0.58} />
            <Stop offset="100%" stopColor={dark ? '#0A1020' : '#FAFCFF'} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="bg-pink" cx="26%" cy="77%" rx="48%" ry="48%">
            <Stop offset="0%" stopColor={dark ? '#50293F' : '#FFE9F4'} stopOpacity={dark ? 0.2 : 0.44} />
            <Stop offset="100%" stopColor={dark ? '#0A1020' : '#FFFFFF'} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={dark ? '#09101F' : '#F8FBFF'} />
        <Rect width="100%" height="100%" fill="url(#bg-blue)" />
        <Rect width="100%" height="100%" fill="url(#bg-lilac)" />
        <Rect width="100%" height="100%" fill="url(#bg-pink)" />
      </Svg>
    </View>
  );
}

function VoiceOrb({
  amplitude,
  disabled,
  onPress,
  state,
  size,
}: {
  amplitude: number;
  disabled: boolean;
  onPress: () => void;
  state: VoiceConversationUiState;
  size: number;
}) {
  const reduceMotion = useReducedMotion();
  const breath = useSharedValue(0);
  const spin = useSharedValue(0);
  const energy = useSharedValue(0);

  useEffect(() => {
    energy.value = withTiming(Math.max(0, Math.min(1, amplitude)), {
      duration: 110,
      easing: Easing.out(Easing.quad),
    });
  }, [amplitude, energy]);

  useEffect(() => {
    cancelAnimation(breath);
    cancelAnimation(spin);

    if (reduceMotion) {
      breath.value = 0;
      spin.value = 0;
      return;
    }

    breath.value = withRepeat(
      withTiming(1, {
        duration: state === 'completed' ? 4800 : 3600,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );

    spin.value = withRepeat(
      withTiming(1, {
        duration:
          state === 'processing'
            ? 5200
            : state === 'aiSpeaking' || state === 'userSpeaking'
              ? 6900
              : 9200,
        easing: Easing.linear,
      }),
      -1,
      false,
    );

    return () => {
      cancelAnimation(breath);
      cancelAnimation(spin);
    };
  }, [breath, reduceMotion, spin, state]);

  const orbStyle = useAnimatedStyle(() => {
    const stateBoost =
      state === 'aiSpeaking' || state === 'userSpeaking'
        ? 0.018
        : state === 'processing'
          ? 0.009
          : 0;

    return {
      transform: [
        {
          scale:
            0.995 +
            breath.value * 0.018 +
            energy.value * 0.04 +
            stateBoost,
        },
      ],
    };
  });

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const glowOpacity =
    state === 'aiSpeaking' || state === 'userSpeaking'
      ? 0.45
      : state === 'processing'
        ? 0.34
        : state === 'completed'
          ? 0.22
          : 0.28;

  const orbAccessibilityLabel =
    state === 'userSpeaking'
      ? 'Stop speaking'
      : state === 'userListening' || state === 'error'
        ? 'Start speaking'
        : 'Voice activity';

  return (
    <Pressable
      testID="voice-orb"
      accessibilityLabel={orbAccessibilityLabel}
      accessibilityRole={disabled ? undefined : 'button'}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.orbPressTarget,
        pressed && !disabled ? styles.orbPressed : null,
      ]}
    >
      <Animated.View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.orbOuter,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowOpacity: glowOpacity,
        },
        orbStyle,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, innerStyle]}>
        <Svg width={size} height={size} viewBox="0 0 300 300">
          <Defs>
            <RadialGradient id="orb-main" cx="35%" cy="28%" rx="68%" ry="68%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
              <Stop offset="28%" stopColor="#A6E6FF" stopOpacity="0.96" />
              <Stop offset="57%" stopColor="#9EA7FF" stopOpacity="0.9" />
              <Stop offset="79%" stopColor="#F5B5F4" stopOpacity="0.82" />
              <Stop offset="100%" stopColor="#A9F2EA" stopOpacity="0.74" />
            </RadialGradient>
            <RadialGradient id="orb-cyan" cx="70%" cy="82%" rx="55%" ry="55%">
              <Stop offset="0%" stopColor="#59EEE4" stopOpacity={state === 'userSpeaking' ? 0.9 : 0.68} />
              <Stop offset="100%" stopColor="#59EEE4" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="orb-pink" cx="72%" cy="38%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#FFB9F1" stopOpacity={state === 'aiSpeaking' ? 0.88 : 0.64} />
              <Stop offset="100%" stopColor="#FFB9F1" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="150" cy="150" r="138" fill="url(#orb-main)" />
          <Circle cx="150" cy="150" r="137" fill="url(#orb-cyan)" />
          <Circle cx="150" cy="150" r="137" fill="url(#orb-pink)" />
          <Circle cx="150" cy="150" r="137" fill="none" stroke="#FFFFFF" strokeOpacity="0.72" strokeWidth="3" />
          <Ellipse
            cx="150"
            cy="158"
            rx="124"
            ry="62"
            fill="none"
            stroke="#FFFFFF"
            strokeOpacity="0.44"
            strokeWidth="1.5"
            transform="rotate(-18 150 158)"
          />
          <Circle cx="248" cy="135" r="4" fill="#FFFFFF" fillOpacity="0.88" />
          <Circle cx="65" cy="211" r="2.6" fill="#FFFFFF" fillOpacity="0.72" />
        </Svg>
      </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function TranscriptStage({
  assistantLabel,
  state,
  turn,
  textColor,
  mutedColor,
}: {
  assistantLabel: string;
  mutedColor: string;
  state: VoiceConversationUiState;
  textColor: string;
  turn: ConversationTurn | null;
}) {
  const reduceMotion = useReducedMotion();
  const [displayTurn, setDisplayTurn] = useState<ConversationTurn | null>(turn);
  const [exitingTurn, setExitingTurn] = useState<ConversationTurn | null>(null);
  const activeOpacity = useSharedValue(turn ? 1 : 0);
  const activeY = useSharedValue(0);
  const previousProgress = useSharedValue(1);

  useEffect(() => {
    if (!turn) {
      setDisplayTurn(null);
      activeOpacity.value = withTiming(0, { duration: 180 });
      return;
    }

    if (!displayTurn) {
      setDisplayTurn(turn);
      activeOpacity.value = 0;
      activeY.value = reduceMotion ? 0 : 8;
      activeOpacity.value = withTiming(1, { duration: 220 });
      activeY.value = withTiming(0, { duration: 220 });
      return;
    }

    if (displayTurn.id !== turn.id) {
      setExitingTurn(displayTurn);
      setDisplayTurn(turn);
      previousProgress.value = 0;
      activeOpacity.value = 0;
      activeY.value = reduceMotion ? 0 : 10;

      previousProgress.value = withTiming(1, {
        duration: reduceMotion ? 260 : 650,
        easing: Easing.out(Easing.cubic),
      });
      activeOpacity.value = withDelay(
        reduceMotion ? 40 : 170,
        withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) }),
      );
      activeY.value = withDelay(
        reduceMotion ? 40 : 170,
        withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) }),
      );
      return;
    }

    if (displayTurn.text !== turn.text || displayTurn.speaker !== turn.speaker) {
      setDisplayTurn(turn);
    }
  }, [
    activeOpacity,
    activeY,
    displayTurn,
    previousProgress,
    reduceMotion,
    turn,
  ]);

  const activeStyle = useAnimatedStyle(() => ({
    opacity: activeOpacity.value,
    transform: [{ translateY: activeY.value }],
  }));

  const previousStyle = useAnimatedStyle(() => {
    const progress = previousProgress.value;

    if (reduceMotion) {
      return {
        opacity: 1 - progress,
        transform: [{ translateY: -12 * progress }],
      };
    }

    return {
      opacity: interpolate(progress, [0, 0.28, 0.56, 1], [1, 0.7, 0.35, 0]),
      transform: [
        { perspective: 850 },
        { translateY: interpolate(progress, [0, 1], [0, -112]) },
        { translateX: interpolate(progress, [0, 1], [0, -74]) },
        { scale: interpolate(progress, [0, 1], [1, 0.35]) },
        { rotateZ: `${interpolate(progress, [0, 1], [0, -7])}deg` },
        { rotateY: `${interpolate(progress, [0, 1], [0, 30])}deg` },
      ],
    };
  });

  if (state === 'completed') {
    return (
      <View style={styles.transcriptStage}>
        <View style={styles.completeCopy}>
          <Text style={[styles.completeTitle, { color: textColor }]}>
            Conversation complete
          </Text>
          <Text style={[styles.completeSubtitle, { color: mutedColor }]}>
            Review or continue
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.transcriptStage}>
      {exitingTurn ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.previousTurn, previousStyle]}
        >
          <Text style={[styles.ghostSpeaker, { color: mutedColor }]}>
            {exitingTurn.speaker === 'assistant' ? assistantLabel : 'You'}
          </Text>
          <Text style={[styles.ghostText, { color: mutedColor }]}>
            {exitingTurn.text}
          </Text>
        </Animated.View>
      ) : null}

      {displayTurn ? (
        <Animated.View style={[styles.activeTurn, activeStyle]}>
          <View style={styles.voiceMark} accessibilityElementsHidden>
            <View style={styles.voiceBarShort} />
            <View style={styles.voiceBarTall} />
            <View style={styles.voiceBarMid} />
            <View style={styles.voiceBarTall} />
            <View style={styles.voiceBarShort} />
          </View>
          <Text style={[styles.speakerLabel, { color: mutedColor }]}>
            {displayTurn.speaker === 'assistant' ? assistantLabel : 'You'}
          </Text>
          {displayTurn.text ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.activeText, { color: textColor }]}
            >
              {displayTurn.text}
            </Text>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

function TranscriptModal({
  assistantLabel,
  completionSummary,
  dark,
  messages,
  onClose,
  onDownload,
  visible,
}: {
  assistantLabel: string;
  completionSummary?: string | null;
  dark: boolean;
  messages: TranscriptMessage[];
  onClose: () => void;
  onDownload?: () => void;
  visible: boolean;
}) {
  const turns = conversationalMessages(messages);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      transparent={false}
      visible={visible}
    >
      <View
        style={[
          styles.transcriptSheet,
          { backgroundColor: dark ? '#0B1324' : '#F8FBFF' },
        ]}
      >
        <View
          style={[
            styles.sheetHeader,
            { borderBottomColor: dark ? '#23324A' : '#E4EAF3' },
          ]}
        >
          <Pressable onPress={onClose} accessibilityRole="button">
            <Text style={[styles.sheetAction, { color: dark ? '#AFC0FF' : '#5369D9' }]}>Close</Text>
          </Pressable>
          <Text
            style={[
              styles.sheetTitle,
              { color: dark ? '#F3F6FF' : '#14213A' },
            ]}
          >
            Transcript
          </Text>
          {onDownload ? (
            <Pressable onPress={onDownload} accessibilityRole="button">
              <Text style={[styles.sheetAction, { color: dark ? '#AFC0FF' : '#5369D9' }]}>Export</Text>
            </Pressable>
          ) : (
            <View style={styles.sheetActionSpacer} />
          )}
        </View>
        <ScrollView
          contentContainerStyle={styles.transcriptSheetContent}
          showsVerticalScrollIndicator={false}
        >
          {completionSummary ? (
            <Text
              style={[
                styles.sheetSummary,
                { color: dark ? '#AAB7CF' : '#5D6F8E' },
              ]}
            >
              {completionSummary}
            </Text>
          ) : null}
          {turns.map((turn) => (
            <View key={turn.id} style={styles.sheetTurn}>
              <Text
                style={[
                  styles.sheetSpeaker,
                  { color: dark ? '#93A3BD' : '#8A99B1' },
                ]}
              >
                {turn.speaker === 'assistant' ? assistantLabel : 'You'}
              </Text>
              <Text
                style={[
                  styles.sheetText,
                  { color: dark ? '#F3F6FF' : '#14213A' },
                ]}
              >
                {turn.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function VoiceConversationExperience({
  amplitude,
  assistantLabel,
  canSendManual,
  completionSummary,
  headerSubtitle,
  headerTitle,
  manualText,
  messages,
  micDisabled,
  onBack,
  onMenu,
  onChangeManualText,
  onDownloadTranscript,
  onEnterTextMode,
  onExitTextMode,
  onMicPress,
  onNextConversation,
  onReplayAudio,
  onReplayConversation,
  onSendManual,
  state,
  statusMessage,
  textMode,
}: Props) {
  const { width } = useWindowDimensions();
  const dark = useColorScheme() === 'dark';
  const [trayOpen, setTrayOpen] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const turn = useActiveConversationTurn(messages, state, textMode);
  const progressiveTurn = useProgressiveAssistantText(turn, state, textMode);
  const trayProgress = useSharedValue(0);

  const textColor = dark ? '#F3F6FF' : '#14213A';
  const mutedColor = dark ? '#AAB7CF' : '#8394B2';
  const orbSize = Math.min(292, Math.max(226, width * 0.67));

  useEffect(() => {
    trayProgress.value = withTiming(trayOpen ? 1 : 0, {
      duration: trayOpen ? 300 : 230,
      easing: Easing.out(Easing.cubic),
    });
  }, [trayOpen, trayProgress]);

  useEffect(() => {
    if (state === 'completed') setTrayOpen(false);
  }, [state]);

  const trayStyle = useAnimatedStyle(() => ({
    opacity: trayProgress.value,
    transform: [
      {
        translateY: interpolate(trayProgress.value, [0, 1], [58, 0]),
      },
    ],
  }));

  const gestureResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 12 &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy < -42 && state !== 'completed') {
            setTrayOpen(true);
          } else if (gesture.dy > 42) {
            setTrayOpen(false);
          }
        },
      }),
    [state],
  );

  const userInputExpected =
    state === 'userListening' ||
    state === 'userSpeaking' ||
    state === 'error';

  const orbVoiceEnabled =
    !textMode &&
    !micDisabled &&
    (state === 'userListening' ||
      state === 'userSpeaking' ||
      state === 'error');

  const trayMicEnabled =
    !micDisabled &&
    (state === 'userListening' ||
      state === 'userSpeaking' ||
      state === 'error');

  return (
    <View testID="voice-conversation-root" style={styles.root} {...gestureResponder.panHandlers}>
      <AmbientBackground dark={dark} />

      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Menu"
          accessibilityRole="button"
          onPress={onMenu}
          style={[
            styles.headerButton,
            {
              backgroundColor: dark
                ? 'rgba(20,32,54,0.78)'
                : 'rgba(255,255,255,0.64)',
              borderColor: dark
                ? 'rgba(132,151,184,0.24)'
                : 'rgba(255,255,255,0.74)',
              shadowColor: dark ? '#000000' : '#A6B9D5',
            },
          ]}
        >
          <Ionicons color={textColor} name="menu-outline" size={27} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text numberOfLines={1} style={[styles.headerTitle, { color: textColor }]}>
            {headerTitle}
          </Text>
          <Text numberOfLines={1} style={[styles.headerSubtitle, { color: mutedColor }]}>
            {headerSubtitle}
          </Text>
        </View>

        <Pressable
          accessibilityLabel={trayOpen ? 'Hide conversation controls' : 'Show conversation controls'}
          accessibilityRole="button"
          onPress={() => setTrayOpen((open) => !open)}
          style={[
            styles.headerButton,
            {
              backgroundColor: dark
                ? 'rgba(20,32,54,0.78)'
                : 'rgba(255,255,255,0.64)',
              borderColor: dark
                ? 'rgba(132,151,184,0.24)'
                : 'rgba(255,255,255,0.74)',
              shadowColor: dark ? '#000000' : '#A6B9D5',
            },
          ]}
        >
          <Ionicons color={textColor} name="options-outline" size={25} />
        </Pressable>
      </View>

      <TranscriptStage
        assistantLabel={assistantLabel}
        mutedColor={mutedColor}
        state={state}
        textColor={textColor}
        turn={progressiveTurn}
      />

      {statusMessage && state !== 'completed' ? (
        <View style={styles.statusWrap}>
          <Text
            accessibilityLiveRegion="polite"
            style={[
              styles.statusText,
              { color: dark ? '#AAB7CF' : '#657691' },
            ]}
          >
            {statusMessage}
          </Text>
        </View>
      ) : null}

      {!textMode ? (
        <View style={styles.orbZone}>
          <VoiceOrb
            amplitude={amplitude}
            disabled={!orbVoiceEnabled}
            onPress={() => {
              if (!orbVoiceEnabled) return;
              onExitTextMode();
              onMicPress();
            }}
            size={orbSize}
            state={state}
          />
        </View>
      ) : (
        <View pointerEvents="none" style={styles.textModeSpacer} />
      )}

      {userInputExpected && !trayOpen ? (
        <View pointerEvents="none" style={styles.swipeHint}>
          <Text style={[styles.primaryVoiceHint, { color: mutedColor }]}>
            {state === 'userSpeaking'
              ? 'Tap the orb again to finish'
              : 'Tap the orb to speak'}
          </Text>
          {state !== 'userSpeaking' ? (
            <View style={styles.typeHintRow}>
              <Ionicons color={mutedColor} name="chevron-up" size={15} />
              <Text style={[styles.swipeHintText, { color: mutedColor }]}>
                Swipe up to type
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {state !== 'completed' ? (
        <Animated.View
          testID="voice-input-tray"
          pointerEvents={trayOpen ? 'auto' : 'none'}
          style={[
            styles.inputTray,
            {
              backgroundColor: dark
                ? 'rgba(14,25,43,0.94)'
                : 'rgba(255,255,255,0.9)',
              borderColor: dark
                ? 'rgba(91,111,145,0.42)'
                : 'rgba(220,229,244,0.92)',
            },
            trayStyle,
          ]}
        >
          <View
            style={[
              styles.trayHandle,
              { backgroundColor: dark ? '#596982' : '#CCD6E5' },
            ]}
          />
          <View style={styles.inputActions}>
            <Pressable
              accessibilityLabel={
                state === 'userSpeaking'
                  ? 'Stop microphone recording'
                  : 'Start microphone recording'
              }
              accessibilityRole="button"
              disabled={!trayMicEnabled}
              onPress={() => {
                if (!trayMicEnabled) return;
                onExitTextMode();
                onMicPress();
              }}
              style={[
                styles.micButton,
                state === 'userSpeaking' && styles.micButtonActive,
                !trayMicEnabled && styles.controlDisabled,
              ]}
            >
              <Ionicons
                color="#FFFFFF"
                name={state === 'userSpeaking' ? 'stop' : 'mic'}
                size={24}
              />
            </Pressable>

            <View
              style={[
                styles.textEntryWrap,
                {
                  backgroundColor: dark ? '#111D31' : '#F3F7FC',
                  borderColor: dark ? '#33445F' : '#DDE5F0',
                },
              ]}
            >
              <TextInput
                accessibilityLabel="Type your speaking-practice response"
                editable={!micDisabled}
                multiline
                onChangeText={onChangeManualText}
                onFocus={onEnterTextMode}
                placeholder="Type a response…"
                placeholderTextColor={dark ? '#8392AA' : '#93A2BA'}
                style={[styles.textEntry, { color: textColor }]}
                value={manualText}
              />
              {manualText.trim() ? (
                <Pressable
                  accessibilityLabel="Send typed response"
                  accessibilityRole="button"
                  disabled={!canSendManual}
                  onPress={onSendManual}
                  style={[
                    styles.sendMiniButton,
                    !canSendManual && styles.controlDisabled,
                  ]}
                >
                  <Ionicons color="#FFFFFF" name="arrow-up" size={19} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.traySecondaryRow}>
            {textMode ? (
              <Pressable
                testID="voice-mode-return"
                accessibilityLabel="Voice"
                accessibilityRole="button"
                onPress={onExitTextMode}
                style={styles.trayTextButton}
              >
                <Ionicons color={textColor} name="volume-medium-outline" size={18} />
                <Text style={[styles.trayTextButtonLabel, { color: textColor }]}>Voice</Text>
              </Pressable>
            ) : null}
            {onReplayAudio ? (
              <Pressable
                accessibilityRole="button"
                onPress={onReplayAudio}
                style={styles.trayTextButton}
              >
                <Ionicons color={textColor} name="refresh-outline" size={18} />
                <Text style={[styles.trayTextButtonLabel, { color: textColor }]}>Replay</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {state === 'completed' ? (
        <View style={styles.completionControls}>
          <View style={styles.completionSecondaryRow}>
            <Pressable
              accessibilityRole="button"
              onPress={onReplayConversation}
              style={[
                styles.completionChip,
                {
                  backgroundColor: dark
                    ? 'rgba(20,32,54,0.82)'
                    : 'rgba(255,255,255,0.62)',
                  borderColor: dark
                    ? 'rgba(132,151,184,0.28)'
                    : 'rgba(255,255,255,0.75)',
                },
              ]}
            >
              <Ionicons color={textColor} name="refresh-outline" size={19} />
              <Text style={[styles.completionChipText, { color: textColor }]}>Replay</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTranscriptVisible(true)}
              style={[
                styles.completionChip,
                {
                  backgroundColor: dark
                    ? 'rgba(20,32,54,0.82)'
                    : 'rgba(255,255,255,0.62)',
                  borderColor: dark
                    ? 'rgba(132,151,184,0.28)'
                    : 'rgba(255,255,255,0.75)',
                },
              ]}
            >
              <Ionicons color={textColor} name="document-text-outline" size={18} />
              <Text style={[styles.completionChipText, { color: textColor }]}>Transcript</Text>
            </Pressable>
          </View>

          <View style={styles.completionNav}>
            <Pressable
              accessibilityRole="button"
              onPress={onBack}
              style={[
                styles.navButton,
                styles.navButtonSecondary,
                {
                  backgroundColor: dark
                    ? 'rgba(20,32,54,0.82)'
                    : 'rgba(255,255,255,0.64)',
                  borderColor: dark
                    ? 'rgba(132,151,184,0.28)'
                    : 'rgba(255,255,255,0.78)',
                },
              ]}
            >
              <Text style={[styles.navButtonText, { color: textColor }]}>Previous</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onNextConversation}
              style={[styles.navButton, styles.navButtonPrimary]}
            >
              <Text style={[styles.navButtonText, styles.navButtonPrimaryText]}>Next</Text>
              <Ionicons color="#FFFFFF" name="arrow-forward" size={20} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <TranscriptModal
        assistantLabel={assistantLabel}
        completionSummary={completionSummary}
        dark={dark}
        messages={messages}
        onClose={() => setTranscriptVisible(false)}
        onDownload={onDownloadTranscript}
        visible={transcriptVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 10,
    zIndex: 20,
  },
  headerButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderColor: 'rgba(255,255,255,0.74)',
    borderRadius: 28,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    shadowColor: '#A6B9D5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.13,
    shadowRadius: 18,
    width: 54,
  },
  headerCopy: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.3,
    maxWidth: '100%',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
    maxWidth: '100%',
  },
  transcriptStage: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 260,
    paddingBottom: 195,
    paddingHorizontal: 30,
    position: 'relative',
  },
  activeTurn: {
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 620,
    width: '100%',
  },
  previousTurn: {
    left: 30,
    maxWidth: 300,
    position: 'absolute',
    top: 24,
  },
  voiceMark: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 3,
    height: 28,
    justifyContent: 'center',
    marginBottom: 8,
  },
  voiceBarShort: {
    backgroundColor: '#70C4FF',
    borderRadius: 4,
    height: 11,
    width: 4,
  },
  voiceBarMid: {
    backgroundColor: '#B4A0FF',
    borderRadius: 4,
    height: 19,
    width: 4,
  },
  voiceBarTall: {
    backgroundColor: '#F1A5E7',
    borderRadius: 4,
    height: 26,
    width: 4,
  },
  speakerLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1.2,
    marginBottom: 17,
  },
  activeText: {
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: -0.8,
    lineHeight: 43,
    maxWidth: 620,
    textAlign: 'center',
  },
  ghostSpeaker: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  ghostText: {
    fontSize: 17,
    fontWeight: '300',
    lineHeight: 22,
  },
  completeCopy: {
    alignItems: 'center',
  },
  completeTitle: {
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    marginTop: 8,
    textAlign: 'center',
  },
  orbZone: {
    alignItems: 'center',
    bottom: 116,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  orbPressTarget: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbPressed: {
    opacity: 0.94,
    transform: [{ scale: 0.985 }],
  },
  orbOuter: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    shadowColor: '#9DBBFF',
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 34,
  },
  textModeSpacer: {
    bottom: 116,
    height: 292,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  statusWrap: {
    alignItems: 'center',
    bottom: 410,
    left: 34,
    position: 'absolute',
    right: 34,
    zIndex: 16,
  },
  statusText: {
    color: '#657691',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  swipeHint: {
    alignItems: 'center',
    bottom: 38,
    flexDirection: 'column',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 15,
  },
  primaryVoiceHint: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  typeHintRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 3,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputTray: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(220,229,244,0.92)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    paddingBottom: 18,
    paddingHorizontal: 18,
    paddingTop: 10,
    position: 'absolute',
    right: 0,
    shadowColor: '#667795',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12,
    shadowRadius: 26,
    zIndex: 40,
  },
  trayHandle: {
    alignSelf: 'center',
    backgroundColor: '#CCD6E5',
    borderRadius: 3,
    height: 4,
    marginBottom: 13,
    width: 40,
  },
  inputActions: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 10,
  },
  micButton: {
    alignItems: 'center',
    backgroundColor: '#5A82FF',
    borderRadius: 25,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  micButtonActive: {
    backgroundColor: '#E2677D',
  },
  textEntryWrap: {
    alignItems: 'flex-end',
    backgroundColor: '#F3F7FC',
    borderColor: '#DDE5F0',
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 50,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  textEntry: {
    color: '#14213A',
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    maxHeight: 96,
    minHeight: 36,
    paddingVertical: 7,
  },
  sendMiniButton: {
    alignItems: 'center',
    backgroundColor: '#6E77F6',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  controlDisabled: {
    opacity: 0.4,
  },
  traySecondaryRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    minHeight: 30,
    paddingTop: 8,
  },
  trayTextButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  trayTextButtonLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  completionControls: {
    bottom: 14,
    left: 20,
    position: 'absolute',
    right: 20,
    zIndex: 30,
  },
  completionSecondaryRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 16,
  },
  completionChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderColor: 'rgba(255,255,255,0.75)',
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 43,
    paddingHorizontal: 20,
  },
  completionChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  completionNav: {
    flexDirection: 'row',
    gap: 14,
  },
  navButton: {
    alignItems: 'center',
    borderRadius: 28,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 58,
  },
  navButtonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1,
  },
  navButtonPrimary: {
    backgroundColor: '#8B78F5',
    gap: 10,
    shadowColor: '#8BBEFF',
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '500',
  },
  navButtonPrimaryText: {
    color: '#FFFFFF',
  },
  transcriptSheet: {
    backgroundColor: '#F8FBFF',
    flex: 1,
    paddingTop: 16,
  },
  sheetHeader: {
    alignItems: 'center',
    borderBottomColor: '#E4EAF3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sheetTitle: {
    color: '#14213A',
    fontSize: 18,
    fontWeight: '600',
  },
  sheetAction: {
    color: '#5369D9',
    fontSize: 15,
    fontWeight: '500',
    minWidth: 52,
  },
  sheetActionSpacer: {
    minWidth: 52,
  },
  transcriptSheetContent: {
    gap: 22,
    paddingBottom: 60,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  sheetSummary: {
    color: '#5D6F8E',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  sheetTurn: {
    gap: 6,
  },
  sheetSpeaker: {
    color: '#8A99B1',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  sheetText: {
    color: '#14213A',
    fontSize: 19,
    fontWeight: '400',
    lineHeight: 28,
  },
});
