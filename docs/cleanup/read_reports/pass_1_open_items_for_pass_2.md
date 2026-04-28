# Pass 1 Open Items For Pass 2

- `docs/**` still contains historical references to removed mobile roots and native trees. These are documentation cleanup items, not active runtime authority.
- `apps/client/src/*` family has not been consolidated yet. That belongs to Pass 2.
- Shared client authority overlap such as `apps/client/core/*` vs `packages/core/*` was not touched in this pass.
- Backend, cards, YKI, and engine-adjacent authority merges were intentionally left for later passes.
- `apps/backend/app/routers/yki_exam.py` still has fallback references around `pool_index.json`; this is unrelated to Pass 1 and should be handled in the YKI pass.
