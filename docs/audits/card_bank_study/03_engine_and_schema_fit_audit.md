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
- Main runtime authority total: 35149 cards.
- Runtime content types exclude grammar entirely: {"sentence_card": 5076, "vocabulary_card": 30073}.
- Runtime path distribution is all professional despite general published cards.
- Duplicate rows: 21946.
- `apps/backend/materials/cards/published/floently_general_grammar_cards.json` contains canonical grammar cards, but the live loader drops them.

PASS / WARN / FAIL:
- runtime authority discipline: FAIL
- schema completeness: FAIL
- tag/category/level consistency: WARN
- manifest integrity: WARN
- stable IDs: WARN
- import/export compatibility: WARN

Severity: Critical
Deployment impact: blocks deployment
Owner: backend
Exact file paths:
- [apps/backend/app/runtime/cards_material_bank.py](/home/vitus/floently-finnish/apps/backend/app/runtime/cards_material_bank.py)
- [apps/backend/app/cards/schemas/cards.py](/home/vitus/floently-finnish/apps/backend/app/cards/schemas/cards.py)
- [apps/backend/app/cards/schemas/common.py](/home/vitus/floently-finnish/apps/backend/app/cards/schemas/common.py)
- [apps/backend/app/cards/publication/repository.py](/home/vitus/floently-finnish/apps/backend/app/cards/publication/repository.py)
- [bank_inventory.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/bank_inventory.csv)

Remediation:
- Eliminate the legacy runtime materializer or make it fully schema-aware.
- Preserve `path`, `profession`, `content_type`, and grammar front/back fields from canonical envelopes.

Verification steps:
- runtime stats must include grammar cards and preserve general/professional split.
