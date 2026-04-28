# Evidence-Based Learning And UX Gap Analysis

## Executive view

The product concept aligns with the intended loop `Diagnose → Learn → Retrieve → Produce → Correct → Schedule → Review`, but the runtime implementation is only partially trustworthy because client-to-backend wiring is inconsistent and some user flows rely on fallback data or broken imports.

## Confirmed strengths

- `/home/vitus/floently-finnish/apps/backend/learning/scheduler.py`
  - real interval calculation uses correctness, confidence, latency, and ease.
- `/home/vitus/floently-finnish/apps/backend/learning/adapter.py`
  - submission path updates progress and schedules review.
- `/home/vitus/floently-finnish/apps/backend/learning/review_service.py`
  - due review queue exists.
- `/home/vitus/floently-finnish/apps/backend/learning/personal_phrase_bank_service.py`
  - phrase-bank concept is present.
- `/home/vitus/floently-finnish/apps/backend/learning/confidence_tracker_service.py`
  - confidence is represented as more than decorative UI copy.

## Confirmed gaps

### Gap 1: client learning services target non-authoritative or missing endpoints

Evidence:
- `/home/vitus/floently-finnish/apps/client/features/learning/services/ykiPlannerService.ts`
- `/home/vitus/floently-finnish/apps/client/features/learning/services/confidenceTrackerService.ts`
- `/home/vitus/floently-finnish/apps/client/features/learning/services/revisionVaultService.ts`
- `/home/vitus/floently-finnish/apps/client/features/learning/services/personalPhraseBankService.ts`
- `/home/vitus/floently-finnish/apps/client/features/learning/services/workplaceIncidentService.ts`

Impact:
- learning UX may appear complete while silently relying on local fallback summaries rather than live governed behavior.

### Gap 2: cards are a real backend/runtime investment, but product integration is still fragile

Evidence:
- `/home/vitus/floently-finnish/apps/backend/app/cards/runtime/api/router.py`
- `/home/vitus/floently-finnish/apps/backend/tests/test_runtime_api.py`
- `/home/vitus/floently-finnish/apps/client/app/cards/index.tsx`
- `/home/vitus/floently-finnish/apps/client/features/cards/services/cardsService.ts`
- `/home/vitus/floently-finnish/packages/core/api/cards.ts`

Assessment:
- cards are more than a backend artifact.
- however, the client-side API and the broader app boot path are unstable enough that first-class runtime confidence is not established.

### Gap 3: UX coherence cannot be validated credibly while the client does not typecheck

Evidence:
- `/home/vitus/floently-finnish/apps/client/state/AppShell.tsx`
- `/home/vitus/floently-finnish/apps/client/tsconfig.json`
- TypeScript build failure output

Impact:
- predictable navigation, error states, and interruption tolerance cannot be trusted from source inspection alone.

## WCAG/UX assessment

### Unverified due to build state

- focus behavior
- keyboard navigation
- error-state accessibility
- screen-reader semantics
- touch-target adequacy across the real runnable flows

## Required remediation priorities

1. Make the client buildable before claiming learning-flow completeness.
2. Bind learning screens to authoritative endpoints rather than `/api/routes/...` placeholders and fallback-only content.
3. Preserve cards as a first-class practice mode, but route them through the chosen authoritative backend API.
4. After stabilization, perform an actual task-based UX/accessibility pass across:
   - onboarding
   - learn
   - cards
   - yki practice
   - yki exam
   - professional Finnish
   - speaking lab
