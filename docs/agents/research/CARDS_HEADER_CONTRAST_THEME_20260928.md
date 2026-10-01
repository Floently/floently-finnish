# Cards header contrast and theme hydration follow-up — 2026-09-28

Status: implementation research for a narrow post-UAT repair.
Base: current `main`
Branch: `fix/cards-header-contrast-theme-hydration-20260928`

## Trigger

Exact exported-app screenshot `09-cards-level-gate.png` from the passing Build 47 visual artifact showed that the Cards **Back** control is visually washed out in light mode while the adjacent Menu control remains clear.

Repository inspection found two contributing implementation facts:

1. `CardPracticeScreen` renders the top navigation before `CardPracticeSession`.
2. `CardPracticeSession` renders large absolute decorative glows after that header; later siblings can paint over earlier siblings unless z-order is made explicit.
3. The Back control itself uses an almost-white translucent surface and white border, so a white decorative overlay further reduces its contrast.
4. `CardPracticeScreen` reads `usePreferencesStore.themeMode` directly but does not hydrate preferences, so direct `/cards` entry can remain on the default light theme even when the learner has a persisted dark preference.

## Current platform guidance

React Native documents that components normally render according to document-tree order and that later components draw over earlier ones; `zIndex` is the supported control for explicit overlap ordering. Android `elevation` also affects z-order. React Native also supports normal color styling for explicit foreground/background contrast.

References:
- https://reactnative.dev/docs/layout-props#zindex
- https://reactnative.dev/docs/view-style-props#elevation
- https://reactnative.dev/docs/colors

## Decision

Use the smallest existing-architecture repair:

- hydrate the canonical preferences store on Cards screen entry;
- keep the existing app theme authority—do not add system-theme logic;
- give the navigation bar an explicit positioned z-layer and Android elevation so decorative session graphics remain behind it;
- use a clearly readable light-mode Back surface, border and blue text;
- preserve the current dark-mode palette override;
- do not change Cards selection, session, API, audio, answer, entitlement or navigation behavior;
- extend the existing `verify:card-level-gate` verifier with source-contract assertions for preference hydration and protected header layering;
- wire `verify:card-level-gate` into normal client CI so this fix remains enforced.

## Acceptance criteria

1. Direct Cards entry hydrates persisted theme preference.
2. Light-mode Back control is visibly readable above decorative background graphics.
3. Dark-mode Back control continues to use canonical palette values.
4. Top navigation is explicitly above later decorative/session content on web, iOS and Android semantics.
5. Cards mode tabs, level gate, level memory, session start, audio and answer behavior remain unchanged.
6. Existing card-level invariants still pass.
7. Normal client CI executes the card-level verifier.
8. No backend, schema, billing, auth, native dependency or production action.

`RESEARCH_GATE=PASS`
`PRODUCTION_ACTIONS=NONE`
