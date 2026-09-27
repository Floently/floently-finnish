# Build 47 Phase 8 — Learner Experience Polish Research

Date: 2026-09-27  
Branch: `feature/build47-learning-experience-polish-20260927`  
Base: `775702827eb3d8ab2e999b726dff779e7f87bdbe`

## Scope

Integrate the already-accepted Wave-1 learning-experience primitives into the current Build 47 learning flows without changing learning-state authority, navigation authority, task order, progression rules, entitlement behavior, billing/auth behavior, YKI exam semantics, Roleplay ownership, or production runtime state.

The intended product effect is restrained:
- meaningful state transitions may animate;
- successful completion may receive semantic haptic confirmation;
- reduced-motion users receive static transitions;
- routine taps/navigation do not produce haptics;
- no looping/decorative motion appears behind Reading, Writing, or microphone recording.

No new native dependency is required.

## Sources reviewed

### React Native accessibility
URL: https://reactnative.dev/docs/accessibilityinfo  
Accessed: 2026-09-27

Finding:
React Native exposes reduced-motion accessibility state/events and accessibility announcements/focus primitives. Motion-sensitive UI should respect the user's system setting.

Decision influenced:
Use the existing reduced-motion-aware shared wrapper rather than adding bespoke animation state in each learning screen.

### React Native Reanimated — useReducedMotion
URL: https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/  
Accessed: 2026-09-27

Finding:
`useReducedMotion` exposes the device reduced-motion preference synchronously.

Decision influenced:
Retain the existing `ReducedMotionAwareMotion` primitive, which already consumes `useReducedMotion`, instead of introducing another motion-policy hook.

### React Native Reanimated — accessibility / reduced motion
URL: https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/  
Accessed: 2026-09-27

Finding:
Reanimated supports reduced-motion configuration on entering, exiting and layout animations; system reduction can make transitions reach their endpoint immediately or omit exit motion.

Decision influenced:
Use short semantic transitions only for task/feedback/next-state changes and keep all such transitions routed through the shared primitive.

Rejected alternative:
No screen-specific animation loops, springs, pulsing microphone effects, or continuous decorative motion.

### Expo Haptics
URL: https://docs.expo.dev/versions/latest/sdk/haptics/  
Accessed: 2026-09-27

Finding:
Haptic support is platform/device dependent and may be unavailable or ignored in legitimate conditions. Haptic calls are asynchronous and should not be treated as application-state authority.

Decision influenced:
Use the existing best-effort `performLearningHaptic` helper only after learning state has successfully changed. Never block progression or change correctness based on haptic success/failure.

Rejected alternative:
No haptic on every tap, navigation button, recorder press, answer selection, or repeated model-audio action.

## Existing architecture audited

Accepted shared primitives already present:
- `packages/ui/learningExperience/motion.tsx`
- `packages/ui/learningExperience/haptics.ts`
- `packages/ui/learningExperience/focus.tsx`
- `packages/ui/learningExperience/progress.tsx`
- `packages/ui/learningExperience/semanticState.tsx`

The motion primitive:
- checks reduced motion;
- can suppress enter/exit/layout motion;
- has semantic kinds such as `next-task`, `feedback-reveal`, `success`, and `milestone`.

The haptic primitive:
- exposes semantic events;
- catches platform failure;
- returns a boolean but does not own learning state.

Guided Speaking currently:
- persists deterministic stage completion before navigation;
- permits passed-stage replay without rolling back the frontier;
- locks future stages;
- uses audio success after a transcript;
- does not yet use shared reduced-motion transition/haptic primitives.

Because transcript success already has an audio cue, Phase 8 should reserve haptics for successful stage completion or meaningful milestones, not transcript recognition.

## Acceptance criteria

1. Guided Speaking stage/step presentation uses the shared reduced-motion-aware transition primitive for meaningful state changes only.
2. Successful persisted Guided Speaking stage completion triggers best-effort semantic completion feedback only after persistence succeeds.
3. Level-boundary completion may use the existing milestone semantic event; ordinary stages use completion.
4. Review/replay completion must not mutate or imply a new frontier milestone.
5. Haptic failure must never block progression, navigation, persistence, audio, or Roleplay handoff.
6. No haptic is added to routine Back, History, Listen, recorder start/stop, recall-open, or ordinary navigation presses.
7. No looping/decorative animation is introduced.
8. Existing 300-stage deterministic curriculum, future-stage lock, History replay, Stage-300 Roleplay handoff, recorder fallback, and persistence authority remain unchanged.
9. Permanent source verifier covers reduced-motion primitive use, semantic haptic placement, and absence of prohibited routine haptic calls.
10. Existing navigation, Guided Speaking, Cards, Roleplay, YKI, Reading/Writing and governance checks must remain green before handoff.

## Follow-on scope after Guided Speaking

After the Guided Speaking integration proves clean:
- Cards: feedback reveal/session completion only.
- Reading: task completion/next-task only.
- Writing: feedback/compare/next-task only.
- Professional mission landing: only if a shared primitive improves orientation without implying false completion.

Each follow-on integration must preserve the same semantic constraints and must not broaden into a visual redesign.
