# Pass 3 Report

## Scope of Pass 3

Pass 3 covered:

- backend structural duplication cleanup
- consolidation of legacy top-level backend siblings into `apps/backend/app/*`
- backend service/integration/db ownership consolidation for the groups safe to resolve in this pass
- removal of resolved backend duplicate structures after parity verification

## Exact files and directories inspected

- `apps/backend/app/**`
- `apps/backend/api/**`
- `apps/backend/audio/**`
- `apps/backend/cards/**`
- `apps/backend/db/**`
- `apps/backend/learning/**`
- `apps/backend/services/**`
- `apps/backend/main.py`
- `apps/backend/api_contract.py`
- backend tests and scripts referencing legacy sibling namespaces
- prior pass reports under `docs/cleanup/read_reports/`

## Exact files and directories merged into canonical locations

- `apps/backend/learning/*` -> `apps/backend/app/services/learning/*`
- import rewrites in:
  - `apps/backend/app/services/overview_service.py`
  - `apps/backend/tests/test_learning_adapter.py`
  - `apps/backend/tests/test_learning_scheduler.py`
  - `apps/backend/tests/test_publication_lifecycle.py`
  - `apps/backend/app/services/learning/system_data.py`
  - `apps/backend/app/services/learning/policy_engine.py`
  - `apps/backend/app/services/learning/graph_service.py`

## Exact files and directories moved to quarantine

- `apps/backend/learning/`
- `apps/backend/db/`
- `apps/backend/api/`
- `apps/backend/services/`
- `apps/backend/app/services/google_oauth_service.py`

## Preserved behavior, config, routes, and helpers before move

- preserved the full learning helper family by canonicalizing it under `app/services/learning`
- preserved backend route behavior through the existing canonical `app/router.py` and `app/routers/*`
- preserved DB/model behavior under `app/db/*`
- preserved Google OAuth behavior under `app/integrations/google_oauth_service.py`
- preserved backend boot behavior in `main.py`

## Verification commands run

- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -c "import main; print('main import ok')"`
- `bash /home/vitus/floently-finnish/apps/backend/scripts/boot_gate.sh`
- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -m pytest tests/test_learning_adapter.py tests/test_learning_scheduler.py -q`

## Verification results

- `main` import: pass
- boot gate: pass
- targeted learning pytest: pass

## Whether Pass 3 is complete

Pass 3 is complete for the structural groups resolved here:

- top-level `learning` is no longer an active backend authority
- top-level `db` wrappers are no longer present
- empty legacy `api` and `services` sibling directories are no longer present
- duplicate Google OAuth service ownership was reduced to the canonical integration implementation

## Exact recommendations for Pass 4

- collapse the remaining `cards.*` namespace bridge into fully canonical `app/cards/*` imports and ownership
- collapse the remaining `audio.*` namespace bridge into fully canonical `app/audio/*` imports and ownership
- resolve the top-level `yki/` authority chain into canonical `app/*` ownership
- handle engine-adjacent overlap only in the dedicated later pass
