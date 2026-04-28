# YKI Surgical Fix Execution Log

## 1. Practice Import Failure
- Confirmed `apps/client/features/yki-practice/services/ykiPracticeService.ts` exists.
- Confirmed the reported failure path was specifically `apps/client/state/AppShell.tsx`.
- Removed the `AppShell.tsx` dependency on the feature-layer practice service.
- Added canonical shell-safe cleanup helpers:
  - `clearPersistedYkiPracticeSession()`
  - `clearPersistedYkiExamSession()`
- Updated `clearRuntimePersistence()` in `AppShell.tsx` to use those helpers.

## 2. Exam Fallback Failure
- Confirmed the external engine was not reachable.
- Confirmed the in-process fallback path was blocked by missing engine support modules, not by bank/index data.
- Restored the missing support packages required by the in-process engine:
  - media registry and TTS fixture path
  - speech transcription/pronunciation fixtures
  - writing evaluation helper
- Updated the adapter to:
  - probe engine host reachability before attempting the external request
  - fall back immediately when the configured engine host is unreachable
  - execute the in-process fallback path directly instead of relying on `asyncio.to_thread`

## 3. Validation
- Practice overview and practice start verified from backend route code.
- Exam fallback verified with:
  - unreachable external engine base URL
  - governed start through `start_yki_session`
  - governed resume through `get_yki_session`
  - objective answer through `submit_yki_answer`
  - final submit through `submit_yki_exam`
  - certificate fetch through `get_yki_certificate`

## 4. Result
- Practice import/runtime blocker fixed.
- Exam fallback/runtime blocker fixed.
