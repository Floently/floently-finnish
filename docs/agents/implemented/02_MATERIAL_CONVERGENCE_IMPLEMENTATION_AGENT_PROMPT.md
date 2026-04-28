# Material Convergence Implementation Agent Prompt

You are the implementation agent for Floently Finnish material-bank convergence.

Target repo:
`/home/vitus/floently-finnish/`

You have direct filesystem access to these repos and must inspect them as needed:
- `/home/vitus/floently-finnish/`
- `/home/vitus/kielitaika/`
- `/home/vitus/kielitaikka-yki-engine/`
- `/home/vitus/Documents/puhis/`
- `/home/vitus/yki_material_pipeline/`

## Primary instruction
Use this execution document as the run order:
- `/home/vitus/floently-finnish/docs/agents/01_MATERIAL_CONVERGENCE_EXECUTION_DOC.md`

Also read these supporting decision files before making changes:
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_BANK_FORENSIC_AUDIT.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_SCHEMA_RANKING.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_USEFULNESS_AND_COUNTS.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_REPO_DECISION_LEDGER.json`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_GOVERNANCE_RECOMMENDATION.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_CONVERSION_PLAN.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_ACTION_PLAN_FOR_IMPLEMENTATION.md`
- `/home/vitus/floently-finnish/docs/agents/MATERIAL_FIX_AGENT_PROMPT.md`

## Mission
Converge all useful materials into exactly two runtime families only:

1. YKI tasks -> v3.2 certified YKI family
2. Cards -> canonical `puhis` card envelope/publication/runtime family

## Non-negotiable rules
1. Preserve the active `engine/` YKI schema/validator family already present in `floently-finnish`.
2. Do not introduce a third runtime schema.
3. Do not publish raw generator outputs directly to runtime.
4. Keep inventory files separate from payload files.
5. Keep donor materials, but classify and isolate them.
6. Make deterministic, validator-backed conversions only.
7. When unsure, prefer explicit quarantine over risky runtime admission.

## How to execute
- Follow the exact phase order in `01_MATERIAL_CONVERGENCE_EXECUTION_DOC.md`.
- For each phase, perform the action, then run the verification items before moving on.
- Make the smallest set of changes needed to produce a governed result.
- Do not silently skip broken imports, missing files, or invalid data.
- If a phase cannot be completed safely, record the blocker and continue with safe independent phases when possible.

## Required post-run outputs
Write all of these to:
`/home/vitus/floently-finnish/docs/agents/`

- `MATERIAL_EXECUTION_RUN_LOG.md`
- `MATERIAL_EXECUTION_CHANGE_LEDGER.json`
- `MATERIAL_POST_RUN_DECISION_REPORT.md`
- `MATERIAL_POST_RUN_OPEN_ISSUES.md`
- `MATERIAL_POST_RUN_COUNTS.json`
- `MATERIAL_RUNTIME_AUTHORITY_MAP.md`

## Post-run report requirements
Your final report set must be decision-grade, not descriptive only.

### `MATERIAL_POST_RUN_DECISION_REPORT.md` must include
- what was successfully internalized
- what remains external
- what now counts as runtime authority for YKI
- what now counts as runtime authority for cards
- whether `kielitaika` normalized cards were converted successfully
- whether `practice_content` is now safe
- what donor families remain reference-only
- whether materials are now stable enough for deployment-readiness verification
- the exact next move recommended

### `MATERIAL_POST_RUN_OPEN_ISSUES.md` must include
- issue ID
- severity: critical / high / medium / low
- file/path scope
- why it matters
- exact remediation recommendation
- whether it blocks deployment-readiness

### `MATERIAL_RUNTIME_AUTHORITY_MAP.md` must include
- runtime domain
- canonical schema family
- canonical validator
- canonical published data path
- donor/reference paths
- quarantine/archive paths

### `MATERIAL_POST_RUN_COUNTS.json` must include
- internalized YKI counts
- published card counts
- converted normalized-card counts
- converted donor YKI counts
- quarantined counts
- rejected counts
- duplicate counts if detected

## Abort conditions
If you hit one of these, do not guess:
- canonical donor files are unexpectedly missing
- validator-backed schemas contradict the frozen decisions
- a hidden third runtime schema is required to keep the project functional

If you abort any part, still write all required post-run files with the blocker, impact, and best next step.
