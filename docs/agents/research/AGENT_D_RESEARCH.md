# Agent D research — shared Writing and revision engine

Date: 2026-08-16
Agent: D
Branch: `agent/d-writing-revision-engine-20260816`
Immutable base: `69813b433838130d5afe4b052360dbfd12df3f40`

## Questions investigated

1. What does current second-language-writing evidence support about corrective feedback, revision, focus, direct correction, and metalinguistic explanation?
2. Which parts of the writing experience should change between A1/A2 and B1/B2?
3. How can a mobile writing flow keep the keyboard, feedback, and status information usable and accessible?
4. What draft persistence can this branch truthfully promise?
5. Which KieliValmis evaluation, auth, entitlement, and learning-contract facilities already exist, and which are protected from Agent D changes?
6. What privacy boundary is appropriate for learner writing, especially workplace or healthcare-like text?
7. How can Healthcare Report Writing become a future task family without changing its current route or behavior in this branch?

## Existing repository evidence and constraints

- The GitHub compare API resolved `agent/d-writing-revision-engine-20260816` as identical to immutable base `69813b433838130d5afe4b052360dbfd12df3f40` before research began. The assigned branch is not `main`, a production/integration branch, or another agent's branch.
- `packages/core/schemas/learning.ts` is frozen. It already provides `TaskDescriptor`, `TaskResult`, and `LearnerEvent`; Agent D must use local extensions and may not add shared fields.
- `apps/client/features/professional/screens/HealthcareReportWritingScreen.tsx` is a standalone, one-shot screen. It uses local keyword/length heuristics, shows strengths/missing items/tips, and exposes a full model answer. It has no attempt history, targeted retry, resubmission, or before/after comparison.
- `apps/client/state/ProfessionalRoute.tsx` owns the current Healthcare Report Writing launch and disables it when the selected profession is not present in canonical subscription entitlements. This file and the existing healthcare screen/data must remain behaviorally unchanged in Agent D's branch.
- There is no general-purpose Writing evaluation API. Existing provider-backed evaluators are Roleplay and YKI services. Their files and semantics are protected Wave-1 capabilities and are not safe extension points for Agent D.
- `packages/core/api/client.ts` injects the canonical auth token for API calls. Agent D will not create a parallel API/auth client.
- `apps/client/state/authStore.ts` exposes the stable authenticated `user.id`. `apps/client/state/subscriptionStore.ts` exposes hydrated `learnAccess`, `professionalAccess`, and entitled professions. New route entry gates can consume these states without reimplementing plan rules.
- The client has React Native 0.83.6, Expo Router 55.0.16, and `@react-native-async-storage/async-storage` 2.2.0. Existing `sessionPersistence.ts` uses AsyncStorage/localStorage with an in-memory fallback, but it has no learner-keyed Writing repository, retention rule, draft encryption, or cross-account draft tests.
- Expo Router file routes are directly addressable. A new Writing route must fail closed until canonical auth and subscription state have hydrated; the renderer must never be the entitlement authority.
- The feature-branch firewall forbids changes to shared learning types, package manifests/locks, workflows, production/deployment files, protected Roleplay/YKI/auth/subscription services, `AppShell.tsx`, and `navigationModel.ts`.

## Sources, findings, and decisions

All sources were accessed 2026-08-16.

### Learning design

1. Brown, Liu, and Norouzian, “Effectiveness of written corrective feedback in developing L2 accuracy: A Bayesian meta-analysis,” *Language Teaching Research*, DOI 10.1177/13621688221147374. https://journals.sagepub.com/doi/10.1177/13621688221147374
   - Finding: Across 52 controlled primary studies, written corrective feedback showed moderately effective, durable effects; direct, indirect, and metalinguistic approaches had broadly similar aggregate effects. The authors also stress that simple universal practitioner rules remain limited.
   - Decision: Writing feedback is an actionable learning step, but the engine will not claim that one correction style is universally superior. Each priority includes a concise reason and a learner action, not merely a corrected form.

2. Kang and Han, “The efficacy of written corrective feedback in improving L2 written accuracy: A meta-analysis,” *The Modern Language Journal* 99(1), DOI 10.1111/modl.12189. https://onlinelibrary.wiley.com/doi/abs/10.1111/modl.12189
   - Finding: Corrective feedback can improve L2 written accuracy, with effects moderated by learner proficiency, setting, and task genre.
   - Decision: Feedback rules and scaffolding belong to versioned task configuration. Everyday and Professional register/genre behavior will not be inferred from one generic score.

3. Shintani, Ellis, and Suzuki, “Effects of Written Feedback and Revision on Learners' Accuracy in Using Two English Grammatical Structures,” *Language Learning* 64(1), DOI 10.1111/lang.12029. https://onlinelibrary.wiley.com/doi/abs/10.1111/lang.12029
   - Finding: The study compared direct and metalinguistic feedback with and without revision; revision following feedback showed a longer-term advantage for one studied structure, while effects differed by structure. Revision is pedagogically meaningful, but revision of one text alone is not proof of broad acquisition.
   - Decision: A first submission does not complete the canonical task. The learner must revise and resubmit; evidence records the actual retry and avoids claims of general mastery.

4. Sheen, “The Effect of Focused Written Corrective Feedback and Language Aptitude on ESL Learners' Acquisition of Articles,” *TESOL Quarterly* 41(2), DOI 10.1002/j.1545-7249.2007.tb00059.x. https://onlinelibrary.wiley.com/doi/10.1002/j.1545-7249.2007.tb00059.x
   - Finding: Focused feedback on one linguistic feature improved accuracy in that study, and direct feedback with metalinguistic information produced stronger delayed performance than direct correction alone. Individual analytic ability moderated effects.
   - Decision: Default feedback will be focused and briefly metalinguistic: what needs attention, why it matters, and what to retry. A1/A2 prompts are more explicit; B1/B2 prompts ask the learner to make more of the revision decision.

5. Ellis, Sheen, Murakami, and Takashima, “The effects of focused and unfocused written corrective feedback in an English as a foreign language context,” *System* 36(3), DOI 10.1016/j.system.2008.02.001. https://www.sciencedirect.com/science/article/abs/pii/S0346251X08000390
   - Finding: Both focused and unfocused feedback groups outperformed a no-feedback group in the studied context, without a significant difference between the two feedback scopes. The research base does not prove an exact universally optimal number of comments.
   - Decision: The product default of at most two priorities is an explicit cognitive-load/product hypothesis, not a scientific constant. It will be user-tested and can evolve through task configuration without rewriting the engine.

6. Council of Europe, *Common European Framework of Reference for Languages: Learning, teaching, assessment — Companion Volume* (2020). https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4
   - Finding: Written production/interaction progresses from simple phrases and short formulaic messages at A1/A2 toward connected, audience-aware, detailed, and register-appropriate texts at B1/B2.
   - Decision: A1/A2 tasks provide plan questions, phrase starters, shorter targets, and concrete communicative checks. B1/B2 tasks reduce phrase support and add organization/register expectations. CEFR labels guide task design; the engine does not award an official CEFR level.

### Mobile, accessibility, routing, and storage

7. React Native `TextInput` documentation. https://reactnative.dev/docs/textinput
   - Finding: Multiline inputs support controlled text, accessibility font scaling, and platform keyboard behavior; absolutely positioned controls can interact badly with Android resize behavior.
   - Decision: Use a controlled multiline input in normal document flow, no fixed submit bar over the keyboard, and accessible labels/hints.

8. React Native `KeyboardAvoidingView` documentation. https://reactnative.dev/docs/keyboardavoidingview
   - Finding: The component can adjust height, position, or padding for the software keyboard, and platform behavior should be chosen explicitly.
   - Decision: Wrap the focus screen in `KeyboardAvoidingView`, using padding on iOS and height on other platforms.

9. React Native `ScrollView` documentation. https://reactnative.dev/docs/scrollview
   - Finding: `keyboardShouldPersistTaps="handled"` allows handled child controls to receive taps while the keyboard is open; drag dismissal is configurable.
   - Decision: Use handled keyboard taps and on-drag keyboard dismissal so submit/retry controls remain usable.

10. W3C, WCAG 2.2; Understanding 4.1.3 Status Messages; Understanding 2.5.8 Target Size (Minimum). https://www.w3.org/TR/WCAG22/ ; https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html ; https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
    - Finding: Important status changes should be programmatically determinable without forcing focus, and pointer targets need adequate size/spacing.
    - Decision: Draft/evaluation state and new feedback use live-region semantics; press targets are at least 44 logical pixels high. The focus state has no looping motion.

11. Expo Router protected routes documentation. https://docs.expo.dev/router/advanced/protected/
    - Finding: File routes exist by default; client-side protected routing must be driven by an explicit guard and does not replace server authorization.
    - Decision: New route entry components wait for canonical auth/subscription hydration and fail closed. They consume existing entitlement booleans and never invent plan rules. No shared navigation or server authorization code is changed.

12. Expo AsyncStorage documentation and upstream repository. https://docs.expo.dev/versions/latest/sdk/async-storage/ ; https://github.com/react-native-async-storage/async-storage
    - Finding: AsyncStorage is persistent but unencrypted. Persistence requires an explicit keying, isolation, error, and retention design; merely calling `setItem` is not enough to promise safe durable drafts.
    - Decision: Wave-1 Writing drafts are session-memory only. UI copy says they are kept only in the open practice and may be lost on leave/reload. Durable autosave is deferred.

### Privacy

13. Regulation (EU) 2016/679 (GDPR), especially Article 5 purpose limitation/data minimisation and Article 9 special-category data. https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679
    - Finding: Personal data processing must be purpose-limited and minimized; health data has additional protection. Learners may paste real personal/workplace details even when a prompt asks for fictional text.
    - Decision: The default evaluator is local and deterministic; it sends no learner text to a provider. Professional tasks warn users to use fictional details and never enter real patient/client/personal information. Any future remote evaluator requires explicit data-flow, retention, disclosure, authentication, provider, and deletion review.

## Acceptance criteria derived from research

1. One typed engine and one renderer serve Everyday and Professional Writing.
2. A task preserves stable `taskId` and `contentVersion` through every attempt, comparison, result, and event adapter.
3. The implemented loop is understand, plan, write, submit, focused feedback, revise, resubmit, compare, then evidence.
4. Feedback begins with communicative success and exposes no more than two priority improvements by default.
5. Each priority gives a concise explanation and targeted retry instruction; the evaluator never supplies a full rewritten answer.
6. Attempt ordering and comparisons are deterministic from injected IDs/timestamps.
7. A failed evaluator records an understandable failure while preserving the exact editable draft.
8. A1/A2 configurations visibly provide more planning/phrase scaffolding than B1/B2.
9. Professional tasks require professional access, audience/register metadata, and a fictional-details warning; Everyday tasks differ in register and entitlement declaration.
10. Draft status text accurately states session-only retention; no persistence API is used or implied.
11. `TaskResult` is emitted only after a successful revision/resubmission; event creation requires injected authenticated learner and event IDs.
12. Route entry guards consume existing auth/subscription stores and fail closed while loading or denied.
13. The shared learning contract, auth, entitlement, AppShell, navigation, Roleplay, YKI, package, native, and production files remain unchanged.
14. Existing Healthcare Report Writing screen/data/route behavior remains unchanged. A new inactive migration descriptor may describe future conversion, but it cannot activate or import the new renderer into the legacy route.
15. The screen is keyboard-safe, readable, status-announced, touch-friendly, and contains no looping animation.
16. Authored tasks are original KieliValmis content and contain no official YKI or proprietary course items.

## Alternatives rejected

- **Reuse or modify Roleplay/YKI provider services.** Rejected because those are protected, task-specific evaluators and would couple ordinary Writing to formal/protected semantics.
- **Create a new backend/provider endpoint in Agent D.** Rejected because no reviewed learner-writing privacy/data-retention path exists and backend router/auth changes would cross ownership boundaries.
- **Have AI rewrite the learner's entire answer.** Rejected because it removes the productive revision step and obscures what the learner changed.
- **Show every detectable problem.** Rejected as an unactionable default. Evidence does not establish an exact ideal count, so the two-priority cap is kept configurable and explicitly tested.
- **Persist drafts immediately in AsyncStorage.** Rejected because the installed store is unencrypted and the repo lacks a learner-keyed Writing retention/isolation contract.
- **Replace Healthcare Report Writing now.** Rejected because its current entitlement-controlled behavior is protected from regression and integration ownership belongs to Agent A.
- **Modify `AppShell.tsx`, `navigationModel.ts`, package manifests, or shared types.** Rejected by the Wave-1 ownership and feature-branch firewall.

## Uncertainties and how they will be tested

- Deterministic authored checks can miss valid Finnish paraphrases. Tests will prove deterministic limits/fallbacks, while manual user tests will sample paraphrases. UI copy will describe feedback as focused, not exhaustive. A provider adapter remains an interface only.
- The two-priority default may be too little for some B2 users. Manual tests will compare clarity/actionability across A1–B2; the constant is centralized for later evidence-based adjustment.
- CEFR descriptors do not prescribe KieliValmis's exact prompts. Native/advanced Finnish review is still required for content quality; content versions make later corrections historically explicit.
- Keyboard behavior varies across iOS, Android, and web. Source tests cover required props/semantics; manual tests will use small screens, large text, and active keyboards.
- Client-side route gating is not server authorization. Tests will prove that the renderer is withheld without hydrated canonical access. Future provider/event writes must still enforce server-side identity/entitlement.
- Durable autosave remains unavailable. Tests will reject persistence imports and false autosave copy. A later implementation requires cross-account, restart, corruption, logout-clear, retention, and deletion tests.
- The healthcare migration descriptor intentionally cannot activate itself. Tests will prove it remains `integration_required` and that current Healthcare Report Writing files are absent from the Agent D diff.

## Integration requirements for Agent A

- `INTEGRATION_REQUIREMENT`: Mount `/learn/writing` and `/professional/writing` from approved pathway entry points without weakening canonical auth/entitlement behavior.
- `INTEGRATION_REQUIREMENT`: Connect Writing result/event adapters to Agent B's durable learner-event service only after authenticated learner identity, idempotency, and persistence contracts are integrated.
- `INTEGRATION_REQUIREMENT`: If remote Writing evaluation is approved later, provide an authenticated server adapter with structured-output validation, data-protection disclosure, retention/deletion rules, provider failure handling, and no client-held provider secret.
- `INTEGRATION_REQUIREMENT`: Decide whether/when legacy Healthcare Report Writing scenarios are converted using the inactive migration descriptor; preserve the existing feature until independent parity and entitlement tests pass.
- `INTEGRATION_REQUIREMENT`: Durable autosave needs an approved learner-keyed encrypted-or-otherwise-reviewed storage policy plus account-switch/logout and retention tests.

RESEARCH_GATE=PASS
