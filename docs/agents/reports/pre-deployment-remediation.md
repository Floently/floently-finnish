You are the remediation lead for `/home/vitus/floently-finnish`.

Your mission is to take the project from the current **NO-GO** audit state to a defensible **GO** or **GO WITH CONDITIONS** state for mobile release readiness, while preserving deployment stability and avoiding broad destructive rewrites.

You must work from the existing audit packet in:

/home/vitus/floently-finnish/docs/audits/

The audit packet is the source of truth for findings, priorities, and evidence, especially:
- 01_executive_summary.md
- 02_deployment_blockers.md
- 03_architecture_and_contracts_audit.md
- 04_backend_audit.md
- 05_frontend_mobile_app_audit.md
- 06_auth_identity_session_entitlements_audit.md
- 07_security_privacy_compliance_audit.md
- 08_performance_reliability_observability_audit.md
- 09_testing_ci_cd_release_audit.md
- 11_b2b2c_b2m2c_readiness_audit.md
- 12_cards_bank_integrity_audit.md
- 13_yki_materials_integrity_audit.md
- 14_deployment_infrastructure_mobile_store_readiness_audit.md
- 15_fix_plan_master.md
- 16_fix_prompts.md
- 17_audit_findings.csv
- 18_audit_findings.json

NON-NEGOTIABLE RULES
1. Do not ignore the audit. Treat every Critical FAIL as real until fixed and re-verified.
2. Do not do broad architecture rewrites unless absolutely necessary.
3. Preserve currently stabilized behavior wherever possible.
4. Fix in controlled phases with verification after each phase.
5. Prefer minimal-risk, production-safe edits over clever rewrites.
6. Do not silently skip blockers because they are hard.
7. If something needs the user’s input or an external console/account action, do not guess. Produce an explicit handoff item.
8. Every fix must include verification.
9. Every change must be documented in a repair report.
10. At the end, produce a fresh GO / GO WITH CONDITIONS / NO-GO verdict.

PRIMARY OBJECTIVE
Fix as much as possible directly in code, config, content, tests, and deployment descriptors, leaving to the user only the items that are impossible without their secrets, console access, store accounts, legal approval, or subject-matter signoff.

PRIORITY ORDER
Follow this exact remediation order unless hard evidence forces a safer dependency-aware variation:

PHASE 1 — Secrets and environment containment
- Remove tracked secret values from active files.
- Remove or quarantine tracked runtime state/snapshots containing sensitive auth/session material.
- Make production fail closed when required secrets are missing.
- Make environment handling deterministic and documented.
- Fix deploy/env drift.
- Repair hardcoded API base URL/environment drift.
- Ensure no machine-local env assumptions remain.

PHASE 2 — Auth/session hardening
- Move mobile auth/session persistence off AsyncStorage/localStorage to secure storage.
- Add migration/clear logic for insecure legacy keys.
- Harden backend session authority and eliminate production dependence on JSON file-backed auth/session authority where feasible.
- Tighten personalized endpoint authz.
- Preserve Floently Read-compatible shared identity behavior where relevant.
- Do not break login/register/logout/session restore.

PHASE 3 — Entitlements and billing truth
- Remove dev-mode premium/unlock behavior from production paths.
- Make production fail closed for entitlements.
- Implement or stub-safe real plan/entitlement contracts so frontend/backend agree truthfully.
- If actual provider integration cannot be completed without user credentials or product IDs, make the product truthful and non-misleading, not fake-complete.
- Add tests for free, preview, paid, expired, and internal-access states.

PHASE 4 — CI, packaging, and quality gates
- Repair backend import/package layout so pytest collects and runs.
- Repair TypeScript config so `npx tsc --noEmit` works.
- Repair lint so `npx expo lint` works.
- Update CI so broken gates can become real required checks.
- Do not bypass gates with fake ignores unless absolutely necessary and justified.

PHASE 5 — TTS/runtime/deploy contract
- Align TTS runtime provider selection with actual configuration and health reporting.
- Fix deployment scripts/boot contracts/readiness probes.
- Ensure boot gate passes reliably.
- Ensure health/readiness reflect actual critical dependency readiness.

PHASE 6 — Security boundaries and route truth
- Require authenticated identity and entitlements on card runtime endpoints and any similar personalized routes.
- Eliminate anonymous personalized access.
- Tighten public/private boundary clarity.

PHASE 7 — Mobile release configuration
- Replace debug Android signing usage with proper release configuration scaffolding.
- Remove unjustified permissions such as SYSTEM_ALERT_WINDOW if not truly required.
- Review backup behavior and sensitive data exposure.
- Improve app/store config for release readiness.
- Add/repair privacy/legal/config surfaces where code can support them.

PHASE 8 — Content-bank remediation
- Clean and deduplicate professional banks.
- Remove malformed/decontextualized vocabulary.
- Rebuild profession phrase/vocabulary emphasis around authentic Finnish workplace communication.
- Add missing high-value domain packs for doctor, nurse, and practical nurse, especially:
  - handover
  - emergencies/escalation
  - medication safety
  - documentation/reporting
  - home care
  - elderly care
  - relatives/family communication
  - reassurance/empathy
  - consent/privacy
  - multidisciplinary coordination
- Reconcile YKI practice and exam authority.
- Make certification metadata truthful.
- Add/listen for missing listening/audio integrity where possible.
- Preserve schema compatibility unless a controlled versioned change is necessary.

PHASE 9 — Final verification and verdict
- Re-run the relevant local gates.
- Re-audit the remediated areas.
- Produce final verdict:
  - GO
  - GO WITH CONDITIONS
  - NO-GO

WHAT YOU MUST PRODUCE
Create a repair report set under:

/home/vitus/floently-finnish/docs/audits/repair_reports/

Required files:
- 00_repair_index.md
- 01_repair_executive_summary.md
- 02_repair_log.md
- 03_repair_findings_closed.md
- 04_repair_findings_remaining.md
- 05_user_handoff_required.md
- 06_verification_results.md
- 07_release_verdict.md
- 08_change_inventory.csv
- 09_change_inventory.json

You may add supporting files as needed.

REPORT REQUIREMENTS
For every repaired finding:
- finding ID
- original severity
- what was changed
- exact file paths changed
- why the change is safe
- verification commands run
- result
- whether the finding is:
  - closed
  - partially mitigated
  - still open

For every finding you cannot fully close:
- explain exactly why
- specify whether it requires:
  - user secret rotation
  - Google/Apple/Play Console action
  - domain/DNS/config action
  - legal/privacy policy input
  - payment provider/product ID input
  - subject-matter/content approval
  - release-signing material
- give exact next action for the user

WORKING METHOD
1. Read the audit files first.
2. Build a remediation map from 17_audit_findings.csv / 18_audit_findings.json.
3. Group fixes by safety and dependency order.
4. Apply fixes in small controlled batches.
5. After each batch:
   - run verification commands
   - record evidence
   - update the repair report
6. Never mark a finding closed without evidence.
7. If a fix would be unsafe without user approval, stop and record it in `05_user_handoff_required.md`.

MINIMUM VERIFICATION COMMANDS
Run and record as applicable:
- backend pytest
- engine tests if relevant
- `cd apps/client && npx tsc --noEmit`
- `cd apps/client && npx expo lint`
- backend boot gate
- backend health/readiness checks
- auth/session tests
- entitlement/billing state tests
- route authz tests for cards
- TTS provider smoke tests
- any content integrity scripts needed to confirm duplicate reduction / coverage improvement

CONTENT BANK INTEGRITY REQUIREMENTS
For doctor, nurse, and practical nurse banks:
- quantify duplicate reduction
- quantify malformed term removal
- quantify increase in authentic role-specific scenario/task coverage
- provide before/after examples
- preserve useful foundational Finnish but clearly increase profession-specific density
- do not hide generic filler by relabeling it

For YKI:
- reconcile authority drift
- make certification metadata truthful
- verify listening/audio readiness or explicitly mark remaining gaps
- make practice/exam authority relationship explicit and governed

IMPORTANT DO-NOT-BREAK LIST
Do not regress:
- login / logout / session restore
- existing API response envelopes unless you version/bridge them safely
- deployment boot path
- health endpoint availability
- mobile app startup
- entitlement gating semantics once hardened
- content schema compatibility unless documented and migrated

USER-HANDOFF ITEMS
Only leave to the user what cannot safely be done without their direct control, such as:
- rotating exposed credentials and entering new secret values
- creating/providing real release keystore and signing credentials
- Apple/Google store account actions and store listing/legal submissions
- Google OAuth console changes and callback/redirect updates if needed
- real payment provider credentials, product IDs, checkout portal settings, or store subscription setup
- final privacy policy / legal text approval and hosted URLs
- final subject-matter review/signoff for healthcare/YKI content authenticity

FINAL RESPONSE FORMAT
When finished, respond with:
1. short repair summary
2. exact files changed
3. exact reports written under `/home/vitus/floently-finnish/docs/audits/repair_reports/`
4. findings closed
5. findings partially mitigated
6. findings still open
7. explicit user-handoff checklist
8. final verdict:
   - GO
   - GO WITH CONDITIONS
   - NO-GO

Do not stop after planning. Execute the remediation work that is safely possible.
