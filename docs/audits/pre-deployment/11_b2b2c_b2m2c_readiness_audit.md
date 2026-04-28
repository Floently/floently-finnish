# B2B2C B2M2C Readiness Audit

## Scope Statement
Assessment of employer-funded and municipality-funded deployment readiness, including cohort/reporting support, privacy boundaries, and organizational model maturity.

## What Was Inspected
- Mounted API surface, admin/cohort code, DB schema, subscription/entitlement model, and reporting-related references.

## Methods Used
- Static inspection of mounted and unmounted routes.
- Search for tenant/cohort/organization concepts across backend and client.

## Commands Run
- `rg -n "tenant|organization|cohort|reporting|employer|municipality|assignment|group" apps/backend apps/client packages -S`
- `sed -n '1,120p' apps/backend/app/routers/admin.py`
- `sed -n '1,60p' apps/backend/app/router.py`

## PASS / WARN / FAIL Verdicts
- Current B2C app deployment readiness: **WARN**
- B2B2C pilot readiness: **FAIL**
- B2M2C pilot readiness: **FAIL**

## Required Now vs Soon vs Later
- Required now for current learner app: do not market non-existent cohort/reporting capability; tighten auth and entitlements first.
- Required soon for pilots: tenant/cohort model, admin authz, reporting, auditability, data export/privacy boundaries.
- Future roadmap: procurement features, organization-specific dashboards, assignment workflows.

## Findings
### AUD-012 — B2B2C/B2M2C readiness is aspirational code, not deployable capability
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **should fix before deployment**
        - Owner suggestion: **product**
        - Exact paths: `apps/backend/app/routers/admin.py`, `apps/backend/app/router.py`, `apps/backend/app/db/models.py`
        - Evidence:
        - apps/backend/app/routers/admin.py references get_current_admin_user and services.professional_reporting_service, but this router is not mounted in apps/backend/app/router.py.
- No active tenant, organization, cohort membership, or role model exists in the mounted production router surface or DB schema reviewed.
        - Suggested remediation: Do not market B2B2C/B2M2C readiness as current capability. Define actual org, cohort, reporting, and privacy boundaries before pilot commitments.
        - Verification after remediation:
        - Document the supported org model and expose only mounted, tested admin/reporting endpoints.
- Add tenant/cohort schema, authz rules, and audit logs before pilots.
