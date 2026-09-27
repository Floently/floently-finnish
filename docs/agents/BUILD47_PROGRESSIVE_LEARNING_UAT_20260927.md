# Build 47 progressive-learning UAT — 2026-09-27

Scope: issue #46 progressive drawer, 300-stage Guided Speaking and Cards level confirmation.
This is a manual product-owner/device UAT script. It does not authorize deployment or expose any learner-only bypass.

## Preconditions

- Use a normal authenticated test account with the same entitlement path being tested.
- Start from a clean app launch.
- Do not alter production data or publish an OTA.
- For later-stage Guided Speaking checks, use a test profile whose legitimate stored history already reached the required stage. Do not add a UI/debug shortcut to future stages.

## A. Progressive drawer

1. Open the drawer from Home.
2. Confirm only the major destinations are visible initially.
3. Expand Everyday → Speaking.
4. Confirm Guided Speaking, Roleplay and existing speaking destinations appear only after expansion.
5. Expand another Everyday sibling and confirm the previous sibling collapses.
6. Open Guided Speaking from the drawer.
7. Reopen the drawer and confirm the current branch is identifiable/restored.
8. Repeat for Professional Finnish with an entitled profession.
9. Verify an unentitled professional destination cannot be opened through the drawer.
10. On a narrow phone viewport, confirm parent and leaf rows remain easy to tap and screen-reader expanded/collapsed state is announced.

Expected: one clear branch at a time; expanding never navigates; a leaf navigates once and closes the drawer once.

## B. Guided Speaking — new learner

1. Open Everyday → Speaking → Guided Speaking with a profile that has no Guided Speaking history.
2. Confirm the learner sees Stage 1 only; no future-stage grid/list is visible.
3. Confirm History is not offered before any stage has been passed.
4. Listen to the Stage 1 model.
5. Move to Speak and make a genuine microphone attempt.
6. Complete the stage.
7. Confirm Stage 2 becomes the current stage.
8. Open History and confirm Stage 1 is available to repeat while Stage 3+ is absent.
9. Repeat Stage 1.
10. Complete the repeat and confirm the learner returns to Stage 2, not Stage 1 and not Stage 3.

Expected: progression is monotonic; review never rolls back the frontier and never reveals future stages.

## C. Guided Speaking — deterministic persistence

Use a test profile that has legitimately reached at least Stage 26.

1. Record the current stage number, level, title, model and prompt.
2. Close the app completely and reopen it.
3. Return to Guided Speaking.
4. Confirm the same current stage identity/content is restored.
5. Open History and repeat an earlier passed stage.
6. Confirm its title/model/prompt are the same as before.
7. Return to the frontier.
8. At the A1.1 → A1.2 boundary, confirm Stage 25 reports A1.1 and Stage 26 reports A1.2.
9. If a profile has reached later boundaries, repeat the boundary check at 50/51, 100/101, 150/151, 200/201 and 250/251.

Expected: permanent stage IDs/content remain deterministic across relaunches and level transitions are explicit.

## D. Guided Speaking — final handoff

Use a test profile whose legitimate history has reached Stage 300.

1. Open Stage 300.
2. Confirm it reports C2 and no Stage 301 exists anywhere in the learner UI.
3. Complete the production attempt.
4. Confirm the next action opens the existing Roleplay experience.
5. Return later to Guided Speaking and confirm Stage 300 is available in History.

Expected: Stage 300 alone is the curriculum completion handoff; the completion sentinel is internal only.

## E. Cards — mandatory level confirmation

1. Open Everyday Cards → Vocabulary.
2. Confirm no card loads before level confirmation.
3. Confirm A1–A2, B1–B2 and C1–C2 are visible.
4. Select A1–A2 and press Start.
5. Confirm the active session header shows A1–A2.
6. End and reopen Cards.
7. Confirm A1–A2 may be preselected but the session does not auto-start.
8. Select B1–B2 and press Start.
9. Confirm the session is B1–B2.
10. Switch from Vocabulary to Phrases.
11. Confirm the app returns to level confirmation rather than silently starting Phrases.
12. Confirm B1–B2 may remain preselected, then explicitly Start.
13. Complete a session and choose Restart.
14. Confirm Restart returns to level confirmation.

Expected: every new Cards session requires a deliberate level confirmation; remembering a level is only a preselection.

## F. Cards — level isolation and staged difficulty

For each card mode where the selected bank has material:

1. Start A1–A2.
2. Inspect served cards and confirm no B1–B2 or C1–C2 material enters the session.
3. Repeat for B1–B2 and C1–C2.
4. With a fresh test profile, confirm authored intro cards are prioritized before core/stretch where review priority is otherwise equal.
5. With a profile containing due/weak cards, confirm due review still has priority over introducing easier new material.

Expected: CEFR band is a hard candidate boundary; intro/core/stretch staging supplements rather than replaces adaptive review.

## G. YKI suitability boundary

1. Open YKI Practice before any future YKI-card certification work.
2. Confirm there is no shortcut labelled “YKI Cards” and no generic Cards shortcut presented as YKI-specific material.
3. Start a YKI speaking task that requires roleplay.
4. Confirm the task-level Roleplay handoff still works.

Expected: uncertified general Cards are not marketed as YKI-specific; legitimate YKI speaking flow remains intact.

## H. Regression smoke

Verify after the above:
- existing Roleplay opens and records normally;
- Recorded Speaking still opens normally;
- account/settings/billing destinations remain reachable;
- RevenueCat/subscription state is unchanged;
- no new native permission prompt appears;
- light/dark mode remains readable;
- card audio/hints/reporting/review banks still work after level confirmation.

## Product-owner acceptance

Record:
- device / OS:
- build / branch / exact SHA:
- tested entitlement:
- first-time learner flow: PASS / FAIL
- returning learner History flow: PASS / FAIL
- Cards level gate: PASS / FAIL
- YKI suitability boundary: PASS / FAIL
- overall “step-by-step and easy to follow”: PASS / FAIL
- notes / screenshots:

`PRODUCTION_ACTIONS=NONE`
