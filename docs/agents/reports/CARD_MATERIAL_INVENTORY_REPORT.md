# CARD_MATERIAL_INVENTORY_REPORT

## Runtime-usable sources
- `apps/backend/materials/cards/validated/kielitaika_normalized_cards.json`: `publishable_now`. Current validated runtime material with general + professional cards.
- `apps/backend/app/cards/output/accepted/accepted_cards.json`: `publishable_now`. Primary validated ingestion authority already loaded by runtime.
- `/home/vitus/Documents/puhis/backend/practice/data/cards/nurse_cards.json`: `publishable_now`. Professional nurse donor source copied into local runtime path.
- `/home/vitus/Documents/puhis/backend/practice/data/cards/doctor_cards.json`: `publishable_now`. Professional doctor donor source copied into local runtime path.
- `/home/vitus/Documents/puhis/backend/practice/data/cards/lahioitaja_cards.json`: `publishable_now`. Professional practical nurse donor source copied into local runtime path.
- `/home/vitus/needed_files/all/card_materials_from_puhis/new_practice/finnish_grammar_content_pack__v1.json`: `convertible`. Converted into schema-valid general grammar supplement via current new_practice adapter.
- `apps/backend/materials/cards/validated/floently_practical_nurse_grammar_cards.json`: `publishable_now`. Mirrored practical-nurse grammar starter bank with unique ids.
- `/home/vitus/needed_files/all/card_materials_from_puhis/vocabulary_card_set/vocab.json`: `reject_for_now`. Mixed-language and non-Finnish donor list; not safe to publish.
- `/home/vitus/needed_files/all/card_materials_from_puhis/sentence_card_set/sentences.json`: `reject_for_now`. English parliamentary sentences; not valid Finnish phrase bank content.
- `/home/vitus/needed_files/all/card_materials_from_puhis/grammar_card_set/grammar.json`: `donor_only`. Useful as corruption evidence, not publishable grammar content.

## Bank counts
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
