# CARD_BANK_PRODUCTION_REPORT

## What was produced
- Copied missing professional donor banks into `apps/backend/practice/data/cards/` so the runtime can ingest nurse, doctor, and practical nurse sources.
- Copied required `new_practice` source packs into `apps/backend/practice/new_practice/`.
- Generated explicit grouped bank files under `apps/backend/materials/cards/validated/` and `apps/backend/materials/cards/published/` by path/profession/family/level.
- Added `apps/backend/materials/cards/validated/floently_general_grammar_cards.json` so the default runtime has real general grammar coverage.
- Added `apps/backend/materials/cards/validated/floently_practical_nurse_grammar_cards.json` so practical nurse has an explicit grammar starter bank with unique ids.
- Fixed frontend mode mapping so visible tabs request the correct backend card family.

## Resulting bank coverage
- `general` / `grammar`: 91 cards (A1_A2:27, B1_B2:57, C1_C2:7)
- `general` / `phrases`: 71 cards (A1_A2:38, B1_B2:33)
- `general` / `words`: 21 cards (A1_A2:7, B1_B2:13, C1_C2:1)
- `professional/doctor` / `grammar`: 60 cards (A1_A2:23, B1_B2:35, C1_C2:2)
- `professional/doctor` / `phrases`: 1636 cards (A1_A2:11, B1_B2:1625)
- `professional/doctor` / `words`: 3021 cards (A1_A2:69, B1_B2:2901, C1_C2:51)
- `professional/nurse` / `grammar`: 184 cards (A1_A2:45, B1_B2:131, C1_C2:8)
- `professional/nurse` / `phrases`: 1427 cards (A1_A2:85, B1_B2:1328, C1_C2:14)
- `professional/nurse` / `words`: 2174 cards (A1_A2:107, B1_B2:2067)
- `professional/practical_nurse` / `grammar`: 90 cards (A1_A2:27, B1_B2:56, C1_C2:7)
- `professional/practical_nurse` / `phrases`: 1383 cards (A1_A2:18, B1_B2:1365)
- `professional/practical_nurse` / `words`: 2376 cards (B1_B2:2376)
