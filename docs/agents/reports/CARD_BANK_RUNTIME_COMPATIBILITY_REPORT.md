# CARD_BANK_RUNTIME_COMPATIBILITY_REPORT

## Mode mapping
- `Words` -> backend `vocabulary_card` via `packages/core/api/cards.ts` content-type mapping.
- `Phrases` -> backend `sentence_card` via the same mapping.
- `Grammar` -> backend `grammar_card`; general grammar coverage is supplemented by `floently_general_grammar_cards.json`.
- Professional banks are available because the missing local donor files now exist under `apps/backend/practice/data/cards/`.
- Practical nurse grammar now exists as an explicit validated source file, not only as runtime fallback behavior.

## Runtime notes
- The previous client bug was that card session/deck requests omitted `content_type`, so tab changes did not correspond to actual backend families.
- The backend professional source repository expected local files under `apps/backend/practice/data/cards/`; these were missing and are now present.
- The current client no longer needs to infer tab families from mixed decks.
