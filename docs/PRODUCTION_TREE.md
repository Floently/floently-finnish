# Floently Finnish Final Target Tree

```text
floently-finnish/
├── apps/
│   ├── backend/
│   │   ├── analytics/
│   │   │   ├── __init__.py
│   │   │   └── event_logger.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── analytics.py
│   │   │       ├── auth.py
│   │   │       ├── billing.py
│   │   │       ├── health.py
│   │   │       ├── learning.py
│   │   │       ├── professional.py
│   │   │       ├── speaking_lab.py
│   │   │       ├── yki_exam.py
│   │   │       └── yki_practice.py
│   │   ├── audit/
│   │   │   ├── __init__.py
│   │   │   └── audit_logger.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── errors.py
│   │   │   ├── responses.py
│   │   │   └── security.py
│   │   ├── learning/
│   │   │   ├── __init__.py
│   │   │   ├── adapter.py
│   │   │   ├── confidence_tracker_service.py
│   │   │   ├── content.py
│   │   │   ├── diagnostic_service.py
│   │   │   ├── models.py
│   │   │   ├── personal_phrase_bank_service.py
│   │   │   ├── practice_service.py
│   │   │   ├── progress_service.py
│   │   │   ├── repository.py
│   │   │   ├── review_service.py
│   │   │   ├── revision_vault_service.py
│   │   │   ├── scheduler.py
│   │   │   ├── study_plan_service.py
│   │   │   ├── system_service.py
│   │   │   ├── work_track_service.py
│   │   │   └── workplace_incident_service.py
│   │   ├── practice/
│   │   │   ├── __init__.py
│   │   │   └── adapter.py
│   │   ├── professional/
│   │   │   ├── __init__.py
│   │   │   ├── path_service.py
│   │   │   └── scenario_service.py
│   │   ├── speaking/
│   │   │   ├── __init__.py
│   │   │   ├── adapter.py
│   │   │   ├── engine.py
│   │   │   ├── feedback_service.py
│   │   │   └── prompt_catalog.py
│   │   ├── tests/
│   │   │   ├── test_api_contract.py
│   │   │   ├── test_learning_scheduler.py
│   │   │   └── test_yki_state_machine.py
│   │   ├── tts/
│   │   │   ├── __init__.py
│   │   │   └── audio_registry.py
│   │   ├── yki/
│   │   │   ├── __init__.py
│   │   │   ├── adapter.py
│   │   │   ├── contracts.py
│   │   │   ├── engine_client.py
│   │   │   ├── orchestrator.py
│   │   │   └── state_machine.py
│   │   ├── yki_practice/
│   │   │   ├── __init__.py
│   │   │   └── adapter.py
│   │   ├── __init__.py
│   │   ├── api_contract.py
│   │   └── main.py
│   └── client/
│       ├── app/
│       │   ├── _layout.tsx
│       │   ├── index.tsx
│       │   ├── learn/index.tsx
│       │   ├── professional/index.tsx
│       │   ├── progress/index.tsx
│       │   ├── settings/index.tsx
│       │   ├── speaking/index.tsx
│       │   ├── yki-exam/index.tsx
│       │   └── yki-practice/index.tsx
│       ├── src/
│       │   ├── navigation/routes.ts
│       │   └── design_system/tokens/
│       │       ├── colors.ts
│       │       ├── radius.ts
│       │       ├── spacing.ts
│       │       └── typography.ts
│       └── state/
│           ├── AppShell.tsx
│           ├── authStore.ts
│           └── uiStore.ts
├── packages/
│   ├── core/
│   │   ├── analytics/events.ts
│   │   ├── api/
│   │   │   ├── analytics.ts
│   │   │   ├── auth.ts
│   │   │   ├── billing.ts
│   │   │   ├── client.ts
│   │   │   ├── governedResponseValidation.ts
│   │   │   ├── index.ts
│   │   │   ├── learning.ts
│   │   │   ├── professional.ts
│   │   │   ├── speakingLab.ts
│   │   │   ├── types.ts
│   │   │   ├── ykiExam.ts
│   │   │   └── ykiPractice.ts
│   │   ├── modes.ts
│   │   ├── schemas/
│   │   │   ├── learning.ts
│   │   │   └── session.ts
│   │   └── state/session.ts
│   └── ui/
│       ├── components/
│       │   ├── AppScaffold.tsx
│       │   ├── EmptyState.tsx
│       │   ├── FeedbackCard.tsx
│       │   ├── LearningLoopStepper.tsx
│       │   ├── ModeCard.tsx
│       │   ├── PageHeader.tsx
│       │   ├── PhraseChip.tsx
│       │   ├── ProgressRing.tsx
│       │   ├── ReviewQueueCard.tsx
│       │   ├── SectionCard.tsx
│       │   ├── StatChip.tsx
│       │   ├── TaskCard.tsx
│       │   └── index.ts
│       ├── index.ts
│       └── screens/
│           ├── HomeScreen.tsx
│           ├── LearnScreen.tsx
│           ├── LearningSessionScreen.tsx
│           ├── ProfessionalFinnishScreen.tsx
│           ├── ProgressScreen.tsx
│           ├── SettingsScreen.tsx
│           ├── SpeakingLabScreen.tsx
│           ├── YkiExamScreen.tsx
│           └── YkiPracticeScreen.tsx
└── engine/
    └── authoritative files from /home/vitus/kielitaikka-yki-engine/
```

## Source rule

- Files in `engine/` must come from the real YKI engine repo.
- The rest of this batch is ready to merge now.
