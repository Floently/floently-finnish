# KieliValmis Practice Hub, Four-Skill Learning, and Voice Identity Plan

Established: 2026-08-16

Status: PRODUCT / ARCHITECTURE PLAN — NOT PRODUCTION DEPLOYMENT AUTHORITY

## 1. Why this plan exists

KieliValmis already has valuable practice capabilities distributed across Everyday Finnish, Professional Finnish, YKI, cards, roleplay, speaking, report writing, and contextual professional tools. The long-term product should preserve those pathway-specific homes while also giving the learner one attractive place to **practice without having to decide where to navigate next**.

This plan adds three connected product requirements:

1. a unified **Practice Hub** that composes daily practice from existing and future learning capabilities;
2. complete listening, speaking, reading, and writing development across Everyday Finnish and Professional Finnish, with YKI retaining its own serious four-skill preparation path;
3. a reliable multi-voice identity system so male/female or otherwise explicitly assigned actor voices match the presented persona and YKI dialogues can use distinct speakers.

The Practice Hub must be a composition/orchestration layer. It must not become a competing fourth learning pathway.

The three primary learning pathways remain:

- Everyday Finnish;
- Professional / workplace Finnish;
- YKI preparation.

## 2. Core product model

The product should support two complementary modes of use.

### Exploration mode

The learner may deliberately enter a pathway and choose a capability:

- Everyday Finnish -> vocabulary, listening, speaking/roleplay, reading, writing, grammar/review;
- Professional Finnish -> profession vocabulary, workplace listening, roleplay/interview, reading, writing/documentation, incidents/missions;
- YKI -> reading, listening, writing, speaking, practice, mock/full exam and later planner/review.

### Practice mode

The learner opens **Practice** and KieliValmis builds a coherent short session from the capabilities they are entitled to and ready for.

The learner should not need to jump between menus after each task.

The Practice Hub becomes the orchestration shell around canonical task runtimes, not a duplicate implementation of those runtimes.

## 3. Recommended learner-facing information architecture

### Top-level Practice destination

Recommended label:

- English: `Practice`
- Finnish localization candidate: `Harjoittele` or `Päivän harjoitus`

The exact localized label should be tested for clarity. The product concept is more important than the final wording.

Practice should be a normal user-facing destination alongside the existing primary pathway access, but it should not hide or replace those pathways.

### Practice Hub opening state

The first screen should answer four questions immediately:

1. **What should I do?** — one dominant `Start today's practice` action;
2. **How long will it take?** — 5 / 10 / 20 minute choices, with a sensible default;
3. **What will I practise?** — a compact preview such as `reading + speaking + review`;
4. **Why these tasks?** — one understandable reason such as `Your service phrases are due and speaking has had less practice this week.`

Secondary controls may include:

- All;
- Everyday;
- Professional;
- YKI;
- Review due;
- Walk / Commute when audio-only practice is supported.

These are filters/scopes, not separate duplicated practice engines.

## 4. Pathway-scoped Daily Practice

Each primary pathway should also expose its own `Daily Practice` / `Practice today` action.

### Everyday Finnish daily practice

Only Everyday-compatible tasks enter the queue:

- vocabulary retrieval;
- grammar in context;
- everyday listening;
- everyday roleplay/speaking;
- reading real-life notices/messages;
- everyday writing/replies;
- Phrase Bank review after it becomes truthful and durable;
- Revision Vault items after real learner events exist.

### Professional Finnish daily practice

Only tasks relevant to the learner's selected/entitled profession and mapped work domain enter the queue:

- profession vocabulary;
- workplace listening;
- profession roleplay;
- interview practice;
- professional reading/document comprehension;
- professional writing/documentation;
- Workplace Incident Lab tasks after its profession/context contract is repaired;
- Work Path missions after the canonical professional taxonomy/progression is established;
- due professional corrections/review.

### YKI daily practice

Use a serious four-skill practice composer:

- reading;
- listening;
- writing;
- speaking;
- due weak task types;
- balanced skill exposure;
- level-appropriate material;
- later planner targets and exam-date pressure only when backed by truthful learner data.

YKI daily practice must remain distinct from a timed mock/full exam. The Practice Hub may recommend a mock when appropriate, but must not silently turn a short practice session into an exam.

## 5. The queue must not be truly random

The learner should experience variety, but task selection must be **controlled, explainable interleaving**, not arbitrary shuffling.

Pure randomness can:

- repeat the same easy capability too often;
- overwhelm beginners;
- produce incoherent topic switching;
- neglect weak skills;
- surface the wrong profession;
- surface an unavailable microphone task;
- over-serve vocabulary because cards are easy to schedule.

### Hard filters before ranking

Reject any candidate that violates:

- entitlement;
- profession/work-domain scope;
- learner level / CEFR safety range;
- prerequisite knowledge;
- feature flag or runtime health;
- modality availability (for example microphone unavailable);
- session time budget;
- recent repetition policy;
- YKI exam/practice boundary;
- current product truth rules.

### Suggested first explainable ranking model

The 2026-08-15 transfer proposed a useful starting model:

```text
score =
  0.30 * overdueNeed
+ 0.25 * weaknessNeed
+ 0.15 * goalRelevance
+ 0.15 * skillBalance
+ 0.10 * novelty
+ 0.05 * timeFit
```

These are initial product weights, not scientific constants. They should be tested and revised using learner evidence.

### Coherence bonus

Add a `contextCoherence` or mission-chain factor so consecutive tasks can reinforce the same real-life situation.

Example Everyday session:

1. read a health-centre appointment message;
2. identify the changed appointment time;
3. retrieve `peruttu`, `uusi aika`, `sopia`;
4. write a short reply requesting another time;
5. roleplay the same request by phone;
6. save one recurring mistake for later review.

Example Professional session:

1. listen to a short handover;
2. read a related patient/workplace note;
3. identify the important information;
4. perform a spoken handover roleplay;
5. write a short documentation entry;
6. retry one high-value correction.

This is purposeful interleaving: skills change, but the communicative situation remains understandable.

## 6. Practice session shell

The learner should remain inside one calm session shell.

Recommended structure:

- header: `Today's practice` + time remaining / step count;
- compact pathway and skill chips;
- one task at a time;
- canonical task renderer mounted/entered inside the shell where safe;
- `Skip for now` and `Give me another task` controls;
- no forced back-and-forth through pathway menus;
- save/resume session if the durable session contract supports it;
- post-session summary with what was practised and one recommended continuation.

The shell should not copy business logic from Roleplay, YKI, cards, Reading or Writing. It should pass a task descriptor/context to the canonical owner and collect the resulting learner event.

## 7. Session lengths and recipes

Initial options:

### 5 minutes — Quick practice

Typical 2–3 steps:

- one due retrieval cluster;
- one short reading/listening/application task;
- one retry or mini speaking/writing action.

### 10 minutes — Daily practice

Typical 3–5 steps:

- retrieval/review;
- comprehension;
- production (speaking or writing);
- targeted correction/retry.

### 20 minutes — Deep practice

Typical 5–8 steps:

- review;
- new/context task;
- reading/listening;
- production;
- correction;
- transfer to another modality;
- short summary/recommendation.

Do not pad a session to hit a timer exactly. Time is a constraint, not a gamified obligation.

## 8. Skill balance

Track rolling 7-day and 28-day exposure for:

- vocabulary;
- grammar;
- listening;
- speaking;
- reading;
- writing.

The Practice Hub should prevent one skill from dominating solely because it is easy to schedule.

A learner may still intentionally choose `Vocabulary only` or another focused mode from the pathway surfaces, but the default daily practice should be balanced according to learner goals and needs.

## 9. Four-skill content contract

### Everyday Finnish

Systematically develop:

- listening;
- speaking;
- reading;
- writing

with vocabulary and grammar supporting all four.

### Professional Finnish

Systematically develop profession-specific:

- listening;
- speaking;
- reading;
- writing;
- vocabulary;
- workplace interaction/cultural competence.

The existing Healthcare Report Writing capability is a useful donor/prototype, but it should eventually become one task family inside a canonical professional Writing system rather than remaining the only meaningful writing experience.

### YKI

Maintain explicit separate evidence for:

- reading;
- listening;
- writing;
- speaking.

YKI material/task patterns may inform Everyday/Professional difficulty and task design, but ordinary learning surfaces must not unexpectedly present exam-like difficulty or copy official material without provenance/licensing review.

## 10. Reading progression

Reading difficulty should progress by both language and cognitive demand.

### A1

- individual words and familiar phrases;
- signs, labels, menus, prices, times, opening hours;
- short notices;
- one-line messages;
- find name/date/place/price;
- picture/text matching;
- very limited inference.

### A2

- SMS and chat messages;
- appointment notices;
- simple emails;
- short service instructions;
- short workplace notes;
- explicit main idea and details;
- vocabulary in immediate context.

### B1

- workplace instructions;
- public-service/web notices;
- announcements;
- longer emails;
- short news/information texts;
- narratives;
- main idea, detail and simple inference.

### B2

- longer articles;
- policies/instructions;
- workplace documents;
- opinion texts;
- implied meaning and register;
- information connection across paragraphs.

### C1–C2

- complex authentic-style texts;
- professional documents;
- nuanced argumentation;
- rhetorical intention;
- ambiguity and implication;
- synthesis across sources.

## 11. Writing progression

Writing must be a learning loop, not a one-time correction screen.

Canonical loop:

`understand situation -> plan -> write -> submit -> focused feedback -> revise -> resubmit -> compare improvement -> schedule relevant review`

### A1

- type a missing word;
- names/dates/times;
- 1–3 simple sentences;
- short personal information;
- heavily scaffolded message replies;
- optional phrase/sentence starters.

### A2

- short SMS/chat/email replies;
- cancel/reschedule appointment;
- ask opening time/information;
- short absence/sick message to work;
- simple everyday descriptions;
- roughly 30–70 words where appropriate.

### B1

- service emails;
- complaints/explanations;
- workplace messages;
- narratives;
- practical YKI-like writing;
- approximately 70–150 words depending on genre.

### B2

- formal correspondence;
- workplace documentation;
- structured opinion/explanation;
- incident description;
- register-aware writing;
- reduced scaffolding.

### C1–C2

- precise professional writing;
- nuanced argumentation;
- synthesis;
- complex formal correspondence;
- audience/register shifts;
- high lexical and grammatical precision.

## 12. Writing feedback model

Feedback should prioritize learning rather than maximizing the number of detected errors.

Possible internal dimensions:

- communicative success;
- comprehensibility;
- task/content completion;
- organization/cohesion;
- vocabulary;
- grammar/morphology;
- register/audience appropriateness.

At beginner levels, expose only a small number of high-value corrections.

Recommended default result:

1. what the learner did well;
2. one or two priority improvements;
3. a short explanation of why;
4. one targeted rewrite/retry;
5. compare the retry with the previous attempt;
6. emit truthful `writing_submitted` / `writing_retried` events;
7. send recurring high-value errors into the future review architecture.

Do not automatically rewrite the whole answer and call that learning.

## 13. Attractive presentation without visual overload

The uploaded visual package establishes a useful rule: every visual element should **Teach, Orient, Respond, or Reward**. If it does none of those jobs, it is unnecessary.

### Practice Hub visual identity

Recommended experience:

- calm card/sheet layout with one dominant start action;
- compact animated session path showing 3–6 upcoming moments as icons rather than a long list;
- pathway accent chips for Everyday / Professional / YKI;
- skill icons for listening/speaking/reading/writing/review;
- a subtle scene illustration when it teaches context;
- short transitions between tasks;
- the existing Aurora/progress visual language can show completion/progress once real evidence exists;
- recurring KieliValmis characters may create continuity across tasks when their voice/persona identity is reliable.

### Session transition

A completed task may visually collapse into a small checkmark/node while the next task expands. This creates a sense of flow without forcing navigation.

### Reward rules

Reward real learning events, not taps:

- successful targeted retry;
- genuine mastery threshold;
- balanced daily session completion;
- meaningful streak milestone;
- improvement in a previously weak skill.

Avoid:

- confetti for routine answers;
- constant bouncing CTAs;
- looping animation behind reading/writing;
- sounds for every navigation tap;
- reward animation when the underlying progress did not improve.

### Reading/writing focus mode

When dense reading or a text input is active:

- no decorative looping movement behind the content;
- no ambient audio;
- generous text spacing;
- visible progress/status but low visual noise;
- reduced-motion behavior supported;
- writing autosave state clearly communicated once durable persistence exists.

## 14. `Why this task?` and learner control

Every adaptive session should remain understandable.

Examples:

- `Speaking has had less practice this week.`
- `You missed this service phrase twice.`
- `Your YKI reading practice is behind your other skills.`
- `This continues yesterday's workplace handover mission.`

Learner controls:

- `Skip for now`;
- `Give me another task`;
- `No microphone right now`;
- `Make it shorter`;
- pathway filters;
- sound/reduced-motion preferences.

The system should learn from explicit skips only after the learner-event/privacy architecture defines what may be stored.

## 15. Multi-voice problem — current evidence

Voice identity is still an unresolved product defect and should not be considered closed by earlier attempts.

### Current provider-mapping defect

At the 2026-08-16 reconciled YKI branch, `apps/backend/app/services/tts/voice_registry.py` places:

- `fi-FI-Wavenet-B` in the male pool;
- `fi-FI-Standard-B` in the male pool.

Google Cloud's current official supported-voices documentation classifies both `fi-FI-Wavenet-B` and `fi-FI-Standard-B` as **FEMALE**.

Official source:

``https://cloud.google.com/text-to-speech/docs/list-voices-and-types`

The same official source lists multiple Finnish Chirp 3 HD voices with explicit gender metadata, including examples such as:

- `fi-FI-Chirp3-HD-Charon` — male;
- `fi-FI-Chirp3-HD-Aoede` — female.

The uploaded 2026-08-15 handover independently recorded prior testing that Standard-B had been incorrectly treated as male and suggested Charon/Aoede as verified male/female candidates.

Therefore the current registry comments claiming Wavenet-B/Standard-B are male are not trustworthy and the registry must be corrected from provider evidence and runtime tests.

### Current YKI single-voice defect

At the same current branch, `apps/client/features/exam/services/audioPlayer.ts::playTextAsync()` sends every generated text request with:

- `voicePreference: 'female'`;
- `mode: 'cards'`.

`YkiPracticeRoute` passes an entire `audio_script` string to this helper. A dialogue with multiple speakers therefore has no structured per-speaker voice contract and is expected to play as one female voice unless it uses a separate pre-generated audio source.

This is a direct architectural reason YKI conversations do not currently sound like distinct male/female speakers.

## 16. Voice identity contract

Create one canonical voice-assignment object.

Example:

```ts
export type VoiceIdentity = {
  personaId: string;
  displayName: string;
  actorRole: string;
  gender?: 'male' | 'female' | 'neutral';
  language: 'fi-FI';
  voiceProfile: string;
  provider: string;
  providerVoiceId: string;
  registryVersion: string;
};
```

The exact schema may change, but the contract must separate:

- display/name identity;
- semantic actor role;
- explicitly curated gender where the product uses it;
- product-level voice profile;
- actual provider voice ID.

Do not infer the actor's voice from a random name at synthesis time.

## 17. Roleplay voice acceptance requirements

When a roleplay session starts:

1. resolve the persona/actor;
2. resolve its voice identity once;
3. store that assignment on the session;
4. return the assignment to the client;
5. reuse the same assignment for every AI turn in that session;
6. client passes the exact voice profile/assignment rather than guessing;
7. provider fallback preserves the intended voice identity as closely as possible;
8. cache keys include the resolved voice identity so cached audio cannot cross-contaminate personas.

Acceptance matrix must include:

- male persona -> verified male provider voice;
- female persona -> verified female provider voice;
- stable voice across all turns;
- stable voice after app navigation/reload where the session persists;
- fallback provider preserves intended gender/identity;
- persona display name and spoken actor remain coherent;
- Android/iOS/web playback;
- slow replay where applicable.

## 18. YKI multi-speaker dialogue contract

YKI dialogue/listening content should not be represented only as an opaque single `audio_script` when multiple actors are required.

Recommended model:

```ts
export type DialogueTurn = {
  speakerId: string;
  speakerRole: string;
  personaId?: string;
  gender?: 'male' | 'female' | 'neutral';
  voiceProfile: string;
  text: string;
};
```

A dialogue task should provide ordered turns plus a speaker registry.

### Rendering options

Preferred initial cross-provider-safe implementation:

1. synthesize each speaker turn using the assigned voice;
2. preserve small natural pauses;
3. concatenate/play the ordered segments as one dialogue or as a managed sequence;
4. preserve the same voice for each `speakerId` throughout the task.

Provider-native multi-speaker synthesis may later be used where reliable, but the product contract must not depend on one provider-specific feature.

### YKI acceptance

- two-speaker dialogue uses audibly distinct voices when the task defines two actors;
- male/female actor assignments match configured metadata;
- same actor remains the same voice through the dialogue;
- narrator, if present, is distinct and explicitly configured;
- transcript labels match speaker identities;
- replay and slow/clear mode do not collapse speakers into one voice;
- pre-generated official/licensed audio is never replaced by TTS unless explicitly intended;
- fallback does not silently turn the entire dialogue into one mismatched voice.

## 19. Voice registry verification

Do not trust hard-coded gender comments alone.

Build a verifier that checks the curated KieliValmis registry against provider-supported voice metadata where available, plus a small manually verified fixture set.

Minimum permanent tests:

- every production Finnish provider voice exists;
- every voice has expected provider gender metadata when the provider exposes it;
- no production male profile resolves to a provider voice classified female;
- no production female profile resolves to a provider voice classified male;
- roleplay persona fixtures resolve deterministically;
- dialogue speakers remain distinct where required;
- provider fallbacks have explicit mappings;
- unknown/unavailable voices fail to a safe documented voice rather than random guessing.

A short human auditory acceptance pass is still required before promotion because metadata cannot prove pronunciation quality or perceived speaker suitability.

## 20. Priority and sequencing

### Do now — documentation only

- preserve the uploaded Director Transfer package in GitHub;
- add stable roadmap IDs for Practice Hub and multi-voice work;
- record the current voice evidence/defects;
- preserve production forward-only rules.

### After current production-source reconciliation closes

1. finish Phase-1 navigation/access/object-ownership foundations;
2. correct and verify the voice registry/provider mapping as a tightly scoped reliability package if it is still broken on the current canonical head;
3. create multi-speaker YKI dialogue contract and tests;
4. establish learner-event/task descriptor foundations;
5. implement Practice Hub composer behind a feature flag using existing safe tasks first;
6. build shared Reading and Writing engines/content contracts;
7. connect pathway-scoped daily practice;
8. connect truthful Progress/adaptive recommendations;
9. add visual/reward refinement after behavior/data truth is stable.

### Production rule

No Practice Hub, Reading/Writing engine, or voice repair is authorized for deployment merely because this document exists.

Every implementation package must:

- start from the then-current forward canonical lineage;
- preserve production ancestry;
- pass feature-specific tests;
- pass the protected whole-product invariant gates;
- build one immutable candidate artifact from the exact tested Git commit;
- pass post-deploy canaries before acceptance.

## 21. Success criteria

The plan succeeds when:

- learners can intentionally explore Everyday, Professional and YKI capabilities;
- learners can also open one Practice destination and receive a coherent balanced daily session without menu hopping;
- each pathway offers its own scoped daily practice;
- sessions feel varied without being uncontrolled randomness;
- reading/writing/listening/speaking all appear over time at appropriate levels;
- task selection is explainable;
- real learner events drive progress/review;
- visual richness supports context and motivation without disrupting focus;
- roleplay actor names/personas consistently use the intended voice;
- YKI multi-speaker conversations use stable, distinct speaker voices;
- voice provider mappings are verified rather than guessed;
- none of this work regresses the live server or currently released mobile applications.
