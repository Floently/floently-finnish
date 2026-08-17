# Agent G Accessibility Review Follow-up — 2026-08-17

Branch: `agent/g-experience-motion-20260816`

Immutable Wave-1 base: `69813b433838130d5afe4b052360dbfd12df3f40`

Director / Agent-A review authority: Issue #16 checkpoint dated 2026-08-17, classifying Agent G PR #20 at `20108b55cb925b5365219d3cc381a2bce57729f1` as `CHANGES_REQUIRED` for two narrow accessibility defects:

1. close/verify the keyboard-focus appearance contract;
2. add live/status semantics for dynamic non-error feedback.

This follow-up is research-first for those corrections only. It does not reopen the broader Agent-G architecture.

## Questions investigated

1. What explicit focus treatment is needed for the only interactive Agent-G visual primitive, `PracticeProgressPath` step buttons?
2. How should dynamically revealed success/attention/info feedback be announced without moving screen-reader focus?
3. Which React Native API works across the installed native/web stack without adding a dependency or changing global accessibility behavior?
4. How can the fixes be regression-tested without importing learning/composer business logic?

## Existing repository evidence

- `packages/ui/learningExperience/progress.tsx` at the reviewed SHA styled a pressable node for `pressed` and `current` state, but had no `onFocus`/`onBlur` state and therefore no Agent-G-authored visible keyboard-focus indicator.
- `packages/ui/learningExperience/semanticState.tsx` at the reviewed SHA gave errors `accessibilityRole="alert"`, but success/attention/info feedback used static `accessibilityRole="text"` only. Because feedback can be revealed after submission, this did not explicitly expose a status/live-update contract.
- The installed stack already contains React Native 0.83.6 / React Native Web 0.21.x. No native package or accessibility SDK is required.
- The existing Agent-G verifier already guards touch targets, accessibility roles, focus-surface motion prohibitions and business-logic boundaries, so it is the correct place for permanent source-contract assertions for these two fixes.

## Sources and findings

Access date: 2026-08-17.

### React Native 0.83.6 accessibility type authority

Source: `facebook/react-native`, tag `v0.83.6`, `packages/react-native/Libraries/Components/View/ViewAccessibility.d.ts`

Finding: React Native 0.83.6 exposes two distinct role APIs. The legacy `AccessibilityRole` union does **not** include `status`, but the newer `Role` union used by the `role` prop **does include `status`**. The same type authority defines `accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'` for Android.

Decision caused: dynamic non-error `SemanticFeedback` will use the supported `role="status"` contract rather than casting an unsupported `accessibilityRole`. Error feedback will use `role="alert"`. The Android live-region property remains as an explicit polite/assertive announcement signal. This directly answers Agent A's request for both status semantics and live behavior.

### React Native accessibility documentation

Source: https://reactnative.dev/docs/accessibility

Finding: React Native documents `accessibilityLiveRegion` for dynamically changing content. `polite` requests announcement when the view changes without interrupting ongoing speech; `assertive` interrupts. The documented alert role remains appropriate for important/error content.

Decision caused: keep errors assertive; give non-error semantic feedback `accessibilityLiveRegion="polite"` so success/attention/info updates can be announced without programmatic focus movement. Do not make routine static empty-state copy a live region.

### React Native 0.83.6 Pressable type authority

Source: `facebook/react-native`, tag `v0.83.6`, `packages/react-native/Libraries/Components/Pressable/Pressable.d.ts`

Finding: `PressableProps` explicitly types both `onFocus` and `onBlur`, in addition to extending view/accessibility props.

Decision caused: focus appearance can be implemented with local component state and the existing Pressable primitive. No browser DOM listener, dependency, or custom native module is justified.

### React Native for Web accessibility

Source: https://necolas.github.io/react-native-web/docs/accessibility/

Finding: React Native for Web exposes familiar ARIA props and explicitly supports the React-Native-specific `accessibility*` props for compatibility. It is designed to map accessibility information to semantic HTML/ARIA.

Decision caused: the shared component can keep the React Native role/live-region contract rather than importing a web-only element or stylesheet. Web keyboard focus remains handled by the Pressable focus callbacks; status semantics are carried by the supported `role` prop.

### WCAG 2.2 — 4.1.3 Status Messages

Source: https://www.w3.org/TR/WCAG22/#status-messages

Finding: status messages must be programmatically determinable so assistive technologies can present them without receiving focus.

Decision caused: do not call `.focus()` or otherwise move focus into feedback after submit. `role="status"` plus polite live semantics are the narrow correction for non-error feedback.

### W3C ARIA22 — role=status

Source: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22

Finding: `role=status` carries polite-live semantics on the web and is intended for non-error application/status updates.

Decision caused: use the React Native 0.83.6 `role` prop, whose actual type authority includes `status`, instead of the older `accessibilityRole` prop.

### WCAG 2.2 — focus appearance

Source: https://www.w3.org/TR/WCAG22/#focus-appearance

Finding: a strong reference focus treatment is a visible indicator with area equivalent to a 2 CSS-pixel perimeter and sufficient contrast with the unfocused state.

Decision caused: interactive practice-path nodes will track keyboard focus explicitly and render a 2-point `palette.primary` border while focused plus a primary-surface background cue. The focus state is independent of `current`/selected state, so a pending or completed node remains visibly focusable. No action is triggered on focus.

## Alternatives rejected

- **Rely only on browser/native default focus rings:** rejected because Agent A specifically found the authored focus-appearance contract unverified, and the reviewed component styling did not prove a visible indicator.
- **Programmatically focus feedback after submission:** rejected because WCAG status-message behavior should not steal focus; it would also disrupt keyboard/screen-reader task flow.
- **Use `accessibilityRole="status"` via a TypeScript cast:** rejected because `AccessibilityRole` does not include `status`. The supported React Native 0.83.6 solution is the separate `role="status"` prop.
- **Use only `accessibilityLiveRegion` without a status role:** rejected after inspecting the exact 0.83.6 type authority because Agent A explicitly requested live/status semantics and React Native provides a supported status role.
- **Make all loading/empty panels live regions:** rejected because static page-state content should not become unsolicited announcements. This correction is for dynamic semantic feedback.
- **Add web-only CSS or a new focus dependency:** rejected because an explicit 2-point border can be expressed with existing React Native style/state and the current role/accessibility props already support the shared stack.

## Uncertainties and tests

1. `accessibilityLiveRegion` is Android-specific in React Native core, while `role="status"` provides the platform-neutral semantic role and React Native Web maps role/accessibility data to HTML/ARIA. Manual VoiceOver/TalkBack/browser QA remains required at integration.
2. Native focus behavior differs from web keyboard focus. The source contract will prove the component handles `onFocus` and `onBlur` and renders a 2-point primary focus border; manual web keyboard QA remains part of user acceptance.
3. A focus border must not replace selected/current semantics. Regression assertions will require both `accessibilityState={{ selected: ... }}` and the independent focused styling.
4. Live feedback must not become assertive unless it is an error. Regression assertions will require `role="status"` + polite live-region semantics for non-errors, and `role="alert"` + assertive behavior for errors.

## Correction acceptance criteria

- Practice step buttons have explicit `onFocus` / `onBlur` state.
- Focused buttons render a 2-point `palette.primary` border plus a second surface cue and do not trigger navigation/context change merely from focus.
- Current/selected semantics remain present and separate from focus appearance.
- Dynamic non-error semantic feedback uses supported `role="status"` and `accessibilityLiveRegion="polite"`.
- Error feedback uses `role="alert"` and assertive live behavior.
- No programmatic focus movement is introduced.
- No dependency/native/config/protected-path changes.
- Agent-G verifier gains permanent focus/status/live-region guards.
- TypeScript and Agent-G verifier must pass on the corrected exact SHA before acceptance.

RESEARCH_GATE=PASS
PRODUCTION_ACTIONS=NONE
