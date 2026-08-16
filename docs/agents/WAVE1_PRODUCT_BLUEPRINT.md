# KieliValmis Wave 1 Product Blueprint

Status: SHARED PRODUCT DIRECTION
Owner: Agent A
Date: 2026-08-16

## Product objective

Wave 1 should make KieliValmis feel like one coherent serious Finnish-learning product rather than a collection of unrelated tools. The learner keeps three primary pathways:

- Everyday Finnish;
- Professional Finnish;
- YKI preparation.

A top-level Practice destination orchestrates those capabilities but does not become a fourth pathway.

Everyday and Professional must visibly develop listening, speaking, reading and writing. Vocabulary and grammar support those four skills. YKI remains an explicit serious four-skill preparation system with its exam semantics protected.

## Experience principles

1. **One obvious next action.** Important screens should have one dominant action, not a grid of competing CTAs.
2. **Context before mechanics.** A learner should understand the real-life situation and communicative goal before answering.
3. **Active use over passive consumption.** Favor retrieval, comprehension decisions, production, correction and retry over long explanation-only screens.
4. **Coherence across modalities.** Where possible, change skill while retaining context: read a message, listen to related speech, answer, speak, write, revise.
5. **Truthful adaptation.** Explain selections only from real learner evidence. When evidence is absent, say what curriculum balance is being created rather than inventing weakness/mastery.
6. **Scaffolding fades with level.** A1 gets more visual/phrase support; B1/B2 increasingly use authentic-style messages/documents and fewer decorative aids.
7. **Focus states are calm.** Reading, Writing and microphone recording remove decorative movement and unnecessary chrome.
8. **Reward learning, not taps.** Reward a successful retry, genuine improvement, balanced session or meaningful milestone—not every routine answer.

## Practice Hub target

Opening state should answer four things immediately:

- What should I do? — `Start today's practice`;
- How long? — 5 / 10 / 20 minutes;
- What will I practice? — compact skill/pathway preview;
- Why these tasks? — one truthful, understandable reason.

Suggested structure:

```text
Good evening

Today's practice                         10 min

[small contextual illustration / scene only when useful]

Reading · Speaking · Review
Everyday + Professional

[ Start today's practice ]

5 min       10 min       20 min

Why these tasks?
This session balances reading and speaking
and continues the workplace handover theme.

○ ─── ● ─── ○ ─── ○
Read  Speak  Write Review
```

Inside a session:

- one task at a time;
- compact pathway/skill identity;
- step count or time guidance;
- `Skip for now`;
- `Give me another task`;
- `No microphone right now`;
- `Make it shorter`;
- task completion collapses into a completed path node;
- next task expands without forcing the learner back through menus.

Do not pad sessions to hit a timer exactly. Time is a constraint, not an obligation.

## Composer behavior

Hard filters happen before ranking. Never schedule an incompatible task and hope the runtime rejects it later.

Filter for:

- declared entitlement compatibility;
- profession/work-domain;
- level/prerequisite safety;
- feature/runtime health;
- modality availability;
- time budget;
- repetition policy when evidence exists;
- YKI practice/mock/full-exam boundary;
- product truth constraints.

Initial ranking concepts, only when inputs exist:

```text
0.30 overdue need
0.25 weakness need
0.15 goal relevance
0.15 rolling skill balance
0.10 novelty
0.05 time fit
+ context coherence
```

Evidence-backed terms are neutral/omitted when durable learner evidence does not exist.

## Reading target

Use one shared engine with pathway-specific content.

### A1

- signs, labels, menus, prices, times, opening hours;
- one-line messages/notices;
- find name/date/place/price;
- strong visual/context support;
- very limited inference.

### A2

- SMS/chat;
- appointment messages;
- simple email;
- service instructions;
- short workplace notes;
- explicit main idea/details.

### B1

- workplace instructions;
- public-service notices;
- announcements;
- longer email;
- short information/news-style text;
- main idea, detail and simple inference.

### B2+

- longer articles/policies/workplace documents;
- register and implied meaning;
- information connection across paragraphs;
- progressively less scaffolding.

Ordinary learning routes are `/learn/reading` and `/professional/reading`. Do not use `/read`, which belongs to the separate KieliValmis Read surface.

## Writing target

One shared revision engine, pathway-specific content/configuration.

Canonical loop:

`understand -> plan -> write -> submit -> focused feedback -> revise -> resubmit -> compare improvement -> emit evidence`

Feedback defaults:

1. what worked communicatively;
2. one or two priority improvements;
3. short explanation;
4. targeted rewrite/retry;
5. compare improved version with the learner's previous attempt.

Do not replace learning with a full automatic rewrite.

### A1/A2

- short replies/messages;
- practical service situations;
- phrase/sentence starters where helpful;
- low correction volume.

### B1/B2+

- service/workplace email;
- explanations/complaints;
- workplace documentation;
- incident description;
- register-aware writing;
- reduced scaffolding.

## Professional mission target

Professional learning should be organized around believable work goals, not generic exercises with a profession label pasted on.

Example healthcare chain:

`listen to handover -> identify critical facts -> spoken handover -> read related note -> write documentation -> correct one high-value error`

Other domains should use the same pattern with domain-appropriate communication, not necessarily the same task count.

Professional scenarios are Finnish-language learning, not regulated professional/medical/legal advice.

## Visual system

Every visual/motion element must Teach, Orient, Respond or Reward.

Use the installed stack first:

- React Native Reanimated for motion and layout transitions;
- React Native SVG for lightweight semantic illustrations/icons;
- Expo Image for image handling;
- Expo Haptics for sparse semantic feedback.

Do not add a native animation SDK such as Rive during Wave 1 without explicit approval. Native dependency changes are intentionally deferred because mobile releases are live/sensitive.

### Level-sensitive visual treatment

- A1: more contextual illustration, icons, highlighted clues and phrase support;
- A2: contextual scenes/messages with moderate scaffolding;
- B1: realistic service/workplace messages and documents;
- B2+: predominantly authentic-style text/documents with restrained contextual graphics;
- formal YKI: intentionally neutral/exam-like.

Advanced learners should never feel they are using a children's app.

## Motion budget

Default target:

- maximum ambient animations visible simultaneously: 1;
- maximum entrance animation: 1;
- maximum transient feedback animation: 1;
- typical UI transition about 160–320 ms;
- meaningful success about 300–600 ms;
- major milestone about 450–1200 ms;
- no decorative looping motion during Reading, Writing, YKI focus or microphone recording;
- system reduced-motion preference always respected.

Prefer short opacity/scale/layout transitions to large parallax or constant travel.

Current authoritative starting points:

- Reanimated accessibility/reduced motion: https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/
- Reanimated layout transitions: https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-transitions/
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C Animation from Interactions: https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
- Expo SDK 55 Haptics: https://docs.expo.dev/versions/v55.0.0/sdk/haptics/

## Haptics and sound

Use haptics for semantic events such as meaningful completion or successful submit/retry. Do not vibrate on every navigation tap. Respect platform support and failure/no-op behavior.

Do not add ambient sounds or sound effects that compete with Finnish listening/speaking content.

## Repeat-use quality

A feature should invite repeat use through learning value:

- sessions vary but remain coherent;
- the learner can predict what controls do;
- feedback is actionable;
- retries visibly improve something;
- progress/reasons are truthful;
- transitions feel polished but quick;
- no manipulative streak pressure or reward noise is needed to make the experience engaging.

## Definition of beautiful

For Wave 1, “beautiful” means:

- strong hierarchy;
- generous readable spacing;
- coherent typography/components;
- purposeful illustration;
- responsive micro-interaction;
- calm focused learning states;
- level-appropriate sophistication;
- accessibility;
- consistent pathway/skill identity;
- no visual element competing with the Finnish the learner is trying to understand or produce.
