# Pass 3 Merge Log

## Canonical merges applied

1. Canonicalized the learning package under `apps/backend/app/services/learning/*`
   - copied the active top-level `apps/backend/learning/*` implementation into the canonical service layer
   - preserved the full learning helper family under one backend application authority

2. Rewrote canonical imports to the new learning authority
   - `apps/backend/app/services/overview_service.py`
   - `apps/backend/tests/test_learning_adapter.py`
   - `apps/backend/tests/test_learning_scheduler.py`

3. Rewrote internal canonical learning imports
   - `apps/backend/app/services/learning/system_data.py`
   - `apps/backend/app/services/learning/policy_engine.py`
   - `apps/backend/app/services/learning/graph_service.py`

4. Removed the final `db` wrapper dependency
   - updated `apps/backend/tests/test_publication_lifecycle.py` to import `app.db.models`

5. Consolidated Google OAuth responsibility
   - confirmed `apps/backend/app/integrations/google_oauth_service.py` is the live implementation
   - removed the empty duplicate `apps/backend/app/services/google_oauth_service.py`

## No-op structural confirmations

- `apps/backend/api/` was empty and had no surviving live behavior
- `apps/backend/services/` was empty and had no surviving live behavior

## Deferred intentionally

- `apps/backend/cards/` was not removed because it still serves as the namespace bridge for deeper cards authority imports
- `apps/backend/audio/` was not removed because canonical app/audio code still imports through the `audio.*` shim namespace
