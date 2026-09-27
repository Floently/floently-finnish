# Agent F Research — Professional Mission System

Status: Wave 1 research gate
Agent: F
Branch: `agent/f-professional-missions-20260816`
Immutable base: `69813b433838130d5afe4b052360dbfd12df3f40`
Access date for external sources: 2026-08-16

## Questions investigated

1. What does task-based/action-oriented language-learning research imply for a multi-skill professional mission rather than a menu of unrelated exercises?
2. How should workplace Finnish tasks preserve believable purpose, audience, register and continuity across listening, speaking, reading and writing?
3. What profession taxonomy actually controls KieliValmis entitlement today, and how does it differ from the broader Work Path / Incident Lab domain taxonomy?
4. Which current Professional, Work Path, Incident Lab, interview and Roleplay capabilities can be referenced safely without cloning or modifying their engines?
5. How should a Professional mission reference Reading, Writing and Listening while Agents C/D and existing runtime owners remain independent?
6. How should healthcare and other safety-sensitive scenarios be framed so the product teaches Finnish communication rather than professional, medical, legal or safety advice?
7. What content/provenance rules prevent accidental use of YKI or proprietary instructional material?
8. Which uncertainties require integration requirements or deterministic tests instead of speculative runtime changes?

## Existing repository evidence and constraints

### Frozen orchestration contract

`packages/core/schemas/learning.ts` is the frozen Wave-1 source of truth. `TaskDescriptor` already provides the fields Professional missions need at the cross-feature boundary: stable task/content versions, runtime owner, `professional` pathway, skills, CEFR band, duration, modality requirements, entitlement declarations, launch route/params, health, profession, topic, `contextId`, prerequisites and tags. The contract explicitly allows adapters and forbids feature branches from changing the shared contract.

Decision: build a local Professional extension around `TaskDescriptor`; do not edit `learning.ts`.

### Entitled professions are narrower than workplace domains

`packages/core/api/entitlements.ts` defines the sellable/entitled profession keys as exactly:

- `doctor`
- `nurse`
- `practical_nurse`

`apps/client/state/subscriptionStore.ts` and `apps/client/state/ProfessionalRoute.tsx` use the same three keys for professional access/context.

By contrast, `apps/backend/app/services/learning/work_track_service.py` and `apps/backend/app/services/learning/workplace_incident_service.py` define six broad workplace domains:

- healthcare
- construction
- cleaning
- office
- hospitality
- retail

Decision: model **entitled profession** and **work domain** as separate concepts. No Agent-F code may treat construction/office/etc. as newly purchased profession entitlements. A domain-only mission may exist as authored/configuration evidence, but scheduling it requires an explicit compatible audience/domain input and never invents entitlement.

### Current Professional experience is a loose feature menu

`apps/client/state/ProfessionalRoute.tsx` currently presents Cards, Roleplay, interview and Healthcare Report Writing as separate cards. Its profession goals are static summaries, not executable continuity chains.

`apps/client/features/professional/services/workFinnishPathService.ts` reduces the first backend work track to summary cards.

`apps/client/features/learning/services/workplaceIncidentService.ts` reduces an Incident Lab scenario to an isolated prompt/hint.

Decision: add mission descriptors/configuration and narrow adapters rather than rewriting these screens. Agent A can later choose integration wiring after independent review.

### Work Path and Incident Lab contain useful domain signals but are not canonical mission engines

`work_track_service.py` already identifies domain-relevant communication goals (for example healthcare handover, construction hazard escalation, office coordination, hospitality service recovery and retail returns).

`workplace_incident_service.py` contains one scenario per domain and a follow-up activity, but the scenarios are standalone and several include professional-action guidance mixed with language practice.

Decision: adapters may extract domain, communicative goal, register and continuity seeds, but Agent F will author new KieliValmis language-learning mission content instead of copying those scenarios verbatim into a new engine.

### Roleplay is protected and route-owned

`packages/core/api/roleplay.ts` exposes the current Roleplay profession and scenario contracts. `apps/client/features/speaking/data/alternativeScenarios.ts` shows current scenario IDs. `apps/client/state/AppShell.tsx` routes Professional Roleplay/interview into the protected speaking flow; `apps/client/state/navigationModel.ts` maps that guarded surface to `/speaking`.

Decision: mission steps may reference Roleplay through a launch descriptor only. Agent F will not modify Roleplay session ownership, STT/audio, voice identity, persona continuity, scenario registry, `AppShell`, or `navigationModel`.

### Reading and Writing have reserved Wave-1 routes; ordinary Professional Listening does not

Wave-1 governance reserves `/professional/reading` and `/professional/writing` for Agents C and D. The current shared contract has a `listening` runtime, but current repository route inspection found no ordinary Professional Listening route owned outside YKI.

Decision: Reading/Writing mission references use the reserved contract routes and remain descriptor-only on Agent F's branch. Listening steps use the canonical runtime name but are explicitly `unavailable` behind an integration feature flag until Agent A has a real ordinary Professional Listening capability/route to bind. Agent F will not clone YKI listening, reuse formal YKI items, or invent an executable route and mark it healthy.

### Existing interview capability is Roleplay-based

Current Professional interview scenario mappings are:

- nurse → `nurse_interview_beta`
- doctor → `doctor_patient_interview` (currently used by ProfessionalRoute as its doctor interview entry)
- practical nurse → `practical_nurse_interview`

Decision: the interview adapter records these as current repository mappings and points to Roleplay; it does not implement interview conversation logic itself. The doctor mapping is semantically imperfect, so tests will preserve determinism while the handoff records it as a known limitation rather than silently renaming protected Roleplay content.

## External sources and findings

### 1. Council of Europe — CEFR in the classroom / action-oriented approach

Source: Council of Europe, “The CEFR in the classroom” and “Action-orientation in the classroom”.

- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-in-the-classroom
- https://www.coe.int/en/web/common-european-framework-reference-languages/action-orientation-in-the-classroom

Finding in own words: CEFR descriptors are useful for structuring a sequence of activities around transparent objectives, and the action-oriented approach treats the learner as a social agent doing meaningful communicative work rather than merely manipulating forms.

Decision caused: every mission has a real workplace goal, audience, register and outcome; steps change modality while retaining the same `contextId`. CEFR metadata is attached to the mission and descriptors, not used as decorative labels.

Rejected alternative: a profession landing page that simply groups independent skill exercises. It does not create a coherent communicative action or retain context across modalities.

### 2. Council of Europe — transparency/coherence and CEFR professional domain

Sources:

- https://www.coe.int/en/web/common-european-framework-reference-languages/transparency-and-coherence
- https://www.coe.int/en/web/portfolio/the-common-european-framework-of-reference-for-languages-learning-teaching-assessment-cefr-

Finding in own words: CEFR connects objectives, language activities and competences, and explicitly recognises the professional domain. It should be adapted to the concrete context rather than treated as a ready-made task bank.

Decision caused: use level bands and skill metadata as constraints on authored tasks, but do not copy CEFR examples or claim that a mission is an official assessment item.

Rejected alternative: reusing YKI material as a convenient four-skill source. Professional learning and formal YKI semantics/content provenance must stay separate.

### 3. Bryfonski & McKay (2019) — TBLT implementation meta-analysis

Source: Lara Bryfonski & Todd H. McKay, “TBLT implementation and evaluation: A meta-analysis,” *Language Teaching Research* 23(5), 603–632. DOI: 10.1177/1362168817744389.

- https://journals.sagepub.com/doi/10.1177/1362168817744389

Finding in own words: across 52 studies, long-form TBLT implementations showed a strong positive overall effect, with authentic tasks and interaction central to the approach; implementation context and needs analysis matter.

Decision caused: mission configuration is task/goal-first and domain-specific. The catalog does not generate random job-title substitutions over generic prompts.

Rejected alternative: one generic “clarify a problem” template with profession names interpolated. It is cheap but violates task authenticity and creates profession leakage risk.

### 4. Newton & Kusmierczyk (2011) — second languages for the workplace

Source: Jonathan Newton & Ewa Kusmierczyk, “Teaching Second Languages for the Workplace,” *Annual Review of Applied Linguistics* 31, 74–92. DOI: 10.1017/S0267190511000080.

- https://www.cambridge.org/core/journals/annual-review-of-applied-linguistics/article/teaching-second-languages-for-the-workplace/E84BFFD7C0295DD53B35CF3FB0DAB17E

Finding in own words: workplace language is not only specialised vocabulary/formal register; routine interpersonal communication is part of accomplishing work, and workplace language must be understood inside its social setting and community interaction norms. Employment interview language is also a legitimate workplace-learning target.

Decision caused: missions specify audience and register and include routine coordination, repair, escalation and follow-up—not just terminology quizzes. Interview remains a mission adapter into canonical Roleplay rather than a separate engine.

Rejected alternative: vocabulary-first profession packs as the main Professional architecture.

### 5. Kielibuusti — professional language at the workplace

Source: University of Helsinki / Kielibuusti, “Learning professional language at the workplace”.

- https://www.kielibuusti.fi/en/employers/language-learning-at-work/learning-professional-language-at-the-workplace

Finding in own words: professional language proficiency includes choosing language appropriately in work-related interaction and develops through authentic workplace situations, not vocabulary alone.

Decision caused: content has explicit register (`colleague-neutral`, `customer-polite`, `supervisor-concise`, etc.) and each chain ends in a communicative/documentation outcome plus one focused language repair.

### 6. Finnish Institute of Occupational Health — healthcare language and patient safety

Source: Finnish Institute of Occupational Health, “The language question concerns the entire work community”.

- https://www.ttl.fi/en/learning-materials/promoting-social-inclusion-of-nurses-recruited-from-abroad-into-the-work-community/the-language-question-concerns-the-entire-work-community

Finding in own words: healthcare work relies on shared language for understanding needs/instructions, communicating with colleagues and documenting information; workplace language learning is a process and documentation support matters.

Decision caused: healthcare missions combine reception, interaction and documentation, and the safety frame explicitly says the scenario teaches Finnish communication only and does not authorise clinical action or replace workplace procedure/supervision.

Rejected alternative: prescriptive clinical “best action” training inside the language mission. KieliValmis is not a medical decision-support product.

### 7. Finnish Institute of Occupational Health — construction professional multiliteracy

Source: Finnish Institute of Occupational Health, “Professional multiliteracy as a promoter of occupational safety in the construction sector – MonTTu”.

- https://www.ttl.fi/en/research/projects/professional-multiliteracy-as-a-promoter-of-occupational-safety-in-the-construction-sector-monttu

Finding in own words: construction safety communication is multimodal and involves text, sound, images/video and gestures; communication is materially related to safe work coordination.

Decision caused: construction missions centre on understanding/confirming a briefing and reporting a site communication issue, not teaching how to perform hazardous work. The language goal is clarity/confirmation, and the safety notice defers to actual workplace instructions.

### 8. Suomi.fi — regulated healthcare qualifications

Source: Suomi.fi, “Recognition of professional qualifications in Finland”.

- https://www.suomi.fi/company/responsibilities-and-obligations/professional-qualifications-in-different-sectors/guide/professional-qualifications-and-equivalence/recognition-of-professional-qualifications-in-finland

Finding in own words: healthcare roles represented by KieliValmis include regulated professions with formal qualification/authority boundaries in Finland.

Decision caused: mission metadata carries a regulated-context safety frame for doctor/nurse/practical-nurse content. Language-learning completion is never described as professional competence, authorisation or clinical qualification.

## Content provenance and authenticity policy

All new mission texts on Agent F's branch will be original KieliValmis authored examples. Research sources inform design decisions only; source wording, official exam questions, proprietary textbooks and paid-course material are not copied into mission content.

Each mission will include provenance metadata with:

- provenance ID;
- origin (`kielivalmis-original` or `repository-adapter`);
- authoring/review note;
- content version;
- YKI-origin flag fixed to false for this catalog.

Validator rules reject missing provenance and any mission that declares YKI/proprietary origin.

## Engineering decisions

1. Add a pure, typed `packages/core/professional/` mission model and catalog so Agent E/Agent A can consume it without importing moving Agent C/D branches.
2. Extend `TaskDescriptor` locally rather than changing the frozen learning schema.
3. Keep `ProfessionKey` (`doctor|nurse|practical_nurse`) separate from six `ProfessionalWorkDomain` values.
4. Use deterministic mission/step/context IDs and fixed order—no random adaptive behaviour.
5. Require all executable references to canonical runtime names; no Reading/Writing/Roleplay/Listening business logic appears in Agent-F modules.
6. Use `/speaking` for Roleplay launch references and the Wave-1 reserved `/professional/reading` and `/professional/writing` references. Scenario/mission params are descriptor metadata for integration; protected navigation is not modified here.
7. Keep ordinary Professional Listening references `unavailable` behind an explicit integration flag until a canonical launch owner exists. This is safer than pointing to YKI or silently cloning audio/comprehension logic.
8. Provide adapters for Work Track, Incident Lab and interview source shapes that normalize metadata only. They do not evaluate learner responses or make professional decisions.
9. Regulated/safety-sensitive missions require a safety frame stating they are Finnish-language communication practice and that real workplace rules/professional judgement remain authoritative.
10. Tests enforce profession leakage prevention, canonical runtime references, deterministic ordering/context, CEFR/skill validity, malformed rejection, provenance and YKI separation.

## Alternatives rejected

### Rewrite ProfessionalRoute into a new mission UI now
Rejected because it would touch an entitlement-sensitive route while Agent F can deliver the orchestration model independently. Integration wiring belongs to Agent A after source review.

### Fork Reading/Writing/Roleplay/Listening inside Professional
Rejected because Wave-1 explicitly requires canonical shared engines and protected Roleplay behaviour must not be modified.

### Treat six backend work domains as subscription professions
Rejected because current billing/entitlement truth exposes only doctor/nurse/practical nurse. Doing otherwise would create misleading access semantics.

### Use YKI listening runtime/content as the missing Professional listener
Rejected because formal YKI boundaries and content provenance are protected and Professional learning is a distinct pathway.

### Mark a hypothetical `/professional/listening` route as available
Rejected because repository inspection found no current ordinary Professional Listening owner. A descriptor must not claim runnable health when its launch target is unresolved.

### Generate missions randomly from task fragments
Rejected because the same inputs must produce deterministic context/order and random fragments would undermine scenario coherence.

## Uncertainties and containment tests

### Ordinary Professional Listening launch surface
Uncertainty: no canonical route exists on the immutable base.

Containment: listening references are required for four-skill completeness but validate only when marked `unavailable` with the integration feature flag. A test rejects an “available” listening step with no resolved canonical launch. Handoff records an `INTEGRATION_REQUIREMENT` for Agent A.

### Future Agent C/D descriptor params
Uncertainty: Agents C/D may choose specific task-family parameter names on their independent branches.

Containment: Agent F only depends on frozen `TaskDescriptor` route/params shape and uses mission/content reference IDs. Agent A can adapt parameter names during controlled replay without changing mission semantics.

### Roleplay route parameter wiring
Uncertainty: protected `AppShell` currently builds speaking presets internally, so direct descriptor params may require an integration-owned adapter before Practice can deep-launch a scenario deterministically.

Containment: Agent F does not edit navigation. Tests assert the canonical route and scenario mapping; handoff records the integration need.

### Domain-only mission eligibility
Uncertainty: construction/cleaning/office/hospitality/retail content exists in backend Work Path but is not represented by current paid profession entitlements.

Containment: domain catalog entries are not converted into paid-profession entitlement claims. Selection requires an exact domain match, and profession-scoped selection can never return a different profession. Integration must decide future entitlement/product exposure separately.

### Content realism
Uncertainty: authored synthetic examples cannot prove every employer's exact local register/workflow.

Containment: content focuses on communication goals rather than operational procedure; safety notices defer to workplace policy; manual user testing checks believability and register. Content versions make later expert review safe.

## Research gate conclusion

The repository already supplies the stable descriptor boundary, three authoritative entitlement professions, six work-domain signals, a protected Roleplay route and reserved Reading/Writing routes. Research supports goal-oriented, context-retaining workplace tasks with explicit audience/register and authentic communication outcomes. The missing Professional Listening launch surface can be contained safely without inventing or cloning a runtime.

The implementation can therefore proceed as a source-only typed descriptor/configuration layer with deterministic validation/tests, while protected runtime/navigation/entitlement/YKI files remain untouched.

`RESEARCH_GATE=PASS`
