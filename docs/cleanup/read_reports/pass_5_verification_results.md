# Pass 5 Verification Results

## Required Commands

- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -c "import main; print('main import ok')"` -> passed
- `bash /home/vitus/floently-finnish/apps/backend/scripts/boot_gate.sh` -> passed
- `cd /home/vitus/floently-finnish/apps/client && npx tsc --noEmit` -> passed
- `cd /home/vitus/floently-finnish/apps/client && npx expo lint` -> passed

## Targeted Sanity Checks

- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -c "import app.routers.yki_exam, app.routers.yki_practice, app.routers.v1_cards; print('router imports ok')"` -> passed
- `rg -n "engine/task_index_v3_2|task_index_v3_2\\.json|pool_index\\.json|manifest\\.json|yki_content_bank|task_staging|backend/bank" apps/backend/app --glob '!**/.venv/**'` -> only canonical app-owned YKI material constants plus a descriptive comment in `yki_practice.py`
- `rg -n "apps/backend/(cards|audio|yki)|yki_content_bank|task_staging|backend/bank|engine/task_index_v3_2|/task_index_v3_2\\.json|/pool_index\\.json|/manifest\\.json" . --glob '!docs/**' --glob '!**/.git/**' --glob '!**/.venv/**' --glob '!**/node_modules/**'` -> only historical root ledgers and engine/materials documentation outside live app code

## Result

Pass 5 verification passed.
