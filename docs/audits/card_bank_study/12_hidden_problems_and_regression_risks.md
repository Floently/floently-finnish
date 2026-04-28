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
- Hidden authority drift between live `/cards` and canonical cards runtime.
- Live loader silently drops grammar and rewrites general path to professional.
- Legacy and published material are combined with no manifest boundary.

PASS / WARN / FAIL: FAIL
Severity: Critical
Deployment impact: blocks deployment
Owner: backend
Regression risks:
- wrong-bank-at-runtime risk: high
- schema drift risk: high
- duplicate reintroduction risk: high
- profession leakage risk: high
- adaptive/session amplification of bad content: high

Exact file paths:
- [apps/backend/app/runtime/cards_material_bank.py](/home/vitus/floently-finnish/apps/backend/app/runtime/cards_material_bank.py)
- [apps/backend/app/cards/publication/repository.py](/home/vitus/floently-finnish/apps/backend/app/cards/publication/repository.py)

Remediation:
- harden runtime authority, validate manifest/source boundaries, and add automated checks for path/content/profession integrity and duplicate reintroduction.

Verification steps:
- add bank smoke tests for grammar presence, level balance, and one-source-of-truth routing.
