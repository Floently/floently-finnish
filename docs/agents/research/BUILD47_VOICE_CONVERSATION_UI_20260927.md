# Build 47 — Voice conversation UI research

Date: 2026-09-27
Branch: `feature/build47-voice-conversation-ui-20260927`
Base: `69594c22deddad6dbfd2f9c07db168c1ab53ad91`

## User-approved product direction

The new speaking-practice experience is voice-first and deliberately minimal:

- no chat bubbles, conversation cards, permanent transcript stack, permanent microphone, or dense control chrome;
- one active utterance at a time in the centre;
- the previous utterance shrinks, fades and curves toward the upper-left while the next utterance enters;
- a low-positioned luminous KLYMis orb represents voice state and reacts gently to audio amplitude;
- controls appear only when contextually needed;
- microphone and typing controls are hidden behind an intentional swipe-up interaction;
- transcript history moves to a separate transcript surface;
- completion reveals Replay / Transcript plus Previous / Next;
- when the interaction becomes text-only, the orb is removed and the soft ambient background remains;
- Reduce Motion replaces perspective/large movement with crossfades.

The four user-provided screen references are visual guidance only; implementation must preserve KieliValmis/KLYMis identity rather than copying another product.

## Current source inspection

The current Roleplay conversation runtime already owns the required production logic:

- `RoleplayConversationScreen.tsx` owns session start, server-owned scenario identity/rotation, turn submission, TTS lifecycle, completion report, export and replay;
- `useRoleplayRecorder.ts` owns the canonical Finnish recording/STT path and exposes live microphone amplitude;
- `speakRoleplayText` exposes start/finish/unavailable lifecycle callbacks;
- `react-native-reanimated@4.2.1` and `react-native-svg@15.15.3` are already shipped;
- `react-native-gesture-handler` is already shipped;
- React Native / Expo already provide accessibility and safe-area primitives.

Therefore this work should replace the **presentation layer**, not fork session, recorder, STT, TTS, scenario rotation, billing, auth or evaluation authority.

## Dependency decision

Do **not** add React Native Skia.

Although a shader/canvas orb could be richer, adding a new native dependency is unnecessary and would broaden the release surface. The existing SVG + Reanimated stack can provide:

- radial-gradient orb layers;
- subtle glow/halo;
- amplitude-driven scale;
- slow internal orbital rotation;
- reduced-motion fallbacks.

This satisfies the requested visual behaviour without a native dependency change.

## Motion/accessibility research

React Native Reanimated 4 documents system-aware reduced-motion handling and `useReducedMotion()` across Android, iOS and web:
https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/

Reanimated's accessibility guide documents `ReduceMotion.System` as the normal system-aware behaviour:
https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/

React Native exposes `AccessibilityInfo.isReduceMotionEnabled()` and related accessibility APIs:
https://reactnative.dev/docs/0.82/accessibilityinfo

Decision:

- use Reanimated for transcript/orb transitions;
- use the system reduced-motion setting;
- in reduced motion, remove perspective rotation and large translation/scale;
- retain speaker labels, state text and transcript so the orb is never the sole state indicator.

## Speech/transcript truth boundary

AI text is known before TTS playback, so it can be revealed progressively while TTS is speaking using word/chunk timing tied to audio start/finish.

Current native user STT is **not streaming**. `useRoleplayRecorder` sends the completed recording to the existing transcription path and receives the transcript after stop.

Therefore:

- do not fabricate “live” user words from a completed transcript;
- while recording, show the user speaker state and listening indication;
- once STT returns, animate the real transcript into the active position;
- keep the component model ready for a future genuine `partialTranscript` source;
- web/native streaming STT can be added later only through an explicit speech-recognition/streaming authority, not a visual fake.

## Interaction decision

The primary screen remains almost empty.

Default voice surface:
- compact header;
- active transcript stage;
- low orb;
- subtle swipe-up hint while user input is expected.

Swipe-up utility tray:
- microphone action;
- text entry;
- context-only replay/slow/error controls when available.

Entering text mode:
- stops active voice playback;
- hides the orb;
- keeps the ambient background;
- returns to voice mode explicitly or after voice action.

Completion:
- centred “Conversation complete”;
- quiet Replay / Transcript;
- Previous / Next at bottom;
- detailed evaluation/report remains available behind Transcript/report rather than occupying the live conversation.

## Acceptance criteria

1. No live chat-bubble/transcript-stack UI remains on the main Roleplay conversation surface.
2. One active utterance is dominant; previous turn exits with overlapping recede/fade animation.
3. Orb is visible only in voice mode and reacts to recorder amplitude/state.
4. Text-only mode removes the orb.
5. Microphone and text input are hidden by default and revealed through swipe-up/context controls.
6. Transcript history is separate from the live surface.
7. Completion controls appear only after completion.
8. Existing server-owned roleplay session/scenario/turn APIs remain unchanged.
9. Existing recorder/STT and TTS authority remain unchanged.
10. Reduce Motion removes perspective/large spatial motion.
11. No new native dependency.
12. Existing CI, roleplay scenario-rotation and audio invariants remain green.
13. Add permanent source-level UI invariants for the new no-chat-card/no-permanent-mic contract.
