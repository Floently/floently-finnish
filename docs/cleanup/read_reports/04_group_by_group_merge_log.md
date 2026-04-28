# Group By Group Merge Log

## Client

- Pass 1 removed root/native/mobile duplication and runtime artifact contamination
- Pass 2 consolidated client source authority into `apps/client/*`
- Pass 5 verification confirmed the canonical client tree still compiles and lints

## Backend Structural

- Pass 3 consolidated legacy backend structural duplication into `apps/backend/app/*`
- Pass 4 removed the live `apps/backend/cards/`, `apps/backend/audio/`, and `apps/backend/yki/` duplicate trees by merge-and-move
- Pass 5 completed the remaining YKI material-path authority cleanup inside canonical `app/*` callers

## Cards

- canonical chain: `app/routers/v1_cards.py` -> `app/services/cards_service.py` -> `app/runtime/cards_logic.py` -> `app/runtime/cards_material_bank.py` -> `app/cards/**`
- Pass 5 determined this is layered ownership, not unresolved duplication

## YKI

- canonical repo-local materials authority: `apps/backend/materials/yki/*`
- canonical app boundary: `app/services/yki_materials.py`, `app/routers/yki_exam.py`, `app/routers/admin_yki.py`
- canonical external engine boundary: `app/adapters/yki_engine_adapter.py`, `app/runtime/yki.py`, `app/services/yki_service.py`, `app/routers/v1_yki.py`

## Cleanup Record

- prior-pass prompts now live under `docs/cleanup/executed_prompts/`
- prior-pass reports live under `docs/cleanup/read_reports/`
- final Pass 5 and verdict ledgers live under `docs/cleanup/`
