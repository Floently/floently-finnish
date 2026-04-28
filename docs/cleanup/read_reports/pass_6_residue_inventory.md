# Pass 6 Residue Inventory

## Moved Residue

- `apps/backend/.pytest_cache/`
  - classification: artifact/cache/runtime residue
  - reason: pytest cache, not canonical source
- `apps/backend/runtime/`
  - classification: artifact/runtime residue
  - reason: empty runtime artifact root remaining in the tree; recreated dynamically when needed
- `apps/backend/app/runtime/state.json`
  - classification: artifact/runtime residue
  - reason: contained live auth/session snapshot data and is explicitly forbidden as committed authority
- `apps/backend/app/runtime/uploads/`
  - classification: artifact/runtime residue
  - reason: contained runtime voice upload artifact
- `apps/backend/app/audio/storage/assets/`
  - classification: artifact/cache/runtime residue
  - reason: generated audio asset cache under an ignored runtime-storage path
- repo-local `__pycache__/`
  - classification: artifact/cache residue
  - reason: Python bytecode caches from local runs
- `apps/client/.expo/`
  - classification: build/cache artifact
  - reason: Expo local cache
- `dist/`
  - classification: build artifact
  - reason: generated frontend build output
- `tts_test.py`
  - classification: stale support/artifact residue
  - reason: standalone ad hoc TTS probe that only wrote `output.mp3`
- `output.mp3`
  - classification: generated artifact
  - reason: output from ad hoc TTS probe
- `everything_remaining_ledger.json`
  - classification: stale cleanup/process residue
  - reason: historical migration-control ledger superseded by cleanup records
- `EVERYTHING_REMAINING_README.md`
  - classification: stale cleanup/process residue
  - reason: historical migration package note
- `PRODUCE_NOW_README.md`
  - classification: stale cleanup/process residue
  - reason: historical scaffold package note
- `ROLEPLAY_PACK_NOTES.md`
  - classification: stale cleanup/process residue
  - reason: root duplicate note superseded by docs copy
- `completion_pack_file_list.txt`
  - classification: stale cleanup/process residue
  - reason: historical migration package index
- `error_log.txt`
  - classification: artifact residue
  - reason: stale log output file

## Kept Canonical Paths Reviewed

- `apps/backend/app/runtime/*.py`
  - classification: canonical source, keep
- `apps/backend/app/audio/storage/README.md`
  - classification: canonical support, keep
- `apps/backend/app/cards/output/accepted/accepted_cards.json`
  - classification: canonical source/support, keep
- `docs/cleanup/floently-finnish-cleaned-tree.txt`
  - classification: cleanup evidence/support, keep
- `docs/cleanup/read_reports/**`
  - classification: historical cleanup record, keep
- `apps/backend/tools/phase_5_2_live_verification.py`
  - classification: canonical support/tooling, keep after stale sample-path repair
