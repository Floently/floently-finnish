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
- Live runtime has 5076 sentence cards and no separate phrase bank authority.
- Duplicate report shows repeated long article-derived completion prompts, including surgical infection prose and medical-history exposition.
- External curated phrase packs include genuinely reusable chunks such as `Avaa suusi, olkaa hyvä.` and `Hoitaja antaa potilaalle kipulääkettä.`, but the practical nurse pack also contains generic clutter such as ski holidays and furniture shopping.

PASS / WARN / FAIL:
- formulaic usefulness: WARN
- real communicative value: WARN
- actionability and workplace realism: FAIL
- register/politeness: WARN
- reusability across situations: FAIL

Severity: Critical
Deployment impact: blocks deployment
Owner: content
Exact file paths:
- [duplicate_report.csv](/home/vitus/floently-finnish/docs/audits/card_bank_study/duplicate_report.csv)
- `/home/vitus/Asiakirjat/project_documents/floently-finnish/complied_card_materials/fraasit/*/*.json`

Remediation:
- Convert sentence banks into a profession phrase bank centered on instructions, reassurance, questioning, handover, and documentation language.
- Quarantine article fragments and generic lifestyle filler.

Verification steps:
- top duplicate groups should no longer be long prose fragments.
