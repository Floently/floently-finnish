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
- Runtime total: 35149 cards
- Runtime sources: published 6307, legacy 28842
- Runtime content types: {"sentence_card": 5076, "vocabulary_card": 30073}
- Exact duplicate rows: 21946
- Malformed vocab candidates: 7989

PASS / WARN / FAIL:
- Engine and authority: FAIL
- Learning effectiveness: FAIL
- Vocabulary quality: FAIL
- Phrase quality: FAIL
- Grammar quality: FAIL
- CEFR/YKI suitability: FAIL
- Doctor suitability: FAIL
- Nurse suitability: WARN
- Practical nurse suitability: FAIL
- External curated-bank integration opportunity: WARN

Severity: Critical
Deployment impact: blocks deployment
Owner: backend + content
Exact file paths:
- `apps/backend/app/routers/v1_cards.py`
- `apps/backend/app/services/cards_service.py`
- `apps/backend/app/runtime/cards_logic.py`
- `apps/backend/app/runtime/cards_material_bank.py`
- `apps/backend/practice/data/cards/*.json`
- `apps/backend/materials/cards/published/*.json`

Remediation:
- Establish one runtime authority and stop mixing published and legacy donor banks.
- Replace low-retrieval donor templates with canonical curated cards.
- Fix grammar-card runtime compatibility.
- Import curated external fraasit/sanasto/kielioppi packs through a controlled canonical pipeline.

Verification steps:
- prove one source of truth for `/cards`
- rerun duplicate report
- rerun profession coverage metrics
- sample 100 cards per profession after remediation
