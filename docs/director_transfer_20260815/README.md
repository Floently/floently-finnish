# KieliValmis Director Transfer Package Index

Established: 2026-08-16

Status: PRESERVED PRODUCT/DESIGN EVIDENCE — CURRENT CODE AND PRODUCTION RECONCILIATION HAVE PRECEDENCE

## Purpose

This document records, in searchable GitHub text, the contents and intended use of the KieliValmis improvement packages supplied by the product owner on 2026-08-16. The original packages were prepared on 2026-08-15 by a previous AI/development pass.

The packages are valuable because they deliberately cover product direction, UI exposure, deletion safety, learning science, competitor research, visual/motion design, roleplay, progress, adaptive learning, mobile delivery, QA, and starter implementation patterns.

They are historical design and implementation evidence. They are **not** production deployment authority. Any old branch/head/worktree references inside them are superseded whenever current source or the 2026-08-16 production reconciliation proves a newer state.

Current precedence remains:

1. current source and proven production runtime evidence;
2. `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`;
3. `docs/PRODUCTION_SOURCE_RECONCILIATION_20260816.md`;
4. `docs/KIELIVALMIS_CURRENT_RUNTIME_AUTHORITY.md`;
5. `docs/KIELIVALMIS_COMBINED_IMPLEMENTATION_PLAN.md` and current roadmap;
6. this preserved transfer package as design/research/donor evidence.

## Package 01 — Director handover

Original archive: `kielivalmis_01_director_handover.zip`

Contents include:

- `handover/01_DIRECTOR_HANDOVER_FULL.md` — broad project/product handoff covering the post-release state, product direction, known gaps, safety rules, current learning pathways, hidden capability decisions, UX concerns, and implementation ideas;
- `handover/19_ADDITIONAL_DIRECTOR_NOTE.md` — realism/canonicalization guidance for the next executor;
- `current_state/02_CURRENT_STATE_AND_GIT.md` — historical branch/worktree snapshot from 2026-08-15;
- `current_state/14_CODE_INTEGRATION_MAP.md` — historical mapping from design proposals to then-current code;
- `current_state/RAW_UI_EXPOSURE_AUDIT_OUTPUT_20260815.txt` — raw surface audit evidence;
- `roadmap/12_ROADMAP_NEW_ITEMS.md` — proposed stable roadmap additions.

Key retained ideas:

- KieliValmis should be a narrow, deep Finnish-learning system for life/work in Finland and YKI rather than a broad generic language catalogue;
- connect learning capabilities into one coherent learner journey instead of exposing every feature as a separate destination;
- preserve real user-facing capability but eliminate duplicate/legacy runtime surfaces only after dependency proof;
- use current code as authority rather than following stale historical reports.

## Package 02 — Exposure, deletion and QA

Original archive: `kielivalmis_02_exposure_deletion_qa.zip`

Contents include:

- `exposure_deletion/03_EXPOSURE_AND_DELETION_PROTOCOL.md`;
- `qa/15_RISK_AND_QA_REGISTER.md`;
- `qa/PREDELETE_EVIDENCE_TEMPLATE.md`;
- `qa/code/audit-predelete-dependencies.mjs`;
- `qa/code/verify-canonical-ui-owners.mjs`;
- repeated current-state and roadmap evidence needed to make deletion decisions.

Key retained ideas:

- every learner-facing surface must end as intentionally exposed, contextually/internal retained with a proven reason, or deleted;
- deletion requires reverse dependency proof, unique-capability comparison, migration of required behavior first, and pre/post deletion gates;
- a clean build after deletion is not enough to prove safe deletion;
- Git history is the backup — dead product surfaces should not remain as informal backups;
- add automated invariants so new orphan/duplicate learner surfaces are detected before release.

## Package 03 — Competitor and learning-science research

Original archive: `kielivalmis_03_competitor_learning_research.zip`

Contents include:

- `research/04_COMPETITOR_RESEARCH.md`;
- `research/16_OPEN_SOURCE_ARCHITECTURE_REFERENCES.md`;
- `learning_science/05_LEARNING_SCIENCE.md`;
- `sources/13_SOURCE_CATALOG.md`.

Key retained ideas:

- borrow interaction/learning principles, not competitor visual identity or proprietary content;
- use retrieval, spaced review, corrective feedback, understandable progression, and action-oriented CEFR development;
- interleaving should be purposeful and coherent, not arbitrary topic shuffling;
- multimedia should teach/contextualize rather than add cognitive load;
- design for real Finnish situations, transfer across modalities, and repeated retrieval in new contexts;
- public/open-source references require license review before source reuse.

## Package 04 — Visual, animation and artwork system

Original archive: `kielivalmis_04_visual_animation_artwork.zip`

Contents include:

- `visual_system/07_VISUAL_ANIMATION_ART_SYSTEM.md`;
- `visual_system/18_ART_PRODUCTION_PIPELINE.md`;
- `visual_system/20_VISUAL_FEATURE_RECIPES.md`;
- `visual_system/MOTION_BUDGET.md`;
- reusable React Native starter components including `AuroraProgressRing`, `ProgressCelebrationOverlay`, `ProgressiveArtworkFrame`, `StoryMoment`, reduced-motion helpers and character manifests;
- original example SVG artwork (`aurora_star.svg`, `tram_stop.svg`, `kitchen.svg`, `character_aino.svg`);
- Progress event/reducer/sound/celebration starter code.

Core visual doctrine retained:

Every visual element should **Teach, Orient, Respond, or Reward**. If it does none of those jobs it is probably unnecessary.

Motion budget:

- normally 0–1 ambient looping region per screen;
- one primary entrance transition at a time;
- one transient feedback animation at a time;
- celebrations usually under about 1.2 seconds;
- no decorative loop behind dense reading or active writing;
- no decorative movement during active microphone recording beyond functional waveform/mic state;
- no reward sound for routine taps;
- respect system reduced motion and explicit sound/haptic controls.

Progressive visual richness:

- beginner content may use stronger contextual imagery and visible scaffolding;
- imagery becomes contextual rather than instructional as competence increases;
- advanced and YKI simulation surfaces become calmer, more document/text authentic and less decorative;
- recurring original KieliValmis characters may create continuity when persona/voice identity is reliable.

## Package 05 — Roleplay 2.0

Original archive: `kielivalmis_05_roleplay_system.zip`

Contents include:

- `roleplay/08_ROLEPLAY_2_0.md`;
- conversation-memory, anti-repetition, mission engine, feedback-policy and pedagogy starter code;
- `RoleplayMissionHUD.tsx`;
- `roleplayMission.example.json`;
- supporting learning-science and code-integration notes.

Key retained ideas:

- keep natural AI-generated conversation, but place it inside a deterministic pedagogical mission contract;
- learner and AI/counterpart roles remain stable;
- scenario/mission success can be deterministic even when dialogue varies;
- anti-repetition should vary context, actors, modifiers and language while preserving concepts that legitimately need review;
- level should change vocabulary, turn length, ambiguity, support and independence;
- post-session feedback defaults to one strength, one high-value correction, one phrase to keep and one targeted retry;
- learning memory should retain useful weak/mastered concepts without silently retaining sensitive conversation details;
- persona identity should include stable voice metadata.

The 2026-08-16 production reconciliation has already implemented stronger role-contract reliability than the old transfer checkpoint. Therefore the old starter code is donor/reference only; it must not replace current reconciled roleplay source.

## Package 06 — Progress and adaptive learning

Original archive: `kielivalmis_06_progress_adaptive_learning.zip`

Contents include:

- `progress/09_PROGRESS_AND_MOTIVATION.md`;
- `adaptive_learning/10_ADAPTIVE_LEARNING_ENGINE.md`;
- LearningEvent, reducer, store, progress sound and celebration starter code;
- adaptive next-step, queue builder and commute-session state-machine starter code.

Key retained ideas:

- Progress must be real, explainable and based on learner events;
- track skill evidence for vocabulary, grammar, listening, speaking, reading and writing;
- one dominant `Continue` / next-best-step action may make study easier without removing free exploration;
- recommendations must explain why they were selected;
- session composer supports 5/10/20 minute sessions;
- a useful 10-minute session might combine due retrieval, listening, roleplay and targeted retry;
- maintain rolling 7/28-day skill exposure so one easy-to-schedule capability (especially vocabulary/cards) does not crowd out other skills;
- professional learning can follow chains such as `vocabulary -> listening -> roleplay -> documentation -> review`;
- novelty means reusing knowledge in a different useful context, not avoiding repetition;
- hard constraints (entitlement, profession, level, modality, health, time, YKI boundaries) filter candidates before ranking.

The original suggested scoring shape was:

`0.30 overdueNeed + 0.25 weaknessNeed + 0.15 goalRelevance + 0.15 skillBalance + 0.10 novelty + 0.05 timeFit`

These are initial explainable product weights, not immutable scientific constants.

## Package 07 — Single-developer and mobile delivery

Original archive: `kielivalmis_07_single_developer_mobile_delivery.zip`

Contents include:

- `single_developer/06_SINGLE_DEVELOPER_EXECUTION_PLAN.md`;
- `single_developer/17_FIRST_90_DAYS_EXECUTION.md`;
- `mobile_delivery/11_OTA_AND_MOBILE_DELIVERY.md`;
- roadmap/current-state references.

Key retained ideas:

- build small coherent dependency-aware packages;
- separate code proof from production deployment;
- use feature flags for substantial new behavior;
- preserve mobile binary/runtime compatibility and know when OTA is insufficient;
- maintain release/rollback evidence;
- do not mix unrelated work into production-critical patches.

The old 90-day ordering is historical and is superseded where the 2026-08-16 production-source reconciliation introduced stricter dependencies.

## Package 08 — Code starter pack

Original archive: `kielivalmis_08_code_starter_pack.zip`

Contents include the package's original example code/data/artwork without the large prose documents, including:

- visual/motion components and manifests;
- roleplay mission/pedagogy/anti-repetition examples;
- progress events/store/reducer/sound/celebration examples;
- adaptive recommendation/queue examples;
- pre-delete audit/invariant scripts;
- original example SVG artwork.

Important rule: this code is **reference/donor material only**. It was explicitly never applied as a complete package. Every useful idea must be re-derived against the then-current canonical source and replayed narrowly. Do not paste the starter pack wholesale into production code.

## Master transfer

Original archives:

- `kielivalmis_director_transfer_master_20260815.zip`;
- `kielivalmis_director_transfer_master_20260815.tar.gz`.

The master combines the eight slices into one transfer directory and includes a `PACKAGE_MANIFEST.json` with byte sizes and SHA-256 hashes for the individual source files.

Master read order recorded by the original package:

1. Director handover;
2. current state/Git;
3. exposure/deletion protocol;
4. single-developer plan;
5. visual/animation/art system;
6. Roleplay 2.0;
7. Progress/motivation;
8. adaptive learning engine;
9. competitor research;
10. learning science;
11. mobile delivery;
12. roadmap new items;
13. source catalog;
14. QA register;
15. starter code folders.

## New 2026-08-16 product synthesis

The transfer package is now explicitly extended by:

`docs/KIELIVALMIS_PRACTICE_HUB_FOUR_SKILL_VOICE_PLAN_20260816.md`

That addendum turns several transfer ideas into a concrete product contract:

- one unified Practice Hub, while retaining the existing pathway-specific homes;
- pathway-scoped Daily Practice for Everyday, Professional and YKI;
- controlled, explainable interleaving instead of true random shuffling;
- shared Reading and Writing learning engines/content contracts;
- four-skill development in Everyday and Professional Finnish;
- serious four-skill YKI practice;
- voice identity as an explicit product/runtime contract;
- a real multi-speaker YKI dialogue contract;
- provider voice metadata verification and permanent regression coverage.

## Archive hashes

Uploaded archive SHA-256 values captured before GitHub documentation:

- `kielivalmis_01_director_handover.zip`: `9c1e11b14624e7c997852539fc30bb6c39c6ed9545ff3f785bc922ff3e298d72`
- `kielivalmis_02_exposure_deletion_qa.zip`: `3e33c3d998ebad692f2db2cc99aa50a831f2264df409440638ce44233952a1ba`
- `kielivalmis_03_competitor_learning_research.zip`: `dbe38952975940ae71ecc984aaaa4a75abfcba4f932582ee9c4cdf5fc07cb9e1`
- `kielivalmis_04_visual_animation_artwork.zip`: `e267693b603ccee0d0c301364685757ccd9b94bab7f28c7bfc8e3200247d51ec`
- `kielivalmis_05_roleplay_system.zip`: `abbcaab7a8fe0edb5b79af2a24a6c7e77f5df31057352156c62af58749cafb37`
- `kielivalmis_06_progress_adaptive_learning.zip`: `d2f2d474230938385674161dcdc3cf99309a095bea77e768a6b788ba1c148d51`
- `kielivalmis_07_single_developer_mobile_delivery.zip`: `b08b4b09adb2c19dc429129a705d7c6040bb7c878898f1a8387b81212c094813`
- `kielivalmis_08_code_starter_pack.zip`: `6bc2cbf9c55c4516dfb849d2b7958b604df3b93726c8a9468a202a1ac0c32e42`
- `kielivalmis_director_transfer_master_20260815.zip`: `b465ef8d94dcf03c9a743f0e107a2c440ab9565137337334e312fe8c283db4ef`
- `kielivalmis_director_transfer_master_20260815.tar.gz`: `d1151be82bd68080bbf6902174103a1fbfe81f487aa20b1b869c3e74352e92b2`

These hashes provide provenance if the original binary package must later be compared against a retained external copy.