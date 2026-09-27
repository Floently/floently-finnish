# Build 47 Source Candidate Reconciliation — 2026-09-27

Candidate base: `33bd375cb5ab7bb8eff735ae8a728209c1cbf542`  
Candidate branch: `integration/build47-source-candidate-20260927`

## Purpose

This is a source-only reconciliation gate for the Build 47 learner-experience work. It does not merge, deploy, publish an OTA update, create a store build, modify production data, or change billing/auth/native configuration.

The candidate is intentionally based on the latest exact-green Phase 9 head because the Build 47 work was developed as a linear branch stack.

## Verified ancestry

The Phase 9 head contains every preceding Build 47 PR head with zero commits behind:

| PR | Scope | Qualified head | Relationship to Phase 9 |
| --- | --- | --- | --- |
| #54 | Progressive drawer | `de321302d56af868d1de5fdd371411c9aa1d8b28` | ancestor |
| #55 | Guided Speaking UX | `e8d31929730673cd656dc8c76d7e6637d1f545cf` | ancestor |
| #56 | 300-stage deterministic Guided Speaking curriculum | `1b0782b342aa2cd47c0db3c6eec4f6ff6494976d` | ancestor |
| #57 | Cards explicit level gate | `8b6b3d7b95d0e4d2a327aac660809993ff724627` | ancestor |
| #58 | Practice one-next-session | `9f9e87774e3c9c7839f8825806c061b249dcfbf4` | ancestor |
| #59 | Roleplay mode-pool isolation/server rotation | `e4a477b1e251132b8c0c1a94cced2f516d746265` | ancestor |
| #60 | Professional mission-first chain | `577a2175c4650d4fd40eb8038eef6b67ca7eaa2c` | ancestor |
| #61 | Reading/Writing deterministic A1–C2 | `775702827eb3d8ab2e999b726dff779e7f87bdbe` | ancestor |
| #62 | restrained learning motion/haptics | `59deb5cba973c29d7f3f5d3ca231e357c12b9dd0` | ancestor |
| #63 | Professional deterministic Listening | `33bd375cb5ab7bb8eff735ae8a728209c1cbf542` | candidate base |

No manual cherry-pick or conflict resolution is needed to assemble these changes.

## Source definition-of-done status

### Progressive disclosure
PASS in source:
- major learner branches are progressively disclosed;
- nested branch presses expand rather than navigate;
- one sibling branch remains open per hierarchy level;
- guarded leaves keep entitlement authority outside the drawer;
- current nested route can restore the relevant branch.

### Guided Speaking
PASS in source:
- deterministic 300-stage A1–C2 curriculum;
- one frontier stage at a time;
- future stages locked;
- passed stages replayable through History without frontier rollback;
- Stage 300 is the explicit open-Roleplay handoff;
- reduced-motion-aware transitions and completion semantics are integrated.

### Cards
PASS in source:
- explicit level confirmation before a new session;
- level-scoped content contract;
- staged difficulty and existing retrieval/session authority preserved.

### Practice
PASS in source:
- one obvious next session;
- existing deterministic session composition retained;
- no false personalized mastery signal introduced.

### Roleplay
PASS in source:
- Everyday, Workplace, YKI, Professional and Interview mode ownership is explicit;
- server owns ordinary pool rotation;
- general pools are isolated;
- explicit Replay does not consume ordinary rotation;
- wrong-pool explicit scenarios fail closed.

### Professional mission
PASS in source:
- one profession-correct mission is foregrounded;
- mission context remains stable across Listen → Speak → Read → Write + correct;
- Professional Listening now has a dedicated deterministic runtime;
- transcript fallback does not claim audio listening completion;
- existing standalone Professional tools remain reachable;
- regulated-language boundary remains visible.

### Reading/Writing
PASS in source:
- deterministic A1–C2 progression;
- canonical next-task order;
- profession mission adapters remain additive;
- no random runtime task choice.

### Experience/accessibility
PASS in source:
- shared reduced-motion-aware motion primitives;
- semantic haptics only at meaningful confirmed transitions;
- no new animation/haptic/native dependency;
- haptic failure never owns learning state.

## Remaining non-source gate

`DEVICE_UAT=PENDING`

Product-owner/device UAT is still required before any release action. It should exercise, at minimum:
1. drawer expansion/restoration at mobile width;
2. Guided Speaking first stage, frontier advance, History replay, future lock and Stage-300 boundary;
3. Cards level confirmation and a complete session;
4. Practice one-next-session;
5. Roleplay pool entry for Everyday/Workplace/YKI/Professional/Interview;
6. Professional mission Listen → Speak → Read → Write handoff;
7. Professional Listening audio playback and transcript fallback;
8. Reading/Writing next-task progression;
9. reduced-motion system preference;
10. entitlement-locked and signed-out negative paths.

## Release boundary

No release action is authorized by this report. A green source candidate means only that the repository's automated source gates agree on the combined code. Production/TestFlight/OTA/store action remains separate and explicitly governed.
