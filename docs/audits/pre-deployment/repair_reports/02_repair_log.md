Scope: chronological remediation log for the moved pre-deployment audit packet.

What was inspected:
- config/auth/TTS/deploy/build files
- frontend auth persistence and billing flows
- local verification commands and outputs

Methods used:
- fix in phases matching `docs/agents/pre-deployment-remediation.md`
- verify after each batch

Commands run and outcomes:
1. `sed` / `rg` inspections across backend, frontend, Android, and deploy files.
   Result: confirmed audit drift points before edits.
2. `git rm --cached android/app/debug.keystore apps/backend/app/runtime/state.json apps/backend/app/runtime/uploads/voice/roleplay-session/recording.m4a apps/backend/runtime/uploads/voice/roleplay-session/recording.m4a`
   Result: tracked sensitive artifacts removed from version control without deleting ignored local copies.
3. `apps/backend/.venv/bin/pytest apps/backend/tests/test_api_contract.py apps/backend/tests/test_learning_adapter.py apps/backend/tests/test_learning_scheduler.py -q`
   Result: initially failed on missing `utils`, missing `classify_confidence`, missing phrase/study-plan exports. Follow-up patches reduced this to `4 passed in 0.03s`.
4. `cd apps/client && npx tsc --noEmit`
   Result: initially exposed real frontend typing defects once path resolution was fixed. Follow-up patches produced clean exit.
5. `cd apps/client && npx expo lint`
   Result: clean exit after TS/path fixes.
6. `bash apps/backend/scripts/boot_gate.sh`
   Result: initially failed on socket-based readiness probe; rewritten to deterministic in-process health validation. Final output:
   `Import OK`
   `{'status': 'ok', 'service': 'floently-backend'}`
7. `apps/backend/.venv/bin/pytest apps/backend/tests -q`
   Result: still failing in unremediated legacy areas:
   - `tests.cards_test_support` missing
   - `jwt` package missing in local backend venv during card API import path
   - `yki.contracts` does not match `test_yki_orchestrator.py` / `test_yki_state_machine.py`
8. `apps/backend/.venv/bin/python3 -c "import sys; sys.path.insert(0, 'apps/backend'); from app.services.voice_service import get_tts_health_snapshot; print(get_tts_health_snapshot())"`
   Result: provider snapshot now reports aligned defaults and provider health.

Evidence:
- [apps/backend/app/core/config.py](/home/vitus/floently-finnish/apps/backend/app/core/config.py)
- [apps/client/services/authStorage.ts](/home/vitus/floently-finnish/apps/client/services/authStorage.ts)
- [apps/client/state/authStore.ts](/home/vitus/floently-finnish/apps/client/state/authStore.ts)
- [apps/backend/app/routers/v1_subscription.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_subscription.py)
- [apps/backend/app/routers/v1_cards.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_cards.py)
- [apps/backend/app/services/tts/runtime.py](/home/vitus/floently-finnish/apps/backend/app/services/tts/runtime.py)
- [android/app/build.gradle](/home/vitus/floently-finnish/android/app/build.gradle)
- [apps/backend/scripts/boot_gate.sh](/home/vitus/floently-finnish/apps/backend/scripts/boot_gate.sh)

Verdict:
- Batch result: `PARTIAL_SUCCESS`
- Deployment impact: `still blocks deployment`
