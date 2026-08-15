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

Status: KEEP - BLOCKED FROM EXPOSURE

Phase 0 classification date: 2026-08-15

The feature is built at `/learn/phrase-bank` and has meaningful unique
learner-facing capability, so it must be kept. It must not yet be exposed
through normal navigation.

Evidence:

- the direct route serves successfully;
- the client has a dedicated screen, hook, service, and learning API contract;
- the active GET `/api/v1/learning/phrase-bank` calls
  `get_learning_phrase_bank()`;
- that active read path builds its result from `_sample_phrase_entries()`
  instead of authenticated learner-specific persisted data;
- the active POST `/api/v1/learning/phrase-bank` calls
  `add_learning_phrase()`, which starts from the sample phrase bank and
  appends the submitted phrase only to the returned dictionary;
- that POST path does not durably persist the submitted learner phrase;
- a separate `LearningRepository` has an in-process phrase-bank dictionary,
  but it is not the storage path used by the active router;
- the client `withFallback()` behavior can substitute sample phrase data when
  the real request fails;
- the save fallback can return a locally generated success object even when
  the server save failed;
- no Roleplay/Speaking -> Personal Phrase Bank write integration was found in
  the targeted source audit;
- no phrase-specific review flow was found, while the current learner CTA
  routes to generic `/cards`.

Product decision:

KEEP the Personal Phrase Bank because collecting, reusing, and reviewing
personally useful Finnish phrases is strongly aligned with KieliValmis.

DO NOT EXPOSE it until learner data is truthful and durable.

Exposure exit gates:

1. use authenticated, account-specific durable phrase storage;
2. make GET return the learner's actual saved phrases, not sample entries;
3. make POST persist successfully across refresh, process restart, and later
   sessions;
4. never silently present demo/fallback phrases as real learner data in
   production;
5. never show a successful save when persistence failed;
6. implement and verify real Roleplay -> Phrase Bank capture before the UI
   promises that workflow;
7. provide a phrase-specific review flow, or explicitly parameterize and test
   the existing cards flow for Phrase Bank review;
8. localize mixed hard-coded learner-facing Finnish/English strings;
9. complete authenticated runtime validation for empty state, populated state,
   errors, refresh, navigation, and deep links.

Recommended permanent home after these gates pass:

Everyday Finnish

Secondary future entry:

Progress / adaptive recommendations

---

## KV-UX-007 — Expose Revision Vault

Status: KEEP - BLOCKED FROM EXPOSURE

Phase 0 classification date: 2026-08-15

The feature is built at `/learn/revision-vault` and contains meaningful unique
revision-prioritisation capability, so it must be kept. It must not yet be
exposed through normal learner navigation.

Evidence:

- the direct route serves successfully;
- the client has a dedicated screen, hook, service, and API contract;
- the active GET `/api/v1/learning/revision-vault` calls
  `get_learning_revision_vault()`;
- that backend function prioritises `_sample_revision_entries()` instead of
  authenticated learner-specific errors or corrections;
- the client wraps the request in `withFallback()`;
- the fallback can silently display fabricated learner state including
  19 due items and 42 protected items;
- no verified learner-error or correction ingestion path into the Revision
  Vault was found in the targeted source audit;
- `revision_vault_service.py` contains useful prioritisation logic that should
  be retained and connected to real learner events;
- `Start today's review` routes to generic `/cards`, with no verified
  Revision-Vault-specific review mode;
- `Add more` routes to generic `/learn`;
- the empty-state CTA labelled `Add to your phrase bank` also routes to
  generic `/learn`, so its destination does not match its promise.

Product decision:

KEEP the Revision Vault because error-focused spaced revision is strongly
aligned with KieliValmis and the prioritisation logic is reusable.

DO NOT EXPOSE it until the vault represents real learner history.

Exposure exit gates:

1. populate the vault from authenticated learner mistakes, corrections,
   weak patterns, and scheduled review events;
2. persist revision entries durably per learner;
3. remove or explicitly isolate all production sample/fallback learner state;
4. never present fabricated due counts or protected-item counts as real data;
5. connect mistakes from relevant learning flows to the vault;
6. provide a verified Revision-Vault-specific review flow, or explicitly
   parameterize and test the existing cards flow;
7. fix CTA destinations so labels and routes match;
8. ensure empty state reflects actual learner data rather than sample state;
9. complete authenticated runtime validation for empty, populated, error,
   refresh, navigation, and deep-link states.

Recommended permanent home after remediation:

Everyday Finnish

Secondary future entry:

Progress / adaptive recommendations

---

## KV-UX-008 — Expose Confidence Tracker

Status: KEEP - BLOCKED FROM EXPOSURE

Phase 0 classification date: 2026-08-15

The feature is built at `/learn/confidence` and contains meaningful reusable
confidence-calibration capability. Keep it, but do not expose it yet.

Evidence:

- the direct route serves successfully;
- the client has a dedicated screen, hook, service, and API contract;
- the backend confidence service contains real reusable logic for separating
  knowledge, confidence, retry behaviour, hesitation, and calibration bands;
- the active GET `/api/v1/learning/confidence` calls
  `get_learning_confidence()`;
- that function currently builds the result from
  `_sample_confidence_signals()` rather than authenticated learner history;
- the client wraps the request in `withFallback()`;
- that fallback can silently display fabricated learner metrics including
  calibration 74%, overconfidence 18%, underconfidence 11%, and sample skill
  entries;
- no verified real learner-signal ingestion path feeding
  `build_confidence_tracker()` was found in the targeted audit;
- the client `calibrationScore` is currently the average absolute difference
  between accuracy and confidence, so perfect calibration produces 0 while
  the UI presents the value as a conventional positive score;
- `overconfidenceRate` and `underconfidenceRate` are currently calculated as
  matching-entry count multiplied by 10 rather than a true percentage;
- skill-specific practice CTAs all route to generic `/speaking`, including
  cases where the weak area may be reading, listening, or writing.

Product decision:

KEEP the Confidence Tracker capability.

DO NOT EXPOSE the current standalone surface until its learner signals and
summary metrics are truthful.

Long-term product direction:

Integrate confidence-calibration evidence into the richer Progress system
rather than treating Confidence Tracker as an isolated dashboard.

Exposure / integration exit gates:

1. derive confidence signals from authenticated learner activity;
2. define and persist the learner events required for confidence, accuracy,
   retry rate, and hesitation;
3. aggregate those signals durably per learner and skill area;
4. remove or explicitly isolate production sample/fallback learner metrics;
5. correct calibration-score semantics and clearly define whether higher or
   lower is better;
6. calculate overconfidence and underconfidence as real percentages;
7. route recommendations to the actual affected skill and practice mode;
8. verify empty, populated, error, refresh, navigation, and deep-link states;
9. integrate the resulting evidence into Progress recommendations where
   appropriate.

Recommended permanent home after remediation:

Progress

Possible secondary entry:

Contextual links from relevant practice areas

Remediation timing:

Deferred until the combined agents-package + ChatGPT implementation phase has
established the final learner-event and progress-data architecture.

---

## KV-UX-009 — Expose YKI Planner

Status: KEEP - BLOCKED FROM EXPOSURE

Phase 0 classification date: 2026-08-15

The feature is built at `/learn/planner` and contains a useful YKI study-plan
engine, but the current learner-facing plan is not based on verified personal
YKI progress or preferences.

Evidence:

- the direct route serves successfully;
- the client has a dedicated screen, hook, service, and API contract;
- the backend study-plan service contains meaningful reusable planning logic
  using accuracy, confidence, attempt volume, recency, risk ranking, study
  time, and skill-specific activity templates;
- the active GET `/api/v1/learning/planner` calls
  `get_learning_planner()`;
- that active path currently uses `_sample_study_signals()`;
- it also hard-codes `StudyPreferences` to 35 minutes per day, five study
  days per week, target level B1, and work focus Office;
- no verified authenticated learner-performance ingestion path into the active
  planner was found;
- no verified learner preference source supplies study time, study days,
  target exam date, target level, or work focus to the active planner;
- `target_level` exists in `StudyPreferences` but is not currently used by
  the readiness calculation;
- therefore the readiness algorithm is not currently target-level-sensitive;
- the client field labelled `Target level` is populated from
  `payload.readiness.band`, so values such as `DEVELOPING` can be presented
  as if they were the learner's target CEFR/YKI level;
- the client wraps the planner request in `withFallback()`;
- fallback state can silently display a fabricated B1/B2 target, weekly
  focus, next-best action, and four-week milestone plan;
- milestone completion state is derived from array position rather than
  learner completion evidence: index 0 is `active`, index 1 is `next`, and
  later blocks are labelled `done`;
- the primary milestone CTA always routes to generic `/yki-practice` rather
  than the recommended section/task;
- the empty state promises that the plan will be built around `real progress`,
  while the current active data source is synthetic.

Product decision:

KEEP the YKI Planner and its planning engine.

DO NOT EXPOSE the current surface until the plan is genuinely personalized
and its readiness claims are defensible.

Exposure exit gates:

1. derive study signals from authenticated YKI learner activity across
   reading, listening, writing, and speaking;
2. persist and use real accuracy, confidence, attempts, and practice-recency
   evidence;
3. use learner-configured study time and study days;
4. use the learner's real target level and target exam date;
5. make target level materially affect planning/readiness where appropriate;
6. separate `target level` from `readiness band` in both API semantics and UI;
7. replace fabricated milestone statuses with persisted completion/progress
   evidence;
8. prevent sample/fallback plans from masquerading as personalized plans;
9. route next-best actions to the recommended YKI section and task rather than
   generic practice;
10. connect mock-exam and practice results back into subsequent plan cycles;
11. calibrate and pedagogically validate readiness weights and thresholds
    before presenting labels such as `exam_ready`;
12. verify empty, populated, error, refresh, navigation, deep-link, and
    preference-change behaviour.

Recommended permanent home after remediation:

YKI pathway

Secondary future entry:

Progress / adaptive recommendations

Remediation timing:

Deferred until the combined agents-package + ChatGPT implementation phase has
established the final learner-event, YKI-performance, preferences, and
progress-data architecture.

---

## KV-UX-010 — Expose Work Finnish Path

Status: KEEP CAPABILITY - BLOCK SURFACE - MERGE CANDIDATE

Phase 0 classification date: 2026-08-15

The route `/professional/work-path` contains useful professional-learning-path
concepts, but the standalone surface should not be exposed in its current
form.

Current evidence indicates that its valuable concepts should probably be
integrated into the canonical Professional Finnish experience rather than
creating a second competing professional hub.

Evidence:

- the direct route exists and serves successfully;
- the backend contains structured work-track definitions with core tasks,
  language targets, speaking scenarios, writing tasks, and vocabulary
  clusters;
- the Work Path client does not consume the learner's selected or entitled
  profession;
- instead, it unconditionally takes `payload.tracks?.[0]`;
- the first backend work track is Healthcare Finnish;
- the professional overview independently returns Office as its current
  `recommendedTrack`;
- its `nextMission` is also an Office clarification/writing mission;
- the Work Path client therefore can combine Healthcare as the displayed track
  with an Office next mission;
- the fallback can silently display fabricated Healthcare track state and
  fabricated mission status;
- active mission statuses are generated by array position rather than real
  learner completion;
- no verified durable Work Path mission-progress source was found;
- the standalone screen contains no CTA that opens a mission or learning
  activity;
- the canonical `ProfessionalRoute` already resolves the learner's entitled
  profession and provides actionable vocabulary, roleplay, interview, and
  report-writing destinations;
- the canonical Professional route currently operates on nurse, doctor, and
  practical-nurse profession entitlements;
- the Work Path backend separately defines healthcare, construction, cleaning,
  office, hospitality, and retail work domains;
- those two taxonomies are not currently reconciled;
- the standalone Work Path screen also contains hard-coded learner-facing
  English and hard-coded light-theme colors.

Product decision:

KEEP the underlying Work Finnish Path capability.

BLOCK exposure of the current standalone page.

Treat the route/screen as a MERGE CANDIDATE during the combined architecture
implementation.

The goal is to preserve useful path concepts such as missions, next mission,
skill sequencing, workplace-language targets, and professional progression,
while avoiding a second competing Professional Finnish hub.

Canonicalization / remediation gates:

1. define the canonical distinction between paid professions and broader work
   domains;
2. map every supported professional learner to the correct path without
   silently defaulting to Healthcare or the first track;
3. make recommended track, displayed track, and next mission come from one
   coherent source;
4. connect path state to the learner's selected/entitled profession;
5. replace positional/fallback mission status with real learner progress;
6. connect every actionable mission to the correct vocabulary, roleplay,
   interview, writing, incident, or other professional practice;
7. decide how useful work-domain content should be represented when it does not
   correspond directly to a paid profession;
8. integrate useful path/progression concepts into the canonical
   `ProfessionalRoute` unless a separately valuable learner journey is proven;
9. localize learner-facing copy and use canonical theme tokens;
10. verify professional entitlement/access behaviour;
11. prevent fallback data from masquerading as learner-specific progress;
12. complete runtime validation across each supported profession.

Deletion rule:

DO NOT DELETE the standalone implementation during Phase 0.

After the combined agents-package + ChatGPT implementation establishes the
final Professional Finnish architecture, run the required reverse-dependency
and unique-capability comparison.

Delete the standalone Work Path route/screen only if all useful capability has
been migrated and both deletion gates are proven:

`PRE_DELETE_DEPENDENCY_GATE=PASS`

`UNIQUE_REQUIRED_CAPABILITY_REMAINING=NO`

Intended final product home:

Professional Finnish

Remediation timing:

After the full Phase 0 audit and combined agents-package + ChatGPT
implementation planning establish the final professional-learning architecture.

---

## KV-UX-011 — Repair and contextualize Workplace Incident Lab

Status: KEEP - CONTEXTUAL - BLOCKED FROM PROMOTION

Phase 0 classification date: 2026-08-15

The route `/professional/incidents` contains useful and distinctive workplace
incident-learning capability and is already reachable contextually from the
Speaking profession flow.

Keep the capability and its contextual product role, but do not promote or
expose the current implementation more widely until its profession routing,
claims, actions, and persistence are truthful.

Evidence:

- the route exists and serves successfully;
- Speaking contains a real contextual Incident Lab entry;
- that entry routes to `/professional/incidents` without passing the active
  profession or work track;
- `useWorkplaceIncident()` also supplies no track;
- `listWorkplaceIncidents()` therefore currently defaults to `office`;
- a learner entering from nurse, doctor, or practical-nurse Speaking can
  therefore receive an Office incident rather than content for the active
  profession;
- the backend incident engine contains useful structured capability across
  healthcare, retail, hospitality, cleaning, construction, and office;
- each backend scenario can include language targets, response choices,
  best-response index, follow-up task, explanation, and coaching notes;
- the current client discards most of those richer pedagogical fields;
- the current Professional entitlement taxonomy uses nurse, doctor, and
  practical_nurse rather than the six backend work-domain identifiers;
- no canonical profession-to-work-domain mapping was found;
- the healthcare backend scenario is healthcare-domain content rather than
  separately doctor-, nurse-, or practical-nurse-specific content;
- the empty-state copy says incidents appear after the learner's first
  workplace roleplay and build on situations the learner has handled;
- no roleplay-history or learner-event ingestion feeding Incident Lab was found;
- current incident scenarios are static;
- the visible `Save draft` control has no save handler;
- no durable incident-draft persistence path was found;
- `Practice live`, the empty-state action, and the primary action all route to
  generic `/professional`;
- no incident ID, scenario ID, profession, or track is propagated into the
  live-practice destination;
- client API failure handling can silently substitute fabricated Healthcare and
  Service fallback incidents;
- learner-facing Incident Lab copy is hard-coded in English even though the
  localization system already contains Incident Lab translation keys;
- the targeted audit did not prove surface-specific professional entitlement
  enforcement;
- backend track input is accepted as a raw route string while the incident
  service directly indexes the supported scenario dictionary, so explicit
  supported-track validation should be added.

Product decision:

KEEP the Workplace Incident Lab capability.

KEEP its intended contextual relationship to Professional Finnish and
profession-specific Speaking practice.

DO NOT PROMOTE the current route into wider learner navigation yet.

Recommended final product model:

- primary home: inside the learner's selected Professional Finnish profession;
- contextual secondary entry: Speaking / roleplay;
- not a global drawer destination;
- each entry must preserve the learner's active profession and chosen incident.

Remediation / exposure gates:

1. define the canonical relationship between paid professions and broader work
   domains;
2. pass active profession/context into Incident Lab instead of silently
   defaulting to Office;
3. provide genuinely profession-appropriate incident content for every
   supported paid profession;
4. label broader work-domain content accurately when it is not a paid
   profession;
5. remove or rewrite claims that incidents come from learner history unless
   real roleplay/event ingestion is implemented;
6. if adaptive incident generation from prior learner situations is desired,
   build it on the final learner-event architecture rather than fabricated
   state;
7. implement real draft persistence or remove the `Save draft` affordance;
8. route `Practice live` directly into the matching profession and incident
   scenario;
9. decide how the existing response choices, best response, language targets,
   follow-up task, and coaching notes should participate in the learner
   experience instead of silently discarding them;
10. prevent fallback incidents from masquerading as personalized or
    profession-specific learner state;
11. localize all learner-facing Incident Lab copy using the existing i18n
    system;
12. verify professional entitlement and direct-route access behaviour;
13. validate supported backend track IDs and return a controlled client error
    for invalid tracks;
14. verify empty, populated, error, refresh, profession-switch, back-navigation,
    and deep-link behaviour;
15. validate the repaired flow independently for every supported profession.

Deletion decision:

NO.

The incident-scenario engine and associated learning model provide unique
required workplace-learning capability.

Do not delete the route or engine during Phase 0.

Remediation timing:

Deferred until the full Phase 0 audit and combined agents-package + ChatGPT
implementation planning establish the final Professional Finnish taxonomy,
learner-event architecture, and navigation model.

---

# P0 — Full-surface reconciliation findings

These items were discovered during the final Phase 0 route, ownership, and
legacy/orphan reconciliation.

They are registered now so none are lost when the agents-package findings and
the broader KieliValmis roadmap are merged into the combined implementation
plan.

## KV-P0-001 — Repair `/help` route contract

Status: TODO

Help is an active AppShell capability and Settings links to it, but navigation
maps it to `/help` while no Expo `/help` route file exists.

Canonicalize direct deep-link and browser-refresh behavior without creating a
second Help implementation.

---

## KV-P0-002 — Enforce Read entitlement on direct routes

Status: TODO

`AppShell` knows `readAccess`, but `ReadProtectedRoute` currently gates direct
Read child routes by authentication token rather than Read entitlement.

Align direct routes, AppShell navigation, and backend authorization with the
separate paid-product contract.

---

## KV-P0-003 — Enforce Create entitlement on direct routes

Status: TODO

`CreateProtectedRoute` currently checks authentication but not `createAccess`.

Keep Create pre-launch and ensure direct Studio access follows the final Create
entitlement contract before launch.

---

## KV-P0-004 — Canonicalize Read/Create AppShell navigation

Status: TODO

`read` and `create` are GuardedScreen values with entitlement checks, but they
are not handled by the current feature-entry/secondary-screen routing branches.

Remove the competing navigation models so gateway navigation, guarded
navigation, persisted navigation, direct routes, and deep links agree.

---

## KV-P0-005 — Reconcile multi-product architecture documentation

Status: TODO

Older architecture documentation says Read should remain preview-only while
later implementation records prove a real native Read module now exists inside
the shared Expo app.

Document the current architecture clearly:

- shared native app shell;
- separate Learn and Read product modules;
- separate entitlements/payments;
- Learn backend on Hetzner;
- Read backend on Render;
- Create still pre-launch.

---

## KV-P0-006 — Preserve useful legacy YKI Practice behavior

Status: TODO

Before deleting the unconsumed legacy `YkiPracticeScreen`, explicitly evaluate
and, if retained, migrate:

- skill-focus selection;
- persisted practice-session resume.

The canonical YKI Practice route should remain the only final learner surface.

---

## KV-P0-007 — Remove orphan exam scaffold screens

Status: DEFERRED - PRE-DELETE GATES REQUIRED

Candidates:

- CEFRLevelScreen
- DetailedFeedbackScreen
- ExamHistoryScreen
- ExamRunnerScreen
- ExportResultsScreen
- SubmissionProcessingScreen
- SubmitExamScreen
- legacy ExamIntroScreen

The seven zero-consumer screens are only five-line scaffolds.

ExamIntro is likewise a scaffold and is currently retained by a stale barrel
export.

Remove them only in a controlled deletion batch after current-tree dependency
and unique-capability gates pass.

---

## KV-P0-008 — Resolve placeholder YKI review route

Status: TODO

`/yki-exam/review` currently has no verified inbound workflow and renders only
a placeholder scaffold.

Either build real answer review as part of the canonical YKI result workflow
or remove the route/screen after deletion gates.

Do not retain a fake review page.

---

## KV-P0-009 — Define and correctly wire YKI certificate capability

Status: TODO

The backend exposes an authenticated YKI session certificate capability, while
the current frontend certificate route is disconnected from that API.

Before exposure:

- define what the certificate represents;
- ensure naming cannot imply unsupported official status;
- bind it to the learner's verified session;
- connect it only from valid results state;
- localize/theme it;
- handle not-issued and error states.

Do not delete the backend capability merely because the current frontend is
incomplete.

---

## KV-P0-010 — Remove Expo template modal

Status: DEFERRED - PRE-DELETE GATES REQUIRED

`apps/client/app/modal.tsx` is default Expo template UI with no verified product
consumer.

Delete it only after the final dependency gate.

---

## KV-P0-011 — Consolidate old packages/ui product screens

Status: TODO

Canonical product routes now supersede the old packages/ui Learn,
LearningSession, ProfessionalFinnish, Progress, Settings, and SpeakingLab
screens.

Before deletion, preserve useful product concepts rather than preserving dead
runtime UI.

In particular, evaluate the existing learning-loop concept:

diagnose -> retrieve -> produce -> schedule

for the future learner-event/adaptive learning architecture.

---

## KV-P0-012 — Consolidate legacy public marketing/web sources

Status: TODO

Compare the old organization/contact/Learn landing source files with the
canonical native public-marketing surfaces.

Preserve useful pilot-partner messaging and CG5/localization provenance, prove
that no build or generation tool depends on the old files, then remove obsolete
duplicates through the normal deletion gate.

---

## KV-P0-013 — Simplify the daily-practice compatibility alias

Status: TODO

`daily-practice` remains in AppShell/persisted-navigation compatibility but maps
to `/learn`, while the current Home action already opens the canonical Learn
experience.

After navigation-state compatibility is understood, remove unnecessary alias
UI/state rather than exposing another learner destination.

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

- prove there are no retained direct importers;
- enumerate every export the candidate provides and prove there are no
  retained consumers;
- inspect re-exports and barrel/index chains;
- inspect dynamic imports, requires, registries and string-based loaders;
- verify route/deep-link/callback/workflow dependencies;
- verify hooks, services, helpers, types, constants, storage/events and API
  dependencies;
- compare the candidate against the canonical implementation for unique
  behavior;
- migrate and validate any unique required behavior before deletion;
- repeat the reverse-dependency audit after migration;
- verify relevant web/Expo/Android/iOS/auth/payment/external dependencies;
- require `PRE_DELETE_DEPENDENCY_GATE=PASS`;
- require `UNIQUE_REQUIRED_CAPABILITY_REMAINING=NO`;
- only then delete stale files, routes, exports and navigation definitions.

A post-deletion build is required but does not replace the pre-deletion
dependency proof.

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
