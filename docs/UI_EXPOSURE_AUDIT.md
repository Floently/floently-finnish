# KieliValmis UI Exposure Audit

Audit date: 2026-08-15

Source checkpoint:

`d7c2e178bc06f8af6881106c5b58921523a8632d`

## Purpose

Determine whether learner-facing functionality that is already built is
actually reachable through normal product UI.

A source file or Expo route is not automatically a user-facing product
surface. Old implementations, internal workflow screens, callbacks,
onboarding steps, and separate products must not be exposed merely because
they exist.

## Static inventory

The initial read-only audit found:

- 46 Expo route files
- 16 GuardedScreen values
- 14 AppShell-rendered screen values
- 7 active drawer destinations
- 14 state Route components
- 49 learner-facing Screen candidates
- 10 components with no detected code reference
- 7 barrel-only/reference candidates
- 34 Expo routes outside SCREEN_PATHS

These counts are discovery evidence, not automatic defect counts.

---

# Expose-or-delete policy

KieliValmis must not retain unused learner-facing pages, duplicate route
implementations, abandoned screens, or dead navigation surfaces merely
because they may be useful later.

Every page or learner-facing screen must end in exactly one of these states:

1. **EXPOSED**
   - intentionally reachable from the product UI;

2. **CONTEXTUAL / INTERNAL WITH VERIFIED RETENTION REASON**
   - not globally exposed, but actively required by a current production
     workflow;

3. **DELETE**
   - no justified active role remains.

A decision to retain a non-exposed page requires verifiable evidence.

## Mandatory pre-deletion dependency proof gate

No page, component, route, hook, service, helper, type, constant, registry,
or feature directory may be deleted until reverse-dependency evidence proves
that retained code does not depend on anything it provides.

This gate applies even when the candidate appears unused in the UI.

Before deletion, prove all of the following:

1. **Direct-import proof**
   - no retained source imports the candidate;

2. **Export-consumer proof**
   - no retained source consumes any default, named, type, interface, class,
     constant, hook, helper, or other export provided by the candidate;

3. **Re-export / barrel proof**
   - no retained barrel or index file exposes the candidate to another
     consumer;

4. **Dynamic-loading proof**
   - no retained `import()`, `require()`, lazy loader, registry, lookup table,
     plugin map, or string-based loader points to it;

5. **Navigation proof**
   - no retained route, redirect, deep link, callback, drawer item, home
     action, workflow transition, or URL contract requires it;

6. **Shared-function proof**
   - no retained feature relies on hooks, services, helpers, storage keys,
     events, callbacks, API wrappers, constants, or types supplied only by the
     code being removed;

7. **Unique-capability proof**
   - compare the candidate with the canonical implementation and identify any
     behavior that exists only in the candidate;

8. **Migration-before-deletion proof**
   - if unique required behavior exists, migrate and validate that behavior
     first, then repeat the dependency proof;

9. **Platform/external proof**
   - verify Expo, web, Android, iOS, authentication, payments, callbacks,
     deep links, store review flows, and external documented consumers where
     relevant.

A clean build after deletion is a secondary validation step. It is not a
replacement for this pre-deletion proof.

Deletion is allowed only after the evidence record explicitly states:

`PRE_DELETE_DEPENDENCY_GATE=PASS`

and:

`UNIQUE_REQUIRED_CAPABILITY_REMAINING=NO`

After deletion, run a second validation gate covering stale references,
lint/type checks, navigation invariants, affected runtime flows, and
platform implications.

Acceptable retention evidence includes at least one of:

- imported and invoked by an active production flow;
- required Expo / platform infrastructure;
- required authentication, onboarding, callback, reset, or payment flow;
- required child screen of an active multi-step workflow;
- unique currently-required functionality that does not exist in the
  canonical implementation;
- required compatibility/deep-link surface with an explicit documented
  consumer.

The following are NOT sufficient reasons to retain a page:

- it might be useful later;
- it existed in an older design;
- it is exported from an index/barrel file;
- it has no errors;
- it contains code that looks useful;
- another implementation already replaced it;
- deleting it feels risky without first checking references.

If useful code exists only in a deprecated screen, move the useful logic
into the canonical implementation and then delete the deprecated screen.

Separate-product code is not automatically exempt. If Read or Create code
belongs in another repository and has no verified runtime responsibility in
this repository, it should be removed here after links/redirects are safely
redirected to the correct product.

Git history is the archive. Dead source files should not be used as an
informal backup mechanism.

---

# Classification

## A. Confirmed normal UI surfaces

### Everyday Finnish

Status: EXPOSED

Current visible entry includes:

- vocabulary flashcards
- everyday roleplay

The richer learning tools documented below are not currently visible from
this hub.

### Professional Finnish

Status: EXPOSED

Current pathway includes:

- profession vocabulary
- profession roleplay
- interview practice
- healthcare report writing
- profession goals

### YKI Practice

Status: EXPOSED

The current implementation is `apps/client/state/YkiPracticeRoute.tsx`.

Do not expose the separate unreferenced
`features/yki-practice/screens/YkiPracticeScreen.tsx` merely because that
older implementation still exists.

### YKI Exam

Status: EXPOSED

Runtime/results/review/certificate/mock-cycle routes are workflow surfaces
and should remain contextual unless a product requirement says otherwise.

### Progress

Status: EXPOSED

Progress was discovered as built but insufficiently exposed and was added
to the drawer during this post-release work.

### Settings

Status: EXPOSED

### Subscription / billing

Status: EXPOSED

### Cards

Status: CONTEXTUAL / EXPOSED

Cards are reached from learning pathways and do not require their own
top-level drawer destination.

### Speaking

Status: CONTEXTUAL / EXPOSED

Speaking is entered from learner tasks and pathway actions. It does not
need to become a top-level drawer item solely to satisfy this audit.

### Help

Status: CONTEXTUAL / EXPOSED

---

# B. Built product features that are currently direct-URL-only

These are the highest-value exposure candidates.

They must receive runtime validation before being added to normal
navigation.

## Personal Phrase Bank

Route:

`/learn/phrase-bank`

Classification:

KEEP - BLOCKED FROM EXPOSURE

Phase 0 evidence date:

2026-08-15

Built capabilities include:

- add Finnish phrase
- translation / meaning
- context
- phrase strength
- saved phrase statistics
- intended card-style review entry
- intended roleplay entry

Source and runtime audit findings:

- direct route exists and serves successfully;
- active GET currently builds the learner-facing bank from
  `_sample_phrase_entries()`;
- active POST appends to the generated response but does not durably persist
  the phrase;
- the separate learning repository is process-memory storage and is not wired
  into the active `/api/v1/learning/phrase-bank` router path;
- client API failure handling can silently replace real learner state with
  fallback sample data;
- failed saves can be represented locally as successful temporary objects;
- no verified Roleplay/Speaking -> Phrase Bank write path was found;
- no phrase-specific review route was found;
- the current review CTA points to generic `/cards`, whose Phrase Bank
  behavior is not established.

Retention decision:

KEEP.

Justification:

This surface contains unique and strategically valuable learner capability.
A personal collection of Finnish phrases tied to real workplace, speaking,
writing, and everyday situations fits the KieliValmis product direction.

Exposure decision:

BLOCKED.

Do not expose it in normal navigation until:

- storage is authenticated, learner-specific, and durable;
- read and write paths use the same real source of truth;
- production fallbacks cannot fabricate learner state or successful saves;
- Roleplay capture is real and tested;
- Phrase Bank review has a verified phrase-specific destination;
- localization and full runtime gates pass.

Recommended product home after remediation:

Everyday Finnish

Secondary future entry:

Progress / recommendations

Deletion decision:

NO. Unique required learner capability remains.

---

## Revision Vault

Route:

`/learn/revision-vault`

Classification:

KEEP - BLOCKED FROM EXPOSURE

Phase 0 evidence date:

2026-08-15

Built capabilities include:

- due-now count
- protected items
- spaced-review buckets
- next action
- intended start-review action
- intended add-more workflow
- revision-priority calculation

Source and runtime audit findings:

- direct route exists and serves successfully;
- active GET currently builds the queue from `_sample_revision_entries()`;
- learner-specific mistakes are not the demonstrated source of the queue;
- client API failure handling can silently show fabricated fallback state;
- fallback state currently reports 19 due and 42 protected items;
- no verified learner-error/correction ingestion path was found;
- the underlying revision-prioritisation service is real and should be kept;
- `Start today's review` routes to generic `/cards`;
- no Revision-Vault-specific card-review mode was found;
- `Add more` routes to generic `/learn`;
- `Add to your phrase bank` also routes to `/learn`, which does not match
  the CTA label.

Retention decision:

KEEP.

Justification:

The Revision Vault provides a distinct and valuable learning capability:
prioritising weak language for spaced repair and reuse. That capability fits
KieliValmis and should become part of the real learner-progress system.

Exposure decision:

BLOCKED.

Do not expose it in normal navigation until:

- revision entries come from real authenticated learner activity;
- learner revision state is durable and account-specific;
- sample and fallback state cannot masquerade as real learner progress;
- mistake/correction ingestion is implemented and tested;
- the review CTA reaches a verified vault-specific review experience;
- CTA labels and destinations are consistent;
- full runtime gates pass.

Recommended product home after remediation:

Everyday Finnish

Secondary future entry:

Progress / recommendations

Deletion decision:

NO. Unique required revision-prioritisation capability remains.

---

## Confidence Tracker

Route:

`/learn/confidence`

Classification:

KEEP - BLOCKED FROM EXPOSURE

Phase 0 evidence date:

2026-08-15

Built capabilities include:

- confidence vs accuracy
- calibration analysis
- overconfidence detection
- underconfidence detection
- weakest-calibration detection
- actionable confidence/knowledge interpretation
- intended targeted practice recommendation

Source and runtime audit findings:

- direct route exists and serves successfully;
- the confidence algorithm/service is meaningful reusable capability;
- active GET currently builds state from `_sample_confidence_signals()`;
- no verified authenticated learner-signal ingestion path was found;
- client API failure handling can silently substitute fabricated confidence
  state;
- fallback data currently includes calibration 74%, overconfidence 18%,
  underconfidence 11%, and sample skill entries;
- current `calibrationScore` is an average absolute confidence/accuracy gap,
  meaning perfect calibration evaluates to 0 despite the UI presenting it as
  a conventional score;
- current overconfidence and underconfidence rates are counts multiplied by
  10 instead of true percentages;
- skill-specific practice CTAs all route to `/speaking`, so weak reading,
  listening, or writing areas do not currently receive targeted practice.

Retention decision:

KEEP.

Justification:

Separating confidence from actual language control is a distinctive and useful
capability. It can prevent the system from confusing hesitation with lack of
knowledge and can improve adaptive recommendations.

Exposure decision:

BLOCKED.

Do not expose it in normal navigation until:

- confidence data comes from real authenticated learner events;
- aggregation is durable and learner-specific;
- sample/fallback state cannot masquerade as learner progress;
- calibration and rate metrics are mathematically and semantically correct;
- recommendations route to the correct skill-specific practice;
- full runtime gates pass.

Recommended permanent home after remediation:

Progress

Long-term recommendation:

Integrate this evidence into the richer Progress system instead of leaving
Confidence Tracker as an isolated metric page.

Deletion decision:

NO. Unique required confidence-calibration capability remains.

Remediation timing:

After the combined agents-package + ChatGPT implementation phase establishes
the final learner-event/data foundation.

---

## YKI Planner

Route:

`/learn/planner`

Classification:

KEEP - BLOCKED FROM EXPOSURE

Phase 0 evidence date:

2026-08-15

Built capabilities include:

- readiness calculation
- risk and strength ranking
- weekly study-time calculation
- skill-focused weekly blocks
- next-best actions
- intended milestones
- YKI practice entry
- mock-exam entry

Source and runtime audit findings:

- direct route exists and serves successfully;
- the study-plan algorithm is meaningful reusable capability;
- active GET currently uses `_sample_study_signals()`;
- active planner preferences are hard-coded to 35 minutes/day, five days/week,
  B1, and Office;
- no verified real learner study-signal source feeds the active planner;
- no verified learner preference source feeds the active planner;
- `target_level` is present in the preference model but does not currently
  affect the readiness calculation;
- the UI's `Target level` value is actually derived from the readiness band;
- client API failure handling can silently substitute a fabricated B1/B2
  four-week plan;
- milestone status is generated from list position rather than learner
  completion evidence;
- later generated milestones can therefore be labelled `done` without proof
  that the learner completed them;
- next-milestone practice routes to generic `/yki-practice` rather than the
  actual recommended section/task;
- the empty-state copy promises planning around `real progress`, which is not
  yet the demonstrated data source.

Retention decision:

KEEP.

Justification:

A personalized YKI planner is highly aligned with KieliValmis. The existing
engine contains reusable logic for prioritising weak skills, balancing
maintenance work, respecting study capacity, and constructing weekly practice.

Exposure decision:

BLOCKED.

Do not expose it in normal navigation until:

- performance signals are real, durable, learner-specific, and YKI-specific;
- availability and target preferences come from the learner;
- target level and readiness band have correct separate semantics;
- readiness scoring is calibrated and defensible for its learner-facing claim;
- milestone completion reflects actual progress;
- fallback/sample plans cannot masquerade as learner plans;
- recommendations open the appropriate skill/task;
- plan cycles respond to subsequent practice and mock-exam results;
- full runtime gates pass.

Recommended product home after remediation:

YKI pathway

Secondary future entry:

Progress / recommendations

Deletion decision:

NO. Unique required YKI planning capability remains.

Remediation timing:

After the combined agents-package + ChatGPT implementation phase establishes
the final learner-event, YKI-performance, preference, and progress-data
foundation.

---

## Work Finnish Path

Route:

`/professional/work-path`

Classification:

KEEP CAPABILITY - BLOCK SURFACE - MERGE CANDIDATE

Phase 0 evidence date:

2026-08-15

Useful capability identified:

- structured work tracks
- professional core tasks
- language targets
- speaking scenarios
- writing tasks
- vocabulary clusters
- intended mission sequencing
- intended next-mission concept
- intended professional progression

Source and runtime audit findings:

- direct route exists and serves successfully;
- the Work Path client always selects `payload.tracks?.[0]`;
- it does not consume the learner's selected profession or active professional
  context;
- the first backend track is Healthcare Finnish;
- the backend professional overview separately recommends Office;
- the overview's current next mission is also Office-specific;
- displayed track and next mission can therefore contradict one another;
- client API failure handling can silently show fabricated Healthcare state;
- fallback mission status can imply progress without learner evidence;
- normal mission status is generated from array position;
- no verified durable mission-progress source was found;
- the screen has no mission CTA and does not open real learning activities;
- the existing canonical Professional Finnish route already uses the learner's
  entitled/selected profession;
- that canonical route already opens profession-specific vocabulary,
  workplace roleplay, interview practice, and report writing;
- current entitlement professions and backend work-domain taxonomy do not
  describe the same set of identifiers;
- learner-visible text is hard-coded rather than localized;
- the screen contains hard-coded light-theme colors.

Retention decision:

KEEP THE CAPABILITY.

Exposure decision:

BLOCK THE STANDALONE SURFACE.

Canonicalization recommendation:

Prefer integrating useful Work Path progression and mission concepts into the
existing canonical Professional Finnish experience.

Do not create two competing Professional Finnish hubs unless a genuinely
different learner journey is proven.

Required remediation / merge proof:

- reconcile profession and work-domain taxonomy;
- use the learner's selected and entitled profession;
- unify recommended track, displayed track, and next mission;
- introduce real learner mission progress;
- connect missions to actual learning experiences;
- support every intended profession consistently;
- localize the surface;
- use canonical palette/theme tokens;
- validate entitlement behaviour;
- eliminate fabricated fallback progress.

Deletion decision:

NOT AUTHORIZED YET.

The standalone route/screen becomes a deletion candidate only after useful
capability has been migrated into the canonical Professional Finnish
architecture and the required reverse-dependency and unique-capability gates
pass.

Required future deletion markers:

`PRE_DELETE_DEPENDENCY_GATE=PASS`

`UNIQUE_REQUIRED_CAPABILITY_REMAINING=NO`

Intended final product home:

Professional Finnish

Remediation timing:

After the full Phase 0 audit and combined agents-package + ChatGPT
implementation establish the final professional-learning architecture.

---

# C. Built feature that is contextual but under-prominent

## Workplace Incident Lab

Route:

`/professional/incidents`

Classification:

CONTEXTUAL

Current code contains a contextual route into this surface from the
speaking flow.

Built capabilities include:

- profession-specific incidents
- urgency
- written Finnish response
- best-action hint
- live-practice action

Recommendation:

Keep contextual access but also evaluate adding a visible entry from the
Professional Finnish pathway.

---

# D. Workflow routes — intentionally contextual

These should not automatically become drawer entries:

- authentication routes
- password reset routes
- onboarding steps
- card-practice runtime
- YKI exam runtime
- YKI results
- YKI review
- YKI certificate
- YKI mock cycle

Classification:

INTENTIONALLY CONTEXTUAL

---

# E. Separate product surfaces

The `/read/*` and `/create/*` route families belong to separate product
experiences.

Classification:

INTENTIONALLY SEPARATE PRODUCT

They must not be inserted into the KieliValmis Learn learner drawer merely
to satisfy route-exposure coverage.

Product-level linking may exist elsewhere, but access, UI shell, and
billing boundaries remain separate unless the product architecture is
explicitly changed.

---

# F. Legacy / orphan candidates — do not expose

## Legacy YKI Practice screen

File:

`apps/client/features/yki-practice/screens/YkiPracticeScreen.tsx`

Classification:

LEGACY / DUPLICATE CANDIDATE

The active application currently implements YKI practice through
`apps/client/state/YkiPracticeRoute.tsx`.

Action:

Audit for any unique functionality before eventual deletion or
consolidation.

---

## Legacy FeatureEntry / daily-practice surface

Guarded screen:

`daily-practice`

Classification:

LEGACY / ALIAS CANDIDATE

It maps to `/learn` and largely directs the learner back to Learn.

Do not create a new drawer destination for it.

---

## Unreferenced exam-screen candidates

The static audit found no active code reference for:

- CEFRLevelScreen
- DetailedFeedbackScreen
- ExamHistoryScreen
- ExamRunnerScreen
- ExportResultsScreen
- SubmissionProcessingScreen
- SubmitExamScreen

Classification:

ORPHAN / LEGACY AUDIT REQUIRED

These are not automatically product pages.

Before removal, compare them against the current YKI exam runtime and
confirm that they contain no unique required functionality.

---

## Old packages/ui screen candidates

Candidates include:

- LearnScreen
- LearningSessionScreen
- ProfessionalFinnishScreen
- ProgressScreen
- SettingsScreen
- SpeakingLabScreen

Classification:

LEGACY / DUPLICATE AUDIT REQUIRED

The current app has active route/state implementations for these product
areas.

Do not expose these old components independently.

---

# G. Infrastructure / non-product routes

Examples:

- `+html`
- modal infrastructure

Classification:

INTENTIONALLY INTERNAL

---

# Exposure plan

## Phase 1 — runtime validate the five strongest hidden features

Validate directly in the isolated localhost app:

- `/learn/phrase-bank`
- `/learn/revision-vault`
- `/learn/confidence`
- `/learn/planner`
- `/professional/work-path`

Confirm:

- page renders
- authentication survives
- API calls work
- empty state works
- back navigation works
- actions lead to valid destinations
- theme/layout are acceptable
- no production changes required

## Phase 2 — expose validated features through their correct hubs

Do not overload the global drawer.

Recommended information architecture:

Everyday Finnish:
- Flashcards
- Everyday roleplay
- Personal Phrase Bank
- Revision Vault
- Confidence / learning insight

YKI:
- Practice
- Planner
- Mock/full exam

Professional Finnish:
- Vocabulary
- Roleplay
- Interview
- Report Writing
- Work Finnish Path
- Incident Lab

## Phase 3 — remove non-canonical surfaces

For every duplicate, legacy, orphan, or non-exposed candidate:

1. prove an active retention reason, or
2. migrate any unique required functionality into the canonical surface,
   then delete the obsolete implementation.

Do not retain alternate screens as backups.

After removal:

- simplify GuardedScreen/navigation definitions;
- remove stale Expo routes;
- remove stale barrel exports;
- remove stale imports and route literals;
- run lint and navigation verification;
- validate affected runtime flows;
- add automated expose-or-delete invariants.

---

# Audit rule

A learner-facing production feature must have an intentional discoverable
entry point.

A non-exposed page may remain only when its verified runtime purpose is
documented in this audit.

Allowed retained classifications are therefore:

- EXPOSED
- CONTEXTUAL — with active-flow evidence
- INTERNAL — with infrastructure/workflow evidence
- ENTITLEMENT-HIDDEN — but discoverable when entitled

`SEPARATE PRODUCT` alone is not a retention reason inside this repository.

A page that has no verified current responsibility must be deleted.

New direct-URL-only product surfaces and unjustified duplicate screens
should fail future exposure review.
