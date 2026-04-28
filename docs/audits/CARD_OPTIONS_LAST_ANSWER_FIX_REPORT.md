# CARD_OPTIONS_LAST_ANSWER_FIX_REPORT

## Root Cause
The bug was in the live backend serving path plus canonical published data ordering.

1. Live path confirmation:
- Router: `apps/backend/app/routers/v1_cards.py`
- Service: `apps/backend/app/services/cards_service.py`
- Runtime logic: `apps/backend/app/runtime/cards_logic.py`
- Material source: `apps/backend/app/runtime/cards_material_bank.py` (reads from `apps/backend/card_bank/canonical_bank/published/**`)

2. Why correct answer appeared last:
- Published canonical MCQ cards were heavily biased to `answer_key` pointing to the last option.
- Runtime served options in source order with no shuffle.
- Frontend rendered options in received order and submitted `option_id`; it did not force `last index` correctness.

3. Proof before fix:
- Canonical published MCQ position distribution (pre-fix): `(3,4) = 50301 / 50956`.
- Live runtime sample (pre-fix):
  - `vocabulary_card`: `80/80` last
  - `sentence_card`: `80/80` last
  - `grammar_card`: `80/80` last

## Files Changed

### Code
- `apps/backend/app/runtime/cards_logic.py`
- `apps/backend/app/cards/ingestion/builders/card_builder.py`
- `apps/backend/app/cards/importers/mappers/kielitaika_to_canonical.py`
- `apps/backend/tests/test_cards_logic_answer_options.py`

### Republished canonical published bank
- `apps/backend/card_bank/canonical_bank/published/general/grammar/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/general/grammar/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/general/grammar/c1_c2.json`
- `apps/backend/card_bank/canonical_bank/published/general/sentences/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/general/sentences/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/general/sentences/c1_c2.json`
- `apps/backend/card_bank/canonical_bank/published/general/vocabulary/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/general/vocabulary/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/general/vocabulary/c1_c2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/doctor/grammar/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/doctor/grammar/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/doctor/grammar/c1_c2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/doctor/sentences/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/doctor/sentences/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/doctor/vocabulary/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/doctor/vocabulary/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/doctor/vocabulary/c1_c2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/nurse/grammar/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/nurse/grammar/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/nurse/sentences/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/nurse/sentences/a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/nurse/sentences/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/nurse/sentences/c1_c2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/nurse/vocabulary/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/nurse/vocabulary/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/practical_nurse/grammar/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/practical_nurse/grammar/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/practical_nurse/grammar/c1_c2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/practical_nurse/sentences/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/practical_nurse/sentences/b1_b2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/practical_nurse/sentences/c1_c2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/practical_nurse/vocabulary/a1_a2.json`
- `apps/backend/card_bank/canonical_bank/published/professional/practical_nurse/vocabulary/b1_b2.json`

## Logic Changed (Before vs After)

### 1) Live runtime option serving (`cards_logic.py`)
Before:
- MCQ options were served in source order.
- If source had correct option last, UI always showed correct last.

After:
- Added MCQ option shuffling in `_make_served_follow_up` using per-session seed material.
- Canonical correct option is resolved (`answer_key` + `answer_text` + fallback `answer_value`) and preserved after shuffle.
- `answer_key` and `answer_text` in served payload stay aligned to shuffled options.
- `answer_card` continues evaluating by served `option_id` in `option_id` mode, with text fallback retained for compatibility.

### 2) Ingestion builder (`card_builder.py`)
Before:
- Recognition options emitted in incoming order.
- `answer_key` mapped from pre-shuffle index/order.

After:
- Recognition options are deterministically shuffled at build time.
- `answer_key` is set against final shuffled option set.

### 3) Import mapper (`kielitaika_to_canonical.py`)
Before:
- Imported MCQ options preserved source order.

After:
- Imported MCQ options are deterministically shuffled.
- `answer_key` is preserved and validated against shuffled options.

### 4) Canonical republish
- Rewrote all published MCQ option arrays in `canonical_bank/published/**` with deterministic shuffling while keeping valid `answer_key` mappings.

## Correctness Determination Now
For MCQ (`evaluation_mode=option_id`):
1. Backend serves shuffled `options` list.
2. Backend serves aligned `answer_key` that points to the correct option in that shuffled list.
3. Frontend submits selected `option_id`.
4. Backend evaluates correctness by matching submitted `option_id` to served `answer_key` (with defensive text fallback retained).

This removes any dependency on last index or pre-shuffle ordering.

## Verification Evidence

### Automated tests
Executed:
- `cd apps/backend && PYTHONPATH=. python3 -m unittest -v tests.test_cards_logic_answer_options`
- `cd apps/backend && PYTHONPATH=. python3 -m unittest -v tests.test_runtime_api`

Results:
- All tests passed.
- New tests specifically verify:
  - served MCQ options are shuffled,
  - `answer_key` remains aligned with correct option text,
  - correct/wrong `option_id` submissions evaluate correctly,
  - correct option is not systematically last across vocabulary/sentence/grammar session samples.

### Published canonical bank distribution (post-fix)
Across `50956` MCQ cards with 4 options:
- index `0`: `12689`
- index `1`: `12792`
- index `2`: `12686`
- index `3`: `12789`

Per content type last-position ratio:
- `vocabulary_card`: `6003/24079`
- `sentence_card`: `2001/7974`
- `grammar_card`: `1083/4256`
- `phrase_card`: `3702/14647`

No systematic last-option correctness remains.

### Live runtime served sessions (post-fix)
Sampled 120 served cards per type via live `cards_logic` session path:
- `vocabulary_card` dist `{0:29,1:31,2:34,3:26}`
- `sentence_card` dist `{0:35,1:28,2:25,3:32}`
- `grammar_card` dist `{0:29,1:31,2:24,3:36}`

Correct answer is no longer systematically last in live served payloads.

### Frontend alignment check
Inspected frontend path:
- `apps/client/features/cards/components/CardPracticeSession.tsx`
- `apps/client/features/cards/hooks/useCardPractice.ts`
- `apps/client/features/cards/services/cardsService.ts`
- `packages/core/api/cards.ts`

Findings:
- UI renders options in received order.
- UI submits selected `option_id`.
- Backend evaluates against served `answer_key`.
- No `options.length - 1` or hardcoded last-index correctness logic found.

## Scope Guard
- No card redesign introduced.
- Session flow/state kept intact.
- Fix applied at source-of-truth runtime serving and canonical generation/import pathways.
