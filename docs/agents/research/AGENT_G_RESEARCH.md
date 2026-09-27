# Agent G Research — Learning Experience, Motion, Haptics and Accessibility

Access date: 2026-08-16

Branch: `agent/g-experience-motion-20260816`

Immutable Wave-1 base: `69813b433838130d5afe4b052360dbfd12df3f40`

## Questions investigated

1. How should React Native Reanimated 4.x respect system reduced-motion preferences, including entering/exiting and layout transitions?
2. Which motion forms are appropriate for task entry, completion, next-task movement and feedback without creating vestibular or focus problems?
3. What accessibility semantics should reusable React Native learning primitives expose?
4. What minimum target sizing and typography behavior should the learning primitives preserve on mobile and web?
5. How should Expo Haptics be used sparsely and safely across iOS, Android and web, including unsupported/no-op cases?
6. What conventions should KieliValmis use for accessible images/SVG illustrations?
7. What visual tokens and components already exist in the repository, and where should Agent G extend rather than replace them?
8. How can progress/reward treatment support learning without turning routine taps into manipulative reward events?
9. How should Reading/Writing/YKI/recording focus presentation differ from ordinary learning surfaces?

## Existing repository evidence and constraints

- The assigned branch resolved exactly to the immutable Wave-1 base before research began: `69813b433838130d5afe4b052360dbfd12df3f40`.
- `apps/client/package.json` already includes the required stack: React Native 0.83.6, React 19.2, Reanimated 4.2.1, Expo Haptics, Expo Image and React Native SVG. Therefore no dependency or native configuration change is justified.
- `packages/ui/theme/floentlyPalette.ts` is explicitly documented as the canonical application color system. It provides light/dark surfaces, text, primary/accent, borders and semantic success/danger/warning tokens. Agent G should consume this palette rather than create a competing color theme.
- `apps/client/constants/theme.ts` is a small Expo-template-style theme, but current feature screens already use `getFloentlyPalette`; it should not become the basis of a second learning palette.
- Existing learning screens such as `WorkplaceIncidentLabScreen.tsx` use `FeatureScaffold`, `Card`, `ActionBar`, `EmptyState` and `getFloentlyPalette`, with repeated local radius/spacing/button values. This shows a need for learning-specific reusable experience primitives, but not a broad rewrite of current screens during this branch.
- `apps/client/components/haptic-tab.tsx` performs a light iOS haptic on each tab press. Agent G will not modify protected/shared navigation behavior here. The new learning haptic helper will instead encode the Wave-1 rule: semantic completion/state-change haptics only, not every tap.
- `packages/core/schemas/learning.ts` defines frozen `LearningPathway`, `LearningSkill`, `TaskDescriptor` and `PracticeSessionManifest` types. Agent G may consume those types but must not modify the shared contract or put composer/business logic in visual components.
- The Wave-1 safety verifier forbids dependency manifests, native config, protected navigation, Cards, Roleplay, YKI exam internals, workflows and production paths. New work must remain in Agent-G-owned UI/module paths plus tests/documentation.
- There is no existing reusable learning experience-system directory in `packages/ui`; this permits an additive module instead of a replacement.

## Authoritative technical sources

### React Native Reanimated accessibility / reduced motion
Source: https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/

Finding: Reanimated supports `ReduceMotion.System` on animation/layout builders. With reduced motion enabled, entering/keyframe/layout animations reach endpoints immediately; exiting/shared transitions are omitted. `useReducedMotion()` provides a synchronous boolean representing the setting at app start.

Decision: every Agent-G motion primitive will default to system reduced motion. Non-essential travel/scale motion will be suppressed when reduced motion is on, while essential state changes remain visible immediately. No global `ReducedMotionConfig` override will be introduced because it would alter unrelated application behavior.

### React Native Reanimated `useReducedMotion`
Source: https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/

Finding: `useReducedMotion()` is available on Android, iOS and web and is intended for conditionally disabling or replacing motion. The hook does not rerender if the OS preference changes while the app is already running.

Decision: the reusable wrapper will expose an explicit test override in addition to the system hook. Production defaults remain system-driven; tests can deterministically prove reduced-motion behavior without mutating global application state.

### React Native Reanimated layout transitions
Source: https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-transitions/

Finding: predefined layout transitions support duration and `reduceMotion`. Linear transitions animate position/dimensions; fading transitions animate opacity; platform compatibility is Android/iOS/web.

Decision: task/progress layout changes will prefer short linear/fade behavior in the documented ~160–320 ms range. Large curved/jumping/parallax transitions are rejected because they add motion without learning value and raise vestibular/cognitive-load cost.

### React Native accessibility
Source: https://reactnative.dev/docs/accessibility

Finding: interactive/accessibility elements should expose meaningful `accessibilityLabel` and `accessibilityRole`; roles communicate purpose to VoiceOver/TalkBack.

Decision: interactive learning chips/nodes will declare roles, labels, selected/disabled state where applicable. Pure decoration will not become a screen-reader stop.

### React Native Pressable 0.83
Source: https://reactnative.dev/docs/0.83/pressable

Finding: `Pressable` provides `hitSlop`/HitRect because fingers are imprecise, and touch regions can be expanded without making visual elements oversized.

Decision: tappable learning primitives will use a minimum 44-point visual/control height where practical and may use `hitSlop` for compact icon-like controls. Long labels must wrap instead of shrinking into inaccessible targets.

### React Native Text
Source: https://reactnative.dev/docs/text

Finding: `allowFontScaling` defaults to true and text can participate in platform Dynamic Type behavior. Truncation is opt-in.

Decision: learning identity/progress text will not disable font scaling. Components will avoid fixed-height text containers and unnecessary `numberOfLines` so Finnish long words/labels and larger system text can wrap.

### Expo Haptics SDK 55
Source: https://docs.expo.dev/versions/v55.0.0/sdk/haptics/

Finding: Expo Haptics targets Android vibration, iOS Taptic Engine and Web Vibration API. Haptics can legitimately do nothing on iOS under several conditions (including disabled Taptic Engine, Low Power Mode, camera/dictation states) and web support is browser/permission dependent.

Decision: haptics must be fire-and-forget enhancement only. The helper will catch/reject safely and support explicit disabling. No learning state may depend on the haptic promise. Events will be restricted to meaningful completion, successful submit/retry, milestone/important state and error/attention feedback.

### Expo Image SDK 55
Source: https://docs.expo.dev/versions/v55.0.0/sdk/image/

Finding: Expo Image is cross-platform and exposes `accessibilityLabel`/`alt`; `accessible` defaults false on native. It also supports efficient content fitting/caching.

Decision: the illustration container will require authors to choose semantic vs decorative intent. Semantic images require an accessibility label; decorative images remain hidden from the accessibility tree. The container will avoid forced autoplay/animated imagery in focus contexts.

### React Native SVG maintainer repository
Source: https://github.com/software-mansion/react-native-svg

Finding: React Native SVG is the installed cross-platform SVG implementation for native and web.

Decision: skill/pathway marks will use lightweight SVG geometry rather than image assets or a new native animation SDK. Accessibility semantics will be applied at the React Native wrapper level so the mark has one predictable screen-reader representation.

### WCAG 2.2 — animation from interactions
Source: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions

Finding: interaction-triggered non-essential motion should be disableable; unnecessary animation should be avoided and OS/user-agent reduced-motion preferences should be used. Motion can cause severe vestibular symptoms.

Decision: no decorative looping motion in Reading, Writing, formal YKI or microphone recording. Focus presentation is structurally calm. Reduced motion eliminates non-essential movement rather than merely shortening it.

### WCAG 2.2 — target size minimum
Source: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html

Finding: WCAG 2.2 AA sets a 24x24 CSS-pixel minimum target or sufficient spacing, with exceptions.

Decision: KieliValmis will adopt a stronger mobile default of 44 points for reusable touchable learning controls where layout permits, comfortably exceeding the web minimum and aligning with existing repository button sizing. Compact marks are presentation-only unless given an expanded HitRect.

### WCAG 2.2 — focus appearance
Source: https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html

Finding: visible keyboard focus needs sufficient area and contrast; a 2 CSS-pixel perimeter is a straightforward reference treatment.

Decision: pressable chips/path nodes will have a distinct focused/selected visual state and must not rely only on subtle color shifts. Web focus behavior will remain compatible with platform focus rather than being visually suppressed.

## Learning/product evidence

### Cognitive load in mobile learning
Source: Nguyen, N. N. & Chen, H.-L. (2026), “Toward Deeper Learning: A Systematic Review of Cognitive Load Management in Mobile Learning,” Journal of Educational Computing Research. https://doi.org/10.1177/07356331261445821

Finding: the systematic review covers 53 studies (2016–2025) and identifies scaffolding, practical scenarios and learner autonomy among recurring cognitive-load management strategies. The central design implication is that interface complexity should create room for processing the learning task rather than compete with it.

Decision: learning focus surfaces will remove decorative motion and secondary visual competition. A1 may receive more contextual scaffolding; higher levels get progressively quieter, more authentic document/message treatment. Experience primitives will be concise and composable rather than creating an always-on gamified shell.

### Gamification and learning outcomes
Source: Sailer, M. & Homner, L. (2020), “The Gamification of Learning: a Meta-analysis,” Educational Psychology Review 32, 77–112. https://doi.org/10.1007/s10648-019-09498-w

Finding: gamification shows small positive average effects across cognitive, motivational and behavioral outcomes, but the effect is not a justification for indiscriminate points/celebration mechanics.

Decision: reward visuals/haptics will acknowledge genuine learning events (successful retry, completion, meaningful milestone) rather than routine taps. No streak pressure, randomized reward, confetti loop or escalating extrinsic reward system will be introduced.

### Intrinsic motivation and gamification
Source: recent meta-analysis/systematic review, Educational Technology Research and Development (2024), “Gamification enhances student intrinsic motivation, perceptions of autonomy and relatedness, but minimal impact on competency.” https://doi.org/10.1007/s11423-023-10337-7

Finding: across 35 interventions, gamification had a small positive overall intrinsic-motivation effect, with stronger effects on autonomy/relatedness than perceived competence.

Decision: Agent G will favor clear progress, learner control and meaningful feedback over flashy competency signals. Progress components will communicate actual task state only; they will not invent mastery/confidence.

## Decisions and acceptance criteria caused by the research

1. **Additive module, no theme replacement.** New learning experience tokens derive from `FloentlyPalette`; no competing application palette.
2. **No dependency/native config changes.** Use Reanimated 4.2.1, SVG, Expo Image and Expo Haptics already installed.
3. **Reduced motion by default.** Reanimated motion uses system reduced-motion semantics; deterministic test override supported.
4. **Motion budget encoded.** Typical transitions 160–320 ms; success 300–600 ms; milestone 450–1200 ms. No loop primitive is exposed for focus contexts.
5. **Calm focus primitive.** Reading/Writing/YKI/recording focus modes expose a static presentation contract and cannot opt into ambient looping motion.
6. **Sparse haptics.** Semantic events only; helper safely no-ops when disabled/unsupported or when the platform promise rejects.
7. **Accessible identity.** Pathway/skill components provide accessible labels and never communicate identity by color alone; SVG marks are paired with text/labels.
8. **Responsive progress.** Path nodes wrap labels, avoid fixed text heights and remain usable on small widths and with font scaling.
9. **Accessible illustration contract.** Semantic illustrations require a label; decorative illustrations are excluded from screen-reader focus.
10. **Presentation-only.** Components consume simple state/descriptors; no session composer, scoring, auth, entitlement or runtime business logic is introduced.
11. **Semantic feedback.** Success/error/attention are represented through text/icon/border plus optional restrained motion; color is not the only signal.
12. **Determinism.** Token/state helper functions are pure where possible and source-contract tests permanently guard focus/motion/haptic/dependency rules.

## Alternatives rejected

- **Rive or another animation SDK:** rejected because Wave 1 explicitly forbids new native animation dependencies without approval and the installed stack is sufficient.
- **Global Reanimated reduced-motion override:** rejected because it would change unrelated application behavior and could violate feature ownership.
- **Continuous ambient animation:** rejected because it competes with learning, violates focus rules and creates avoidable vestibular/cognitive load.
- **Haptic on every press/navigation action:** rejected because haptics should be semantic and platform availability is not guaranteed.
- **A second color/theme system:** rejected because `floentlyPalette.ts` is already canonical.
- **Animated images for pathway/skill identity:** rejected because lightweight SVG/static marks are cheaper, clearer and easier to keep calm/accessibility-safe.
- **Progress/mastery celebration inferred from screen visits:** rejected because the frozen contract and Wave-1 truth rules prohibit fabricated learner evidence.
- **Broad restyling of current screens:** rejected because Agent G owns primitives, integration occurs later, and broad edits would create conflicts with Agents C–F.

## Uncertainties and how they will be contained/tested

1. **Reanimated 4.2.1 vs latest 4.x docs:** APIs used will be limited to long-standing `useReducedMotion`, `ReduceMotion`, standard entering/layout animation builders and `Animated.View`. TypeScript/CI will catch version-shape mismatches; no newer-only API will be used knowingly.
2. **Web haptic availability:** the helper will treat haptics as optional, catch failures and offer an explicit disabled mode. A regression test will assert safe no-op behavior using an injected driver.
3. **Exact small-screen wrapping across devices:** components will use flex/wrap/minWidth rather than measured magic numbers. Tests/source contracts will guard absence of fixed label widths, and handoff will include manual narrow-screen + large-text checks for Agent A/user acceptance.
4. **Dynamic OS reduced-motion changes after app start:** Reanimated documents that `useReducedMotion` does not itself trigger rerender on setting changes. This branch will not add global accessibility listeners; Agent A can later choose a cross-app policy if live toggling is required. Components still respect the preference on mount.
5. **SVG screen-reader behavior differences by platform:** the accessible identity is carried by the containing React Native element/text, not individual SVG paths. Manual VoiceOver/TalkBack checks remain part of integration/user acceptance.
6. **No local repository checkout is available in this execution environment:** implementation will rely on repository reads and GitHub Actions for branch-level verification. The branch safety workflow and CI results must be green at the exact final SHA before handoff; any unavailable feature-level command will be reported explicitly rather than claimed as locally executed.

## Research gate

The repository architecture, installed stack, accessibility requirements and motion/haptic design are sufficiently understood to implement an additive, low-coupling learning experience system without shared-contract changes, native dependencies, production actions or protected capability edits.

RESEARCH_GATE=PASS
