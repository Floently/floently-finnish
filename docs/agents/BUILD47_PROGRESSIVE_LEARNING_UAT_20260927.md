# Build 47 combined device UAT — 2026-09-27

Candidate source: `661f3d298c90f8e0c9971dce9a99cb73e721644d`  
Candidate branch: `integration/build47-source-candidate-20260927`

This is the product-owner/device acceptance script for the combined Build 47 learner-experience candidate. It does not authorize deployment, OTA publication, TestFlight/App Store action, self-merge, production-data mutation, or any learner-only bypass.

## Preconditions

- Use the exact candidate source/build under test and record its SHA.
- Use normal authenticated test accounts and the real entitlement paths being tested.
- Start from a clean app launch before each major section.
- Do not add debug UI, storage edits, route shortcuts, or future-stage unlock bypasses solely to make UAT easier.
- For later Guided Speaking boundaries, use profiles whose legitimate stored history already reached the required stage.
- For locked/signed-out paths, use real unentitled and signed-out states.
- Capture screenshots or short recordings for any FAIL/BLOCKER and record the exact step.

## A. Progressive drawer and guarded navigation

1. Open the drawer from Home at a narrow phone width.
2. Confirm only major destinations are visible initially.
3. Expand Everyday → Speaking.
4. Confirm Guided Speaking, Roleplay and existing speaking destinations appear only after expansion.
5. Expand another Everyday sibling and confirm the previous sibling collapses.
6. Open Guided Speaking from the drawer.
7. Reopen the drawer and confirm the current branch is identifiable/restored.
8. Repeat the expansion/restoration check for Professional Finnish with an entitled profession.
9. Verify an unentitled professional destination cannot be opened through the drawer.
10. With a screen reader, confirm parent rows announce expanded/collapsed state and remain easy to activate.

Expected: one clear branch at a time; expanding never navigates; a leaf navigates once and closes the drawer once; entitlement authority remains outside the drawer.

## B. Guided Speaking — first-time learner and frontier progression

1. Open Everyday → Speaking → Guided Speaking with no Guided Speaking history.
2. Confirm Stage 1 only is current and no future-stage grid/list is visible.
3. Confirm History is absent before any stage has been passed.
4. Listen to the Stage 1 model.
5. Move to Speak and make a genuine microphone attempt.
6. Complete the stage.
7. Confirm Stage 2 becomes the current frontier.
8. Open History and confirm Stage 1 is available to repeat while Stage 3+ is absent.
9. Repeat Stage 1 and complete the repeat.
10. Confirm the learner returns to Stage 2, not Stage 1 and not Stage 3.

Expected: progression is monotonic; review never rolls back or skips the frontier and never reveals future stages.

## C. Guided Speaking — deterministic persistence, recall and boundaries

Use a profile that has legitimately reached at least Stage 26.

1. Record the current stage number, level, title, model and prompt.
2. Fully close and reopen the app.
3. Return to Guided Speaking and confirm the same stage identity/content is restored.
4. When deterministic recall is scheduled, confirm the Remember? layer appears before Listen.
5. Confirm recall content remains hidden until Start recall is pressed.
6. Confirm every recalled item comes from an earlier passed stage only.
7. Open History and repeat an earlier passed stage.
8. Confirm its title/model/prompt remain identical.
9. Return to the frontier.
10. Confirm Stage 25 reports A1.1 and Stage 26 reports A1.2.
11. Where legitimate test history permits, repeat boundary checks at 50/51, 100/101, 150/151, 200/201 and 250/251.

Expected: permanent stage identity is deterministic across relaunches; recall never uses current/future content; explicit CEFR boundaries are stable.

## D. Guided Speaking — completion feedback, reduced motion and Stage 300

1. Complete a normal frontier stage and confirm completion feedback occurs only after persisted completion.
2. Repeat a passed stage and confirm the review-return feedback is distinct from a frontier advance.
3. Enable the device Reduce Motion preference and repeat the transition.
4. Confirm state changes remain clear without unnecessary motion.
5. With a profile that legitimately reached Stage 300, open Stage 300.
6. Confirm it reports C2 and no Stage 301 exists anywhere in learner UI.
7. Complete the production attempt.
8. Confirm the next action opens the existing Roleplay experience.
9. Return to Guided Speaking and confirm Stage 300 is available in History.

Expected: semantic completion remains understandable with and without motion; Stage 300 alone owns the open-Roleplay handoff.

## E. Cards — explicit level gate and staged difficulty

1. Open Everyday Cards → Vocabulary.
2. Confirm no card loads before level confirmation.
3. Confirm A1–A2, B1–B2 and C1–C2 are visible.
4. Select A1–A2 and press Start.
5. Confirm the active session header shows A1–A2.
6. End and reopen Cards.
7. Confirm A1–A2 may be preselected but the session does not auto-start.
8. Select B1–B2 and explicitly Start.
9. Switch from Vocabulary to Phrases.
10. Confirm the app returns to level confirmation rather than silently starting.
11. Complete a session and choose Restart.
12. Confirm Restart returns to level confirmation.
13. Where banks have content, verify each selected level excludes material from the other two bands.
14. With fresh history, confirm authored intro cards precede core/stretch when review priority is otherwise equal.
15. With due/weak cards, confirm review priority still wins over introducing easier new material.

Expected: every new Cards session requires deliberate level confirmation; level is a hard content boundary; staged difficulty supplements rather than replaces adaptive review.

## F. Practice — one obvious next session

1. Open Practice from a normal learner account.
2. Confirm one primary next-session action is visually dominant.
3. Start that session and confirm the existing deterministic session composition is retained.
4. Complete enough work to reach the session summary.
5. Confirm the next-session presentation remains singular and clear rather than becoming a competing catalogue.
6. Exercise Skip / Another task / No microphone / Shorter session where those controls legitimately appear.
7. Confirm the UI does not claim personalized mastery or certainty that the underlying engine has not established.

Expected: Practice gives one obvious next action without inventing learner-state claims.

## G. Roleplay — isolated pools and server-owned rotation

Run ordinary starts separately for Everyday, Workplace and YKI, then Professional and Interview with valid profession context.

1. Start Everyday Roleplay repeatedly and record returned scenario IDs until the pool cycles.
2. Confirm only Everyday scenarios appear and there is no immediate repeat while unused alternatives exist.
3. Repeat for Workplace and YKI and confirm no cross-pool leakage.
4. Use explicit Replay and confirm it repeats the selected scenario without consuming ordinary rotation.
5. Attempt a wrong-pool explicit scenario and confirm it fails closed.
6. Start Professional with one profession and confirm only that profession's valid scenarios appear.
7. Start Interview with the same profession and confirm Interview remains isolated from Professional.
8. Confirm direct Everyday/YKI conversations return to their correct parent route.

Expected: the server, not translated labels or client-side profession rotation, owns ordinary pool selection; pools stay isolated.

## H. Professional mission chain — stable context

For Doctor, Nurse and Practical Nurse where entitlement allows:

1. Open Professional Finnish.
2. Confirm one profession-correct mission is foregrounded with one clear Start mission action.
3. Confirm the mission map is Listen → Speak → Read → Write + correct.
4. Start Listen and record the mission identity/context.
5. Continue to Speak and confirm the same mission context is preserved.
6. Continue to Read and confirm the exact profession/mission remains stable.
7. Continue to Write + correct and confirm the exact profession/mission remains stable.
8. Confirm opening a task alone does not falsely mark it complete.
9. Confirm standalone Cards, Reading/Writing, open Roleplay, Interview and Report Writing remain reachable under progressive disclosure.

Expected: the mission is the stable cross-skill identity; tools do not silently switch profession/context or fabricate completion.

## I. Professional Listening — audio truth and fallback

For each supported profession mission:

1. Open the mission's Professional Listening task.
2. Confirm the expected mission/profession/context is displayed.
3. Play the canonical audio and answer both authored comprehension questions.
4. Confirm successful audio use follows the normal mission path.
5. Exercise the transcript fallback by making audio unavailable through a legitimate test condition.
6. Confirm the transcript is presented explicitly as fallback.
7. Confirm transcript fallback does not claim that audio listening was completed.
8. Confirm Professional Listening does not launch the YKI player or create a Roleplay session.

Expected: listening identity is deterministic and profession-isolated; fallback remains truthful about what the learner actually did.

## J. Reading and Writing — deterministic A1–C2 progression

1. Open Everyday Reading at the learner's available level.
2. Complete a task and confirm the next task follows the canonical deterministic order.
3. Relaunch and confirm the current deterministic position persists as designed.
4. Repeat across available A1/A2/B1/B2/C1/C2 boundaries using legitimate test history.
5. Open Writing and exercise draft → feedback/compare → correction progression.
6. Confirm evaluator feedback does not randomly replace the authored task identity.
7. Repeat the deterministic-next check for mission-specific Professional Reading and Writing.
8. Confirm profession adapters remain additive and do not leak another profession's content.

Expected: Reading/Writing progression is authored and deterministic; AI/evaluation assists but does not own curriculum order.

## K. Reduced motion, haptics and accessibility regression

1. With Reduce Motion off, complete representative Guided Speaking, Cards, Reading and Writing actions.
2. Confirm motion is restrained and tied to meaningful state changes.
3. Confirm haptics occur only on meaningful confirmed events, not merely on opening a screen.
4. Enable Reduce Motion and repeat.
5. Confirm all state changes remain understandable without depending on animation.
6. Confirm haptic failure/unavailability never blocks progress.
7. Verify light and dark themes remain readable and major controls retain adequate tap targets/focus behavior.

Expected: polish supports comprehension but never owns learning state.

## L. Signed-out, entitlement and regression negatives

1. Sign out and attempt deep links to protected learner/professional destinations.
2. Confirm protected routes remain inaccessible.
3. Sign in with an account lacking Professional entitlement and attempt Professional leaves/routes.
4. Confirm access fails closed without drawer or deep-link bypass.
5. Verify account/settings/billing destinations remain reachable when legitimately allowed.
6. Confirm RevenueCat/subscription state is unchanged by the Build 47 learner-experience work.
7. Confirm no new native permission prompt or native dependency behavior appears.
8. Smoke-test existing Recorded Speaking and ordinary Roleplay recording.

Expected: Build 47 does not weaken auth/subscription boundaries or existing speaking routes.

## YKI suitability boundary

1. Open YKI Practice.
2. Confirm generic Cards are not labelled or presented as certified "YKI Cards".
3. Start a legitimate YKI speaking task that requires Roleplay.
4. Confirm the task-level Roleplay handoff still works and remains in the YKI pool.

Expected: uncertified general Cards are not marketed as YKI-specific; legitimate YKI speaking flow remains intact.

## Acceptance record

Record all of the following:

- device / OS:
- app version / build:
- exact tested source SHA:
- test account class / entitlement:
- Reduce Motion state tested: ON / OFF / BOTH
- drawer/navigation: PASS / FAIL
- Guided Speaking new learner: PASS / FAIL
- Guided Speaking persistence/history/recall: PASS / FAIL
- Guided Speaking Stage-300 boundary: PASS / FAIL
- Cards level gate/difficulty: PASS / FAIL
- Practice one-next-session: PASS / FAIL
- Roleplay pool isolation/rotation: PASS / FAIL
- Professional mission chain: PASS / FAIL
- Professional Listening: PASS / FAIL
- Reading deterministic progression: PASS / FAIL
- Writing deterministic progression: PASS / FAIL
- reduced-motion/haptics/accessibility: PASS / FAIL
- signed-out/entitlement negatives: PASS / FAIL
- YKI suitability boundary: PASS / FAIL
- overall step-by-step learner clarity: PASS / FAIL
- BLOCKER findings:
- POLISH findings:
- screenshots / recordings / notes:

### Severity

- **BLOCKER** — broken flow, wrong access, future-stage leakage, cross-pool/profession leakage, false completion, unreadable/blocked interaction, or critical regression. Must be fixed and retested before acceptance.
- **POLISH** — non-blocking wording, spacing, timing, motion or presentation improvement.
- **PASS** — acceptable as-is.

A complete acceptance record with no unresolved BLOCKER is required before any release action is considered.

`DEVICE_UAT=PENDING`  
`PRODUCTION_ACTIONS=NONE`
