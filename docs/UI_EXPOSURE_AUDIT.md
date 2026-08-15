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

DIRECT-URL-ONLY

Built capabilities include:

- add Finnish phrase
- translation
- context
- phrase strength
- saved phrase statistics
- card-style review entry
- roleplay entry

Recommended product home:

Everyday Finnish

Secondary future entry:

Progress / recommendations

---

## Revision Vault

Route:

`/learn/revision-vault`

Classification:

DIRECT-URL-ONLY

Built capabilities include:

- due-now count
- protected items
- spaced-review buckets
- next action
- start review
- add more learning material

Recommended product home:

Everyday Finnish

Secondary future entry:

Progress / recommendations

---

## Confidence Tracker

Route:

`/learn/confidence`

Classification:

DIRECT-URL-ONLY

Built capabilities include:

- confidence vs accuracy
- calibration score
- overconfidence
- underconfidence
- weakest-calibration detection
- suggested speaking practice

Recommended product home:

Everyday Finnish or Progress

Long-term recommendation:

Integrate this evidence into the richer Progress system instead of leaving
it as an isolated metric page.

---

## YKI Planner

Route:

`/learn/planner`

Classification:

DIRECT-URL-ONLY

Built capabilities include:

- target level
- weekly focus
- milestones
- milestone status
- next-best action
- YKI practice entry
- mock-exam entry

Recommended product home:

YKI pathway

Secondary future entry:

Progress / recommendations

---

## Work Finnish Path

Route:

`/professional/work-path`

Classification:

DIRECT-URL-ONLY

Built capabilities include:

- profession-aware learning track
- next mission
- mission list
- mission status

Recommended product home:

Professional Finnish

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

## Phase 3 — orphan cleanup

After exposure work is stable:

- inspect duplicate/legacy components
- preserve unique functionality
- remove confirmed obsolete implementations
- simplify GuardedScreen/navigation definitions
- add automated UI-exposure invariants

---

# Audit rule

A learner-facing production feature should have at least one intentional
discoverable entry point unless it is explicitly classified as:

- CONTEXTUAL
- INTERNAL
- SEPARATE PRODUCT
- ENTITLEMENT-HIDDEN

New direct-URL-only product surfaces should fail future exposure review.
