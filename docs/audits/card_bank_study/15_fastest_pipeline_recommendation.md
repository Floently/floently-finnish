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
- The best raw material already exists in structured JSON formats.
- The main bottleneck is authority control and publication discipline, not raw extraction.

PASS / WARN / FAIL: WARN
Severity: High
Deployment impact: should fix before deployment
Owner: backend
Recommendation:
- Implementation language: Python
- Stages:
  1. inventory external and in-repo banks
  2. normalize profession labels and level bands
  3. map curated cards into canonical envelopes
  4. deduplicate on normalized signature
  5. validate against canonical schemas
  6. publish through one manifest-backed layer
  7. smoke-test runtime selection
- Review checkpoints:
  - medication, consent/privacy, emergency, empathy, and home-care content require human review after automation

Exact file paths:
- [sample_transform_script.py](/home/vitus/floently-finnish/docs/audits/card_bank_study/sample_transform_script.py)
- [sample_normalization_rules.md](/home/vitus/floently-finnish/docs/audits/card_bank_study/sample_normalization_rules.md)

Verification steps:
- pipeline must emit deterministic manifests and a duplicate report before publication.
