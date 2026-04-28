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
- Live level distribution is highly skewed: {"A1_A2": 669, "B1_B2": 34348, "C1_C2": 132}.
- The live `/cards` bank mainly supports word recognition and sentence translation, not YKI-style interaction or production tasks.
- External `new_practice` grammar and vocab packs are more structured for staged learning, but are not the current authority.

PASS / WARN / FAIL:
- level appropriateness: WARN
- can-do usefulness: FAIL
- reception vs production support: FAIL
- YKI-relevant communication support: FAIL

Severity: High
Deployment impact: should fix before deployment
Owner: content
Exact file paths:
- [apps/backend/app/runtime/cards_logic.py](/home/vitus/floently-finnish/apps/backend/app/runtime/cards_logic.py)
- `/home/vitus/Asiakirjat/project_documents/floently-finnish/complied_card_materials/new_practice/*.json`

Remediation:
- Tie cards to concrete interaction outcomes and rebalance level bands during publication.

Verification steps:
- re-audit by level and task family after pipeline changes.
