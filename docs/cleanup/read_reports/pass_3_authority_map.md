# Pass 3 Authority Map

## Governing inputs used

- `docs/cleanup/floently_finnish_duplication_cleanup_matrix_v2.md`
- `docs/cleanup/read_reports/pass_1_report.md`
- `docs/cleanup/read_reports/pass_1_authority_map.md`
- `docs/cleanup/read_reports/pass_1_merge_log.md`
- `docs/cleanup/read_reports/pass_1_quarantine_manifest.md`
- `docs/cleanup/read_reports/pass_1_verification_results.md`
- `docs/cleanup/read_reports/pass_1_repo_tree_after.txt`
- `docs/cleanup/read_reports/pass_1_open_items_for_pass_2.md`
- `docs/cleanup/read_reports/pass_2_report.md`
- `docs/cleanup/read_reports/pass_2_authority_map.md`
- `docs/cleanup/read_reports/pass_2_merge_log.md`
- `docs/cleanup/read_reports/pass_2_quarantine_manifest.md`
- `docs/cleanup/read_reports/pass_2_verification_results.md`
- `docs/cleanup/read_reports/pass_2_repo_tree_after.txt`
- `docs/cleanup/read_reports/pass_2_open_items_for_pass_3.md`

## Canonical survivors confirmed in Pass 3

- `apps/backend/app/router.py` and `apps/backend/app/routers/*` remain canonical route authority
- `apps/backend/app/services/*` remains canonical service authority
- `apps/backend/app/integrations/google_oauth_service.py` is the surviving Google OAuth implementation
- `apps/backend/app/db/*` is the surviving DB/model authority
- `apps/backend/app/core/*` remains canonical core/config/state authority

## Duplicate families inspected

### B01: `apps/backend/api/` vs `apps/backend/app/routers/*`

Findings:

- `apps/backend/api/` contained only an empty `routes/` directory
- no live backend imports or boot paths depended on `apps/backend/api/*`

Authority decision:

- keep `apps/backend/app/router.py` and `apps/backend/app/routers/*`
- move `apps/backend/api/` out of the repo

### B04: `apps/backend/db/` vs `apps/backend/app/db/*`

Findings:

- `apps/backend/db/__init__.py`, `database.py`, and `models.py` were pure re-export wrappers around `app.db.*`
- one test file still imported `db.models`

Authority decision:

- keep `apps/backend/app/db/*`
- rewrite the remaining test import to `app.db.models`
- move `apps/backend/db/` out of the repo

### B05: `apps/backend/learning/` vs canonical app service ownership

Findings:

- top-level `apps/backend/learning/*` still contained live implementation used by:
  - `apps/backend/app/services/overview_service.py`
  - learning tests
- the code was not a deep cards/YKI/engine authority; it was a backend service/helper family and fit Pass 3

Authority decision:

- canonicalize the package under `apps/backend/app/services/learning/*`
- rewrite imports to the canonical `app.services.learning.*` path
- move `apps/backend/learning/` out of the repo

### B06 / B09: service and integration duplication

Findings:

- `apps/backend/app/services/google_oauth_service.py` existed as an empty duplicate file
- live auth router imports already pointed at `app.integrations.google_oauth_service`
- `apps/backend/services/` itself was empty

Authority decision:

- keep `apps/backend/app/integrations/google_oauth_service.py`
- move the empty duplicate `apps/backend/app/services/google_oauth_service.py` out of the repo
- move the empty `apps/backend/services/` directory out of the repo

## Deferred groups for Pass 4

- `apps/backend/cards/` remains as a namespace shim for the deeper cards authority chain
- `apps/backend/audio/` remains as a namespace shim for the deeper audio/cards authority chain
- `apps/backend/yki/` remains out of scope for Pass 3
- engine-adjacent overlap remains out of scope for Pass 3
