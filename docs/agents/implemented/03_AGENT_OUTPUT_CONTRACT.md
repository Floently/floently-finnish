# Agent Output Contract

The auditing agent must write all outputs to:

`/home/vitus/floently-finnish/docs/agents/`

Required files:
- MATERIAL_BANK_FORENSIC_AUDIT.md
- MATERIAL_SCHEMA_RANKING.md
- MATERIAL_CONVERSION_PLAN.md
- MATERIAL_REPO_DECISION_LEDGER.json
- MATERIAL_USEFULNESS_AND_COUNTS.md
- MATERIAL_GOVERNANCE_RECOMMENDATION.md
- MATERIAL_ACTION_PLAN_FOR_IMPLEMENTATION.md
- MATERIAL_FIX_AGENT_PROMPT.md

## Quality bar

The agent fails if:
- it gives only generic recommendations
- it does not rank schema families
- it does not estimate useful/convertible counts
- it does not choose canonical schema winners
- it does not provide a conversion plan
- it does not distinguish runtime from offline materials
- it does not cite exact evidence paths
