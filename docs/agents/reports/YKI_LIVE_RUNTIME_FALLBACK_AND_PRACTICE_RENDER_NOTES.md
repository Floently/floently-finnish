# YKI live runtime fallback and practice render notes

This patch addresses the two remaining problems proven by the forensic reports:

1. **Full YKI exam** was still failing because the live adapter did not implement the in-process fallback.
2. **YKI Practice** could still look dead on the client even though backend start returned `200`.

## What changed

### Backend adapter
- `apps/backend/adapters/yki_engine_adapter.py`
- Now attempts the external engine first.
- If that fails, it routes the request into the in-process engine API handlers from `engine.api.exam_api_v3_3`.
- Supported fallback paths:
  - `POST /exam/start`
  - `GET /exam/{session_id}`
  - `POST /exam/{session_id}/answer`
  - `POST /exam/{session_id}/writing`
  - `POST /exam/{session_id}/audio`
  - `POST /exam/{session_id}/speaking`
  - `POST /exam/speaking/start_conversation`
  - `POST /exam/speaking/submit_turn`
  - `POST /exam/speaking/generate_reply`
  - `POST /exam/{session_id}/submit`
  - `GET /exam/{session_id}/certificate`

### Practice client
- `packages/core/api/ykiPractice.ts`
- accepts both raw and `{ data: ... }` payloads
- includes response body in thrown errors for easier diagnosis

- `apps/client/features/yki-practice/services/ykiPracticeService.ts`
- asserts that a started/resumed practice session actually contains tasks

- `apps/client/state/YkiPracticeRoute.tsx`
- shows explicit errors instead of silent failure
- resumes an existing session on mount
- displays returned task id
- clears persisted practice session on finish or invalid resume

## What should happen now

- Full YKI exam should no longer fail purely because `localhost:8010` is down.
- Guided YKI practice should either show the first task immediately or show the exact error text.
