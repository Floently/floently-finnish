# Wave 1 Research and Quality Standard

Status: MANDATORY
Owner: Agent A
Date: 2026-08-16

## Purpose

KieliValmis feature work must be grounded in current platform facts, evidence-based learning design and deliberate product decisions. Research is a required implementation phase, not an appendix written after coding.

## Required research artifact

Before implementation, every Agent B–G must create:

`docs/agents/research/AGENT_<LETTER>_RESEARCH.md`

Agent A maintains the cross-product architecture/release research.

Each research file must contain:

1. research questions;
2. current repository evidence and constraints;
3. at least 3 current authoritative/primary technical sources when the task depends on external APIs/framework behavior;
4. at least 2 high-quality learning/product/accessibility sources where pedagogy or UX is material;
5. source access date;
6. findings in the agent's own words;
7. engineering/product decisions caused by each finding;
8. alternatives considered and why they were rejected;
9. unresolved uncertainty and how tests will contain it;
10. a `RESEARCH_GATE=PASS|FAIL` conclusion.

Do not implement until `RESEARCH_GATE=PASS` is justified.

## Source hierarchy

Prefer, in order:

### Technical facts

1. official framework/provider documentation and release notes;
2. standards bodies/specifications;
3. source repositories or primary maintainers;
4. peer-reviewed papers for empirical performance/behavior;
5. reputable secondary explanation only when primary evidence is unavailable.

### Learning design

Prefer systematic reviews, meta-analyses, peer-reviewed second-language learning research and established assessment/CEFR sources. Do not convert a marketing blog into a pedagogical rule.

### Finnish/YKI content

Use original KieliValmis content, clearly licensed/open material, or authored synthetic examples. Do not copy official YKI exam items or copyrighted textbook/course content. YKI exam semantics must remain distinct from ordinary learning.

## Baseline evidence Agent A used

These are starting points, not a substitute for each agent's task-specific research:

- W3C WCAG 2.2, including interaction animation/reduced-motion guidance: https://www.w3.org/TR/WCAG22/
- W3C Understanding Animation from Interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
- React Native Reanimated accessibility/reduced-motion documentation: https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/
- React Native Reanimated layout transitions: https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-transitions/
- Expo SDK 55 Haptics documentation: https://docs.expo.dev/versions/v55.0.0/sdk/haptics/
- Retrieval-practice systematic/meta-analytic evidence should be consulted by learning-system agents, including current review literature rather than assuming that rereading equals learning.

## Product quality principles

A Wave-1 capability is not accepted because it has many screens or lines of code. It must be:

- truthful: no invented personalization, progress or weakness claims;
- useful: directly improves Finnish learning or practice decisions;
- coherent: users understand what to do next and why;
- attractive: strong hierarchy, purposeful illustration/motion, calm focus states;
- repeatable: supports productive return use rather than novelty-only interaction;
- accessible: keyboard/screen-reader semantics where applicable, contrast, touch targets, reduced motion and readable text;
- maintainable: shared engines rather than pathway clones; small interfaces; explicit ownership; no hidden coupling;
- observable/testable: deterministic contracts and permanent regression tests;
- safe: no production mutation and no weakening auth/entitlement/release protections.

## Visual rule

Every visual, animation, sound or haptic must do at least one job:

- **Teach** — clarify meaning/context/language;
- **Orient** — show place/progress/state;
- **Respond** — make an action/state change understandable;
- **Reward** — acknowledge a real learning achievement.

If it does none of these, remove it.

No decorative looping animation behind Reading, Writing, formal YKI work or microphone recording. System reduced-motion preferences must be respected. Haptics are sparse and semantic, not attached to every tap.

## Learning-design rule

Default sessions should favor active retrieval/application, spaced review when truthful learner evidence exists, focused corrective feedback, revision/retry and controlled interleaving. Do not claim adaptive scheduling until durable learner evidence supports the claim.

When learner evidence is absent, use transparent curriculum-safe balancing rather than fabricated personalization.

## Code quality gate

Before handoff, the agent must answer yes to all of the following:

- Is the implementation simpler than the obvious duplicated alternative?
- Are names/types/contracts understandable without reading the PR discussion?
- Is business logic outside presentation components where practical?
- Is new state scoped and explicitly owned?
- Are failure/fallback states deterministic?
- Are accessibility/reduced-motion states implemented where relevant?
- Are the feature and regression tests meaningful rather than snapshot-only decoration?
- Did the agent remove dead experiments/debug output?
- Did the agent avoid adding a dependency where existing Expo/React Native/core facilities are sufficient?
- Can another engineer safely modify this six months later?

If any answer is no, quality review is not complete.
