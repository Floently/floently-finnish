# Agent A Research — Progressive Disclosure Drawer

Date: 2026-09-27  
Branch: `feature/build47-progressive-ux-20260926`  
Scope: drawer/navigation presentation only; no production action.

## Research gate

`RESEARCH_GATE=PASS`

## Repository findings

1. `packages/ui/components/UtilityDrawer.tsx` is the mounted drawer presentation authority.
2. `apps/client/config/navigation/AppShell_sidebar_sections.ts` is the drawer destination/configuration authority.
3. `apps/client/state/AppShell.tsx` remains the guarded navigation authority. Drawer leaves must call the existing `navigateTo(...)` path rather than duplicating entitlement logic.
4. Existing direct Reading and Writing routes have their own access resolution, while Cards does not currently provide an equivalent route-level auth/entitlement boundary. Therefore drawer Cards shortcuts must pass through the existing guarded Learn/Professional AppShell decision before opening the Cards route.
5. Existing YKI Practice and YKI Exam are already separate guarded destinations and can remain leaf destinations.
6. Existing preview behavior is intentionally narrow and should not be expanded by this change.
7. No new native dependency, backend schema, migration, billing change, auth change, or production configuration is required.

## External accessibility research

### React Native accessibility state
Source: https://reactnative.dev/docs/next/view  
Accessed: 2026-09-27

Finding: React Native exposes `accessibilityState.expanded` for expandable controls.

Decision influenced: every drawer branch control will remain a `Pressable` button and publish its expanded/collapsed state through `accessibilityState={{ expanded }}`.

### WAI-ARIA Authoring Practices — Accordion Pattern
Source: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/  
Accessed: 2026-09-27

Finding: accordion/disclosure headers toggle visibility rather than navigating; when only one sibling may be open, opening one collapses the previous sibling. Expanded state must be exposed to assistive technology.

Decision influenced:
- branch presses expand/collapse only;
- leaf presses navigate;
- one branch is open per hierarchy depth;
- collapsed descendants are removed from the rendered interaction order.

### WAI-ARIA Authoring Practices — Disclosure Pattern
Source: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/  
Accessed: 2026-09-27

Finding: disclosure controls should expose button semantics and expanded state, and their hidden content should not remain interactively exposed.

Decision influenced: nested children are rendered only while their parent is expanded.

## Rejected alternatives

1. **Replace AppShell navigation with a new drawer router** — rejected because it would duplicate entitlement/auth business logic and increase regression risk.
2. **Direct-link Cards from the drawer without an AppShell guard** — rejected because the current Cards route is not itself an entitlement authority.
3. **Add a new drawer/navigation dependency** — rejected; current React Native primitives are sufficient.
4. **Publish the change through production OTA while Build 47 is under review** — rejected by release boundary.

## Acceptance criteria

1. Top-level learner pathways are progressively disclosed instead of displaying all destinations at once.
2. Pressing a branch expands/collapses it without navigating.
3. Opening a sibling branch collapses the previous sibling at the same depth.
4. Leaf selection closes the drawer once and uses the existing guarded navigation callback.
5. Everyday Cards/Reading/Writing shortcuts pass the existing Learn entitlement guard before direct routing.
6. Professional shortcuts pass the existing Professional entitlement guard before direct routing.
7. YKI Practice/Exam retain their existing guard behavior.
8. Preview users retain the existing restricted drawer.
9. Current guarded screen opens the appropriate top-level branch when the drawer is opened where the mapping is unambiguous.
10. Expandable controls expose `accessibilityRole="button"` and `accessibilityState.expanded`.
11. No backend, billing, auth, native configuration, production state, or release branch is changed.
12. Existing navigation invariant verification is extended rather than weakened.

## Implementation boundary

This tranche changes only:
- drawer presentation/types;
- drawer hierarchy configuration;
- minimal guarded AppShell leaf-routing glue;
- permanent navigation verifier assertions;
- this research record.

`PRODUCTION_ACTIONS=NONE`


## Completeness audit addendum

After the first green tranche, the mounted client was re-audited against issue #46's requirement that the drawer expose all currently supported learner destinations without flattening the full tree.

Additional existing destinations confirmed and incorporated:
- Integrated Practice / daily-practice;
- Help and support;
- Everyday recorded speaking;
- Professional recorded speaking;
- Professional structured interview;
- Workplace Incident Lab.

Information-architecture decision:
- Everyday and Professional Speaking are parent branches, not direct navigation leaves. This preserves a stable place for the later Guided Speaking tranche without another drawer redesign.
- Existing Roleplay / Interview / Recorded Speaking remain children of Speaking.
- Workplace Incident Lab remains a Professional child destination.
- Practice + Progress share one localized section to avoid duplicate section identities.
- The drawer component is the single close authority for leaf selection; AppShell no longer repeats the close state update.

No later Guided Speaking implementation, card-level gating, Practice-composer redesign, or roleplay-engine behavior was introduced by this addendum.
