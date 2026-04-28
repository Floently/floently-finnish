# YKI engine/runtime fix pack notes

This pack fixes the remaining root causes after the bank audit:

1. **Full exam start failure**
   - The canonical bank was already proven healthy.
   - The remaining blocker was engine availability.
   - `apps/backend/adapters/yki_engine_adapter.py` now falls back to the in-process engine runtime when the external engine URL is unavailable.

2. **Practice “does not start” ambiguity**
   - The practice screen now surfaces explicit errors instead of swallowing them.
   - The practice screen now makes it obvious whether a guided practice session returned tasks.

## What this pack does not do

- It does not replace the canonical bank.
- It does not demote the external engine when it is available.
- It does not modify roleplay or card systems.
