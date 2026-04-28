# Audit Index

## Scope Statement
System-wide pre-deployment audit of `/home/vitus/floently-finnish` for Google Play and App Store release readiness, including backend, mobile client, auth, security, content-bank integrity, YKI materials, deployment, and B2B2C/B2M2C claims.

## What Was Inspected
- Repository structure, router surface, runtime config, deployment descriptors, and current quality gates.
- Backend auth/session, subscription, TTS, YKI, cards, and healthcheck paths.
- Frontend/mobile navigation shell, auth persistence, permissions, audio, settings, and store configs.
- Professional banks for doctor, nurse, and practical nurse; YKI certified/practice assets.

## Methods Used
- Static code inspection.
- Config and manifest review.
- Local smoke checks and available test/lint/typecheck execution.
- Direct JSON/content-bank sampling and lightweight coverage analysis.

## Commands Run
- git status --short
- find . -maxdepth 3 -type d | sort | sed -n "1,400p"
- rg --files .github apps/backend packages App.tsx android ios | sed -n "1,400p"
- apps/backend/.venv/bin/pytest apps/backend/tests engine/tests -q
- cd apps/client && npx tsc --noEmit
- cd apps/client && npx expo lint
- bash apps/backend/scripts/boot_gate.sh
- python3 scripts and inline JSON inspection across cards and YKI banks

## Final Decision
- Verdict: **NO-GO**
- Bank integrity: **not deployment-ready; augmentation and cleanup required before release**

## Report Set
- `00_audit_index.md`
- `01_executive_summary.md`
- `02_deployment_blockers.md`
- `03_architecture_and_contracts_audit.md`
- `04_backend_audit.md`
- `05_frontend_mobile_app_audit.md`
- `06_auth_identity_session_entitlements_audit.md`
- `07_security_privacy_compliance_audit.md`
- `08_performance_reliability_observability_audit.md`
- `09_testing_ci_cd_release_audit.md`
- `10_usability_accessibility_user_satisfaction_audit.md`
- `11_b2b2c_b2m2c_readiness_audit.md`
- `12_cards_bank_integrity_audit.md`
- `13_yki_materials_integrity_audit.md`
- `14_deployment_infrastructure_mobile_store_readiness_audit.md`
- `15_fix_plan_master.md`
- `16_fix_prompts.md`
- `17_audit_findings.csv`
- `18_audit_findings.json`
- Supporting artifacts: `cards_bank_coverage_*.csv`, `yki_materials_gap_map.csv`
