# Material Post-Run Decision Report

## Executive outcome
- Overall status: partial deployment-ready convergence completed.
- Decision recommendation: accept this run as the canonical material convergence baseline and schedule one follow-up pass for remaining environment/runtime dependency cleanup.
- Deployment-readiness impact: YKI authority and card material authority are now internalized and governed, but the full backend card runtime stack is not yet deployment-ready until auth/runtime environment dependencies are aligned.

## What was completed
- Phase 1: completed. YKI certified bank and task index were internalized under `apps/backend/materials/yki/`, the local builder was repointed, and the internal index was rebuilt.
- Phase 2: mostly completed. The canonical `puhis` card/audio/core/db families were internalized, publication-layer imports were restored, and card authority loaders were corrected. The runtime API router still has an environment dependency blocker.
- Phase 3: completed. `kielitaika` normalized cards were copied internally, mapped to canonical envelopes, validated, published, and quarantined where mapping exceeded schema limits.
- Phase 4: completed. `practice_content` no longer writes payloads into `material_inventory.json` and now targets offline/export-import paths.
- Phase 5: partially completed. Useful donor conversion tooling exists for `kielitaika` normalized cards. `puhis` YKI v1/v2 future-donor converters were not added in this run.
- Phase 6: completed. Governance and provenance registries were added.
- Phase 7: completed. A material convergence verification script was added and wired into CI.
- Phase 8: completed at runtime authority level. Active app/src/engine code no longer reads directly from donor repo paths, and donor families are classified through governance files and registries.

## Runtime authority after the run
### YKI
- Schema family: `engine/schema/task_models_v3_2.py`
- Validator: `engine/validator/task_validator_v3_2.py` and `engine/validator/task_semantic_guard_v3_2.py`
- Published data path: `apps/backend/materials/yki/certified_bank/`
- Index path: `apps/backend/materials/yki/task_banks/task_index_v3_2.json`
- External dependency remaining: none in active runtime code

### Cards
- Schema family: `apps/backend/app/cards/schemas/*`
- Validator: `app.cards.schemas.validate_card_payload`
- Published data path: `apps/backend/app/cards/output/accepted/accepted_cards.json` plus `apps/backend/materials/cards/validated/*.json`
- Inventory path: `apps/backend/materials/datasets/dataset_registry.json`
- External dependency remaining: backend runtime import chain still expects environment packages such as `bcrypt`; audio execution paths still need provider/runtime dependencies when instantiated

## Counts summary
- Internalized YKI tasks: `9706`
- Published cards: `1418` donor-published canonical cards plus `4` accepted canonical sample cards loaded by runtime authority
- Converted normalized cards: `1418`
- Converted donor YKI tasks: `0`
- Quarantined: `7`
- Rejected: `0`

## Major faults still open
- MF-01: `app.cards.runtime.api.router` import is still blocked in the current shell environment by `bcrypt` missing from the backend environment.
- MF-02: Seven long-form `kielitaika` sentence cards exceed canonical sentence field limits and remain quarantined.
- MF-03: Internalized YKI manifest metadata still preserves upstream source-root references in copied manifest files; this is forensic-safe but should be normalized if manifests are exposed operationally.

## Exact next move
- Recommended next task: align backend runtime dependencies and router importability end-to-end, then run the card runtime tests.
- Why it is next: material authority is now converged, and the main remaining risk is environment/runtime activation rather than schema or source ownership.
- What files/areas it touches: `apps/backend/requirements.txt`, auth/runtime dependency wiring, `app/cards/runtime/api/router.py`, and backend test execution.
