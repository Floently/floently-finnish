# Pass 6 Keep Justification

## `apps/backend/app/runtime/*.py`

- reason kept: canonical runtime logic modules for cards, roleplay, voice, and YKI
- proof not contamination: these are imported by live backend code and contain application logic, unlike the moved `state.json` and `uploads/` artifacts

## `apps/backend/app/audio/storage/README.md`

- reason kept: documents the audio storage contract
- proof not contamination: only the generated `assets/` cache was removed; the README is source documentation

## `apps/backend/app/cards/output/accepted/accepted_cards.json`

- reason kept: canonical validated card publication source still used by runtime/publication tooling
- proof not contamination: live code references it through `validated_source_repository.py`, tests, and material convergence tooling

## `docs/cleanup/floently-finnish-cleaned-tree.txt`

- reason kept: evidentiary input used by the final residue-cleanup pass
- proof not contamination: cleanup documentation/support record, not runtime or duplicate source authority

## `docs/cleanup/read_reports/**`

- reason kept: historical Pass 1-5 and prior final-ledger records
- proof not contamination: archival cleanup record; current live cleanup ledgers are recreated at `docs/cleanup/`

## `apps/backend/tools/phase_5_2_live_verification.py`

- reason kept: repo support tool for backend verification
- proof not contamination: stale sample-file dependency was repaired; the tool no longer relies on a quarantined runtime upload artifact
