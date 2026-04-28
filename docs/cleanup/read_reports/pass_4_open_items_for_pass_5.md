# Pass 4 Open Items For Pass 5

- review the deeper engine-adjacent YKI split that still lives across `app/routers/yki_exam.py`, `app/routers/yki_practice.py`, and the external engine-facing flow
- decide whether any further consolidation is needed between `app/runtime/cards_logic.py` and the now-canonical `app/cards/**` runtime stack
- normalize cleanup-doc locations and prompt path assumptions, because the matrix path and prior-pass report locations no longer match the prompt’s root-file expectations
- revisit whether the targeted backend test strategy should stay unit-scoped or be rebuilt around a working async integration fixture
