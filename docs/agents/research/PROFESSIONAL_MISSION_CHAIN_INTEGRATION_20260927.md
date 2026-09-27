# Professional mission-chain integration research — 2026-09-27

## Research gate

`RESEARCH_GATE=PASS`

Branch: `feature/build47-professional-mission-chains-20260927`  
Base: exact green Roleplay Phase 5 head `e4a477b1e251132b8c0c1a94cced2f516d746265`

## Current repository truth

The accepted Agent F mission catalog is already present unchanged in current source:
- `packages/core/professional/missions.mjs`
- `packages/core/professional/missions.d.ts`
- one deterministic authored mission for each sellable profession: doctor, nurse, practical nurse;
- one stable context ID across the mission's listening → speaking → reading → writing → correction arc;
- explicit language-practice safety/provenance boundaries.

The current product has advanced beyond the August source assumptions:
- Professional Reading exists at `/professional/reading`;
- Professional Writing exists at `/professional/writing`;
- mission-specific Reading/Writing adapters already exist in `missionRuntimeAdapters.ts`;
- validated mission Roleplay exists at `/speaking/mission`;
- mission entries are already available to the integrated Practice composer;
- ordinary Professional Listening still has no canonical standalone runtime/route.

The remaining product gap is learner-facing orchestration. `ProfessionalRoute.tsx` still leads with a flat menu of Reading, Writing, Cards, Roleplay, Interview and Report Writing, while the coherent Agent F mission is relegated to a static “goals” list.

## External evidence rechecked

### Council of Europe — CEFR

Current official CEFR guidance describes learners as social agents who use language to pursue goals in real contexts, and distinguishes reception, production, interaction and mediation activities. It also explicitly recognises the professional domain and action-oriented learning built around meaningful tasks.

Sources accessed 2026-09-27:
- https://www.coe.int/en/web/common-european-framework-reference-languages/the-user/learners-as-a-social-agent
- https://www.coe.int/en/web/portfolio/the-common-european-framework-of-reference-for-languages-learning-teaching-assessment-cefr-
- https://www.coe.int/en/web/common-european-framework-reference-languages/action-orientation-in-the-classroom

Integration decision:
- Professional should foreground one coherent workplace communication mission, not a catalogue of disconnected skill buttons;
- modality may change while the mission context stays constant;
- unavailable modalities must be stated truthfully rather than simulated.

### Kielibuusti — workplace language learning

Current Kielibuusti material emphasises using Finnish in real workplace situations and systematic workplace support for language development; its workplace-situation material includes concrete recurring situations such as shift changes and workplace communication.

Sources accessed 2026-09-27:
- https://www.kielibuusti.fi/en/employers/multilingual-workplace/steps-toward-language-awareness-in-the-workplace
- https://www.kielibuusti.fi/fi/opi-suomea/vinkkeja-kielenoppimiseen/opi-suomea-toissa/tyoelaman-tilanteita-videot

Integration decision:
- preserve concrete work situation, audience and register across steps;
- keep Professional mission content language-focused and defer real professional/clinical decisions to workplace procedures and qualified supervision.

## Phase 6 design

1. Keep the accepted Agent F catalog unchanged.
2. Add a current integration readiness model:
   - listening: unavailable;
   - mission speaking: available through validated `/speaking/mission`;
   - mission reading: available through canonical `/professional/reading`;
   - mission writing + focused correction: available through canonical `/professional/writing`.
3. Make the selected profession’s coherent mission the primary Professional surface.
4. Show one clear primary action: start the first available mission step (Speaking, because Listening is not yet implemented).
5. Show the ordered mission map beneath it so the learner understands the whole arc.
6. Do not claim a step is completed merely because it was opened. Durable completion remains owned by the canonical runtimes.
7. Keep the existing standalone Professional tools under a secondary disclosure layer so no shipped capability is lost.
8. Mission Roleplay must send the explicit Phase-5 `professional` roleplay mode; no compatibility fallback in new code.
9. Keep profession entitlement checks in their existing authorities; do not invent new profession/domain entitlements.
10. Keep Interview beta/availability semantics unchanged.

## Acceptance criteria

- Professional landing no longer opens as a flat feature catalogue.
- Exactly one profession-correct mission is foregrounded for the current entitlement context.
- Mission title, situation, communicative goal, audience/register and safety boundary are visible.
- Mission chain clearly shows Listen → Speak → Read → Write & correct.
- Listening is visibly unavailable and never launchable.
- Primary Start action launches validated mission Speaking.
- Speaking deep launch sends explicit `roleplayMode='professional'`.
- Reading launches the exact mission reading task.
- Writing launches the exact mission writing task whose internal workflow includes feedback/revision.
- No mission step from another profession is rendered or launchable.
- Existing standalone Cards/Reading/Writing/Roleplay/Report Writing remain reachable under a secondary layer.
- No YKI runtime/content is reused for Professional Listening.
- Existing subscription, account, Roleplay, YKI, Reading/Writing and release gates remain green.

## Safety

No production deployment, OTA publication, App Store/TestFlight mutation, billing/auth change, dependency change, database migration, or new professional/clinical decision logic.

`PRODUCTION_ACTIONS=NONE`
