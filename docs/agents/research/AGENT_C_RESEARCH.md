# Agent C Research — Shared Reading Engine

Date: 2026-08-16  
Agent: C  
Branch: `agent/c-reading-engine-20260816`  
Immutable base: `69813b433838130d5afe4b052360dbfd12df3f40`

## Questions investigated

1. What progression from A1 through B2 is supported by the CEFR reading descriptors?
2. How should the runtime favor active comprehension and correction over passive rereading?
3. How can contextual vocabulary help without replacing comprehension with a dictionary exercise?
4. Which reading strategies and scaffolds should be explicit, and how should support fade with proficiency?
5. Which mobile layout, text-scaling, touch-target, focus, and screen-reader requirements apply to the current React Native client?
6. Which KieliValmis routes, contracts, visual patterns, auth/entitlement paths, and protected capabilities constrain the design?
7. How will all Finnish learning content remain original and distinct from official YKI or commercial material?

## Existing repository evidence and constraints

- The assigned branch ref resolves directly to the immutable Wave-1 base, `69813b433838130d5afe4b052360dbfd12df3f40`; it contains no feature-agent commit.
- `packages/core/schemas/learning.ts` freezes `TaskDescriptor`, `TaskResult`, pathway, skill, modality, launch, version, and entitlement-declaration concepts. Agent C may adapt to them but may not modify them.
- `docs/agents/WAVE1_BRANCH_MATRIX.md` reserves `/learn/reading` and `/professional/reading` for Agent C and makes `/read` a protected, separate KieliValmis Read product surface.
- The current Expo Router tree contains `/read` routes and a substantial `features/read/**` implementation. There is no ordinary-learning Reading runtime under `features/reading/**`, and neither reserved route exists at the base SHA.
- Existing ordinary feature routes such as `app/learn/planner.tsx` export feature screens directly, while canonical route authorization lives mainly in protected `state/AppShell.tsx`. New Reading deep links therefore need a narrow local guard that consumes the existing auth and subscription stores and fails closed; Agent C must not edit `AppShell.tsx` or `navigationModel.ts`.
- `state/subscriptionStore.ts` exposes explicit `hasLoaded`, `isLoading`, `learnAccess`, `professionalAccess`, preview, and internal-access state. Reading can reuse those values without inventing an entitlement system.
- Current UI conventions include Expo Router, React Native `Pressable`, safe-area layouts, `@ui/theme/floentlyPalette`, generous rounded panels, dominant primary actions, and accessible roles/labels. `PageHeader` has periodic attention movement when a menu is present, so it is unsuitable for the calm active-reading surface.
- The client uses React Native 0.83.6, Expo 55, and TypeScript 5.9.3. The installed stack already provides everything needed; no dependency or native configuration change is justified.
- Protected source includes auth, subscription, navigation, Cards, Roleplay, formal YKI, `/read`, production configuration, and shared Wave-1 contracts. The Reading implementation will use new owned paths and two reserved route files only.

## Sources, findings, and decisions

All sources were accessed 2026-08-16.

### 1. CEFR Companion Volume (Council of Europe, 2020)

Source: https://rm.coe.int/common-european-framework-of-reference-for-languages-learning-teaching/16809ea0d4

Finding in my own words:

- CEFR reading is organized by real purposes and genres: correspondence, orientation/search, information and argument, instructions, and leisure reading.
- A1 readers work phrase by phrase with very short familiar material and can find concrete names, times, places, and prices.
- A2 readers handle short simple concrete texts, routine correspondence, notices, predictable information, and high-frequency everyday or job language.
- B1 readers handle straightforward factual texts, longer correspondence, practical documents, main points, text sequence, and basic context-supported inference.
- B2 readers work with greater independence, longer documents, viewpoints, text structure, implied meaning, and selective reference support.
- CEFR levels are broad bands on a continuum, not claims that one task precisely certifies a learner's level.

Decision caused:

- Author five realistic original documents: Everyday A1, A2, B1, B2, plus Professional reading.
- Progress from notices and short service messages toward announcements, policy-style documents, and workplace procedures.
- Use detail, main-idea, sequencing/matching, contextual-vocabulary, and inference families only where the level supports them.
- Label task difficulty as a content band, not an assessment or certification result.

### 2. CEFR reception strategies and L2 reading-strategy meta-analysis

Sources:

- CEFR identifying cues and inferring descriptors: same Council of Europe source above.
- Yapp, de Graaff, and van den Bergh (2021), “Improving second language reading comprehension through reading strategies: A meta-analysis of L2 reading strategy interventions,” DOI: https://doi.org/10.1075/jsls.19013.yap
- Open author/institution copy: https://dspace.library.uu.nl/bitstreams/af101b6b-8bd2-4c27-90eb-43af3e05e21f/download

Finding in my own words:

- CEFR explicitly develops the use of layout, titles, numbers, known words, connectors, surrounding text, and whole-text organization as comprehension cues.
- The meta-analysis synthesized 46 L2 reading-strategy studies and reported a large overall intervention effect, with useful support for explicit cognitive actions such as noticing structure, activating context, asking questions, and linking information.
- This does not justify permanently exposing every strategy cue. Support must remain relevant to the task and decrease as independent reading develops.

Decision caused:

- Encode level-specific scaffolding as deterministic configuration rather than hidden adaptive behavior.
- A1 receives context, a concrete reading goal, chunked presentation, and strong vocabulary access; A2 receives moderate context and chunking; B1 keeps a concise goal and optional support; B2 defaults to an authentic document with minimal scaffolding.
- Use headings, document metadata, and connectors as meaningful reading cues rather than decorative illustration.

### 3. Retrieval practice versus passive restudy

Sources:

- Rowland (2014), “The effect of testing versus restudy on retention: a meta-analytic review,” DOI: https://doi.org/10.1037/a0037559 and PubMed record: https://pubmed.ncbi.nlm.nih.gov/25150680/
- Agarwal, Nunes, and Blunt (2021), “Retrieval Practice Consistently Benefits Student Learning: a Systematic Review of Applied Research in Schools and Classrooms,” DOI: https://doi.org/10.1007/s10648-021-09595-9 and author PDF: https://pdf.poojaagarwal.com/Agarwal_etal_2021_EDPR.pdf

Finding in my own words:

- Testing can itself be a learning event and generally outperforms equivalent restudy for later retention.
- Applied classroom evidence covers multiple formats, timing, and feedback conditions, while also showing that effects vary and should not be turned into universal claims about every learner.
- A comprehension runtime should therefore require a meaningful decision, reveal focused feedback, and offer correction rather than calling rereading alone “practice.”

Decision caused:

- Present one question at a time after the learner has read the complete document.
- Record incorrect attempts, explain the relevant textual cue, permit an intentional retry, and reward a successful correction in the completion summary.
- Do not generate weakness, mastery, or personalized retention claims; the result reports only observed task performance.

### 4. Contextual vocabulary glosses

Sources:

- Yanagisawa, Webb, and Uchihara (2020), “How Do Different Forms of Glossing Contribute to L2 Vocabulary Learning from Reading? A Meta-Regression Analysis,” author PDF: https://takumiuchihara.weebly.com/uploads/1/2/3/7/123756989/yanagisawa-webb-uchihara-2019-glossing_meta-analysis.pdf
- Zhang and Ma (published online 2021; issue 2024), “The effect of textual glosses on L2 vocabulary acquisition: A meta-analysis,” DOI: https://doi.org/10.1177/13621688211011511

Finding in my own words:

- Meta-analytic evidence supports glosses for incidental vocabulary learning, but effects differ by gloss form, location, and outcome.
- Recognition gains do not guarantee durable recall, and automatically glossing every word risks diverting attention from the communicative purpose.

Decision caused:

- Include a small authored vocabulary set tied to the document context.
- Keep glosses closed until the learner requests them; never replace the Finnish document with a translated version.
- A1/A2 can expose a more prominent vocabulary control, while B1/B2 use restrained optional support.

### 5. React Native accessibility and responsive text

Sources:

- React Native 0.83 Accessibility: https://reactnative.dev/docs/0.83/accessibility
- React Native 0.83 Text: https://reactnative.dev/docs/0.83/text
- React Native 0.83 `useWindowDimensions`: https://reactnative.dev/docs/0.83/usewindowdimensions

Finding in my own words:

- React Native requires explicit role, label, state, and live-region semantics when visual context alone would be ambiguous.
- Dynamic feedback should be announced without unexpectedly interrupting reading.
- System font scaling and responsive window dimensions are first-class inputs; reading UI must not truncate essential text.

Decision caused:

- Give every answer, retry, vocabulary, and navigation control an accessibility role and descriptive label.
- Expose selected/disabled state, mark the progress control as a progress bar, and announce feedback with a polite live region.
- Allow font scaling, avoid essential `numberOfLines` truncation, constrain wide-screen measure, and use wrapping layouts rather than horizontal scrolling.

### 6. WCAG 2.2 mobile/reflow requirements

Sources:

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Understanding Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Understanding Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- Understanding Text Spacing: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html

Finding in my own words:

- WCAG 2.2 establishes a 24 by 24 CSS-pixel minimum target (subject to defined exceptions), single-axis reflow at a 320 CSS-pixel-wide viewport, and no loss when users increase text spacing.
- A learning answer is an important control, so merely meeting the bare minimum is not the right product target.

Decision caused:

- Use at least 48 device-independent pixels for primary interactive controls and comfortable separation between options.
- Keep document and question panels single-column, reflowing, and width-constrained on larger displays.
- Use body line heights around 1.5 times font size and generous paragraph spacing.

### 7. Expo Router and route ownership

Source: https://docs.expo.dev/router/basics/notation/

Finding in my own words:

- File-based routes can mount the two reserved screens without changing the protected central navigation union.
- A route file is not an entitlement boundary by itself.

Decision caused:

- Add only `app/learn/reading.tsx` and `app/professional/reading.tsx` as thin entries into one shared route/runtime.
- Add a local access decision function and boundary that reuses canonical auth/subscription state and fails closed.
- Leave home/drawer discovery wiring to Agent A because `AppShell.tsx` and `navigationModel.ts` are integration-owned.

## Original Finnish content and provenance

- All five representative documents, prompts, choices, glosses, and feedback will be authored specifically for KieliValmis by Agent C on 2026-08-16.
- They will depict synthetic everyday and workplace situations and will not reproduce a real notice, employer policy, textbook passage, paid-course exercise, or official YKI item.
- The content registry will carry a provenance record (`author`, `authoredAt`, `license`, and source note) for auditability.
- Ordinary Reading tasks will not use YKI labels, timers, scoring claims, or exam semantics.

## Alternatives rejected

1. **Repurpose `/read`.** Rejected because it is a separate protected product with its own auth, renderer, library, and subscription behavior.
2. **Build separate Everyday and Professional engines.** Rejected because it duplicates state, adapters, accessibility behavior, and future fixes.
3. **Edit `AppShell.tsx` or `navigationModel.ts`.** Rejected because both are protected integration-owned files; reserved file routes plus a local guard are sufficient for Agent C source evidence.
4. **Add a testing, animation, or content dependency.** Rejected because pure TypeScript logic, React Native primitives, and the existing theme are enough.
5. **Reveal all translations automatically.** Rejected because gloss evidence does not imply that replacing contextual reading with constant translation improves comprehension.
6. **Use random task selection or adaptive scaffolding.** Rejected because randomness weakens determinism and the repository has no durable learner evidence that could justify personalized scaffolding.
7. **Use celebratory looping motion.** Rejected because active reading is a calm focus state and movement would not teach, orient, respond, or reward.
8. **Treat CEFR labels as assessment results.** Rejected because the descriptors are broad curricular reference bands and these authored tasks are not calibrated exams.

## Uncertainties and how they will be tested or contained

| Uncertainty | Containment / test |
| --- | --- |
| VoiceOver, TalkBack, and web screen readers expose React Native semantics differently. | Add permanent semantic source/contract checks, then require manual VoiceOver/TalkBack/web keyboard smoke tests in the handoff. |
| Static original content has not yet received an external Finnish-editor review. | Run deterministic structural/content checks now; list Finnish editorial review as a known limitation and user acceptance item. |
| Agent B's event repository is intentionally unavailable on this moving branch. | Expose typed local event callbacks and a deterministic `TaskResult` adapter; record Agent-A wiring as an integration requirement. |
| Central menu discovery requires protected navigation edits. | Keep both reserved deep links functional and protected; record only the discovery wiring for Agent A. |
| A future remote content provider may fail or return malformed data. | Make loading, provider-error, empty/not-found, and malformed-task states explicit now; validate every task before rendering. |
| Client entitlement state is not a replacement for server enforcement. | Reuse canonical stores, fail closed once hydration completes, declare descriptor requirements, and state explicitly that server checks remain authoritative. |

## Acceptance criteria derived from the evidence

1. One typed runtime renders both Everyday and Professional tasks; no duplicate engine exists.
2. Five original representative tasks cover Everyday A1/A2/B1/B2 and Professional reading.
3. The bank includes detail, main idea, matching, sequencing, contextual vocabulary, and level-appropriate inference.
4. Scaffolding is deterministic and visibly decreases from A1 to B2.
5. Vocabulary support is optional, limited, contextual, and never replaces the Finnish text.
6. Incorrect answers show an actionable text-based explanation and can be retried without losing version or attempt history.
7. `TaskDescriptor` and `TaskResult` adapters preserve task/content version and produce identical output for identical inputs.
8. Loading, error, missing, empty, and malformed task inputs fail safely.
9. Interactive elements expose roles, labels, selected/disabled state, polite feedback announcements, font scaling, large controls, and one-column reflow.
10. `/learn/reading` and `/professional/reading` remain distinct and locally auth/entitlement guarded; `/read` and protected navigation/auth/subscription files remain unchanged.
11. No dependency, native configuration, backend, production, YKI, Roleplay, Cards, or deployment file changes are made.
12. Permanent tests exercise correct, incorrect, retry, malformed, version preservation, scope, scaffolding, route isolation, accessibility contracts, deterministic adapter output, and fail-closed access decisions.

RESEARCH_GATE=PASS
