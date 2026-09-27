# KLYMis Speaking Practice — Voice Conversation UI

Status: **Product UI authority**  
Date: 2026-09-27  
Applies to: KieliValmis / KLYMis Speaking Practice voice conversation surfaces  
Primary implementation: `apps/client/features/speaking/components/VoiceConversationExperience.tsx`

---

## 1. Goal

Replace the traditional card/chat-style speaking-practice interface with a highly minimal, voice-first conversation interface.

The experience must feel:

- calm;
- premium;
- simple;
- spacious;
- alive;
- immediately understandable.

It must **not** feel like a traditional messaging application.

The learner's attention hierarchy is always:

1. What is being said right now?
2. Who is speaking?
3. The living orb confirming the voice state.
4. Navigation only when the current task is complete.

Everything else is secondary.

---

## 2. Non-negotiable visual rules

The live speaking surface must not contain:

- chat bubbles;
- conversation cards;
- borders around sentences;
- permanent vertically stacked transcript history;
- a permanent microphone button;
- a permanent text-entry field;
- many simultaneous controls;
- large heavy page titles competing with the lesson;
- decorative background artwork or scenery.

The primary live experience revolves around:

1. one active utterance in the middle of the screen;
2. one living orb low on the page in voice mode;
3. the previous utterance shrinking/fading away as the next speaker begins;
4. controls appearing only when they are needed.

---

## 3. Background

The background is a very soft luminous surface.

Primary feeling:

- pale blue;
- subtle lavender;
- subtle pink;
- subtle cyan;
- generous white light.

It should appear almost plain at first glance.

Allowed:

- extremely subtle radial light variation;
- soft ambient illumination influenced by the orb;
- very gentle tonal motion if performance permits.

Not allowed:

- obvious stripes;
- landscapes;
- illustrated objects;
- decorative scenery;
- busy particles;
- visually dominant gradients;
- strong rainbow colouring.

### Text-only rule

When the user is not in a voice conversation and the interaction is text-only:

- **remove the orb completely**;
- retain the same calm luminous background;
- keep the active text experience simple;
- reveal typing/voice utility controls only through the interaction tray.

The background must remain visually coherent whether the orb is present or absent.

---

## 4. Screen structure

### 4.1 Header

Below the safe-area/status region:

**Left**
- small circular menu/back control.

**Centre**
- lesson or scenario name;
- small subtitle for topic/context and/or level.

Example:

> Lesson 12  
> Daily Conversation

**Right**
- small circular settings/context-controls button.

Do not add another large page heading such as “Speaking Practice” when the lesson/scenario identity already communicates context.

The header must remain compact and secondary to the conversation.

---

## 5. Active transcript stage

The centre of the screen is reserved for the **active utterance**.

Only the current speaker's utterance is dominant.

Example AI turn:

> KLYMis Guide  
> Good morning.  
> How are you today?

Example learner turn:

> You  
> I'm fine, thank you.

### Typography

Speaker label:
- small;
- subtle;
- low contrast;
- regular/medium weight;
- slightly increased tracking is acceptable.

Active utterance:
- dark navy/slate;
- high contrast;
- centred;
- generous line height;
- elegant regular/light-medium weight;
- no card;
- no box;
- no background plate;
- no border.

The utterance should feel like floating typography.

Avoid oversized heavy display type.

---

## 6. Live utterance appearance

### AI

AI text is known before TTS starts, therefore it may appear progressively while audio plays.

Behaviour:
- reveal by words or natural speech chunks;
- do not type character-by-character;
- update approximately every 100–200 ms;
- use a subtle opacity transition;
- optionally use 2–4 px upward interpolation;
- avoid a blinking text cursor.

The text should feel **spoken**, not typed.

### Learner

The current native recorder/STT path returns the recognized transcript after recording is stopped.

Therefore the UI must **not fake live partial learner speech**.

Current truthful behaviour:
- show “You” / listening state while recording;
- animate the real transcript into the active position when STT returns.

Future behaviour:
- if a genuine streaming partial-transcript source is introduced, feed its real partial results into the same transcript component.

Never simulate partial recognition from a completed transcript.

---

## 7. Turn transition — rotating/receding text

This is a core identity of the experience.

When one speaker finishes and the next speaker begins, the old utterance does not instantly disappear.

The old utterance must appear to move around an invisible wheel/cylinder behind the page.

### Behaviour

1. previous utterance starts moving upward and slightly left;
2. scale reduces;
3. opacity reduces;
4. slight perspective rotation increases;
5. text appears to curve away from the viewer;
6. it disappears behind the visual plane;
7. the next speaker starts appearing in the centre **before the old turn has fully gone**.

The overlap creates one continuous conversation stream.

Do not implement:

> old utterance disappears → pause → new utterance appears

Implement:

> old utterance recedes + new utterance begins entering at nearly the same time

### Motion target

Approximate full-motion progression:

| Time | Scale | Translate Y | Translate X | Rotate Z | Rotate Y | Opacity |
|---|---:|---:|---:|---:|---:|---:|
| 0 ms | 1.00 | 0 | 0 | 0° | 0° | 1.00 |
| 150 ms | 0.82 | -25 | -15 | ~-1° | ~6° | 0.70 |
| 350 ms | 0.58 | -65 | -40 | -4° | 15° | 0.35 |
| 550–700 ms | 0.35 | -110 | -75 | -7° | 30° | 0.00 |

Exact numbers may be tuned visually.

Required feeling:

**FRONT → SHRINK → CURVE AWAY → FADE BEHIND PAGE**

The incoming utterance should begin approximately 150–250 ms after the outgoing animation starts.

---

## 8. Previous-turn ghost

A faint remnant of the outgoing utterance may remain briefly toward the upper-left.

Rules:

- much smaller than active text;
- low opacity;
- visually distant;
- temporary only;
- normally gone within roughly 500–900 ms.

Do not leave permanent conversation history on the live screen.

Full history belongs in the Transcript view.

---

## 9. Voice orb

The orb is the primary visual object in **voice mode**.

It is **not** a microphone button.

It must not contain a microphone icon.

It is ambient status feedback for the conversation.

### Position

- low on the screen;
- above the safe-area/home-indicator region;
- substantially below the active transcript.

### Shape

- circular;
- soft;
- luminous;
- original KLYMis design.

Do not copy another assistant's orb exactly.

### Palette

Use restrained amounts of:

- blue;
- lavender;
- cyan;
- subtle pink;
- white light.

Avoid saturated rainbow effects.

### Implementation

Current preferred implementation:

- `react-native-svg`;
- `react-native-reanimated`;
- radial gradients;
- moving/rotating internal gradient layers;
- subtle edge glow;
- optional curved light path;
- amplitude-driven scale.

Do **not** add Skia only for this effect unless a later measured requirement proves SVG/Reanimated insufficient.

Do not use a prerecorded orb video.

The orb must be generated by the app so it can react to real voice state.

---

## 10. Orb states

### 10.1 Idle

Used before speech begins or between turns.

- very slow internal movement;
- minimal glow;
- nearly still;
- slight breathing motion.

Target:

> scale 0.98 → 1.02 → 0.98  
> 3–5 seconds

### 10.2 AI speaking

- gently more energetic;
- internal gradient moves;
- edge glow increases;
- small amplitude/state pulse;
- no bouncing.

Typical scale range should remain subtle, roughly up to 1.04–1.05.

### 10.3 Learner speaking

Same orb.

Possible distinction:

- slightly brighter lower cyan region;
- gentle amplitude expansion;
- unified visual identity.

Do not switch to a different microphone visualization.

### 10.4 Processing / thinking

- slower orbital movement;
- gentle internal rotation;
- no strong pulse.

### 10.5 Conversation complete

- significantly calmer;
- reduced motion;
- remains part of the final voice-mode composition while completion navigation enters.

---

## 11. Initial screen

When a speaking exercise opens:

Visible:
- compact header;
- lesson/scenario identity;
- mostly empty luminous background;
- orb low on the screen in voice mode.

No transcript is required before the first utterance begins.

The page should initially feel almost empty.

---

## 12. Voice flow

### AI starts

- assistant label appears;
- utterance begins revealing progressively;
- orb enters AI-speaking state.

### AI finishes

- AI utterance begins receding;
- “You” becomes active nearly immediately;
- interface becomes ready for learner voice.

### Learner starts speaking

- no permanent mic chrome appears on the main canvas;
- orb reacts to real microphone amplitude;
- learner label/state remains clear;
- when genuine STT partials exist, they may stream into the active text.

### Learner finishes

- real recognized transcript appears;
- learner utterance recedes with the same circular-away transition;
- processing state is shown;
- next AI utterance enters.

No conversation stack is created.

---

## 13. Microphone and typing access

The main page must not permanently show the microphone or typing field.

Instead, the user reveals the utility tray intentionally.

Primary gesture:

- **swipe upward** on the live page.

The context/settings button may also reveal the same tray.

Tray may contain:

- microphone action;
- typing field;
- Replay when useful;
- Voice return action when currently text-only.

### Text mode

Focusing/using text input enters text-only mode:

- stop active voice playback if needed;
- remove the orb;
- keep the background;
- keep the current utterance context;
- use explicit voice action to return to voice mode.

The transition between voice and text must feel like one experience, not two unrelated screens.

---

## 14. Contextual controls

Controls appear only when context requires them.

Examples:

Recognition failure:
- Try again.

Audio unavailable:
- Replay or text fallback.

Pronunciation assistance when genuinely supported:
- Slow.

Paused flow:
- Resume.

Full conversation:
- Transcript.

Do not display all controls simultaneously.

---

## 15. Transcript history

Normal live conversation mode must not show the full history.

Selecting **Transcript** opens a separate sheet/view.

Transcript view may contain:

- speaker labels;
- complete utterances;
- completion summary;
- export/download action where existing product capability allows it.

Closing Transcript returns to the minimal live/completion surface.

---

## 16. Completion state

Only when the conversation is finished should end-navigation controls appear.

Centre:

> Conversation complete  
> Review or continue

This should remain calm and not dominate the screen.

### Secondary controls

Small:
- Replay;
- Transcript.

### Bottom navigation

Only after completion:

**Previous**
- secondary;
- quiet;
- translucent/light.

**Next**
- primary;
- slightly more visible;
- may use blue/lilac KLYMis accents.

Entry animation:
- opacity 0 → 1;
- translateY 12 → 0;
- approximately 250–350 ms.

No Previous/Next navigation during an active turn.

---

## 17. State machine

Use a state machine/union rather than many unrelated booleans.

Canonical UI states:

```ts
type VoiceConversationUiState =
  | 'idle'
  | 'aiSpeaking'
  | 'userListening'
  | 'userSpeaking'
  | 'processing'
  | 'completed'
  | 'error';
```

This state is presentation authority only.

It must not replace server/session/roleplay authority.

---

## 18. Transcript model

Live presentation needs:

```ts
type ConversationTurn = {
  id: string;
  speaker: 'assistant' | 'user';
  text: string;
};
```

Conceptually maintain:

- active turn;
- exiting/previous turn;
- current display text;
- speaker;
- conversation UI state.

On speaker change:

```
previousTurn = activeTurn
activeTurn = newTurn
```

Keep the previous turn mounted until the exit animation finishes.

Do not immediately unmount it.

---

## 19. Animation implementation

Preferred:
- React Native Reanimated.

Useful shared values include:

- active opacity;
- active translateY;
- previous transition progress;
- previous scale;
- previous translateX/Y;
- previous rotateY/rotateZ;
- orb scale;
- orb energy;
- orb rotation/breath progress;
- utility-tray progress.

Avoid frequent JS-driven frame updates.

Speech/API state and visual animation state should remain separated.

---

## 20. Accessibility

Animations must respect **Reduce Motion**.

When Reduce Motion is enabled:

- remove perspective rotation;
- remove large spatial translation;
- avoid large scaling;
- use a simple crossfade/small translation;
- preserve live transcript and speaker labels.

Active transcript must maintain strong contrast.

Do not use pale pastel text for active utterances.

The orb must never be the only indication of:

- who is speaking;
- listening;
- processing;
- error;
- completion.

Use text/accessibility state as the real semantic signal.

---

## 21. Performance

Targets:

- orb/animation: 60 fps where the device allows;
- transcript updates should not rerender the whole screen;
- microphone amplitude updates should not rebuild transcript structure;
- orb, transcript animation and recorder/API logic remain separate components/concerns.

Memoize where useful.

Avoid new native dependencies unless justified by measured performance needs.

---

## 22. Runtime authority that must remain unchanged

The redesign is a presentation-layer replacement.

It must preserve:

- server-owned Roleplay scenario selection/rotation;
- existing session start/turn/finish APIs;
- canonical Finnish recorder/STT path;
- canonical TTS/audio-session path;
- existing profession/mode isolation;
- existing auth/entitlement/billing boundaries;
- existing completion/evaluation report data;
- existing transcript export capability.

Do not fork those systems just to achieve the visual design.

---

## 23. Current truth boundary for streaming STT

As of this implementation:

- AI progressive text: supported truthfully because the utterance is known before playback;
- web/native microphone amplitude: supported;
- completed learner STT transcript: supported;
- native real-time learner partial transcript: **not currently supplied by the existing recorder authority**.

Therefore native learner partial words must not be simulated.

Future streaming recognition may plug into the same UI once a genuine partial transcript source exists.

---

## 24. Component structure

Recommended/current structure:

```
RoleplayConversationScreen
 └── VoiceConversationExperience
      ├── AmbientBackground
      ├── compact header
      ├── TranscriptStage
      │    ├── exiting/ghost turn
      │    └── active turn
      ├── VoiceOrb                 // voice mode only
      ├── swipe/context input tray // contextual only
      ├── completion controls      // completed only
      └── TranscriptModal
```

The API/session screen remains responsible for backend authority.

The experience component owns presentation and interaction disclosure.

---

## 25. Acceptance tests

The implementation is not complete unless all are true:

1. Main live Roleplay surface contains no chat bubbles.
2. Main live surface contains no stacked transcript history.
3. Main live surface contains no conversation card.
4. Main live surface has no permanently visible microphone button.
5. Main live surface has no permanently visible text input.
6. Only one active utterance is visually dominant.
7. Previous utterance recedes/fades during speaker transition.
8. The next utterance starts entering before the previous one has fully disappeared.
9. Voice mode shows the orb.
10. Text-only mode removes the orb.
11. Orb reacts to canonical microphone amplitude during learner recording.
12. AI speaking changes the orb state.
13. Processing has a calmer distinct orb state.
14. Swipe-up or contextual control reveals the microphone/text tray.
15. Transcript history opens separately.
16. Completion alone reveals Replay / Transcript / Previous / Next.
17. Reduce Motion removes perspective/large movement.
18. Existing server roleplay/session authority remains unchanged.
19. Existing recorder/STT/TTS authority remains unchanged.
20. No new native graphics dependency is required.
21. CI, audio invariants, scenario-rotation invariants and source-candidate checks remain green.

---

## 26. Visual intent in one sentence

**A nearly empty luminous page where spoken words occupy the centre for only the current turn, previous speech curves quietly into the background, and a low living orb confirms the voice state without competing with the lesson.**
