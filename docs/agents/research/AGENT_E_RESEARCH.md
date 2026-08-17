# Agent E Research — Practice Hub and Explainable Composer

Date: 2026-08-16
Agent: E
Branch: `agent/e-practice-hub-composer-20260816`
Immutable Wave-1 base: `integration/wave1-shared-base-20260816`
Resolved base SHA: `69813b433838130d5afe4b052360dbfd12df3f40`

## Research questions investigated

1. What does retrieval-practice evidence support for a short repeated Finnish-learning session?
2. What does second-language spacing evidence support, and what should the product avoid claiming without durable learner history?
3. When does interleaving help, when can it hurt, and why is pure random practice unsafe?
4. How should recommendations be explained without inventing learner weakness, overdue state, mastery, confidence, or history?
5. What is defensible about 5 / 10 / 20 minute UX, given cognitive-load evidence and the lack of evidence that those exact three durations are universally optimal?
6. How can the composer remain deterministic and testable while still balancing skill, time, goals, and context?
7. What is the current KieliValmis route/navigation authority, and where can Agent E integrate without modifying protected navigation/auth/entitlement files?
8. How should microphone, audio, keyboard, feature-health, profession, level/prerequisite, entitlement declaration, repetition, and YKI-mode constraints be enforced?
9. How should path/progress changes be exposed accessibly without distracting motion or hidden status changes?
10. How can repeated Practice use stay coherent and motivating without manipulative streak/reward loops or noisy animation?

## Existing repository evidence and constraints

### Branch and production safety

- Remote `integration/wave1-shared-base-20260816` resolves to `69813b433838130d5afe4b052360dbfd12df3f40`.
- Remote `agent/e-practice-hub-composer-20260816` initially resolved to the same SHA before this research file was created.
- `.github/AGENTS.md`, `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`, `docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`, and every `docs/agents/WAVE1_*` document make production/server work out of scope.
- `.github/workflows/wave1-feature-branch-safety.yml` protects this branch. Its verifier rejects modifications to the frozen learning contract, protected AppShell/navigation files, workflows, dependency manifests, deployment/native files, and other protected capability paths.
- No production action is necessary for this mission.

### Frozen shared learning contract

`packages/core/schemas/learning.ts` is frozen and already contains the runtime-neutral types needed by Practice:

- `TaskDescriptor` with pathway, skills, level band, estimated minutes, modality, entitlement declarations, launch target, health, optional feature flag/profession/topic/context/prerequisites/tags, and explicit `ykiMode`;
- `SkillEvidence` for durable evidence derived from learner events;
- `PracticeScope` for All / Everyday / Professional / YKI;
- `PracticeSelectionReason` with explicit `learner` or `curriculum` evidence mode;
- `PracticeSessionManifest` with target duration, deterministic task order, reasons, and composer version.

The shared contract expressly says Practice orchestrates canonical runtimes rather than cloning Cards, Roleplay, Reading, Writing, or YKI business logic. Agent E must not modify this contract. Any missing cross-agent field becomes an `INTEGRATION_REQUIREMENT` and, if needed, a narrow local adapter.

### Current Practice/navigation implementation

- `apps/client/state/navigationModel.ts` already declares guarded screen `daily-practice`, but its current path maps to `/learn`. This file is protected/integration-owned and must not be changed by Agent E.
- `apps/client/state/AppShell.tsx` already applies authentication and subscription/entitlement guarding to `daily-practice`. Its existing `navigateTo("daily-practice")` path clears navigation error, clears active professional context, and persists the guarded screen. This file is protected/integration-owned and must not be changed by Agent E.
- The current `daily-practice` render in `AppShell.tsx` delegates to `apps/client/state/FeatureEntryRoute.tsx`.
- `FeatureEntryRoute.tsx` currently renders Daily Practice as a placeholder called “Review” that forwards to Learn/YKI. It does not yet compose a session.
- `HomeRoute` currently routes its Daily Practice callback to `learning`, not to the existing guarded `daily-practice` screen. Because this wiring is inside protected `AppShell.tsx`, top-level Home wiring must be an Agent-A integration change rather than an Agent-E edit.
- The drawer route union includes `daily-practice`, but current drawer sections do not surface it. Navigation wiring is protected behavior and should be integrated centrally by Agent A.
- Existing canonical runtime routes include Cards, Speaking/Roleplay, and YKI Practice. Wave-1 reserved ordinary Reading/Writing routes may be represented in local fixtures without importing Agent C/D moving branches; unavailable future fixtures must remain unschedulable until their runtime/feature health says otherwise.

### Installed technical stack

- Expo SDK 55 / Expo Router are already installed.
- React Native 0.83, React 19, Reanimated 4.2.1, and React Native SVG are installed.
- No new dependency is needed.
- The client has a strict TypeScript configuration.
- The generic PR CI runs `npx tsc --noEmit`; Wave-1 safety runs on every push to this feature branch.
- There is no general client unit-test framework declared. Existing permanent client regression protection commonly uses deterministic Node verifier scripts, so Practice tests should follow that pattern without adding a dependency or touching package manifests.

## Sources and access date

All web sources below were accessed 2026-08-16.

### Learning science / pedagogy

1. Agarwal, P. K., Nunes, L. D., & Blunt, J. R. (2021). *Retrieval Practice Consistently Benefits Student Learning: a Systematic Review of Applied Research in Schools and Classrooms*. Educational Psychology Review, 33, 1409–1453. https://doi.org/10.1007/s10648-021-09595-9
   - Systematic review of 50 classroom experiments, 49 effect sizes, total n=5,374; most effects favored retrieval practice, while the authors also identify limits in the evidence base.
2. Kim, S. K., & Webb, S. (2022). *The Effects of Spaced Practice on Second Language Learning: A Meta-Analysis*. Language Learning, 72, 269–319. https://doi.org/10.1111/lang.12479
   - Meta-analysis of 48 experiments / 98 effect sizes / N=3,411; spaced practice had a medium-to-large overall effect for L2 learning, and longer spacing was more beneficial on delayed tests than shorter spacing.
3. Brunmair, M., & Richter, T. (2019). *Similarity matters: A meta-analysis of interleaved learning and its moderators*. Psychological Bulletin, 145(11), 1029–1052. https://doi.org/10.1037/bul0000209
   - Meta-analysis of 59 studies / 238 effect sizes; overall interleaving benefit varied materially by content, with blocking outperforming interleaving for word-based studies in the analyzed corpus.
4. Chen, O., Paas, F., & Sweller, J. (2021). *Spacing and Interleaving Effects Require Distinct Theoretical Bases: a Systematic Review Testing the Cognitive Load and Discriminative-Contrast Hypotheses*. Educational Psychology Review, 33, 1499–1522. https://doi.org/10.1007/s10648-021-09613-w
   - Systematic review distinguishing spacing from interleaving; supports treating interleaving as a discrimination/contrast strategy rather than “random variety.”
5. Sweller, J., van Merriënboer, J. J. G., & Paas, F. (2019). *Cognitive Architecture and Instructional Design: 20 Years Later*. Educational Psychology Review, 31, 261–292. https://doi.org/10.1007/s10648-019-09465-5
   - Review emphasizes capacity/duration limits of working memory and the importance of instructional designs that avoid avoidable extraneous load.

### Primary technical / accessibility / trustworthiness sources

6. Expo. *Navigating between pages in Expo Router* and Router API documentation. https://docs.expo.dev/router/basics/navigation/ and https://docs.expo.dev/versions/latest/sdk/router/
   - Expo Router treats files as URL-addressable routes and provides explicit `navigate`, `push`, `replace`, and back-stack operations.
7. React Native. *Accessibility*. https://reactnative.dev/docs/accessibility
   - Current React Native accessibility APIs include accessible names/roles and live-region support for dynamic changes.
8. W3C. *Web Content Accessibility Guidelines (WCAG) 2.2*, including 4.1.3 Status Messages and 2.3.3 Animation from Interactions. https://www.w3.org/TR/WCAG22/ and https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions
   - Dynamic progress/status should be programmatically available to assistive technology; unnecessary interaction motion should be avoidable/disabled.
9. Software Mansion. *React Native Reanimated Accessibility*. https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/
   - Reanimated 4 supports system reduced-motion behavior; animations default to system reduction behavior, and a synchronous `useReducedMotion` hook is available.
10. NIST. *AI Risk Management Framework / AI RMF Core and Playbook*. https://www.nist.gov/itl/ai-risk-management-framework and https://airc.nist.gov/airmf-resources/playbook/measure/
    - Validity/reliability, transparency, explainability, documented limitations, and testing explanations for accuracy/clarity are trustworthiness goals. Practice is deterministic orchestration rather than an AI model, but the same product-truth principle applies to recommendation explanations.

## Findings, and the decisions each finding caused

### 1. Retrieval should be active, but “retrieval” is not a license to invent learner history

**Finding.** Retrieval practice has robust applied evidence compared with passive restudy in many educational settings. The evidence supports choosing executable tasks that require recall, comprehension decisions, or production when those capabilities are available. It does not prove that a specific learner is weak, overdue, or has forgotten a specific item.

**Decision.** Practice will orchestrate active canonical task runtimes. Learner-specific need terms are scored and explained only when explicitly supplied durable learner evidence is valid for the same learner. Without that evidence, the composer enters transparent curriculum mode.

### 2. Spacing is useful only when historical evidence exists to establish that something was seen before

**Finding.** L2 spacing evidence is positive overall, including delayed retention benefits. But spacing/review requires temporal history. A first-use or evidence-poor client cannot truthfully know that a task is “due.”

**Decision.** The overdue 0.30 factor is zero/neutral when durable evidence does not supply an overdue signal. Recent-repetition blocking is also applied only from supplied durable history. Curriculum mode may balance skill/context but must never say “overdue,” “you missed this,” or equivalent personalized history copy.

### 3. Interleaving is conditional; pure randomness is the wrong design

**Finding.** Interleaving has an overall benefit in the meta-analysis, but effects differ by material and task. Word-based studies in Brunmair & Richter favored blocking, and the systematic review frames interleaving as useful for discriminative contrast rather than arbitrary switching.

**Decision.** The composer will never use random selection. It will use deterministic ranking, stable tie-breaks, rolling skill balance, and a context-coherence bonus. Changing modality/skill can happen while retaining topic/mission context. This avoids “shuffle everything” behavior and makes the manifest reproducible.

### 4. 5 / 10 / 20 minutes are user-selected budgets, not scientifically optimal prescriptions

**Finding.** Cognitive-load literature supports minimizing avoidable load and presenting manageable instructional structure, but the reviewed evidence does not establish 5, 10, and 20 minutes as universally optimal learning durations.

**Decision.** The three durations are product choices required by the Wave-1 brief. They are enforced as upper budgets. Practice will not pad a session to hit a timer exactly and will not market these durations as scientifically optimal. One-task-at-a-time presentation reduces menu/choice burden inside the session.

### 5. Explanations must be derived from actual selection inputs

**Finding.** The repository contract already makes truthful adaptation non-negotiable. NIST trustworthiness guidance reinforces validity, reliability, transparency, explainability, limitation-awareness, and testing explanations for accuracy and clarity.

**Decision.** Every user-visible “Why these tasks?” reason is generated from an actual factor/filter state. Curriculum reasons can describe balance, context continuation, time fit, and modality exclusions. Learner reasons may refer to review/goal evidence only when the matching durable evidence object contains that signal. The system will not transform absent scores into persuasive copy.

### 6. Hard compatibility filters must run before ranking

**Finding.** The shared contract contains the metadata necessary to reject incompatible tasks before launch. Existing runtime auth/entitlement checks remain authoritative and must not be replaced by the composer.

**Decision.** The composer performs a deterministic hard-filter pipeline before ranking for:

1. product-truth/descriptor validity;
2. requested pathway scope;
3. entitlement declarations;
4. profession compatibility;
5. allowed level bands;
6. prerequisites;
7. runtime health/degraded policy;
8. feature flags;
9. microphone/audio/keyboard modality availability;
10. task duration versus target/remaining budget;
11. evidence-backed repetition blocks;
12. explicit YKI `practice` versus `mock`/`full_exam` boundary.

These checks are scheduling safeguards only; canonical runtime authorization remains authoritative at execution.

### 7. Ranking must be deterministic and neutralize missing evidence

**Finding.** The Wave-1 blueprint supplies conceptual starting weights only when inputs actually exist. Determinism is essential for explainability, regression tests, and reproduction.

**Decision.** Ranking starts from the documented weights:

- overdue 0.30 — only from matching durable learner evidence;
- weakness 0.25 — only from matching durable learner evidence;
- goal relevance 0.15 — only from explicit supplied goals/evidence;
- skill balance 0.15 — session-local curriculum balance, not a learner weakness claim;
- novelty 0.10 — only from supplied durable history/signal;
- time fit 0.05 — deterministic fit to remaining budget;
- plus a small deterministic context-coherence bonus for continuing the selected context/mission chain.

Missing evidence-backed terms contribute zero. Ties are resolved by stable descriptor identity rather than randomness. Manifest/session identity is derived deterministically from normalized inputs, not `Math.random()`.

### 8. Learner mode requires an explicit durable-evidence boundary

**Finding.** `SkillEvidence` is a durable normalized contract, but Agent B’s persistence implementation is a moving parallel branch and cannot be imported. Agent E still needs to test learner mode independently.

**Decision.** Agent E will define a narrow local evidence adapter for composer inputs. It must explicitly mark evidence as durable and carry the matching learner ID plus task/skill signals. Evidence that is missing, non-durable, malformed, or keyed to another learner is ignored and the relevant recommendation remains curriculum-only. Agent A can later adapt Agent B’s canonical evidence service into this input.

### 9. YKI ordinary practice must remain visibly and mechanically separate from mock/full exam

**Finding.** The frozen contract has explicit `ykiMode`, and the protected-capability rules forbid silently turning short Practice into a mock/full exam.

**Decision.** Ordinary Practice accepts YKI descriptors only when `ykiMode === "practice"`. Mock or full-exam descriptors are hard-excluded unless a future explicit composer mode is separately authorized. Agent E will not create that escalation in Wave 1.

### 10. Modality controls should recompose, not fail later inside a runtime

**Finding.** `TaskDescriptor.modality` exists specifically so scheduling can account for device/session capability before launch.

**Decision.** “No microphone right now” recomposes with microphone disabled. Audio/keyboard availability are separate input flags. “Make it shorter” recomposes to the next smaller supported budget (20→10→5; 10→5; 5 stays 5). “Give me another task” and Skip apply deterministic exclusions to the current task and recompose from the same original constraints.

### 11. Progress/path state should be textual and semantically understandable before it is animated

**Finding.** React Native exposes labels/roles/live regions; WCAG requires programmatically determinable status changes; Reanimated supports reduced-motion. No animation is needed for correctness.

**Decision.** The first Agent-E shell uses restrained/static progress primitives with visible text such as task number, skill/pathway, completed/skipped state, and a polite accessible status update where appropriate. There is no decorative looping animation. Any later experience-system motion from Agent G can enhance, not define, state and must respect system reduced motion.

### 12. Practice can integrate safely without touching protected navigation authority

**Finding.** `daily-practice` already exists as a guarded AppShell screen and delegates its presentation to `FeatureEntryRoute`. The protected files are intentionally blocked by Wave-1 CI.

**Decision.** Agent E will add owned Practice modules and replace only the daily-practice placeholder branch in `FeatureEntryRoute.tsx`; Professional/Speaking placeholder behavior remains unchanged. The composer launches only descriptor-provided canonical routes/callbacks and contains no task-engine logic. Agent A will perform final top-level Home/drawer/path wiring on integration.

## Alternatives rejected and why

1. **Random shuffle of eligible tasks.** Rejected because it is non-deterministic, hard to explain/test, and pedagogically unjustified given material-dependent interleaving evidence.
2. **Always applying all conceptual ranking weights.** Rejected because overdue/weakness/novelty would become invented personalization when evidence is absent.
3. **Reading `useStreakStore`, transient navigation, or screen visits as learner mastery/weakness evidence.** Rejected because the shared contract requires durable learner events/evidence and forbids screen-navigation-derived learning claims.
4. **Cloning Cards/Roleplay/YKI/Reading/Writing logic inside Practice.** Rejected by architecture: Practice selects a descriptor and launches its canonical route; the runtime owns execution.
5. **Importing Agent B/C/D/F moving branches.** Rejected by Wave-1 parallel-work policy. Local fixtures/adapters are required.
6. **Changing `packages/core/schemas/learning.ts`.** Rejected because Agent A owns the frozen contract.
7. **Changing `AppShell.tsx` or `navigationModel.ts` to expose Practice immediately.** Rejected because these are protected integration-owned files and Wave-1 safety CI correctly forbids Agent E from editing them.
8. **Adding a new testing/router/UI dependency.** Rejected because the installed stack is sufficient and dependency manifests are protected by Wave-1 safety.
9. **Treating degraded runtime health as automatically schedulable.** Rejected. Degraded tasks are schedulable only under an explicit composer policy; default is fail closed.
10. **Padding a 10-minute session to exactly 10 minutes.** Rejected. Time is a constraint, not an obligation; padding can select lower-value or incompatible tasks merely to fill time.
11. **Adding decorative progress animation.** Rejected because it does not improve correctness, can distract, and would create unnecessary reduced-motion surface area.
12. **Claiming 5/10/20 are evidence-proven optimal durations.** Rejected because the reviewed evidence does not establish that exact claim.

## Uncertainties and how they will be tested/contained

### U1. Exact canonical descriptor population will evolve as Agents B/C/D/F integrate

**Containment.** Use a local fixture registry built only from frozen `TaskDescriptor` semantics and currently known canonical routes. Future/parallel capabilities remain unavailable/feature-gated fixtures until integration. Test that unavailable fixtures are never selected.

### U2. Durable learner evidence storage is owned by Agent B and is unavailable on this branch

**Containment.** Test learner mode only with explicit durable local evidence fixtures. Test missing/non-durable/wrong-learner evidence falls back to curriculum behavior. Record an integration adapter requirement for Agent A.

### U3. Top-level Home/drawer routing lives in protected files

**Containment.** Build the complete Daily Practice presentation behind the already-guarded `daily-practice` screen seam. Do not weaken navigation. Record exact integration wiring for Agent A.

### U4. Existing canonical runtimes accept different route parameters

**Containment.** Fixtures use only descriptor launch targets; Practice treats params as opaque strings and never reproduces runtime business logic. TypeScript and route smoke/manual instructions will validate integration.

### U5. “Degraded” health may have runtime-specific safe fallbacks later

**Containment.** Default degraded policy is exclusion. Explicit opt-in can be tested deterministically without assuming a fallback exists.

### U6. Exact balance/context bonus size is a product heuristic, not an empirically calibrated learner model

**Containment.** Keep the bonus small, deterministic, documented, and testable. Do not claim it is a personalized learning estimate. Agent A/user can tune it later without changing hard-filter truth boundaries.

## Derived acceptance criteria

1. Same normalized inputs always produce the same manifest/task order/session identity.
2. Descriptor hard filters run before ranking and expose deterministic diagnostics.
3. Unavailable tasks are excluded; degraded tasks fail closed by default.
4. Required entitlement declarations must all be present in composer input; runtime authorization still remains authoritative.
5. Wrong-profession descriptors are excluded.
6. Disallowed level bands or unmet prerequisites are excluded.
7. Missing microphone/audio/keyboard capability excludes tasks requiring that modality.
8. Selected tasks never exceed remaining/target time, and sessions are never padded merely to fill time.
9. Ordinary Practice never injects YKI mock/full-exam descriptors.
10. Curriculum mode never emits weakness/overdue/missed-attempt personalized language.
11. Learner mode uses only matching, explicitly durable supplied evidence; wrong-learner/non-durable evidence is ignored.
12. Missing overdue/weakness evidence contributes zero rather than a fabricated default score.
13. Context/mission continuity can break ranking ties/near-ties deterministically without overriding hard filters.
14. Skip, Another, No microphone, and Shorter recompositions are deterministic and expose truthful reasons/state.
15. Empty candidate pools return a graceful explicit state rather than throwing or injecting an incompatible task.
16. Session summary reports only tasks actually completed/skipped and skills/pathways actually practiced; it does not invent mastery/progress.
17. Practice UI presents one task at a time, visible path/progress, 5/10/20 duration controls, All/Everyday/Professional/YKI scope, and “Why these tasks?” explanations.
18. Progress/status changes are understandable textually and accessible without animation; no decorative looping animation is added.
19. Composer code contains no Cards/Roleplay/Reading/Writing/YKI engine business logic and launches only descriptor targets/callbacks.
20. Existing Professional/Speaking placeholder behavior in `FeatureEntryRoute.tsx` remains unchanged.
21. No protected/shared contract/navigation/auth/entitlement/workflow/dependency/native/production paths are modified.
22. Permanent no-network regression verification covers deterministic selection and all mandatory negative cases.
23. Final branch passes strict TypeScript, Practice verifier, protected navigation verifier as applicable, and `Wave 1 feature branch safety` at the exact final SHA.

## Research gate conclusion

The repository provides a safe guarded Daily Practice seam, the frozen contract is sufficient without modification, the learning evidence supports active/spaced practice only within truthful evidence boundaries, interleaving evidence argues against random mixing, and the installed stack supports an accessible deterministic implementation without dependencies or production changes.

RESEARCH_GATE=PASS
