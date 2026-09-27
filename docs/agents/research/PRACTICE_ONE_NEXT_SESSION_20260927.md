# Practice Hub one-next-session UX research — 2026-09-27

Branch: `feature/build47-practice-one-next-session-20260927`
Base: qualified Cards Phase 3 head `8b6b3d7b95d0e4d2a327aac660809993ff724627`
Scope: simplify the already-integrated Practice Hub setup without changing composer truth, runtimes, entitlements, evidence semantics, or production state.

## Research gate

`RESEARCH_GATE=PASS`

## Existing KieliValmis evidence

The existing Agent E research remains the architectural authority for Practice:
`docs/agents/research/AGENT_E_RESEARCH.md`.

It already establishes:
- deterministic composition instead of random task selection;
- 5/10/20 minutes are product budgets, not scientifically optimal prescriptions;
- hard compatibility/entitlement/profession/modality filters precede ranking;
- curriculum-only recommendations must not invent weakness, overdue state or mastery;
- canonical Cards/Roleplay/Reading/Writing/YKI runtimes own task execution;
- one-task-at-a-time active sessions reduce choice burden.

Current source audit on 2026-09-27 found that the composer, integrated registry, explainable reasons, 5/10/20 budgets and one-task-at-a-time active shell are already implemented and regression-tested. The remaining product-value gap is the **setup screen**: it presents duration choices, pathway-scope choices, badges, a preview and the start action simultaneously before the learner can begin.

Issue #46 ranks the next learner-value goal as:
**“Practice Hub / one obvious next session — turns the product from a feature catalogue into a guided routine once speaking/cards/navigation inputs are reliable.”**

## Current external UX/accessibility evidence

### Nielsen Norman Group — Progressive Disclosure
https://www.nngroup.com/videos/progressive-disclosure/
Accessed: 2026-09-27.

Finding:
Progressive disclosure reduces interface complexity by keeping secondary/advanced options behind an additional interaction so attention stays on primary options.

Decision:
The normal Practice entry should show one ready-to-start 10-minute session as the primary action. 5/10/20-minute and pathway-scope controls remain available under one deliberate **Customize** action rather than being removed.

### W3C — Help Users Focus
https://www.w3.org/WAI/WCAG2/supplemental/objectives/o5-user-focus/
Accessed: 2026-09-27.

Finding:
Supplemental cognitive-accessibility guidance recommends removing unnecessary distractions and providing clear orientation so users can maintain task focus.

Decision:
The setup screen should answer only:
1. what the next session is;
2. roughly how long it will take;
3. the one action that starts it.
The existing task preview and customization details should be secondary layers.

### W3C — WCAG 2.2 / Predictable interaction
https://www.w3.org/TR/WCAG22/
Accessed: 2026-09-27.

Finding:
WCAG 2.2 includes predictable interaction principles: changing a control should not unexpectedly cause a context change, and user interface states should remain programmatically understandable.

Decision:
Changing 5/10/20 minutes or pathway scope in Customize mode recomposes only the visible plan. It never auto-starts or navigates. Starting remains an explicit button press.

### W3C — Status messages / focus order
https://www.w3.org/WAI/WCAG21/Understanding/status-messages
https://www.w3.org/WAI/WCAG22/Techniques/general/G59
Accessed: 2026-09-27.

Finding:
Important dynamic changes should be available to assistive technology without disruptive focus moves, and interaction order should match the content sequence.

Decision:
The simplification will preserve the existing semantic Practice components and one-task-at-a-time active path. Customize is placed after the primary recommended-session card, and the active session progress path remains unchanged.

## Repository findings

1. `FeatureEntryRoute` already mounts `IntegratedPracticeRoute` for `daily-practice`; no AppShell/navigation rewrite is required.
2. `IntegratedPracticeRoute` defaults to `scope='all'` and `targetMinutes=10`.
3. Those defaults already correspond to the intended Practice Hub preset in `pathwayAdapters.ts`.
4. `composePracticeSession` is deterministic and already yields a valid session preview from those defaults.
5. The current setup UI makes the learner choose/inspect duration, scope and preview before the start button, even though a safe default session already exists.
6. The active-session UI is already one-task-at-a-time and should not be redesigned in this tranche.
7. Durable learner evidence is still intentionally absent from this route; therefore “recommended” may only mean the deterministic curriculum-safe default, not “best for you,” “weak area,” “due,” or similar personalization.
8. The existing `Why these tasks?` output is composer-derived and truthful; it should remain available behind secondary disclosure.
9. The existing 5/10/20 and scope controls must remain reachable because they are part of the Practice contract.
10. No backend, schema, native dependency, billing/auth or production change is required.

## Product contract

Default setup:
- one clear **10-minute practice** card;
- concise statement of what the deterministic composer currently includes;
- one primary Start action;
- one secondary Customize action;
- no claim that 10 minutes is scientifically optimal or personalized.

Customize:
- reveal existing 5 / 10 / 20-minute controls;
- reveal existing All / Everyday / Professional / YKI scope controls;
- show plan preview / “Why these tasks?”;
- changing a choice updates the plan but never starts automatically;
- allow closing Customize and returning to the simple default view without resetting chosen values.

Active session:
- unchanged one-task-at-a-time execution;
- existing Skip / another / shorter / microphone controls preserved;
- canonical task runtimes and guards remain authoritative.

## Acceptance criteria

1. Fresh Practice opens with one dominant Start action for the existing 10-minute All-pathways default.
2. Duration and scope controls are not simultaneously visible by default.
3. One Customize action reveals all existing 5/10/20 and scope choices.
4. The current deterministic preview still controls whether Start is enabled.
5. No personalized need/weakness/overdue/mastery claim is added.
6. Customize changes do not navigate or auto-start.
7. Active and summary phases remain behaviorally unchanged.
8. Existing composer tests remain green.
9. Permanent verifier guards the default-simple/customize-layer contract.
10. No production/OTA/App Store/native/auth/billing action.

## Rejected alternatives

- Auto-start on entering Practice: rejected because it removes user control and can trigger an unexpected context change.
- Removing 5/10/20 or pathway scope choices: rejected; progressive disclosure should preserve advanced controls, not delete them.
- Calling the default “AI recommended” or “best for you”: rejected because the route currently has no durable learner evidence.
- Rewriting the composer: rejected; the composer is already deterministic, explainable and heavily tested.
- Adding another Practice engine: rejected; Practice remains an orchestrator of canonical runtimes.

`PRODUCTION_ACTIONS=NONE`
