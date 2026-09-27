# KieliValmis UI Exposure Audit

Audit date: 2026-08-15

Source checkpoint:

`55a90904948d1dbaa2386afb5690f6063ef28788`

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

KEEP - CONTEXTUAL - BLOCKED FROM PROMOTION

Phase 0 evidence date:

2026-08-15

Unique useful capability includes:

- workplace incident scenarios
- difficulty / pressure levels
- language targets
- response choices
- best-response reasoning
- written and spoken follow-up tasks
- coaching notes
- intended written-response drafting
- intended live-practice continuation

Current contextual wiring:

- Speaking contains an Incident Lab tile;
- the tile routes to `/professional/incidents`;
- the active profession is not propagated into that route;
- the Incident Lab hook also provides no profession or track;
- the client service therefore defaults to `office`.

Source and runtime audit findings:

- nurse, doctor, and practical-nurse learners can therefore enter from a
  profession-specific Speaking area and receive Office incident content;
- backend work-domain identifiers and paid profession identifiers are not
  currently reconciled;
- the healthcare incident is healthcare-domain content rather than separately
  profession-specific doctor/nurse/practical-nurse content;
- the backend model contains richer fields including language targets,
  response choices, best-response index, follow-up task, and coaching notes;
- most of those fields are discarded by the current client transformation;
- incident scenarios are static;
- no verified roleplay-history ingestion feeds this surface;
- the empty state nevertheless claims incidents appear after workplace
  roleplay and build on situations already handled by the learner;
- `Save draft` is visually presented but has no save action;
- no durable incident-draft persistence path was found;
- all live-practice actions route to generic `/professional`;
- incident identity and active profession are not forwarded into live practice;
- API failure can silently substitute unrelated fallback incidents;
- the screen uses hard-coded English despite existing localized Incident Lab
  translation keys;
- surface-specific professional entitlement enforcement was not proven by the
  targeted audit;
- backend track input should be explicitly validated against supported track
  identifiers.

Retention decision:

KEEP.

Context decision:

KEEP CONTEXTUAL.

The Incident Lab concept fits naturally inside a selected Professional Finnish
profession and as a contextual tool from profession-specific Speaking.

Promotion decision:

BLOCKED.

Do not make it a global or more prominent learner destination until:

- profession/work-domain mapping is canonical;
- the active profession is preserved across navigation;
- incident content is appropriate to the selected profession;
- false personalization/history claims are removed or made real;
- draft saving works or the affordance is removed;
- live practice opens the actual corresponding profession/scenario;
- richer backend pedagogical fields are deliberately used or deliberately
  excluded;
- fallback state cannot masquerade as learner-specific content;
- localization and entitlement behaviour are correct;
- supported backend track IDs are validated;
- full runtime gates pass for each supported profession.

Recommended permanent home:

Professional Finnish -> selected profession -> Incident practice

Secondary contextual entry:

Speaking / roleplay

Drawer exposure:

NO.

Deletion decision:

NO. Unique required workplace-incident capability remains.

Remediation timing:

After the full Phase 0 audit and combined agents-package + ChatGPT
implementation establish the final Professional Finnish taxonomy, learner-event
foundation, and navigation architecture.

---

# D. Active public, secondary, and workflow routes

Phase 0 reconciliation date:

2026-08-15

The broad workflow classification from the initial audit has now been
reconciled against the actual Expo routes, AppShell navigation, inbound
references, auth/onboarding contracts, and YKI workflow transitions.

## Root and public routes

### `/`

Classification:

KEEP - ACTIVE PRODUCT ENTRY

Verified responsibilities include:

- KieliValmis public landing on the Learn host;
- authenticated AppShell entry;
- auth-session hydration;
- Google OAuth completion;
- restoration of authenticated product state.

Deletion decision:

NO.

---

### `/contact`

Classification:

KEEP - ACTIVE PUBLIC ROUTE

The Expo route currently uses the canonical native public-marketing contact
surface.

Deletion decision:

NO.

---

### `/for-organizations`

Classification:

KEEP - ACTIVE PUBLIC ROUTE

The Expo route currently uses the canonical
`NativeForOrganizationsScreen`.

Deletion decision:

NO.

The older organization screens are classified separately below as legacy
content/consolidation candidates.

---

## Active secondary account/product routes

### `/progress`

Classification:

KEEP - ACTIVE SECONDARY ROUTE

The AppShell/drawer actively routes learners to the current Progress
implementation.

The current Progress model still requires the separate real-progress work
already recorded in the roadmap.

Deletion decision:

NO.

---

### `/settings`

Classification:

KEEP - ACTIVE SECONDARY ROUTE

The active Settings route owns current profile, appearance, audio, billing,
support, legal, and account controls.

Deletion decision:

NO.

---

### `/billing/subscription`

Classification:

KEEP - ACTIVE BILLING WORKFLOW

This is the active Learn subscription/access destination and is also used by
guard logic when Learn access is unavailable.

Deletion decision:

NO.

---

## Authentication workflow

Routes:

- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`

Classification:

KEEP - CONTEXTUAL WORKFLOW

These routes are required account/authentication flows.

They must remain reachable when required, but they are not learner-navigation
destinations.

Deletion decision:

NO.

---

## Onboarding workflow

Routes:

- `/onboarding`
- `/onboarding/intent`
- `/onboarding/profession`
- `/onboarding/frequency`
- `/onboarding/plan`

Classification:

KEEP - CONTEXTUAL WORKFLOW

The canonical onboarding contract defines:

- `/onboarding` as the onboarding welcome/start;
- intent, profession, and frequency as active flow steps;
- `/onboarding/plan` as a retained deep-link pricing/plan preview rather than
  the normal post-placement paywall destination.

The active post-placement subscription destination is
`/billing/subscription`.

Deletion decision:

NO.

The stale `/onboarding/welcome` literal found in an unused marketing screen
is not a canonical route.

---

## Help route contract

Guarded screen:

`help`

Configured path:

`/help`

Classification:

KEEP CAPABILITY - ROUTE CONTRACT DEFECT

Evidence:

- Help remains an active AppShell secondary screen;
- Settings links to Help;
- navigation persistence understands the Help screen;
- `SCREEN_PATHS` maps Help to `/help`;
- no Expo `/help` route file exists.

Product decision:

KEEP Help.

Roadmap requirement:

Add or otherwise canonicalize the `/help` deep-link/refresh entry so the
configured navigation path and actual Expo route topology agree.

Deletion decision:

NO.

---

## Card-practice runtime

Classification:

KEEP - CONTEXTUAL RUNTIME

Card practice is an active learning runtime, not a global navigation item.

Deletion decision:

NO.

---

## YKI exam workflow

### `/yki-exam`

Classification:

KEEP - ACTIVE YKI ENTRY

The active `YkiExamScreen` provides the current exam-selection/start
experience.

---

### `/yki-exam/runtime`

Classification:

KEEP - ACTIVE CONTEXTUAL RUNTIME

A verified exam-start transition enters this route.

---

### `/yki-exam/results`

Classification:

KEEP - ACTIVE CONTEXTUAL RESULTS

The runtime can produce persisted exam results and the results screen displays
and exports them.

---

### `/yki-exam/mock-cycle`

Classification:

KEEP - ACTIVE CONTEXTUAL YKI TOOL

The route has verified inbound YKI navigation and a real API-backed mock-cycle
surface.

---

### `/yki-exam/review`

Classification:

DELETE CANDIDATE - PLACEHOLDER ROUTE

Evidence:

- the route file exists;
- no active inbound workflow transition was found;
- `ReviewAnswersScreen` is only a five-line `ExamScreenScaffold`;
- it contains no answer-review implementation.

Deletion is not executed during this Phase 0 documentation pass.

Before removal, rerun the mandatory dependency gate against the route/screen
pair.

---

### `/yki-exam/certificate`

Classification:

KEEP CAPABILITY - BLOCK CURRENT FRONTEND

Evidence:

- no current inbound frontend transition was proven;
- the current Expo certificate screen does not load a session or call the
  certificate API;
- the screen can display only optional props and otherwise explains that the
  route is reachable;
- however, the authenticated backend has a real
  `GET /api/v1/yki/sessions/{session_id}/certificate` route.

Product decision:

Do not expose the current certificate screen as if it were complete.

Do not delete the backend certificate capability.

Before learner exposure:

- define the intended product meaning of this certificate;
- load it from the authenticated learner's verified exam session;
- use truthful naming and claims;
- connect it from the real exam-results workflow only when valid;
- handle missing/not-issued/error states;
- localize and theme the surface;
- validate entitlement and deep-link behavior.

The separate `packages/ui/screens/CertificateScreen.tsx` placeholder and its
re-export chain remain legacy candidates and require their own final
dependency gate before deletion.

---

# E. Floently Read / Create ownership boundary

The previous label `SEPARATE PRODUCT` was insufficient on its own.

The full ownership audit now proves that these route families have intentional
current responsibilities inside the shared native Expo application.

## Floently Read

Routes:

- `/read`
- `/read/auth`
- `/read/app`
- `/read/import`
- `/read/library`
- `/read/reader`
- `/read/settings`
- `/read/analytics`
- `/read/subscribe`

Classification:

KEEP - SEPARATE PRODUCT - ACTIVE NATIVE SUITE MODULE

Verified responsibilities include:

- public Read landing;
- Read-specific auth handoff;
- protected native Read workspace;
- document import by text, URL, and file;
- library state;
- reader/player state;
- reading progress;
- settings;
- analytics;
- Read subscription/purchase/restore;
- external Read API and TTS integration.

Backend ownership remains separate:

- Learn backend: Hetzner Learn service;
- Read backend: Render Read service.

Read must not be inserted into the KieliValmis Learn learning hierarchy merely
for exposure coverage.

### Read access-control blocker

`AppShell` contains explicit `readAccess` entitlement logic.

However, direct Read child routes use `ReadProtectedRoute`, which currently
checks authentication/token state but does not independently enforce
`readAccess`.

Required remediation:

- make direct route/deep-link access enforce the same Read entitlement
  contract;
- verify the Render backend independently enforces paid capability where
  required;
- do not rely only on client-side navigation hiding.

Deletion decision:

NO.

---

## Floently Create

Routes:

- `/create`
- `/create/auth`
- `/create/studio`

Classification:

KEEP - SEPARATE PRODUCT - INTENTIONAL PRE-LAUNCH MODULE

Verified current responsibilities:

- public Create landing;
- Create auth handoff;
- protected coming-soon Studio route.

`/create/studio` is not a finished Create Studio implementation.

It must remain clearly pre-launch until the actual Create product is built.

### Create access-control blocker

`AppShell` understands `createAccess`.

Direct Create routing currently uses `CreateProtectedRoute`, which verifies
authentication but not `createAccess`.

Before Create launch:

- enforce the intended Create entitlement on direct routes;
- define final Creator/Create product and entitlement semantics;
- connect only real Studio functionality;
- keep Read and Create access/payment semantics explicit.

Deletion decision:

NO.

---

## Shared AppShell Read/Create navigation discrepancy

`read` and `create` exist in `GuardedScreen` and entitlement checks.

They are not currently handled by `isFeatureEntryScreen()` or
`isSecondaryScreen()`.

The generic `resolveRequestedRoute()` fallback therefore does not represent a
canonical Read/Create transition and can resolve through the YKI-practice
fallback path.

Direct Expo route navigation currently masks this architectural discrepancy.

Required remediation:

Canonicalize one navigation model for:

- product gateway;
- AppShell guarded navigation;
- direct Expo deep links;
- entitlement enforcement;
- persisted navigation restoration.

---

## Multi-product documentation drift

Older architecture documentation still describes Read as preview-only and
warns against integrating Read source into the Learn repository.

Later implementation records prove that the shared native Expo application now
contains a real native Read module while Read backend/service ownership remains
separate.

Update the architecture documentation during the combined implementation-plan
phase so the current mobile-shell decision is unambiguous.

---

# F. Legacy / orphan / consolidation candidates

## Legacy YKI Practice screen

File:

`apps/client/features/yki-practice/screens/YkiPracticeScreen.tsx`

Classification:

MERGE USEFUL CAPABILITY - THEN DELETE CANDIDATE

Runtime evidence:

- no active runtime consumer was found;
- canonical YKI practice is implemented by
  `apps/client/state/YkiPracticeRoute.tsx`.

The old screen must not be exposed.

However, final deletion is blocked because the old implementation still
contains potentially useful behavior not currently present in the canonical
route:

- learner-selectable focus:
  mixed / reading / listening / writing / speaking;
- persisted practice-session resume.

The canonical route currently starts `mixed` practice directly and does not
restore the old persisted practice session.

Decision:

During the combined YKI implementation phase, explicitly decide whether these
behaviors belong in the final YKI practice experience.

If retained, migrate them into `YkiPracticeRoute`.

Only after that comparison may the old screen pass:

`UNIQUE_REQUIRED_CAPABILITY_REMAINING=NO`

Deletion decision:

NOT AUTHORIZED YET.

---

## FeatureEntry / daily-practice compatibility surface

Guarded screen:

`daily-practice`

Classification:

KEEP - TRANSITIONAL INTERNAL ALIAS / MERGE CANDIDATE

Evidence:

- AppShell still imports and renders `FeatureEntryRoute` for persisted
  `daily-practice` state;
- navigation definitions still include the guarded screen;
- its path maps to `/learn`;
- Home's current Daily Practice action opens the canonical Learning route
  instead;
- the FeatureEntry surface mostly redirects users back to Learn/YKI.

Decision:

Do not expose it as a learner destination.

Keep it temporarily while persisted-navigation/backward-compatibility behavior
is clarified.

Later simplify/remove the alias only after retained navigation state and old
deep-link behavior are proven safe.

Deletion decision:

NOT AUTHORIZED YET.

---

## Zero-consumer exam scaffolds

Files:

- `CEFRLevelScreen.tsx`
- `DetailedFeedbackScreen.tsx`
- `ExamHistoryScreen.tsx`
- `ExamRunnerScreen.tsx`
- `ExportResultsScreen.tsx`
- `SubmissionProcessingScreen.tsx`
- `SubmitExamScreen.tsx`

Classification:

STRONG DELETE CANDIDATES

Evidence:

- each file is only a five-line `ExamScreenScaffold`;
- no active code consumer was found;
- they contain no functional runtime implementation;
- active exam runtime/results functionality exists elsewhere.

They are not product surfaces and must not be exposed.

Deletion execution remains deferred.

Immediately before deletion, rerun the mandatory dependency and unique
capability gates against the then-current tree.

---

## Legacy ExamIntro scaffold

File:

`apps/client/features/exam/screens/ExamIntroScreen.tsx`

Classification:

DELETE CANDIDATE

Evidence:

- it is a five-line scaffold;
- the real YKI exam introduction/start experience is implemented by
  `YkiExamScreen`;
- its detected source dependency is a stale barrel export rather than a
  runtime screen consumer.

Removal must include the stale barrel export and pass the final dependency
gate.

---

## ReviewAnswers route/screen

Files:

- `apps/client/app/yki-exam/review.tsx`
- `apps/client/features/exam/screens/ReviewAnswersScreen.tsx`

Classification:

DELETE CANDIDATE

The screen is only a placeholder and no active transition to the route was
found.

Do not confuse the existence of a route constant with implemented answer
review.

---

## Old packages/ui product screens

Legacy/consolidation candidates:

- `LearnScreen`
- `LearningSessionScreen`
- `ProfessionalFinnishScreen`
- `ProgressScreen`
- `SettingsScreen`
- `SpeakingLabScreen`

Classification:

MERGE USEFUL CONCEPTS - THEN DELETE CANDIDATES

Evidence:

- active state-route implementations already own the corresponding production
  product areas;
- these old screens have no direct active runtime consumer;
- several are only barrel exports;
- the old Settings screen's profile-image concept already exists in the active
  Settings implementation.

Do not expose these screens independently.

Before deletion, preserve any still-useful product concepts in the canonical
roadmap/implementation.

One specifically useful idea is the LearningSession sequence:

- diagnose;
- retrieve;
- produce;
- schedule.

This concept may be reused by the future learner-event/adaptive learning loop,
but dead runtime UI must not be retained merely as design storage.

Active `HomeScreen` and `ApplicationErrorScreen` are NOT deletion candidates.

---

## Legacy certificate placeholder chain

Files include:

- `packages/ui/screens/CertificateScreen.tsx`
- `apps/client/features/exam/components/CertificateCard.tsx`

Classification:

LEGACY PLACEHOLDER / DELETE CANDIDATE

This placeholder chain is separate from the real backend certificate
capability described above.

Run a final consumer/dependency proof before removing it.

---

## Expo template modal

File:

`apps/client/app/modal.tsx`

Classification:

STRONG DELETE CANDIDATE

Evidence:

- it contains default Expo template copy (`This is a modal`);
- no inbound modal route consumer was found;
- it has no KieliValmis product responsibility.

Do not delete during this documentation pass.

Run the mandatory deletion gate immediately before removal.

---

## Legacy public-marketing / web sources

Canonical active public Expo routes currently use:

- `NativeForOrganizationsScreen`
- `NativeContactScreen`
- `KieliValmisLandingScreen`

Legacy candidates include:

- `apps/client/features/marketing/screens/ForOrganizationsScreen.tsx`
- `apps/client/web/ForOrganizationsScreen.tsx`
- `apps/client/web/ContactScreen.tsx`
- `apps/client/web/LearnLandingPage.tsx`

Classification:

MERGE / CONTENT-PROVENANCE AUDIT - THEN DELETE CANDIDATES

No active runtime import was found for the old web pages.

Do not delete them blindly because:

- the older organization page contains potentially useful and honest
  pilot-partner copy;
- `LearnLandingPage.tsx` is referenced as source provenance by the CG5
  localization documents.

Before deletion:

1. compare useful copy/content with the canonical public-marketing surfaces;
2. migrate any product messaging still worth retaining;
3. prove no translation-generation/build tooling reads the legacy source;
4. preserve localization provenance where required;
5. rerun reverse-dependency gates.

No old public screen should remain indefinitely merely as an informal backup.

---

# G. Infrastructure routes

## `+html`

Classification:

KEEP - INTERNAL EXPO/WEB INFRASTRUCTURE

It owns web document metadata/infrastructure behavior and is not a
learner-facing page.

Deletion decision:

NO.

---

## `modal.tsx`

The generic template modal is classified above as a deletion candidate and is
not considered required infrastructure merely because Expo created it.

---

# Phase 0 classification status

The initial six high-value feature audits plus the route-coverage,
active-workflow, Read/Create ownership, and legacy/orphan reconciliation passes
now provide the evidence needed to close the Phase 0 classification inventory.

Phase 0 does NOT authorize immediate exposure or repair of the blocked useful
features.

Phase 0 does NOT authorize immediate deletion merely from a candidate label.

Next sequence:

1. freeze this final classification documentation;
2. combine the agents-package findings with the KieliValmis prospective
   roadmap and these Phase 0 findings;
3. produce one dependency-ordered implementation plan;
4. establish the final navigation, entitlement, learner-event, progress,
   Professional taxonomy, and YKI foundations;
5. return to KEEP-BLOCKED useful features and repair/expose them in their
   intended product homes;
6. execute obsolete-surface deletions only in explicit deletion batches after
   the mandatory gates pass on the then-current tree.

The stale previous plan to simply runtime-test and expose the five strongest
hidden features is superseded by the evidence gathered during Phase 0.

---

# Audit rule

Every learner-facing implementation must have an explicit evidence-backed
disposition.

Allowed dispositions include:

- EXPOSED / ACTIVE;
- CONTEXTUAL WORKFLOW;
- INTERNAL INFRASTRUCTURE;
- ENTITLEMENT-HIDDEN;
- KEEP - BLOCKED FROM EXPOSURE/PROMOTION;
- KEEP CAPABILITY - MERGE CANDIDATE;
- SEPARATE PRODUCT - ACTIVE MODULE, when current repository responsibility is
  proven;
- DELETE CANDIDATE, pending mandatory deletion gates.

`SEPARATE PRODUCT` alone is not a retention reason.

`DIRECT-URL-ONLY` alone is not a retention reason.

A duplicate page must not be retained as a backup.

A deletion candidate must not be removed until reverse dependencies and unique
required capability have been re-proven against the current tree.

A useful blocked feature must not be exposed until its documented correctness,
data, entitlement, navigation, and runtime gates pass.
