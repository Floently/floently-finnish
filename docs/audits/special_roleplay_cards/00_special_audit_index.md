# Special Forensic Audit: Roleplay, Cards, Profession Flows
**Audit date:** 2026-04-19  
**Auditor:** Claude Sonnet 4.6 (automated forensic audit)  
**Project root:** `/home/vitus/floently-finnish`

---

## Files in This Audit

| File | Description |
|------|-------------|
| `00_special_audit_index.md` | This index |
| `01_executive_summary.md` | Top-level findings, release recommendation |
| `02_release_blockers.md` | All CRITICAL/HIGH blockers with fix prompts |
| `03_roleplay_engine_audit.md` | Roleplay runtime, router, session flow |
| `04_card_runtime_audit.md` | Card material bank, cards_logic, cards_service |
| `05_profession_flow_doctor_audit.md` | Doctor card/roleplay complete trace |
| `06_profession_flow_nurse_audit.md` | Nurse card/roleplay complete trace |
| `07_profession_flow_practical_nurse_audit.md` | Practical nurse card/roleplay complete trace |
| `08_cross_flow_contracts_and_entitlements_audit.md` | Frontend/backend API contract analysis |
| `09_roleplay_cards_regression_risk_audit.md` | Regression risks |
| `10_hardening_plan.md` | Prioritized hardening backlog |
| `11_fix_prompts.md` | Exact code changes needed per finding |
| `12_findings.csv` | Machine-readable findings |
| `13_findings.json` | JSON findings |

---

## Total Findings Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 4 |
| HIGH | 5 |
| MEDIUM | 4 |
| LOW | 3 |
| **Total** | **16** |

## Release Recommendation

**DO NOT RELEASE** professional cards (doctor/nurse) as-is. Critical routing bugs will cause empty card sessions for professional users. TTS is likely not functional without valid credentials. Practical nurse has a naming-alias issue that needs verification.
