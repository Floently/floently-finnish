# Pass 6 Verification Results

## Required Commands

- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -c "import main; print('main import ok')"` -> passed
- `bash /home/vitus/floently-finnish/apps/backend/scripts/boot_gate.sh` -> passed
- `cd /home/vitus/floently-finnish/apps/client && npx tsc --noEmit` -> passed
- `cd /home/vitus/floently-finnish/apps/client && npx expo lint` -> passed

## Targeted Sanity Checks

- `cd /home/vitus/floently-finnish/apps/backend && .venv/bin/python -c "import app.routers.yki_exam, app.routers.yki_practice, app.routers.v1_cards; print('router imports ok')"` -> passed
- final residue/stale-reference grep -> remaining hits are historical docs, ignore rules, prompt text, or package metadata, not live canonical app callers

## Result

Pass 6 verification passed.
