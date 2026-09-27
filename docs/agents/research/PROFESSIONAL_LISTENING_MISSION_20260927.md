# Build 47 Phase 9 — Professional Mission Listening Research

Date: 2026-09-27  
Branch: `feature/build47-professional-listening-20260927`  
Base: `59deb5cba973c29d7f3f5d3ca231e357c12b9dd0`

## Goal

Fill the only missing skill in the accepted Professional mission chain with a real, deterministic listening runtime while preserving the existing profession-specific mission context.

This phase does **not** modify YKI listening, Roleplay session behavior, backend TTS routing, authentication, billing, or production state.

## Repository findings

The accepted Professional mission catalog already contains one original `audio-script` receive step for each currently supported profession:
- nurse — `nurse-shift-handover`
- doctor — `doctor-follow-up-explanation`
- practical nurse — `practical-nurse-daily-care-update`

Each receive step shares the same `contextId` as that mission's speaking, reading, writing and correction steps. The scripts are marked KieliValmis-original and explicitly not sourced from YKI, textbooks or paid courses.

The current mission integration deliberately leaves Listen unavailable while Speak, Read and Write are adapted to canonical runtimes. Professional Listening therefore needs a separate runtime adapter; repurposing the protected YKI player would blur the formal YKI/practice boundary.

The repository already has two reusable lower-level capabilities:
1. `packages/core/api/voice.ts::requestVoiceTts` — canonical authenticated voice/TTS request API.
2. `apps/client/features/shared/services/audioSession.ts` — shared managed playback with native/web handling.

The implementation can therefore avoid changing protected backend TTS code or adding a native dependency.

## External evidence

### Council of Europe — CEFR descriptors / reception
Sources:
- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- https://www.coe.int/en/web/common-european-framework-reference-languages/reception
- https://rm.coe.int/cefr-companion-volume-withnew-descriptors-2018/1680787989

Accessed: 2026-09-27

Relevant findings:
- CEFR treats listening as a reception activity in which the learner processes spoken input and constructs meaning from contextual cues.
- Reception descriptors distinguish listening purposes such as understanding interaction, announcements/instructions and audio recordings.
- B1-oriented examples include understanding or relaying clearly articulated workplace instructions and task-related information.

Design consequence:
The task should require extracting consequential details from a short workplace message, not merely recognising isolated vocabulary.

### Council of Europe — learner as social agent / action orientation
Source:
- https://www.coe.int/en/web/common-european-framework-reference-languages

Accessed: 2026-09-27

Relevant finding:
The CEFR frames the learner as a social agent and supports action-oriented tasks.

Design consequence:
Each listening task remains tied to the mission's real communicative goal and immediately prepares the next speaking step in the same fictional workplace situation.

### Kielibuusti — professional language at work
Sources:
- https://www.kielibuusti.fi/en/employers/language-learning-at-work/learning-professional-language-at-the-workplace
- https://www.kielibuusti.fi/en/career-and-study-advisors-and-heis/internship-advisors/what-are-professional-language-skills
- https://www.kielibuusti.fi/en/employers/language-learning-at-work/tips-for-supporting-finnish-learners

Accessed: 2026-09-27

Relevant findings:
- Professional language skill is functional language use in work-related interaction, not vocabulary knowledge alone.
- Workplace language varies by profession, recipient, situation and communication channel.
- Clear, calm speech and linguistic models support learners' participation.

Design consequence:
Use profession-specific workplace messages from the accepted mission catalog, ordinary clear Finnish TTS, and questions about information status, timing, uncertainty and intended follow-up.

## Product decisions

### 1. Deterministic, authored content
No runtime text generation and no random selection. The exact mission receive script is the listening stimulus. Each supported mission gets exactly two authored comprehension questions with stable IDs and answer keys.

### 2. Dedicated Professional listening adapter
Create a Professional-only task model/runtime. Do not import the YKI audio player, YKI task schemas, YKI scoring, or Roleplay session engine.

### 3. Reuse only lower-level shared audio infrastructure
Create a thin Professional listening audio service using:
- `requestVoiceTts(... mode: 'speaking_practice' ...)`
- shared `audioSession.playManaged`

No backend route modification and no new dependency.

### 4. Truthful TTS labelling
The UI will describe this as generated/synthesized practice audio when used. It will not imply a human recording or official workplace audio.

### 5. Transcript fallback without false listening completion
A learner may explicitly use the text transcript for accessibility or when audio is unavailable. Transcript fallback allows the learner to continue the language task, but the result must distinguish `audio` from `transcript-fallback`; using the transcript must not be represented as successful audio listening.

### 6. Simple staged flow
One obvious next action:
1. Listen.
2. Answer two fixed comprehension questions.
3. Review completion and continue to the mission's speaking step.

The transcript remains hidden by default. A clear transcript-support action is available and becomes automatic if audio is unavailable.

### 7. Entitlement and mission identity
The route must require authenticated Professional access (or existing internal all-access semantics), resolve only the active/entitled profession's mission task, and fail closed for mismatched/unknown task IDs.

### 8. Safety boundary
The mission's existing regulated-language safety notice remains visible. Questions test understanding of the fictional communication only and never ask the learner to make clinical or operational decisions.

## Acceptance criteria

1. New canonical client route `/professional/listening` exists.
2. Each of nurse, doctor and practical nurse resolves exactly one deterministic mission listening task.
3. Each task uses the accepted mission's exact `audio-script`, mission/context/profession identity, and exactly two stable authored questions.
4. No YKI listening code or formal-exam semantics are imported.
5. No Roleplay session engine is imported.
6. TTS uses the canonical voice API plus shared audio session only.
7. Audio failure gives an explicit transcript fallback and never dead-ends the learner.
8. Transcript fallback is not labelled as completed audio listening.
9. Mission chain marks Listen available only because the new runtime now exists, and Listen becomes the primary mission step.
10. Professional hub removes the obsolete “Listening is not available yet” copy.
11. Successful audio-based completion may use the Phase-8 semantic completion feedback, but feedback must not own state.
12. Existing Speak, Read, Write, Cards, Roleplay, Interview and Report Writing access remains intact.
13. Permanent regression tests cover task determinism, profession isolation, route ownership, fallback truthfulness and the updated mission-chain contract.
14. Full exact-head CI/governance qualification must pass before handoff.

## Non-goals

- no durable mastery claim;
- no new database table or migration;
- no generated adaptive listening content;
- no YKI exam simulation;
- no healthcare competence assessment;
- no production deployment or release action.
