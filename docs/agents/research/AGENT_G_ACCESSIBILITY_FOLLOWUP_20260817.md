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

- `packages/ui/learningExperience/progress.tsx` currently styles a pressable node for `pressed` and `current` state, but has no `onFocus`/`onBlur` state and therefore no Agent-G-authored visible keyboard-focus indicator.
- `packages/ui/learningExperience/semanticState.tsx` currently gives errors `accessibilityRole="alert"`, but success/attention/info feedback uses static `accessibilityRole="text"` only. Because feedback can be revealed after submission, this does not explicitly request a non-focus-changing announcement.
- The installed stack already contains React Native / React Native Web. No native package or accessibility SDK is required.
- The existing Agent-G verifier already guards touch targets, accessibility roles, focus-surface motion prohibitions and business-logic boundaries, so it is the correct place for permanent source-contract assertions for these two fixes.

## Sources and findings

Access date: 2026-08-17.

### React Native accessibility

Source: https://reactnative.dev/docs/accessibility

Finding: React Native documents `accessibilityLiveRegion` for dynamically changing content. `polite` requests announcement when the view changes without interrupting ongoing speech; `assertive` interrupts. The documented `alert` role remains appropriate for important/error content.

Decision caused: keep errors assertive through `accessibilityRole="alert"`; give non-error semantic feedback `accessibilityLiveRegion="polite"` so success/attention/info updates can be announced without programmatic focus movement. Do not make routine static empty-state copy a live region.

### WCAG 2.2 — 4.1.3 Status Messages

Source: https://www.w3.org/TR/WCAG22/#status-messages

Finding: status messages must be programmatically determinable so assistive technologies can present them without receiving focus.

Decision caused: do not call `.focus()` or otherwise move focus into feedback after submit. Live-region semantics are the narrow correction.

### W3C ARIA22 — role=status

Source: https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22

Finding: `role=status` carries polite-live semantics on the web and is intended for non-error application/status updates.

Decision caused: React Native core does not document `status` as an `accessibilityRole` value in the installed API surface, so Agent G will not invent/cast an unsupported native role. `accessibilityLiveRegion="polite"` is the documented React Native primitive, while errors keep `alert`. React Native Web can map the accessibility live-region property to its web accessibility layer.

### WCAG 2.2 — focus appearance

Source: https://www.w3.org/TR/WCAG22/#focus-appearance

Finding: a strong reference focus treatment is a visible indicator with area equivalent to a 2 CSS-pixel perimeter and sufficient contrast with the unfocused state.

Decision caused: interactive practice-path nodes will track keyboard focus explicitly and render a 2-point `palette.primary` border while focused. The focus state will be independent of `current`/selected state, so a pending or completed node remains visibly focusable. No action is triggered on focus.

### React Native Pressable

Source: https://reactnative.dev/docs/pressable

Finding: `Pressable` is the existing interaction primitive and supports focus/blur event handling through React Native view props; it already owns the required 44-point target contract in Agent G.

Decision caused: encapsulate each interactive step into a small local component using `useState(false)`, `onFocus` and `onBlur`; do not add global keyboard listeners or browser-only DOM code.

## Alternatives rejected

- **Rely only on browser/native default focus rings:** rejected because Agent A specifically found the authored focus-appearance contract unverified, and current component styling does not prove a visible indicator across platforms.
- **Programmatically focus feedback after submission:** rejected because WCAG status-message behavior should not steal focus; it would also disrupt keyboard/screen-reader task flow.
- **Use `accessibilityRole="status"` via a TypeScript cast:** rejected because React Native core documentation does not list `status` in its documented `accessibilityRole` API. The documented `accessibilityLiveRegion="polite"` is safer for the installed shared native layer.
- **Make all loading/empty panels live regions:** rejected because static page-state content should not become unsolicited announcements. This correction is for dynamic semantic feedback.
- **Add web-only CSS or a new focus dependency:** rejected because an explicit 2-point border can be expressed with existing React Native style/state and remains shared across iOS/Android/web.

## Uncertainties and tests

1. `accessibilityLiveRegion` is documented by React Native primarily for Android; React Native Web has its own accessibility mapping. The shared component will use the documented RN property and retain visible text in every platform. TypeScript on Agent A's pnpm review harness must accept the prop.
2. Native focus behavior differs from web keyboard focus. The source contract will prove the component handles `onFocus` and `onBlur` and renders a 2-point primary focus border; manual web keyboard QA remains part of user acceptance.
3. A focus border must not replace selected/current semantics. Regression assertions will require both `accessibilityState={{ selected: ... }}` and the independent focused styling.
4. Live feedback must not become assertive unless it is an error. Regression assertions will require polite live-region semantics and preserve the error `alert` role.

## Correction acceptance criteria

- Practice step buttons have explicit `onFocus` / `onBlur` state.
- Focused buttons render a 2-point `palette.primary` border and do not trigger navigation/context change merely from focus.
- Current/selected semantics remain present and separate from focus appearance.
- Dynamic non-error semantic feedback declares `accessibilityLiveRegion="polite"`.
- Error feedback remains `alert` and is not downgraded.
- No programmatic focus movement is introduced.
- No dependency/native/config/protected-path changes.
- Agent-G verifier gains permanent focus/live-region guards.
- TypeScript and Agent-G verifier must pass on the corrected exact SHA before re-review.

RESEARCH_GATE=PASS
PRODUCTION_ACTIONS=NONE
