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
- `complied_card_materials/cards/*.json` are byte-identical to local `practice/data/cards/*.json`.
- Curated `fraasit`, `sanasto`, and `kielioppi` packs have zero runtime ID overlap, so they are not currently integrated.
- `combined/*.json` files contain strong English contamination and aggregate noise.
- `new_practice` packs are structured and convertible.

PASS / WARN / FAIL:
- direct reuse of cards/*.json: PASS but already integrated
- curated fraasit/sanasto/kielioppi reuse: WARN (worth integrating)
- combined aggregate files: FAIL for direct import
- new_practice structured packs: WARN (worth converting)

Severity: High
Deployment impact: should fix before deployment
Owner: content + backend
Exact file paths:
- [compiled_bank_to_runtime_mapping.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/compiled_bank_to_runtime_mapping.csv)
- `/home/vitus/Asiakirjat/project_documents/floently-finnish/complied_card_materials/combined/*.json`
- `/home/vitus/Asiakirjat/project_documents/floently-finnish/complied_card_materials/new_practice/*.json`

Remediation:
- integrate curated and structured packs first; quarantine combined files.

Verification steps:
- every imported external source must appear in a manifest with classification and review status.
