# Progressive drawer copy-density follow-up — 2026-09-28

Base: current `main`
Branch: `fix/progressive-drawer-copy-density-20260928`

## Trigger

The Build 47 exported-app visual UAT passed functionally, but the drawer screenshot showed a remaining cognitive-load issue: when a branch is expanded, many nested rows repeat long helper copy beneath every label. The hierarchy works, but the repetition makes the drawer feel denser than the product requirement “step-by-step and easy to follow.”

## Existing authority

- `packages/ui/components/UtilityDrawer.tsx` owns drawer presentation.
- `apps/client/config/navigation/AppShell_sidebar_sections.ts` owns labels, hints and routes.
- `apps/client/state/AppShell.tsx` owns guarded navigation/entitlements.
- Existing progressive-disclosure behavior and accessibility semantics are already qualified.

## Decision

Keep every existing label, route, hint value, entitlement guard and expansion rule, but change **visual presentation only**:

- top-level drawer rows may show their short helper hint;
- nested rows show their label/icon only;
- nested hint text is still retained as `accessibilityHint` on the Pressable, so screen readers keep the explanatory context;
- no navigation configuration text is deleted;
- no branch/leaf structure is changed.

This preserves “goal → skill → activity” while preventing the expanded hierarchy from becoming a paragraph-heavy feature catalogue.

## Acceptance criteria

1. Top-level route/pathway rows can still show helper copy.
2. Nested rows do not render visible helper paragraphs.
3. Nested rows still expose their configured hint through `accessibilityHint`.
4. Touch targets, branch chevrons, current-location state and one-sibling-open behavior are unchanged.
5. No route, entitlement, deep-link, localization or business logic changes.
6. Navigation invariant verifier permanently guards the presentation rule.

`RESEARCH_GATE=PASS`
`PRODUCTION_ACTIONS=NONE`
