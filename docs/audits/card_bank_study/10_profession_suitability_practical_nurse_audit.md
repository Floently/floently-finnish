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
- Practical nurse runtime count: 11222.
- Coverage evidence is in [profession_coverage_practical_nurse.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/profession_coverage_practical_nurse.csv).
- Some strong care-work lines exist, but the profession also contains obvious generic clutter in the external phrase pack and article-derived runtime duplicates.

PASS / WARN / FAIL:
- role-specific lexical density: WARN
- direct care language: WARN
- home-care/elderly-care language: WARN
- handover/privacy/emergency: FAIL
- generic clutter control: FAIL

Severity: Critical
Deployment impact: blocks deployment
Owner: content
Exact file paths:
- [profession_coverage_practical_nurse.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/profession_coverage_practical_nurse.csv)
- `/home/vitus/Asiakirjat/project_documents/floently-finnish/complied_card_materials/fraasit/lähihoitaja_fraasit/lähihoitaja_fraasit.json`

Remediation:
- Separate useful care-work content from general-life filler and rebuild around dementia, home care, documentation, family communication, and shift coordination.

Verification steps:
- practical nurse sample should skew to care work and home care after curation.
