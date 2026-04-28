# YKI Materials Integrity Audit

## Scope Statement
Audit of YKI practice and exam materials for authenticity, level balance, authority consistency, and release credibility.

## What Was Inspected
- `apps/backend/materials/yki/certified_bank/*`
- `apps/backend/app/routers/yki_exam.py`
- `apps/backend/app/routers/yki_practice.py`
- certification metadata and sample task payloads

## Methods Used
- Manifest/metadata review.
- Sample task inspection across writing/listening.
- Practice-vs-exam authority comparison.

## Commands Run
- JSON inspection of certified bank manifest and sample tasks
- `sed -n '1,80p' apps/backend/app/routers/yki_practice.py`
- `sed -n '1,260p' apps/backend/app/routers/yki_exam.py`

## PASS / WARN / FAIL Verdicts
- Exam bank credibility: **FAIL**
- Practice/exam distinction discipline: **WARN**
- Skill/level/topic balance: **WARN**
- Listening/audio readiness: **FAIL**

## Findings
### AUD-015 — YKI materials have authority drift and certification credibility problems
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **content**
        - Exact paths: `apps/backend/materials/yki/certified_bank/manifest.json`, `apps/backend/materials/yki/certified_bank/tasks/writing_prompt/writing_prompt_00116c99-59d7-5e7e-9de9-1422a536146c.json`, `apps/backend/app/routers/yki_practice.py`, `apps/backend/app/routers/yki_exam.py`
        - Evidence:
        - The certified bank manifest claims bank_version=certified and total_tasks=9706, but sampled tasks under that bank still carry quality.certification.status=uncertified.
- Manifest reports audio_tasks_verified=0, which is a major gap for listening material credibility.
- task_bank_certification_report.md shows topic distribution dominated by technology (5,222 tasks) and writing prompts (5,467 tasks), indicating imbalance.
- apps/backend/app/routers/yki_practice.py embeds a separate task bank directly in code, while yki_exam.py reads the certified bank, so practice and exam do not share one clear content authority.
        - Suggested remediation: Reconcile YKI practice and exam to one governed content authority, repair certification metadata so certified means certified, add verified audio coverage for listening, and rebalance topic/task distributions.
        - Verification after remediation:
        - Every task under certified_bank reports certified status with traceable certification metadata.
- Listening assets are present and verified.
- Practice and exam routes consume a documented shared authority or a deliberately versioned derivative.

## Supporting Artifact
- `yki_materials_gap_map.csv`

## Bank Augmentation Plan
- Verify and recertify every task under `certified_bank` so certification metadata is truthful.
- Add verified audio assets and integrity checks for listening tasks.
- Reduce over-concentration in writing prompts and technology topics.
- Move YKI practice off the embedded hardcoded bank onto a governed derivative of the same canonical authority.
