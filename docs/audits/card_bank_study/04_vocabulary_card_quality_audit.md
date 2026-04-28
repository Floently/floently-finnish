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
- Live bank contains 30073 vocabulary cards.
- Many live vocabulary cards originate from legacy donor banks with self-matching prompts such as `prompt: potilas, answer: potilas`.
- Malformed/noisy vocabulary rows flagged: 7989.
- External compiled `sanasto` packs are much smaller and cleaner, but some still contain low-value items such as `aika`, `asia`, `aurinko`, `auto`, `bussi` inside the doctor pack.

PASS / WARN / FAIL:
- frequency/usefulness: WARN
- retrieval suitability: FAIL
- morphology/inflection support: WARN
- register and collocations: WARN
- domain specificity: FAIL
- malformed/noisy token control: FAIL

Severity: High
Deployment impact: should fix before deployment
Owner: content
Exact file paths:
- [apps/backend/practice/data/cards/doctor_cards.json](/home/vitus/floently-finnish/apps/backend/practice/data/cards/doctor_cards.json)
- [apps/backend/practice/data/cards/nurse_cards.json](/home/vitus/floently-finnish/apps/backend/practice/data/cards/nurse_cards.json)
- [malformed_terms_report.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/malformed_terms_report.csv)
- `/home/vitus/Asiakirjat/project_documents/floently-finnish/complied_card_materials/sanasto/*/*.json`

Remediation:
- Keep curated profession vocabulary; drop legacy rows that only repeat the answer token.
- Add morphology-sensitive prompts for verbs, noun cases, and dosage language where needed.

Verification steps:
- sample 100 vocabulary cards and confirm each tests meaning or use, not token identity.
