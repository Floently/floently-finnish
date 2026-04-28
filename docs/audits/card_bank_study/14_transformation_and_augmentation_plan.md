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
- Current runtime authority is broken enough that augmentation must start with authority hardening.
- Curated external packs exist for doctor, nurse, and practical nurse across phrase, vocab, and grammar.

PASS / WARN / FAIL: WARN
Severity: High
Deployment impact: should fix before deployment
Owner: backend + content
Recommended sequence:
1. Freeze one runtime authority for `/cards`.
2. Import curated `fraasit`, `sanasto`, and `kielioppi` packs into canonical card envelopes.
3. Fix grammar runtime compatibility.
4. Deduplicate against the current live bank on normalized signature.
5. Quarantine legacy donor material that only offers token-identity drills or generic filler.
6. Manually author missing high-value domains: handover, consent/privacy, documentation, emergencies, relatives, home care.

Exact file paths:
- [compiled_bank_to_runtime_mapping.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/compiled_bank_to_runtime_mapping.csv)
- [schema_mapping_examples.json](/home/vitus/floently-finnish/docs/audits/card_bank_study/schema_mapping_examples.json)

Verification steps:
- rerun duplicate, coverage, and runtime stats after each stage.
