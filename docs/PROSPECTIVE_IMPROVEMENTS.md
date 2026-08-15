# KieliValmis Prospective Product Improvements

Last established: 2026-08-15

## Purpose

This document is the persistent product-improvement backlog for KieliValmis.

It records product, UX, learning, navigation, progress, motivation,
roleplay, card-progression, and exposure improvements identified during
App Store / Play Store remediation and the post-release UX review.

This file must remain in GitHub and be updated as work progresses.

Do not silently delete completed items. Change their status to DONE so
future executors can understand what was requested, what was implemented,
and what remains.

## Status values

- `TODO` — accepted improvement not yet implemented
- `AUDIT` — investigation required before implementation
- `IN PROGRESS` — active work
- `VALIDATE` — implemented but still needs final regression validation
- `DONE` — implemented and validated
- `INTENTIONAL` — deliberately not user-exposed; reason must be documented

---

# Product direction

KieliValmis should be a guided Finnish-learning system for real life in
Finland, not primarily a flashcard application.

The major learner pathways are:

1. Everyday Finnish
2. Professional / workplace Finnish
3. YKI preparation

Across those pathways, the product should progressively develop:

- listening
- speaking
- reading
- writing
- vocabulary
- grammar
- real-life communication

Flashcards remain an important foundation, but must not become the entire
learning experience.

---

# P0 — Navigation, routes, and UI exposure

## KV-UX-001 — Everyday Finnish one-click navigation

Status: DONE

Requirement:

Everyday Finnish must open with one click from every valid application
section.

Completed regression paths include:

- Subscription -> Everyday Finnish
- Professional Finnish -> Everyday Finnish
- YKI -> Everyday Finnish
- Progress -> Everyday Finnish
- Home -> Everyday Finnish
- Everyday Finnish -> Professional Finnish

Implementation must preserve the navigation-race protection added during
the August 2026 post-release remediation.

Regression guard:

`apps/client/scripts/verify-navigation-invariants.mjs`

Do not reintroduce `activeScreen` as a reactive route-reconciliation
dependency without redesigning the navigation architecture.

---

## KV-UX-002 — Expose Progress in application navigation

Status: DONE

Requirement:

Progress must be directly reachable through the normal user interface and
not require a hidden route or direct URL.

Progress is exposed through the application drawer and has passed
one-click runtime validation.

---

## KV-UX-003 — Full built-page exposure audit

Status: IN PROGRESS

Audit evidence:

`docs/UI_EXPOSURE_AUDIT.md`

Initial static inventory and human classification completed on 2026-08-15.

Goal:

Ensure that functionality already built into KieliValmis is not
accidentally hidden from users.

Audit all of:

- Expo route files
- navigation-model destinations
- AppShell screens
- `*Route.tsx` components
- learner-facing `*Screen.tsx` components
- drawer entries
- home-page entry points
- contextual buttons and cards
- entitlement-gated routes
- direct-URL-only routes

Every built learner-facing page must be classified as one of:

- EXPOSED
- INTENTIONALLY INTERNAL
- ENTITLEMENT-HIDDEN
- DIRECT-URL-ONLY
- ORPHANED

Anything ORPHANED or DIRECT-URL-ONLY must be reviewed to determine whether
it should become a normal UI destination.

Record the audit findings in this document before changing exposure.

---

## KV-UX-004 — Navigation identity and active-section clarity

Status: TODO

Improve visual orientation throughout the application.

Users should always understand:

- which major pathway they are in
- which subsection they are in
- where the drawer destination will take them
- which navigation item is currently active

Give particular attention to:

- Everyday Finnish
- Professional Finnish
- YKI
- Progress
- Subscription
- Settings

Avoid visually ambiguous section transitions.

---

## KV-UX-005 — Browser navigation robustness

Status: TODO

Validate:

- browser Back
- browser Forward
- refresh
- deep links
- drawer navigation after refresh
- route query parameters
- authenticated route restoration
- subscription route transitions

Navigation state and URL state must not fight each other.

---

## KV-UX-006 — Expose Personal Phrase Bank

Status: AUDIT

The feature is built at `/learn/phrase-bank` but currently direct-URL-only.

Runtime-validate it and, if healthy, expose it through Everyday Finnish.

---

## KV-UX-007 — Expose Revision Vault

Status: AUDIT

The feature is built at `/learn/revision-vault` but currently direct-URL-only.

Runtime-validate it and, if healthy, expose it through Everyday Finnish
and later connect it to Progress recommendations.

---

## KV-UX-008 — Expose Confidence Tracker

Status: AUDIT

The feature is built at `/learn/confidence` but currently direct-URL-only.

Runtime-validate it and determine whether its best permanent home is
Everyday Finnish, Progress, or both.

---

## KV-UX-009 — Expose YKI Planner

Status: AUDIT

The feature is built at `/learn/planner` but currently direct-URL-only.

Runtime-validate it and, if healthy, expose it in the YKI pathway.

---

## KV-UX-010 — Expose Work Finnish Path

Status: AUDIT

The feature is built at `/professional/work-path` but currently
direct-URL-only.

Runtime-validate it and, if healthy, expose it through Professional Finnish.

---

## KV-UX-011 — Improve Workplace Incident Lab discoverability

Status: AUDIT

`/professional/incidents` is already contextually reachable but is not
prominent in the Professional Finnish pathway.

Validate the experience and decide whether to add a visible Professional
Finnish entry while retaining contextual speaking-flow access.

---

# P1 — Authentication usability

## KV-AUTH-001 — Password visibility control

Status: TODO

Add an accessible eye / crossed-eye control to password fields.

Requirements:

- password hidden by default
- user can reveal/hide password
- accessible label
- keyboard accessible on web
- no disruption to browser/password-manager autofill

---

## KV-AUTH-002 — Enter submits sign-in

Status: TODO

On the web sign-in screen, pressing Enter from the password field should
submit authentication.

Also review:

- email -> password keyboard focus
- proper return-key behavior
- duplicate-submit prevention
- loading state

---

# P1 — Progress, readiness, motivation, and recommendations

## KV-PROGRESS-001 — Replace placeholder/readiness heuristics with real progress

Status: TODO

The Progress experience should be driven by actual learner activity rather
than subscription/entitlement state or fixed percentages.

Build a real progress model from learner events such as:

- cards attempted
- cards mastered
- vocabulary level progression
- grammar practice
- listening practice
- speaking sessions
- roleplay performance
- reading activities
- writing activities
- YKI task performance
- professional scenario performance
- repetition / review history
- streak consistency

Progress calculations must be explainable and reproducible.

---

## KV-PROGRESS-002 — Detailed Progress page

Status: TODO

Make Progress substantially more robust, detailed, and useful.

The user should be able to see progress at several levels:

- overall readiness
- Everyday Finnish
- Professional Finnish
- YKI
- listening
- speaking
- reading
- writing
- vocabulary
- grammar
- individual learning sections / modules

The page should show:

- current level
- recent improvement
- weak areas
- strong areas
- completion
- mastery
- recent activity
- trend over time

The learner should be able to interact with progress sections rather than
seeing only static percentages.

---

## KV-PROGRESS-003 — Actionable next-step recommendations

Status: TODO

Progress must tell the learner what to do next.

Examples of recommendation types:

- vocabulary requiring review
- skill currently falling behind
- recommended Everyday Finnish lesson
- recommended professional scenario
- recommended YKI task
- speaking practice suggestion
- listening practice suggestion
- review due today
- suggested next difficulty level

Recommendations should be based on learner evidence rather than generic
marketing text.

---

## KV-PROGRESS-004 — Progress drill-down

Status: TODO

Clicking/tapping a Progress area should open useful details.

Possible drill-down information:

- completed activities
- recent results
- mastery by topic
- difficult items
- performance history
- next recommended work
- contribution to the overall score

---

## KV-PROGRESS-005 — Homepage circular streak/progress indicator

Status: TODO

The circular progress/streak indicator on the homepage must reflect real
progress and visibly advance.

It must not appear permanently static.

Requirements:

- animate when progress increases
- accurately represent current state
- update after qualifying learner activity
- expose useful information on interaction
- avoid misleading animation when no progress occurred

---

## KV-PROGRESS-006 — Positive progress sound feedback

Status: TODO

When genuine learner progress increments, provide tasteful audio feedback.

Requirements:

- only trigger on meaningful improvement
- avoid repeated/noisy triggering
- user must be able to mute or disable it
- respect platform audio/accessibility expectations
- never imply improvement when underlying progress did not increase

---

## KV-PROGRESS-007 — Star / achievement feedback

Status: TODO

Show stars or another appropriate KieliValmis reward effect when meaningful
progress is earned.

Potential triggers:

- completing a learning target
- mastering vocabulary
- improving a skill score
- finishing a recommended task
- reaching a streak milestone
- achieving a new readiness threshold

Animations should feel rewarding without becoming distracting.

Reduced-motion accessibility must be considered.

---

# P1 — Vocabulary and card progression

## KV-CARDS-001 — Easy-to-hard vocabulary progression

Status: TODO

Vocabulary must progress from easier to harder material.

An A1 learner should not routinely receive vocabulary that belongs to a
substantially higher level.

Review:

- CEFR metadata
- lexical difficulty
- card ordering
- scheduler difficulty
- learner level
- answer history
- topic prerequisites

---

## KV-CARDS-002 — Canonical vocabulary-level audit

Status: AUDIT

Perform a read-only audit before changing the bank.

Measure:

- vocabulary distribution by CEFR
- suspicious A1/A2 cards
- missing level metadata
- cards whose text complexity conflicts with their assigned level
- progression gaps
- duplicated difficulty
- cards that should move levels

Do not solve progression purely through UI filtering if the canonical
content metadata itself is wrong.

---

## KV-CARDS-003 — Guided vocabulary curriculum

Status: TODO

Build an intentional progression rather than serving a large undifferentiated
pool of vocabulary.

Possible organization:

- survival Finnish
- home
- food
- shopping
- transport
- health
- appointments
- services
- work
- social interaction
- increasingly complex abstract vocabulary

Progression should combine level, usefulness, learner history, and context.

---

# P1 — Balanced four-skill learning

## KV-LEARN-001 — Everyday Finnish four-skill pathway

Status: TODO

Everyday Finnish should systematically include:

- listening
- speaking
- reading
- writing

alongside vocabulary and grammar.

---

## KV-LEARN-002 — Professional Finnish four-skill pathway

Status: TODO

Professional Finnish should develop profession-specific:

- listening
- speaking
- reading
- writing
- vocabulary
- workplace interaction

This must cover all professions supported by the product rather than one
profession only.

---

## KV-LEARN-003 — YKI four-skill pathway

Status: TODO

YKI learning should give clear structured practice and progress for:

- listening comprehension
- reading comprehension
- writing
- speaking

Progress must be visible separately for the different YKI skills.

---

# P1 — Roleplay and voice

## KV-ROLEPLAY-001 — Role consistency

Status: TODO

Prevent AI roleplay from unexpectedly switching the learner's role and the
AI character's role during a conversation.

Roles should remain stable unless the scenario explicitly requires a
change.

---

## KV-ROLEPLAY-002 — Varied AI-generated roleplay

Status: TODO

Keep OpenAI-driven conversation generation as part of roleplay.

Sessions should be robust and varied rather than deterministic scripts.

Add anti-repetition logic so:

- scenarios do not repeat the same coaching cue every session
- beginner sessions remain simple without becoming identical
- conversation responses stay context-aware
- variation does not break pedagogical safety

---

## KV-ROLEPLAY-003 — Level-appropriate conversation

Status: TODO

Roleplay language, hints, pace, and expected learner responses should adapt
to the learner's level.

A1/A2 conversations should stay genuinely accessible.

More advanced levels may increase:

- vocabulary
- sentence complexity
- conversational ambiguity
- speaking independence

---

## KV-VOICE-001 — Voice identity and mapping audit

Status: TODO

Verify that voice labels and actual generated voices agree.

Prevent male/female voice metadata from being mapped to the wrong voice.

Preserve natural Finnish pronunciation and stable character identity
during roleplay.

---

# P2 — Learning experience expansion

## KV-LEARN-004 — Expand beyond flashcards

Status: TODO

Flashcards should remain useful but should not define the product.

Add richer learning interactions where appropriate, including:

- contextual exercises
- listening tasks
- speaking tasks
- short reading tasks
- writing prompts
- scenario-based activities
- guided review
- adaptive recommendations

---

## KV-LEARN-005 — Competitor-informed learning audit

Status: TODO

Review strong language-learning products to identify useful interaction
patterns and learning structures.

Do not simply clone competitors.

Evaluate which approaches genuinely improve:

- retention
- learner motivation
- progression clarity
- listening
- speaking
- reading
- writing
- real-world Finnish readiness

Use the findings to strengthen KieliValmis's own product direction.

---

# P2 — Product feedback and motivation system

## KV-MOTIVATION-001 — Coherent reward system

Status: TODO

Design progress rings, streaks, stars, sounds, achievements, and progress
feedback as one coherent system.

Avoid adding independent animations that have no relationship to learning.

A reward should correspond to a real learner accomplishment.

---

## KV-MOTIVATION-002 — Accessibility and user control

Status: TODO

Motivation effects must support:

- sound off
- reduced motion
- keyboard interaction on web
- screen-reader-friendly progress information
- non-audio/non-animation progress confirmation

---

# P2 — Quality and regression prevention

## KV-QA-001 — Navigation invariant verification

Status: DONE

A static navigation-invariant verifier now protects the Everyday Finnish
navigation architecture.

Keep it running whenever navigation code changes.

Future goal:

integrate the verifier into the normal CI quality gate.

---

## KV-QA-002 — UI exposure invariant

Status: TODO

After the full built-page exposure audit, add an automated check that
compares known user-facing routes with intended navigation entry points.

The check should identify newly orphaned screens before release.

---

## KV-QA-004 — Expose-or-delete UI surface policy

Status: IN PROGRESS

Every learner-facing page, route implementation, and alternate screen must
be either:

- intentionally exposed;
- retained for a documented and verifiable active runtime reason; or
- deleted.

Do not keep duplicate/legacy screens as informal backups.

Before deleting a candidate:

- inspect all imports and route references;
- verify current production flow ownership;
- compare against the canonical implementation;
- migrate any unique required behavior;
- delete stale routes, exports, and navigation definitions with the page.

Git history is the backup.

Acceptance:

- no unjustified learner-facing orphan screen remains;
- no duplicate canonical/legacy UI implementation remains without a written
  retention reason;
- every retained contextual/internal screen has evidence recorded in
  `docs/UI_EXPOSURE_AUDIT.md`;
- automated exposure checks prevent new unjustified orphan surfaces.

---

## KV-QA-003 — Cross-platform route regression matrix

Status: TODO

Maintain regression coverage for:

- web
- Android
- iOS

Important transitions should behave consistently unless there is an
intentional platform-specific difference.

---

# Recently completed post-release improvements

## DONE — Everyday Finnish navigation repair

- fixed one-click navigation
- removed the route-reconciliation race
- added navigation regression invariants
- validated from multiple application sections

## DONE — Progress UI exposure

- Progress existed but was not sufficiently exposed
- added it as a normal drawer destination
- validated one-click navigation
- validated Progress -> Everyday Finnish

---

# Next planned work

1. Complete the full built-page UI exposure audit.
2. Record every hidden/orphaned/direct-URL-only page in this document.
3. Decide which pages should be exposed.
4. Implement and validate exposure changes.
5. Continue with authentication usability.
6. Audit vocabulary progression.
7. Upgrade Progress and the motivation system.
8. Expand the balanced four-skill learning pathways.

---

# Maintenance rule

Whenever the user requests a meaningful KieliValmis product improvement:

1. add it to this document,
2. assign a stable `KV-*` identifier,
3. record its status,
4. keep acceptance requirements here,
5. update status after implementation,
6. never remove historical completed work merely because it is finished.

This document is intended to survive executor/AI handovers.
