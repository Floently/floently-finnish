Scope: deep technical and pedagogical card-bank study for Floently Learn / Floently Finnish.

What was inspected:
- live `/cards` runtime path in `apps/backend/app/routers/v1_cards.py` and dependent services
- legacy authority loader under `apps/backend/app/runtime/`
- canonical cards runtime and publication stack under `apps/backend/app/cards/`
- in-repo published, validated, accepted, and donor card files
- external compiled bank under `/home/vitus/Asiakirjat/project_documents/floently-finnish/complied_card_materials/`

Methods used:
- route and service tracing
- static schema inspection
- direct content sampling
- duplicate and overlap analysis
- profession-domain keyword coverage analysis

Commands run:
- `rg -n "accepted_cards|published|runtime deck|start_runtime_session|get_runtime_deck|cards/output|manifest|dataset|profession|content_type|adaptive" apps/backend/app apps/backend/cards apps/backend/tests -S`
- `python3 -c "import sys; sys.path.insert(0,'apps/backend'); from app.runtime.cards_material_bank import load_authority_cards; ..."`
- `python3 -c "... compare SHA-256 of apps/backend/practice/data/cards/*.json with external complied_card_materials/cards/*.json ..."`
- `python3 -c "... sample published cards, legacy donor cards, curated fraasit/sanasto/kielioppi packs, and combined/new_practice files ..."`

Evidence:
- Nurse runtime count: 10056.
- Coverage evidence is in [profession_coverage_nurse.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/profession_coverage_nurse.csv).
- Nurse bank currently has the best real patient-facing examples, including bathing, dressing, blood pressure, medication, and calm reassurance.

PASS / WARN / FAIL:
- role-specific lexical density: WARN
- patient interaction: PASS
- medication/symptom language: PASS
- documentation: WARN
- handover/privacy/emergency: FAIL

Severity: High
Deployment impact: should fix before deployment
Owner: content
Exact file paths:
- [profession_coverage_nurse.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/profession_coverage_nurse.csv)
- `/home/vitus/Asiakirjat/project_documents/floently-finnish/complied_card_materials/fraasit/sairaanhoitaja_fraasit/sairaanhoitaja_fraasit.json`

Remediation:
- Preserve the strongest nurse care-work cards and add missing handover, confidentiality, and escalation clusters.

Verification steps:
- sample at least 50 newly added nurse cards across handover/privacy/emergency.
