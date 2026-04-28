# Pass 5 Merge Log

1. Read the Pass 5 prompt, the v2 cleanup matrix, and Pass 1-4 reports from their actual in-repo locations under `docs/cleanup/read_reports/`.
2. Confirmed the cards stack is a canonical layered chain rather than a duplicate-authority family: `v1_cards.py` -> `cards_service.py` -> `runtime/cards_logic.py` -> `runtime/cards_material_bank.py` -> `app/cards/**`.
3. Identified the remaining live YKI material authority drift in `apps/backend/app/routers/yki_exam.py`, which still probed repo-root and `engine/` fallback files.
4. Identified a second stale live-code YKI material path family in `apps/backend/app/routers/admin_yki.py`, which still probed removed legacy bank roots.
5. Added `apps/backend/app/services/yki_materials.py` as the canonical app-owned YKI material-path authority.
6. Rewrote `apps/backend/app/routers/yki_exam.py` to load only canonical YKI material files through the new app-level path authority.
7. Rewrote `apps/backend/app/routers/admin_yki.py` so `v1`/`v2` now resolve to the single surviving certified-bank manifest and metadata location rather than legacy fallback roots.
8. Moved the executed Pass 5 prompt into `docs/cleanup/executed_prompts/cleanup_agent_prompt_pass_5.md` to align prompt/report storage with prior normalized cleanup records.
9. Ran backend import, backend boot gate, targeted router import sanity, client typecheck, client lint, and stale-reference sweeps.
10. Wrote the final Pass 5 reports and final cleanup ledger/verdict files.
