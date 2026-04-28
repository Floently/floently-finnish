Scope: post-remediation local verification evidence.

Commands run:
- `bash apps/backend/scripts/boot_gate.sh`
- `cd apps/client && npx tsc --noEmit`
- `cd apps/client && npx expo lint`
- `apps/backend/.venv/bin/pytest apps/backend/tests/test_api_contract.py apps/backend/tests/test_learning_adapter.py apps/backend/tests/test_learning_scheduler.py -q`
- `apps/backend/.venv/bin/pytest apps/backend/tests -q`
- `apps/backend/.venv/bin/python3 -c "import sys; sys.path.insert(0, 'apps/backend'); from app.services.voice_service import get_tts_health_snapshot; print(get_tts_health_snapshot())"`

Results:

1. Boot gate
- Verdict: PASS
- Evidence:
  - `--- Boot gate: import check ---`
  - `Import OK`
  - `--- Boot gate: HTTP health check ---`
  - `{'status': 'ok', 'service': 'floently-backend'}`

2. Frontend TypeScript compile
- Verdict: PASS
- Evidence: `cd apps/client && npx tsc --noEmit` exited `0`.

3. Frontend lint
- Verdict: PASS
- Evidence: `cd apps/client && npx expo lint` exited `0`.

4. Targeted backend pytest subset
- Verdict: PASS
- Evidence: `.... [100%]` and `4 passed in 0.03s`.

5. Full backend pytest
- Verdict: FAIL
- Evidence:
  - `ModuleNotFoundError: No module named 'tests.cards_test_support'`
  - `ModuleNotFoundError: No module named 'jwt'`
  - `ImportError: cannot import name 'ExamSessionRequest' from 'yki.contracts'`
  - `ImportError: cannot import name 'SECTION_ORDER' from 'yki.contracts'`

6. TTS health snapshot
- Verdict: PASS
- Evidence: provider snapshot now reports aligned defaults and provider statuses for `google`, `openai`, and `development_fallback`.

Overall verification verdict:
- PASS on remediated areas
- FAIL on full backend CI cleanliness
