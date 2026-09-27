# Reading/Writing deterministic progression research — 2026-09-27

## Research gate

`RESEARCH_GATE=PASS`

Branch: `feature/build47-reading-writing-progression-20260927`  
Base: exact-green Professional Phase 6 head `577a2175c4650d4fd40eb8038eef6b67ca7eaa2c`

## Current repository truth

KieliValmis already has mature shared Reading and Writing engines:
- Reading: typed task validation, level-specific scaffolding, multiple question families, retry/correction, result hooks and Everyday/Professional access control.
- Writing: understand → plan → write → focused feedback → revise → compare, deterministic authored feedback checks, attempt history and fail-closed access.
- Professional mission adapters already feed both canonical engines.

The current bottleneck is authored breadth:
- canonical Reading bank: 5 tasks total (4 Everyday, 1 Professional);
- canonical Writing bank: 5 tasks total (3 Everyday, 2 Professional);
- Reading/Writing level types stop at B2;
- Reading's current task selector displays only the level, which becomes ambiguous as soon as a level has multiple tasks;
- route-level resolution returns the first matching level task but there is no explicit deterministic next-task contract.

## External evidence rechecked

### Council of Europe — CEFR/action-oriented progression

Current CEFR guidance treats learners as social agents and organises language use around reception, production and interaction in meaningful contexts. The framework is intended to support transparent progression rather than a single undifferentiated difficulty scale.

Sources:
- https://www.coe.int/en/web/common-european-framework-reference-languages/the-user/learners-as-a-social-agent
- https://www.coe.int/en/web/common-european-framework-reference-languages/action-orientation-in-the-classroom
- https://www.coe.int/en/web/portfolio/the-common-european-framework-of-reference-for-languages-learning-teaching-assessment-cefr-

Decision:
- extend current Reading/Writing level types through C1/C2;
- keep one canonical runtime per skill;
- increase task complexity through text length, inference/argument demands, register, organisation and independence—not merely harder vocabulary.

### Kielibuusti — writing and workplace language practice

Kielibuusti recommends regular Finnish writing, summarising texts, and using real workplace/digital communication situations as language practice. Its workplace materials span reading and writing and describe practical communication tasks such as meetings and customer service.

Sources accessed 2026-09-27:
- https://www.kielibuusti.fi/en/learn-finnish/language-learning-tips/language-tips/tips-for-writing
- https://www.kielibuusti.fi/en/learn-finnish/learning-materials-and-courses/find-online-learning-materials/tyoelaman-suomea
- https://www.kielibuusti.fi/en/employers/language-learning-at-work/tips-for-supporting-finnish-learners

Decision:
- expand with authentic everyday and workplace genres rather than abstract grammar drills;
- keep texts original KieliValmis material;
- make written tasks audience/register specific;
- keep professional content language-focused, fictional and privacy-safe.

## Phase 7 target

### Canonical Reading bank
- Everyday: exactly 12 authored tasks — 2 each at A1, A2, B1, B2, C1, C2.
- Professional: exactly 8 authored generic tasks — 2 each at B1, B2, C1, C2.
- Existing Professional mission Reading tasks remain additive and profession-specific.

### Canonical Writing bank
- Everyday: exactly 12 authored tasks — 2 each at A1, A2, B1, B2, C1, C2.
- Professional: exactly 8 authored generic tasks — 2 each at B1, B2, C1, C2.
- Existing Professional mission Writing tasks remain additive and profession-specific.

### Deterministic progression contract
1. Every task has a stable unique ID and immutable authored content version.
2. Canonical order is explicit: pathway → CEFR level → authored task order.
3. Level deep links always resolve to the first authored task at that level.
4. “Next task” uses canonical order, never random selection.
5. After the final task at a level, Next advances to the first task of the next available level in the same pathway.
6. No next task crosses Everyday ↔ Professional or profession entitlement boundaries.
7. Multiple tasks at one level are identified by title + level, never by duplicate level-only chips.
8. Opening/completing one task does not imply mastery of the level.
9. No durable learner progression is invented; this phase defines deterministic curriculum navigation only.

## Level design

- A1: very short notices/messages; explicit details; highly scaffolded short writing.
- A2: short connected practical texts; simple sequencing; service and scheduling messages.
- B1: connected everyday/workplace texts; main idea + inference; clear multi-part writing.
- B2: denser texts with qualifications/exceptions; reasoned, organised writing with register control.
- C1: longer nuanced texts; implication, stance and synthesis; precise audience-aware writing with competing constraints.
- C2: subtle register/stance and information-status distinctions; concise synthesis or reformulation without overclaiming.

## Safety / non-goals

- Do not rewrite Reading or Writing engines.
- Do not add AI-generated runtime content.
- Do not claim CEFR certification from task completion.
- Do not copy YKI, textbook or paid-course items.
- Do not add durable mastery/progress persistence without a reviewed learner-evidence owner.
- No auth/billing/schema/native/dependency change.
- No production deploy, OTA, App Store or TestFlight action.

`PRODUCTION_ACTIONS=NONE`
