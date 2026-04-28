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

Evidence artifacts:
- [bank_inventory.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/bank_inventory.csv)
- [runtime_bank_map.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/runtime_bank_map.csv)
- [duplicate_report.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/duplicate_report.csv)
- [malformed_terms_report.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/malformed_terms_report.csv)
- [profession_coverage_doctor.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/profession_coverage_doctor.csv)
- [profession_coverage_nurse.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/profession_coverage_nurse.csv)
- [profession_coverage_practical_nurse.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/profession_coverage_practical_nurse.csv)
- [compiled_bank_to_runtime_mapping.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/compiled_bank_to_runtime_mapping.csv)
- [schema_mapping_examples.json](/home/vitus/floently-finnish/docs/audits/card_bank_study/schema_mapping_examples.json)
- [sample_transform_script.py](/home/vitus/floently-finnish/docs/audits/card_bank_study/sample_transform_script.py)
- [sample_normalization_rules.md](/home/vitus/floently-finnish/docs/audits/card_bank_study/sample_normalization_rules.md)

Top-line conclusion:
- The bank actually in use by the main `/cards` router is the legacy authority bank built by `apps/backend/app/runtime/cards_material_bank.py:load_authority_cards()`, sourced from `apps/backend/materials/cards/published/*.json` plus `apps/backend/practice/data/cards/*.json`.
- Runtime bank verdict: FAIL
- External compiled bank verdict: mixed; curated packs are useful, aggregate dumps are not.
