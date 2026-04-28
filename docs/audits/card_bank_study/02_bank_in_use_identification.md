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
- `apps/backend/app/routers/v1_cards.py` calls `cards_service`.
- `apps/backend/app/services/cards_service.py` delegates `start_runtime_session`, `next_runtime_card`, `answer_runtime_card`, and `get_runtime_deck` to `app.runtime.cards_logic`.
- `apps/backend/app/runtime/cards_logic.py` imports `load_authority_cards` and `load_runtime_bank` from `app.runtime.cards_material_bank`.
- `apps/backend/app/runtime/cards_material_bank.py` builds the live bank from `materials/cards/published/*.json` and `practice/data/cards/*.json`.
- The canonical `apps/backend/app/cards/runtime/...` repository stack is present but not authoritative for the main `/cards` router.

Source-of-truth conclusion:
- Current live source of truth for the main cards product is the legacy authority loader, not the canonical publication/runtime stack.
- Authority drift exists between:
  1. `app/cards/output/accepted/accepted_cards.json`
  2. `materials/cards/validated/*.json`
  3. DB-published datasets in `app/cards/publication/repository.py`
  4. the actual live loader under `app/runtime/cards_material_bank.py`

PASS / WARN / FAIL: FAIL
Severity: Critical
Deployment impact: blocks deployment
Owner: backend
Exact file paths:
- [apps/backend/app/routers/v1_cards.py](/home/vitus/floently-finnish/apps/backend/app/routers/v1_cards.py)
- [apps/backend/app/services/cards_service.py](/home/vitus/floently-finnish/apps/backend/app/services/cards_service.py)
- [apps/backend/app/runtime/cards_logic.py](/home/vitus/floently-finnish/apps/backend/app/runtime/cards_logic.py)
- [apps/backend/app/runtime/cards_material_bank.py](/home/vitus/floently-finnish/apps/backend/app/runtime/cards_material_bank.py)
- [runtime_bank_map.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/runtime_bank_map.csv)

Remediation:
- Route the main `/cards` APIs through one canonical authority.
- Publish through one manifest-backed layer only.

Verification steps:
- trace one request from router to storage and prove it cannot read a second bank.
