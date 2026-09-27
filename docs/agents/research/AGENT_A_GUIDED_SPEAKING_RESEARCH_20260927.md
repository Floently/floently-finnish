# Agent A Research — Progressive Guided Speaking

Date: 2026-09-27  
Branch: `feature/build47-guided-speaking-20260927`  
Parent source: drawer-qualified `de321302d56af868d1de5fdd371411c9aa1d8b28`  
Scope: staged speaking UX only; existing Roleplay/voice engines remain authoritative.

## Research gate

`RESEARCH_GATE=PASS`

## External evidence

### Council of Europe — CEFR Companion Volume / descriptors
Sources:
- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- https://rm.coe.int/cefr-companion-volume-with-new-descriptors-2020/16809ea0d4
Accessed: 2026-09-27

Relevant findings:
- A1 spoken interaction is explicitly supported interaction: simple questions/answers on familiar topics, with repetition/rephrasing/help from the interlocutor.
- A2 moves to short routine exchanges and simple conversation on familiar matters.
- B1 can enter familiar conversation with substantially less preparation and sustain it with some support.
- CEFR guidance supports using descriptors to structure a sequence of activities and explain objectives to learners.

Implementation decision:
- do not start beginners with an open scenario;
- make production burden rise stage by stage;
- A1-A2 gets the most visible model language and sentence frames;
- B1-B2 gets reduced support and longer responses;
- C1-C2 gets minimal framing and higher discourse/repair demands.

### Finnish National Agency for Education — YKI
Sources:
- https://www.oph.fi/en/national-certificates-language-proficiency-yki
- https://www.oph.fi/en/education-and-qualifications/selecting-right-yki-test-test-days
Accessed: 2026-09-27

Relevant findings:
- YKI measures functional language proficiency in everyday situations and includes a separate speaking subtest.
- YKI 1=A1, 2=A2, 3=B1, 4=B2, 5=C1, 6=C2.

Implementation decision:
- keep the existing app level bands `A1-A2`, `B1-B2`, `C1-C2`;
- treat level selection as a real change in expected response length, support and language complexity, not a cosmetic badge;
- do not turn Guided Speaking into an unofficial YKI scoring engine.

## Repository findings

1. `apps/client/state/SpeakingRoute.tsx` is the mounted speaking surface coordinator.
2. Existing surfaces are `menu`, `conversation`, and `recorded`.
3. `RoleplayConversationScreen` owns open-ended roleplay. It must remain intact.
4. `RecordedResponseScreen` and Roleplay already reuse `useRoleplayRecorder('fi-FI')`, which is the canonical microphone/STT path.
5. `speakRoleplayText(...)` is the existing Finnish TTS/playback path.
6. Issue #2 owns roleplay scenario-pool isolation/rotation. Guided Speaking must not recreate or pre-empt that work.
7. Drawer Phase 1 intentionally made Everyday and Professional Speaking expandable branches, so Guided Speaking can be inserted as another child without redesigning navigation.
8. Current speaking level bands and profession context are already passed from AppShell to SpeakingRoute.
9. Existing recorder failures already preserve user agency with explicit retry/type guidance; Guided Speaking must not weaken this path.
10. No backend schema, native dependency, entitlement change, or roleplay API change is required for the staged scaffold.

## Product design

Guided Speaking is a scaffold **before** open roleplay, not another roleplay engine.

Deterministic ladder:

1. **Basic chunk** — one useful memorisable line.
2. **Listen and respond** — one short prompt, one short response.
3. **Controlled Q&A** — answer a familiar question.
4. **Sentence frame** — complete a useful frame.
5. **Two-turn exchange** — prompt + response + follow-up.
6. **Short situation** — produce a short functional response in context.
7. **Guided conversation** — combine multiple moves with lighter support.
8. **Open roleplay** — hand off to the existing RoleplayConversationScreen.
9. **Advanced/professional roleplay** — remains the existing profession-specific Roleplay path.

The first seven stages are deterministic guided practice. Stages 8-9 are existing engines/destinations, not duplicated implementations.

## Level contract

### A1-A2
- short, high-frequency Finnish;
- full model line;
- visible sentence frame;
- small support vocabulary;
- expected response typically one short sentence or 2-8 words.

### B1-B2
- familiar practical situations;
- model remains available but frame support is reduced;
- expected response becomes multi-clause / 8-25 words;
- learner must add reason, clarification or follow-up where appropriate.

### C1-C2
- model becomes an example rather than a template;
- minimal lexical support;
- expected response is extended / nuanced;
- repair, qualification, register or explanation is expected.

## Feedback contract

- Guided Speaking does **not** claim pronunciation scoring.
- STT transcript is shown as evidence of what the system heard.
- Completion is based on completing the production attempt, not on a brittle exact-string match.
- The learner can replay the Finnish model before speaking.
- A successful attempt offers one obvious next stage.
- Final guided completion offers the existing open Roleplay as the next action.
- Voice/STT failure must never delete progress or falsely mark pronunciation wrong.

## Localization decision

Do not create a new incomplete translation island in this tranche. Reuse existing translated shell/action labels where possible (`commonBack`, `commonNext`, `commonContinue`, `cardsListen`, `roleplayLevelLabel`, etc.). Finnish model language is learning content, not interface chrome. New interface-only wording should be kept minimal until the next translation-catalog expansion is performed consistently across all enabled languages.

## Rejected alternatives

1. **Modify Roleplay backend to create guided sessions** — rejected; duplicates/openly couples #46 to #2 and increases regression risk.
2. **Score beginner pronunciation from STT text** — rejected; transcript text is insufficient evidence for pronunciation quality and existing evaluation explicitly avoids such claims.
3. **Use random prompts** — rejected; staged progression must be deterministic and testable.
4. **Introduce another recorder/TTS stack** — rejected; reuse canonical voice paths.
5. **Unlock stages through opaque AI scoring** — rejected; progression should be understandable and resilient to STT/provider failure.
6. **Replace open roleplay** — rejected; the proven advanced engine remains the destination after scaffolding.

## Acceptance criteria

1. Speaking has a `guided` surface alongside menu/conversation/recorded.
2. Beginner entry starts at a basic chunk, not a scenario picker.
3. Seven deterministic guided stages increase production burden in order.
4. `A1-A2`, `B1-B2`, and `C1-C2` resolve to materially different support/response expectations.
5. Everyday and Professional contexts both have guided content; profession-specific identity/workplace language is preserved.
6. TTS uses `speakRoleplayText`; STT uses `useRoleplayRecorder`.
7. Existing Roleplay/Recorded screens and APIs are unchanged except for navigation into the new surface.
8. Completing a stage presents the next stage; completing stage 7 presents open Roleplay.
9. Drawer Guided Speaking leaves route through the existing entitlement guard.
10. Permanent tests verify order, level complexity, profession isolation and the existing-engine handoff.
11. No backend/native/billing/auth/production changes.
12. No production OTA or submitted App Store build change.

## Implementation boundary

Planned changes:
- guided-speaking content/model module;
- guided-speaking screen;
- speaking surface type;
- minimal SpeakingRoute integration;
- drawer Guided Speaking leaves + guarded AppShell preset wiring;
- permanent guided-speaking verifier;
- package script / CI invocation only if needed to make the verifier permanent;
- this research record.

`PRODUCTION_ACTIONS=NONE`
