# Audit Output Contract

This contract defines how the audit and fix agents must write their materials.

## Output folder
All materials must be written under:

`/home/vitus/floently-finnish/docs/audits/`

## Required audit outputs
- `FORENSIC_AUDIT_REPORT.md`
- `MAJOR_FAULTS_AND_CORRECT_REMEDIATION.md`
- `DEPLOYMENT_READINESS_SCORECARD.md`
- `FIX_AGENT_PROMPT.md`
- `EVIDENCE_BASED_LEARNING_AND_UX_GAP_ANALYSIS.md`
- `SECURITY_AND_SUPPLY_CHAIN_GAP_ANALYSIS.md`
- `AUDIT_FILE_LEDGER.json`

## Required fix outputs
- `FIX_EXECUTION_LOG.md`
- `FIX_CHANGE_LEDGER.json`
- `POST_FIX_DEPLOYMENT_READINESS_SUMMARY.md`
- `POST_FIX_OPEN_ISSUES.md`

## Style requirements
- direct, clinical, evidence-based
- no vague praise
- every major finding tied to file evidence
- clear severity labels
- explicit deployment blocker designation
- ordered remediation steps

## JSON ledger requirements
For each audited file entry include:
- `path`
- `domain`
- `status` (`active`, `reference`, `duplicate`, `artifact`, `unknown`)
- `severity_if_problematic`
- `notes`
- `recommended_action`

## Minimum bar
If the audit agent cannot confirm something, it must say so explicitly and state what runtime or code evidence is still needed.
