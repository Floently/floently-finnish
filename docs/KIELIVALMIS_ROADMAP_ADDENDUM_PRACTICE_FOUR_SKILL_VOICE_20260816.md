# KieliValmis Roadmap Addendum — Practice Hub, Four-Skill Learning, and Multi-Voice Identity

Established: 2026-08-16

Status: ACTIVE ROADMAP ADDENDUM

This document extends `docs/PROSPECTIVE_IMPROVEMENTS.md` and `docs/KIELIVALMIS_COMBINED_IMPLEMENTATION_PLAN.md` without changing their production-safety rules.

The items below are stable roadmap requirements and must not be lost during future AI/human handoffs.

---

# Practice orchestration

## KV-PRACTICE-001 — Unified Practice Hub

Status: TODO — DESIGN ACCEPTED, IMPLEMENTATION DEFERRED UNTIL CURRENT SOURCE RECONCILIATION/FOUNDATIONS ARE SAFE

Build one learner-facing Practice destination that can compose a coherent daily session from KieliValmis learning capabilities without forcing the learner to navigate between pathway menus after every task.

The Practice Hub is an orchestration layer, not a new competing learning pathway.

It may draw eligible tasks from:

- Everyday Finnish;
- Professional Finnish;
- YKI preparation;
- due vocabulary/review;
- roleplay/speaking;
- listening;
- reading;
- writing;
- professional report/documentation tasks;
- Workplace Incident Lab after its profession/context contract is truthful;
- professional missions after canonical taxonomy/progress exists;
- Phrase Bank and Revision Vault only after their learner data becomes truthful/durable;
- later pronunciation/commute capabilities when implemented.

Acceptance:

1. learner can enter one Practice destination and complete a multi-step session without menu hopping;
2. canonical task runtimes remain the implementation authority — Practice must not duplicate Roleplay, YKI, Cards, Reading or Writing business logic;
3. learner sees a clear session length and a compact preview of the planned skills/pathways;
4. one task appears at a time inside a calm session shell;
5. `Skip for now` and `Give me another task` are available where pedagogically/safely appropriate;
6. completed task collapses into a compact completion marker while the next task becomes primary;
7. session ends with a truthful summary of what was practised and a sensible continuation recommendation;
8. no task is included if entitlement, profession, level, feature health, modality or other hard constraints fail;
9. Practice is covered by navigation/back/deep-link/resume and cross-platform regression tests;
10. no Practice implementation is promoted by replacing a newer production lineage.

Recommended eventual normal navigation label:

`Practice`

Final information architecture and route name must be reconciled with current AppShell/navigation authority before implementation.

---

## KV-PRACTICE-002 — Pathway-scoped Daily Practice

Status: TODO

Every primary KieliValmis pathway should expose a scoped daily-practice entry while preserving direct access to individual capabilities.

### Everyday Finnish Daily Practice

Eligible task families include:

- vocabulary retrieval;
- grammar in context;
- everyday listening;
- everyday roleplay/speaking;
- level-appropriate reading;
- level-appropriate writing;
- truthful Phrase Bank/Revision review when those systems are ready.

### Professional Finnish Daily Practice

Eligible task families include:

- profession vocabulary;
- workplace listening;
- profession roleplay;
- interview practice;
- professional reading/document comprehension;
- professional writing/documentation;
- Workplace Incident Lab after repair;
- Work Path/professional missions after taxonomy/progress canonicalization;
- due professional corrections/review.

The queue must respect the selected/entitled profession and canonical work-domain mapping.

### YKI Daily Practice

Eligible task families include:

- reading;
- listening;
- writing;
- speaking;
- weak-skill tasks;
- due corrections/retries;
- later planner targets when real learner data exists.

YKI Daily Practice is not the same as a timed mock/full exam. The product must preserve that distinction.

Acceptance:

- each pathway has a clear `Practice today`/equivalent action;
- scope is enforced as a hard filter;
- global Practice may mix pathways only when the learner selects/allows that scope and entitlement/goal evidence permits it;
- pathway practice uses the same central session composer rather than creating three separate scheduling engines.

---

## KV-PRACTICE-003 — Controlled interleaving and session composer

Status: TODO

Practice should feel varied, but task order must not be truly random.

Hard filters run before scoring:

- entitlement/access;
- selected/entitled profession and mapped work domain;
- CEFR/learner-level safety;
- prerequisites;
- feature flag/runtime health;
- modality availability (for example microphone/audio);
- target session length;
- recent repetition policy;
- YKI practice/exam boundary;
- production truth/fallback policy.

Initial explainable ranking factors should include:

- overdue review need;
- weak-skill need;
- learner goal relevance;
- rolling skill-balance need;
- novelty/context transfer;
- time fit;
- context/mission coherence.

A useful historical starting model from the 2026-08-15 transfer is:

`0.30 overdueNeed + 0.25 weaknessNeed + 0.15 goalRelevance + 0.15 skillBalance + 0.10 novelty + 0.05 timeFit`

Those weights are tunable product hypotheses, not fixed scientific constants.

Add a context-coherence factor so sequential tasks can reinforce one real-life situation rather than feeling like disconnected random exercises.

Example Everyday chain:

1. read a health-centre appointment message;
2. answer one comprehension question;
3. retrieve `peruttu`, `uusi aika`, `sopia`;
4. write a short reply requesting another time;
5. roleplay the same request by phone;
6. schedule one recurring mistake for later review.

Example Professional chain:

1. listen to a short workplace handover;
2. read the related note;
3. identify important information;
4. perform a spoken handover roleplay;
5. write a short documentation entry;
6. retry one high-value correction.

This is purposeful interleaving: modality changes while the communicative context remains coherent.

---

## KV-PRACTICE-004 — Practice session length and recipes

Status: TODO

Initial learner options:

- 5 minutes — Quick practice;
- 10 minutes — Daily practice;
- 20 minutes — Deep practice.

Guidance:

### 5 minutes

Usually 2–3 steps:

- one due retrieval cluster;
- one short comprehension/application task;
- one retry or mini production action.

### 10 minutes

Usually 3–5 steps:

- retrieval/review;
- comprehension;
- production (speaking or writing);
- targeted correction/retry.

### 20 minutes

Usually 5–8 steps:

- review;
- new/context task;
- reading/listening;
- production;
- correction;
- transfer to another modality;
- short summary/recommendation.

Do not pad sessions merely to satisfy a timer. Session duration is a constraint and expectation, not a gamified obligation.

---

## KV-PRACTICE-005 — Skill-balance guard

Status: TODO

Maintain rolling 7-day and 28-day exposure for at least:

- vocabulary;
- grammar;
- listening;
- speaking;
- reading;
- writing.

The composer should prevent vocabulary/cards from dominating simply because they are easy to schedule.

Skill balance must still respect learner goals. For example, an upcoming YKI target may appropriately increase weak YKI skill exposure, while a Professional learner may receive more profession-specific production.

The learner may still manually choose focused practice (for example `Writing only`) from pathway surfaces. The balance guard governs the default mixed daily practice, not user-selected deliberate focus.

---

## KV-PRACTICE-006 — Explainable daily-practice recommendations

Status: TODO

Every composed/adaptive session should provide a short understandable reason.

Examples:

- `Speaking has had less practice this week.`
- `You missed this service phrase twice.`
- `Your YKI reading practice is behind your other skills.`
- `This continues yesterday's workplace handover mission.`
- `Two review items are due today.`

Do not expose opaque model scores to learners.

Provide learner controls such as:

- `Skip for now`;
- `Give me another task`;
- `No microphone right now`;
- `Make it shorter`;
- pathway scope filters;
- sound/reduced-motion preferences.

---

# Four-skill learning

## KV-LEARN-006 — Shared Reading learning system

Status: TODO

Build a canonical Reading task/runtime/content contract reusable by Everyday Finnish, Professional Finnish, YKI practice and the Practice Hub.

Do not create unrelated duplicate Reading engines per pathway.

Reading progression must control both linguistic and cognitive demand.

### A1

- individual words and familiar phrases;
- signs, labels, menus, prices, times and opening hours;
- very short notices/one-line messages;
- find a name/date/place/price;
- picture/text matching;
- very limited inference.

### A2

- SMS/chat messages;
- appointment notices;
- simple emails;
- short service instructions;
- short workplace notes;
- explicit main idea/details;
- vocabulary in immediate context.

### B1

- workplace instructions;
- public-service/web notices;
- announcements;
- longer emails;
- short information/news texts;
- narratives;
- main idea, detail and simple inference.

### B2

- longer articles;
- policies/instructions;
- workplace documents;
- opinion texts;
- implied meaning/register;
- information connections across paragraphs.

### C1–C2

- complex authentic-style texts;
- professional documents;
- nuanced argumentation;
- rhetorical intention;
- ambiguity/implication;
- synthesis across sources.

Task/question types may include:

- word/picture matching;
- locate information;
- multiple choice;
- ordering;
- true/false/insufficient evidence where pedagogically appropriate;
- main idea;
- detail;
- inference;
- vocabulary in context;
- author/speaker intention;
- synthesis.

YKI task patterns may inform task design and difficulty. Official/certified material must not be copied into ordinary learning surfaces without provenance/licensing authorization.

---

## KV-LEARN-007 — Shared Writing learning system

Status: TODO

Build a canonical Writing learning system reusable by Everyday Finnish, Professional Finnish, YKI practice and Practice Hub.

Canonical learning loop:

`understand situation -> plan -> write -> submit -> focused feedback -> revise -> resubmit -> compare improvement -> schedule relevant review`

Writing must not be a one-time AI correction box.

### A1

- missing word/short form fields;
- names/dates/times;
- 1–3 simple sentences;
- short personal information;
- heavily scaffolded message replies;
- optional phrase/sentence starters.

### A2

- short SMS/chat/email replies;
- appointment cancellation/rescheduling;
- opening-time/information requests;
- simple absence/sick message to work;
- everyday descriptions;
- roughly 30–70 words where genre permits.

### B1

- service emails;
- complaints/explanations;
- workplace messages;
- narratives;
- practical YKI-like writing;
- roughly 70–150 words depending on genre.

### B2

- formal correspondence;
- workplace documentation;
- structured explanation/opinion;
- incident description;
- register-aware writing;
- reduced scaffolding.

### C1–C2

- precise professional writing;
- nuanced argumentation;
- synthesis;
- complex formal correspondence;
- audience/register shifts;
- high lexical/grammatical precision.

Internal evaluation dimensions may include:

- communicative success;
- comprehensibility;
- task/content completion;
- organization/cohesion;
- vocabulary;
- grammar/morphology;
- register/audience appropriateness.

Beginner feedback should expose only the most useful few corrections at a time.

Default learner-facing feedback should include:

1. what the learner did well;
2. one or two priority improvements;
3. short explanation of why;
4. one targeted rewrite/retry;
5. comparison of retry with previous attempt;
6. truthful learner-event output for progress/review.

Do not automatically rewrite the complete answer and call that learning.

The existing `HealthcareReportWritingScreen` is a useful Professional Writing donor/prototype. Its current local keyword/length heuristic evaluator must not become the final shared Writing authority.

---

## KV-LEARN-008 — Four-skill Everyday Finnish pathway

Status: TODO — EXPANDS EXISTING KV-LEARN-001

Everyday Finnish must systematically develop:

- listening;
- speaking;
- reading;
- writing;

with vocabulary and grammar supporting those skills.

The pathway should preserve direct capability access and also offer Everyday Daily Practice through the central composer.

Use real-life Finland contexts such as:

- appointments;
- transport;
- shopping;
- housing;
- healthcare;
- services;
- daycare/school/family logistics;
- work-adjacent everyday communication;
- social interaction.

---

## KV-LEARN-009 — Four-skill Professional Finnish pathway

Status: TODO — EXPANDS EXISTING KV-LEARN-002

Every entitled/supported profession must systematically develop profession-specific:

- listening;
- speaking;
- reading;
- writing;
- vocabulary;
- workplace interaction/cultural competence.

Professional Reading should include role-appropriate notices, notes, instructions, documents and communication.

Professional Writing should absorb useful current report-writing capability and expand to additional genres appropriate to the profession.

Professional Daily Practice should compose profession-scoped tasks through the central Practice composer.

The profession/work-domain taxonomy must be canonical before broader Work Path/Incident Lab content is allowed to masquerade as profession-specific personalization.

---

## KV-LEARN-010 — Four-skill YKI Daily Practice integration

Status: TODO — EXPANDS EXISTING KV-LEARN-003

YKI practice must keep explicit evidence for:

- reading;
- listening;
- writing;
- speaking.

The Practice Hub/YKI Daily Practice composer should balance those skills using level, recency, weakness and due corrections.

Writing should remain a particularly strong KieliValmis YKI capability.

Short daily practice must remain distinct from timed mock/full-exam mode.

---

# Multi-voice identity and dialogue

## KV-VOICE-002 — Correct provider voice gender/identity registry

Status: TODO — CURRENT DEFECT CONFIRMED 2026-08-16

Current reconciled source contains a concrete provider-mapping defect.

`apps/backend/app/services/tts/voice_registry.py` currently places:

- `fi-FI-Wavenet-B` in the male voice pool;
- `fi-FI-Standard-B` in the male voice pool.

Google Cloud's current official supported-voice documentation classifies both as **female**.

The current official Google list also exposes Finnish Chirp 3 HD voices with explicit gender metadata, including examples:

- `fi-FI-Chirp3-HD-Charon` — male;
- `fi-FI-Chirp3-HD-Aoede` — female.

The 2026-08-15 transfer independently recorded prior testing that Standard-B had been wrongly treated as male and identified Charon/Aoede as preferred male/female candidates.

Required work:

1. audit every production Finnish TTS voice against current provider metadata;
2. remove incorrect gender assumptions/comments;
3. define curated provider mappings for each product voice profile;
4. verify runtime provider availability/credentials/quality before promotion;
5. preserve explicit fallback behavior;
6. add permanent registry tests so a male product profile cannot resolve to a provider voice currently classified female, and vice versa;
7. add a small human auditory acceptance pass because metadata alone does not prove pronunciation quality or perceived suitability.

Do not fix this by randomly deriving gender from names at synthesis time.

---

## KV-VOICE-003 — Canonical persona-to-voice identity contract

Status: TODO

Create one canonical voice identity contract linking product persona/actor identity to the actual synthesized provider voice.

A future schema may contain:

- persona ID;
- display name;
- semantic actor role;
- explicitly curated gender/voice identity metadata where used;
- language/locale;
- product voice profile;
- provider;
- provider voice ID;
- registry version.

Roleplay requirements:

- resolve actor/persona once when the session starts;
- resolve voice identity once;
- persist it with the session;
- reuse the same voice for every AI turn;
- client receives and uses the exact voice profile/assignment instead of guessing;
- fallback preserves intended identity as closely as possible;
- TTS cache keys include resolved voice identity;
- persona name and audible speaker remain coherent;
- same session retains voice after navigation/reload when session persistence allows it.

Acceptance matrix includes at least:

- male persona -> verified male provider voice;
- female persona -> verified female provider voice;
- stable voice across turns;
- stable voice after reload/resume;
- Android/iOS/web playback;
- replay/slow mode;
- provider fallback identity preservation.

---

## KV-VOICE-004 — YKI multi-speaker dialogue audio contract

Status: TODO — CURRENT SINGLE-VOICE ARCHITECTURAL DEFECT CONFIRMED 2026-08-16

Current YKI practice can pass an entire `audio_script` string to `audioPlayer.playTextAsync()`.

The current `playTextAsync()` implementation requests:

- `voicePreference: 'female'`;
- `mode: 'cards'`.

Therefore a generated two-speaker YKI dialogue represented only as one script has no structured per-speaker voice assignment and is expected to render as one female voice unless it uses a separate pre-generated audio asset.

This must be redesigned for dialogue content requiring multiple speakers.

Canonical content model should support ordered dialogue turns plus a speaker registry, for example:

- speaker ID;
- speaker role;
- persona ID where applicable;
- gender/voice metadata where explicitly curated;
- voice profile;
- text.

Cross-provider-safe initial renderer:

1. synthesize each speaker turn with the assigned verified voice;
2. preserve natural short pauses;
3. play/concatenate the ordered segments through the managed audio session;
4. maintain the same voice for each speaker throughout the task.

A reliable provider-native multi-speaker implementation may later replace this, but the product contract must not depend on one provider-specific feature.

Acceptance:

- two-speaker dialogue sounds audibly distinct when two actors are defined;
- male/female actor metadata matches verified provider voices;
- same actor remains the same voice through the dialogue;
- optional narrator is separately and explicitly assigned;
- transcript speaker labels match audible speakers;
- replay/slow mode preserves speaker identity;
- pre-generated/certified audio is not silently replaced by TTS unless explicitly intended;
- fallback does not collapse the whole dialogue into one mismatched speaker without an explicit degraded-mode decision.

---

## KV-VOICE-005 — Voice registry/provider verification CI

Status: TODO

Add source-controlled verification for the curated Finnish voice registry.

Minimum permanent checks:

- every production voice profile resolves;
- every configured provider voice exists in the maintained provider fixture/current validation source;
- gender/identity metadata is consistent;
- roleplay persona fixtures resolve deterministically;
- multi-speaker dialogue fixtures produce distinct assignments when expected;
- fallback mapping is explicit;
- unknown voice/profile fails safely rather than randomly guessing;
- current voice registry version is included in diagnostic output;
- provider-specific availability probes remain separate from deterministic no-network CI.

A human release check should sample representative male/female Finnish voices for pronunciation and speaker suitability.

---

# Dependencies and implementation order

These additions do **not** authorize immediate production deployment.

Recommended order:

1. finish current production-source reconciliation and protected whole-product gates;
2. complete Phase-1 navigation/access/object-ownership foundations;
3. repair/verify provider voice mappings if current canonical evidence still proves the defect — this can be a tightly scoped reliability package because it affects existing user-facing audio;
4. define YKI structured multi-speaker dialogue contract and permanent tests;
5. establish canonical learner-event/task-descriptor/durable learner-data foundations;
6. implement Practice composer behind a feature flag using existing known-safe task types first;
7. build shared Reading and Writing contracts/runtimes;
8. connect pathway-scoped Daily Practice;
9. connect truthful Progress/Revision/adaptive recommendations;
10. refine motion/art/rewards only after learner behavior and data truth are stable.

No old transfer starter branch/workspace becomes production directly. Every implementation must be replayed forward from the then-current canonical production lineage according to `PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`.