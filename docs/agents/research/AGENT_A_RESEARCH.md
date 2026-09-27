# Agent A Research — Wave 1 Architecture, UX Safety and Parallel-Work Governance

Agent: A
Date: 2026-08-16
Status: COMPLETE

## Research questions

1. What existing KieliValmis production/release constraints must govern parallel work?
2. What shared contract is the minimum needed so feature agents can work independently?
3. How should motion/haptics be constrained so the product is attractive without reducing accessibility or focus?
4. What learning-design principles justify active practice, correction/retry and non-random session composition?
5. How should research and testing be made enforceable rather than aspirational?

## Repository evidence

Reviewed current forward source candidate and mandatory production policy. Important existing facts:

- Wave-1 pre-governance source candidate is `107985d4dcb26d0c8ef010580e78cc9c61fce922`.
- Canonical production reconciliation ref remains separate and must not be moved by feature work.
- `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md` already requires forward ancestry, protected invariant gates, exact artifact/source identity and post-deploy canaries.
- Current client already has React Native Reanimated, React Native SVG, Expo Image and Expo Haptics available, so a new animation SDK is not required for Wave 1.
- Existing `packages/core/schemas/learning.ts` was small and suitable for a narrowly extended cross-feature contract rather than creating a parallel schema system.

## External sources and findings

### 1. W3C WCAG 2.2

Source: https://www.w3.org/TR/WCAG22/
Accessed: 2026-08-16

Finding: accessibility requirements include control of potentially distracting/harmful movement and navigable, understandable interaction structure.

Decision influenced: Wave-1 UI/motion rules require reduced-motion support, forbid decorative looping motion in focus states and treat accessibility as an acceptance criterion rather than post-release polish.

### 2. W3C — Understanding Animation from Interactions

Source: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
Accessed: 2026-08-16

Finding: non-essential motion triggered by interaction should be disableable; unnecessary motion can cause distraction or vestibular symptoms.

Decision influenced: all Agent-G motion primitives must respect system/user reduced-motion preferences; large/parallax-like movement is not the default visual language.

Rejected alternative: mandatory animated transitions everywhere for “premium feel.” Rejected because it competes with focus and creates avoidable accessibility risk.

### 3. React Native Reanimated — Accessibility

Source: https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/
Accessed: 2026-08-16

Finding: Reanimated supports reduced-motion behavior, including system preference handling, and existing animations can be configured accordingly.

Decision influenced: use the already-installed Reanimated stack for Wave-1 motion instead of introducing another native animation dependency.

### 4. React Native Reanimated — Layout transitions

Source: https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-transitions/
Accessed: 2026-08-16

Finding: layout transitions support Android, iOS and web and can be configured for reduced-motion behavior.

Decision influenced: Practice path/task transitions should be implemented as small layout/state transitions rather than a new custom animation runtime.

### 5. Expo SDK 55 — Haptics

Source: https://docs.expo.dev/versions/v55.0.0/sdk/haptics/
Accessed: 2026-08-16

Finding: Expo Haptics supports Android/iOS and platform-dependent web vibration behavior, with platform conditions where haptics may be unavailable/no-op.

Decision influenced: haptics are semantic/sparse and must degrade safely; they cannot be required to understand task state.

Rejected alternative: haptic feedback on every tap. Rejected as noisy and unnecessary.

### 6. Retrieval practice meta-analytic/systematic evidence

Source: Gonçalves, Muniz & Jaeger, *Retrieval Practice Versus Elaborative Encoding: A Systematic and Meta-analytic Review*, Educational Psychology Review (2025), DOI: 10.1007/s10648-025-10076-6
Accessed: 2026-08-16

Finding: retrieval practice has strong evidence as an effective learning activity relative to passive restudy and is appropriate as a design principle for active learning systems.

Decision influenced: Practice/Reading/Writing designs emphasize retrieval/application, feedback and retry instead of making passive explanation the main loop.

Caution: this evidence does not justify arbitrary ranking weights or fabricated personalization. Task selection still needs truthful product evidence and validation.

## Architectural conclusions

### Shared contract

The minimum useful shared contract is:

- `TaskDescriptor`;
- `TaskCapability`;
- `TaskResult`;
- `LearnerEvent`;
- `SkillEvidence`;
- `PracticeSessionManifest`;
- explicit pathway/skill/runtime/modality/health/YKI-mode types.

This is sufficient for parallel adapters while allowing each engine to keep richer local models.

Rejected alternative: one giant universal exercise schema containing every Reading/Writing/YKI/Roleplay field. Rejected because it would couple all feature agents and create an unstable “god object.”

### Personalization truth

Selection reasons distinguish `learner` evidence from `curriculum` balancing.

Rejected alternative: generate persuasive “you are weak at…” language from session history that is not durably learner-keyed. Rejected as untruthful and difficult to test.

### Parallel branch model

Agents B–G must start from one immutable Agent-A shared base and never branch from or merge one another.

Rejected alternative: stack feature agents in dependency order. Rejected because it serializes development and causes moving-base conflicts.

### Integration model

Agent A will replay accepted packages onto a fresh forward integration candidate instead of merging all branches wholesale. Protected shared files remain integration-owned.

Rejected alternative: merge every green PR into one branch in completion order. Rejected because green feature CI cannot prove whole-product compatibility and broad conflict resolution risks regression.

### Native dependency policy

No new native animation dependency in Wave 1 without explicit approval.

Reason: installed Reanimated/SVG/Image/Haptics cover the first experience system, while native-dependency changes increase mobile build/release risk.

## Testing implications

The governance itself needs a machine verifier. Feature quality uses three independent layers:

1. feature-agent repeated tests;
2. Agent-A independent retest/review at exact SHA;
3. user acceptance before production consideration.

Production promotion remains separate and still requires all existing forward-only release gates.

## Uncertainties contained by tests/integration

- The final durable learner-event storage mechanism is not selected here; Agent B researches it and must not run a production migration.
- Reading/Writing content quality requires human/product review in addition to automated tests.
- Motion visual quality requires platform manual review even when reduced-motion contracts pass.
- Practice ranking weights are initial product hypotheses; deterministic tests prove behavior, not educational optimality.

RESEARCH_GATE=PASS
