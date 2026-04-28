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
- Exact duplicate rows: 21946.
- Content-type balance is heavily skewed toward vocabulary cards: {"sentence_card": 5076, "vocabulary_card": 30073}.
- Level balance is heavily skewed to B1_B2: {"A1_A2": 669, "B1_B2": 34348, "C1_C2": 132}.

PASS / WARN / FAIL:
- topic diversity: WARN
- vocabulary/phrase/grammar balance: FAIL
- redundancy quality: FAIL
- coverage gaps: FAIL

Severity: Critical
Deployment impact: blocks deployment
Owner: content
Exact file paths:
- [duplicate_report.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/duplicate_report.csv)
- [bank_inventory.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/bank_inventory.csv)

Remediation:
- deduplicate at publication time, enforce per-profession balance checks, and add coverage minimums for missing workplace domains.

Verification steps:
- exact duplicate rows should collapse sharply; content-type and level distributions should rebalance.
