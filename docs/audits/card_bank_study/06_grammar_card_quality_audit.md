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
- Canonical grammar cards exist in `floently_general_grammar_cards.json`, `floently_practical_nurse_grammar_cards.json`, and the external `kielioppi/*` packs.
- The live bank emits zero grammar cards because the authority loader drops them.
- External grammar packs are concise and operational compared with the current live runtime, which provides no grammar path through `/cards`.

PASS / WARN / FAIL:
- grammar availability at runtime: FAIL
- meaningful use over metalanguage: WARN
- example realism: WARN
- profession context fit: WARN

Severity: Critical
Deployment impact: blocks deployment
Owner: backend + content
Exact file paths:
- [apps/backend/materials/cards/published/floently_general_grammar_cards.json](/home/vitus/floently-finnish/apps/backend/materials/cards/published/floently_general_grammar_cards.json)
- [apps/backend/materials/cards/published/floently_practical_nurse_grammar_cards.json](/home/vitus/floently-finnish/apps/backend/materials/cards/published/floently_practical_nurse_grammar_cards.json)
- `/home/vitus/Asiakirjat/project_documents/floently-finnish/complied_card_materials/kielioppi/*/*.json`

Remediation:
- Fix runtime grammar compatibility first, then import curated profession grammar packs through the canonical schema.

Verification steps:
- `/cards/deck?content_type=grammar_card` must return live cards from one authority.
