# Agent A — Voice conversation merged-main follow-up research — 2026-09-28

Status: implementation research for a narrow post-merge repair.
Base reviewed: `main@b847f692bca6eac730940398815fc185e4527afd`
Target branch: `fix/voice-conversation-theme-turn-guard-20260928`

## Scope

Audit the newly merged minimal KLYMis voice-conversation surface against its product authority and existing protected Roleplay microphone/session boundaries. This follow-up is limited to presentation/theme correctness and alternate microphone-control turn gating. It does not alter server Roleplay selection, STT/TTS transport, auth, billing, native dependencies, schema, production state, EAS Update, TestFlight or App Store state.

## Repository evidence

Reviewed:
- `docs/design/KLYMIS_SPEAKING_VOICE_CONVERSATION_UI.md`
- `apps/client/features/speaking/components/VoiceConversationExperience.tsx`
- `apps/client/features/speaking/screens/RoleplayConversationScreen.tsx`
- `apps/client/scripts/verify-voice-conversation-ui.mjs`
- `.github/AGENTS.md`
- `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`
- `docs/agents/WAVE1_PROTECTED_FILES_AND_CAPABILITIES.md`
- `docs/agents/WAVE1_TEST_MATRIX.md`

### Finding 1 — dark-mode acceptance is not implemented

The UAT contract requires light and dark themes to remain readable, and the ambient background component already contains a dark palette. However, `VoiceConversationExperience` currently forces `const dark = false`, uses light-only text/surface values, and the parent `SafeAreaView` also forces `#F8FBFF`.

Further source inspection found that `RoleplayConversationScreen` already reads the canonical in-app `themeMode` from `usePreferencesStore` and resolves the standard Floently palette from that preference. A direct `useColorScheme` subscription inside the child would therefore create a second, potentially conflicting theme authority.

Decision:
- keep `usePreferencesStore.themeMode` as the existing app theme authority;
- pass the resolved dark/light state into `VoiceConversationExperience`;
- keep the existing light palette unchanged;
- activate the already-authored dark ambient palette and add restrained dark surface/text counterparts;
- match the parent safe-area background to the same theme;
- do not add another theme dependency or theme authority.

Rejected alternative:
- direct React Native `useColorScheme` inside `VoiceConversationExperience`. It is a valid platform API, but it was rejected here because the app already has an explicit persisted light/dark preference and the voice surface must follow that canonical preference rather than the OS independently.

### Finding 2 — alternate tray microphone can bypass the learner-turn gate

The orb correctly derives an enabled state from both microphone availability and the presentation state:
`userListening | userSpeaking | error`.

The tray microphone currently uses only `micDisabled`. Therefore, while the tray is open, it can invoke the canonical microphone handler during `aiSpeaking`, `processing`, or `idle` if no other busy flag happens to disable it.

This contradicts the product authority: during AI speech, processing and completion, the orb is status-only and recording must not start. The alternate tray microphone must preserve the same turn boundary rather than becoming a bypass.

Decision:
- derive one explicit `trayMicEnabled` from the same learner-turn states, without requiring voice mode;
- preserve tray microphone use in text mode when it is actually the learner's turn;
- disable the Pressable and show disabled styling outside learner-turn states;
- leave the canonical recorder/STT handler unchanged.

Primary reference:
- React Native `Pressable.disabled`: https://reactnative.dev/docs/0.83/pressable
- `disabled` is the platform-supported way to prevent press behavior; no custom gesture interception is needed.

## Acceptance criteria

1. The voice conversation surface follows the current canonical app light/dark preference.
2. Light-mode visual values remain materially unchanged.
3. Dark mode has readable active text, muted text, tray/text-entry surfaces, transcript sheet, status copy, and completion controls.
4. Safe-area background matches the active voice-conversation background.
5. The orb remains directly tappable only during learner-turn states.
6. The tray microphone is also operable only during learner-turn states, including when returning from text mode.
7. AI-speaking, processing, idle and completed states cannot start recording through the tray microphone.
8. Existing `handleMicTap`, recorder/STT/TTS, server/session, roleplay-pool, auth and entitlement authority are unchanged.
9. Permanent source verifier assertions cover both repairs.
10. No native dependency/configuration, backend, production, OTA or store action is introduced.

`RESEARCH_GATE=PASS`
`PRODUCTION_ACTIONS=NONE`
