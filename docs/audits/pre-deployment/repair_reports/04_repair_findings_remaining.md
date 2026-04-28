Scope: findings still open after this remediation pass.

Remaining findings:

1. Title: Full backend pytest still fails in card and YKI legacy suites
- Original severity: Critical
- Verdict: FAIL
- Deployment impact: blocks deployment
- Owner: backend
- Files: [apps/backend/tests/test_publication_lifecycle.py](/home/vitus/floently-finnish/apps/backend/tests/test_publication_lifecycle.py), [apps/backend/tests/test_runtime_api.py](/home/vitus/floently-finnish/apps/backend/tests/test_runtime_api.py), [apps/backend/tests/test_yki_orchestrator.py](/home/vitus/floently-finnish/apps/backend/tests/test_yki_orchestrator.py), [apps/backend/tests/test_yki_state_machine.py](/home/vitus/floently-finnish/apps/backend/tests/test_yki_state_machine.py), [apps/backend/yki/contracts.py](/home/vitus/floently-finnish/apps/backend/yki/contracts.py)
- Evidence: `apps/backend/.venv/bin/pytest apps/backend/tests -q` still errors on missing `tests.cards_test_support`, missing `jwt` in local backend venv import path, and stale YKI contract symbols (`ExamSessionRequest`, `SECTION_ORDER`).
- Suggested remediation: restore/author `tests.cards_test_support`, align `yki/contracts.py` with orchestrator/state-machine test expectations or update the tests deliberately, and ensure backend venv contains declared auth deps.
- Verification steps: rerun `apps/backend/.venv/bin/pytest apps/backend/tests -q` to green.

2. Title: Release signing material still external
- Original severity: Critical
- Verdict: FAIL
- Deployment impact: blocks deployment
- Owner: infra/devops
- Files: [android/app/build.gradle](/home/vitus/floently-finnish/android/app/build.gradle)
- Evidence: release build now fails closed unless `FLOENTLY_UPLOAD_STORE_FILE`, `FLOENTLY_UPLOAD_STORE_PASSWORD`, `FLOENTLY_UPLOAD_KEY_ALIAS`, and `FLOENTLY_UPLOAD_KEY_PASSWORD` are provided.
- Suggested remediation: provide real release keystore material and validate a release build locally or in CI.
- Verification steps: `cd android && ./gradlew assembleRelease` with release signing env vars present.

3. Title: Billing provider remains unconfigured
- Original severity: High
- Verdict: FAIL
- Deployment impact: should fix before deployment
- Owner: backend / product
- Files: [apps/backend/app/core/config.py](/home/vitus/floently-finnish/apps/backend/app/core/config.py), [apps/backend/app/services/subscription_service.py](/home/vitus/floently-finnish/apps/backend/app/services/subscription_service.py)
- Evidence: checkout and portal now fail closed unless `BILLING_CHECKOUT_BASE_URL` and `BILLING_PORTAL_BASE_URL` are provided.
- Suggested remediation: wire real provider URLs or real server-side billing integration.
- Verification steps: authenticated requests to `/api/v1/subscription/checkout` and `/api/v1/subscription/portal` return configured URLs without `BILLING_NOT_CONFIGURED`.

4. Title: Content-bank and YKI integrity defects remain
- Original severity: Critical
- Verdict: FAIL
- Deployment impact: blocks deployment
- Owner: content
- Files: audit packet references under [12_cards_bank_integrity_audit.md](/home/vitus/floently-finnish/docs/audits/pre-deployment/12_cards_bank_integrity_audit.md) and [13_yki_materials_integrity_audit.md](/home/vitus/floently-finnish/docs/audits/pre-deployment/13_yki_materials_integrity_audit.md)
- Evidence: this remediation pass did not rewrite the profession or YKI banks.
- Suggested remediation: execute the augmentation and governance plan from the audit before store release.
- Verification steps: refresh bank coverage metrics and re-audit the profession and YKI banks.
