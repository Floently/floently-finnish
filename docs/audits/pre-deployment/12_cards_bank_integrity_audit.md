# Cards Bank Integrity Audit

## Scope Statement
Audit of grammar, vocabulary, phrase, and profession-tagged card banks with emphasis on doctor, nurse, and practical nurse pathways.

## What Was Inspected
- Published and validated professional card banks under `apps/backend/materials/cards/`.
- Legacy source banks under `apps/backend/practice/data/cards/`.
- Manifests and sidecars for doctor, nurse, and practical nurse.

## Methods Used
- Direct JSON inspection.
- Count, duplication, and keyword coverage analysis.
- Manual sampling of published card content.

## Commands Run
- `find apps/backend/materials/cards/...`
- Python JSON sampling across published professional banks
- Duplicate and keyword-hit analysis scripts

## PASS / WARN / FAIL Verdicts
- Doctor bank: **FAIL**
- Nurse bank: **FAIL**
- Practical nurse bank: **FAIL**
- General foundation support: **WARN**

## Profession-by-Profession Summary
### Doctor
- Deployability: **FAIL**
- Strengths: some consultation verbs, symptoms, medication, and examination instruction coverage.
- Major faults: 1,157 duplicates in B1-B2 phrase bank; malformed vocabulary; weak emergency/home-care/family communication coverage; overuse of generic and historical medical filler.

### Nurse
- Deployability: **FAIL**
- Strengths: grammar layer is comparatively stronger; includes medication, isolation, and patient-support language.
- Major faults: 716 phrase duplicates; role realism remains uneven; advanced C1-C2 layer is too thin; bank still carries generic non-workplace material.

### Practical Nurse
- Deployability: **FAIL**
- Strengths: some care-work context appears in grammar and medication vocabulary.
- Major faults: 975 phrase duplicates; emergency/escalation and elderly/home-care coverage are too weak for the product promise; vocabulary quality is noisy.

## Findings
### AUD-013 — Professional card banks contain heavy duplication, generic filler, and low-integrity vocabulary
        - Verdict: **FAIL**
        - Severity: **Critical**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **content**
        - Exact paths: `apps/backend/materials/cards/published/professional/doctor/phrases/b1_b2.json`, `apps/backend/materials/cards/published/professional/nurse/phrases/b1_b2.json`, `apps/backend/materials/cards/published/professional/practical_nurse/phrases/b1_b2.json`, `apps/backend/materials/cards/published/professional/*/words/*.json`
        - Evidence:
        - Doctor phrase bank has 1,157 duplicate entries in phrases/b1_b2.json; nurse has 716; practical nurse has 975 duplicate entries (analysis script run during audit).
- Published vocabulary includes suspect low-value tokens such as aamtu, aim, how, who, TT, and other malformed or decontextualized items.
- Sample phrase entries include generic historical medical statements such as `1700-luvulla kirurgian ja lääketieteen oppialat alkoivat yhdistyä`, which do not support workplace communication readiness.
        - Suggested remediation: Deduplicate aggressively, quarantine malformed vocabulary, and rebuild profession banks around authentic Finnish workplace scenarios and communicative tasks rather than imported noise.
        - Verification after remediation:
        - Re-run bank integrity metrics showing duplicate counts near zero and malformed term removal.
- Human review confirms each profession track is dominated by authentic, role-specific, actionable Finnish.

### AUD-014 — Professional pathways are under-covered in critical workplace domains
        - Verdict: **FAIL**
        - Severity: **High**
        - Deployment impact: **blocks deployment**
        - Owner suggestion: **content**
        - Exact paths: `apps/backend/materials/cards/published/professional/doctor/`, `apps/backend/materials/cards/published/professional/nurse/`, `apps/backend/materials/cards/published/professional/practical_nurse/`
        - Evidence:
        - Keyword coverage analysis showed very low hits in emergency/escalation, elderly/home-care, empathy/family, and handover/documentation compared with the overall bank sizes.
- Doctor bank total 4,717 cards but only 12 emergency/escalation hits and 24 elderly/home-care hits; practical nurse bank total 3,850 cards but only 10 emergency/escalation hits and 28 elderly/home-care hits.
        - Suggested remediation: Add curated content packs for handover, emergencies, family communication, consent/privacy, documentation, home care, elderly care, rehabilitation, medication safety, and multidisciplinary coordination for each profession.
        - Verification after remediation:
        - Coverage report shows meaningful scenario/task counts in all critical domain areas per profession.
- Subject-matter review confirms language-to-work claims are supported by the bank.

## Supporting Artifacts
- `cards_bank_coverage_doctor.csv`
- `cards_bank_coverage_nurse.csv`
- `cards_bank_coverage_practical_nurse.csv`

## Augmentation Recommendation
Augmentation is required before release. Priority order:
1. Remove duplicate/generic imported sentence stock.
2. Rebuild workplace phrase banks around authentic scenarios.
3. Add high-value domain packs for emergencies, handover, documentation, home care, relatives, consent/privacy, and reassurance.
4. Re-curate vocabulary to remove malformed and decontextualized items.
