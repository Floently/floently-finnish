# Card Runtime Audit

**Scope:** `apps/backend/app/runtime/cards_material_bank.py`, `apps/backend/app/runtime/cards_logic.py`, `apps/backend/app/services/cards_service.py`, `apps/backend/app/routers/v1_cards.py`  
**Inspected:** 2026-04-19

---

## Architecture Overview

The card system has two operational paths:

**Legacy path** (uses `load_runtime_bank()`):
- `GET /cards/session?mode=vocabulary` → `cards_service.get_session()` → `get_card_session()` → `load_runtime_bank()`
- `POST /cards/answer` → `cards_service.answer()` → `evaluate_card_answer()` + `load_runtime_bank()`

**New runtime path** (uses `load_authority_cards()` directly):
- `GET /cards/session/adaptive/start` → `start_runtime_session()` → `start_cards_session_logic()` → `_filtered_cards()` → `load_authority_cards()`
- `POST /cards/session/{id}/answer` → `answer_runtime_card()` → `answer_card_logic()`
- `GET /cards/session/{id}/next` → `next_runtime_card()` → `next_card_logic()`
- `GET /cards/deck` → `get_runtime_deck()` → `list_cards_logic()` → `_filtered_cards()`

The frontend uses the **new runtime path** exclusively (`packages/core/api/cards.ts`).

---

## Card Loading Pipeline

```
practice/data/cards/*.json
        ↓ _source_files() — glob *.json
        ↓ load_authority_cards() — parse, normalize, build dicts
        ↓ _filtered_cards() — filter by domain/content_type/profession
        ↓ _rank_cards() — prioritize unseen, level-expand
        ↓ _materialized_card() — add state fields
        ↓ start_cards_session() → session stored in STORE
```

---

## Findings

### F-CARD-01: KeyError 'prompt' in load_runtime_bank()
**Verdict:** FAIL  
**Severity:** Critical  
**File:** `apps/backend/app/runtime/cards_material_bank.py` line 105  

```python
# load_authority_cards() builds dict with key 'follow_up_prompt'
# but load_runtime_bank() accesses item['prompt'] — KeyError
records.append(CardRecord(..., prompt=item['prompt'], ...))
```

The `CardRecord` dataclass (lines 23–36) has `prompt: str` as a required field, but `load_authority_cards()` stores the prompt under `'follow_up_prompt'`. This causes `KeyError: 'prompt'` on any call to `load_runtime_bank()`.

Affects: `GET /cards/session`, `POST /cards/answer` (legacy endpoints).

### F-CARD-02: Card Data Path Is ONLY practice/data/cards
**Verdict:** WARN  
**Severity:** High  
**File:** `apps/backend/app/runtime/cards_material_bank.py` lines 11–12  

```python
from app.core.paths import PRACTICE_DATA_DIR as _PRACTICE
CARDS_DIR = _PRACTICE / "cards"
```

`PRACTICE_DATA_DIR` = `apps/backend/practice/data`. So `CARDS_DIR` = `apps/backend/practice/data/cards`.

The system ignores the rich `apps/backend/materials/cards/published/` directory which contains 33 professionally structured JSON files with proper IDs, content schemas, follow_ups, and quality scores. These published files are **never loaded**.

Instead, only three flat JSON files are loaded:
- `doctor_cards.json` (11,507 items — Finnish word → Finnish word)
- `nurse_cards.json` (7,551 items — Finnish word → Finnish word)
- `lahioitaja_cards.json` (9,784 items — Finnish word → Finnish word)

The published materials (`materials/cards/published/`) are a completely separate, higher-quality bank that the runtime never uses.

### F-CARD-03: Doctor/Nurse Card Content Has No English Translation
**Verdict:** FAIL  
**Severity:** Critical  
**File:** `apps/backend/practice/data/cards/doctor_cards.json`  

```json
{"type": "recognition", "question": "Mikä sana tämä on?", "prompt": "potilas", 
 "options": ["potilas","palkkio","suolisto","keuhka"], "answer": "potilas"}
```

`load_authority_cards()` extracts:
- `front` = `item.get('prompt')` = `"potilas"` (Finnish)
- `back` = `item.get('answer')` = `"potilas"` (same Finnish word)
- `accepted_answers` = `["potilas"]`

Both front and back are the same Finnish word. A learner is shown "potilas" and expected to type "potilas". No English gloss anywhere.

For MCQ recognition cards: `front = item.get('question')` = `"Mikä sana tämä on?"`, options are all Finnish words. No translation provided.

### F-CARD-04: Type Distribution in Practice Card Files
**Verdict:** WARN  
**Severity:** Medium  

Doctor cards (`doctor_cards.json`), 11,507 items sample types:
- `recognition` — MCQ with Finnish options
- `recall` — type the Finnish word
- `reverse` — "Mitä tämä sana tarkoittaa kontekstissa?" (Finnish context question, Finnish answer)
- `completion` — fill-in-the-blank in Finnish sentences

All types are mapped as follows in `load_authority_cards()`:
- `recognition` → `variant_type='recognition_mcq'` (is in `_MCQ_TYPES`)
- `recall`, `reverse` → `variant_type='free_recall'`
- `completion` → `variant_type='free_recall'` (completion type IS in `_BLANK_TYPES`)

The `completion` type items have a `full_sentence` key that is not read:
```json
{"type": "completion", "question": "Jos _____ ei voi syödä...", "answer": "potilas", 
 "full_sentence": "Jos potilas ei voi syödä..."}
```

The `full_sentence` field is never used by the card loader.

### F-CARD-05: LRU Cache on load_authority_cards() — Hot Reload Risk
**Verdict:** WARN  
**Severity:** Medium  
**File:** `apps/backend/app/runtime/cards_material_bank.py` lines 46–99  

```python
@lru_cache(maxsize=1)
def load_authority_cards() -> list[dict[str, Any]]:
```

The card bank is cached indefinitely (for process lifetime). Content changes require process restart. The cache also means that if loading fails at startup, all subsequent calls return cached empty result. The demo card fallback (line 98) is appended when `not cards` — this is the only card that gets served if the files are missing or fail to parse.

### F-CARD-06: Adaptive Session — Ranking Works Correctly
**Verdict:** PASS  
**File:** `apps/backend/app/runtime/cards_logic.py` lines 191–226  

The `_rank_cards()` function:
- Prioritizes unseen cards in the target level band
- Falls back to adjacent bands (via `LEVEL_EXPANSION`)
- Uses deterministic shuffle via `_selection_seed()` (SHA-256 of user+domain+profession+level+history_size)
- Recycles seen cards when all are exhausted

This logic is sound.

### F-CARD-07: Content Type Mismatch — Grammar/Phrase Cards Not in Bank
**Verdict:** FAIL  
**Severity:** Medium  

The frontend requests `content_type=grammar_card` when `mode=grammar` and `content_type=sentence_card` when `mode=phrases`. But `load_authority_cards()` hardcodes `content_type='vocabulary_card'` for ALL cards (line 83).

So `GET /cards/session/adaptive/start?content_type=grammar_card` will return:
```python
if content_type and card["content_type"] != content_type:
    continue
# → skips all cards since all are 'vocabulary_card'
# → authority_cards = []
# → AppError(404, "CARDS_NO_AUTHORITY_MATCH", "No cards matched...")
```

When the user switches to "Grammar" or "Phrases" mode in the card UI, the session fails to start with 404.

### F-CARD-08: answer_card Field Name Mismatch
**Verdict:** WARN  
**Severity:** Medium  
**File:** `apps/backend/app/runtime/cards_logic.py` lines 340–380  

Backend returns from `answer_card()`:
```python
{
  "correct": correct,
  "is_correct": correct,
  "correct_answer": {"value": ..., "option_id": ..., "display_text": ...},
  "accepted_variants": [...],
  "next_card": ...,
  "session_completed": ...,
  ...
}
```

Frontend (`packages/core/api/cards.ts` lines 142–161) reads:
```typescript
correctAnswer: res.data.correct_answer?.value ?? '',
acceptedVariants: res.data.accepted_variants ?? [],
nextCard: mapCard(res.data.next_card ?? null),
sessionCompleted: res.data.session_completed,
```

These field names match. PASS on the answer response.

### F-CARD-09: start_cards_session Returns first_card (snake_case) — Frontend Reads first_card
**Verdict:** PASS  
**File:** `apps/backend/app/runtime/cards_logic.py` lines 280–286  

Backend returns: `{"session": ..., "first_card": ...}` (snake_case)  
Frontend reads: `res.data.first_card` (line 136 in `cards.ts`) — matches.

### F-CARD-10: No Rate Limiting Enforcement on Adaptive Endpoints
**Verdict:** WARN  
**Severity:** Low  
**File:** `apps/backend/app/routers/v1_cards.py`  

Config defines `card_adaptive_start_limit`, `card_answer_limit` etc. but these are not enforced in the route handlers. Rate limiting is declared in config but never applied.

---

## Summary Table

| Finding | Verdict | Severity |
|---------|---------|----------|
| F-CARD-01: KeyError 'prompt' in load_runtime_bank | FAIL | Critical |
| F-CARD-02: Only practice/data/cards loaded, not published | WARN | High |
| F-CARD-03: Doctor/nurse cards have no English translation | FAIL | Critical |
| F-CARD-04: completion cards lose full_sentence | WARN | Medium |
| F-CARD-05: LRU cache — hot reload risk | WARN | Medium |
| F-CARD-06: Adaptive ranking logic | PASS | — |
| F-CARD-07: Grammar/phrase mode → 404 (content_type mismatch) | FAIL | Medium |
| F-CARD-08: answer_card field names | PASS | — |
| F-CARD-09: start_cards_session shape | PASS | — |
| F-CARD-10: Rate limiting not enforced | WARN | Low |
