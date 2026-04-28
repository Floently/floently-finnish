# Nurse Profession Flow Audit

**Scope:** Nurse card loading, nurse roleplay, entitlement checks, content quality  
**Inspected:** 2026-04-19

---

## Card Flow Trace: Nurse

### Step 1 — Frontend Initiates Session

```typescript
// GET /cards/session/adaptive/start?domain=professional&content_type=vocabulary_card&profession=nurse
```

Frontend profession value: `"nurse"` (from `CardProfession` type).

### Step 2 — Material Bank Loading

Source file: `apps/backend/practice/data/cards/nurse_cards.json`

```python
raw_profession = "nurse_cards".replace("_cards", "").lower()  # = "nurse"
profession = _PROFESSION_ALIASES.get("nurse", "nurse")  # = "nurse" (not in aliases)
```

Cards stored with `path='professional'`, `profession='nurse'`.

**Total nurse cards:** 7,551

### Step 3 — Filtering

```python
# domain == "professional" → card["path"] == "professional" → PASS ✓
# content_type == "vocabulary_card" → card["content_type"] == "vocabulary_card" → PASS ✓
# profession == "nurse" → card["profession"] == "nurse" → PASS ✓
```

**Result:** All 7,551 nurse cards pass the filter.

### Step 4 — Sample Card

```json
{
  "type": "recognition",
  "question": "Mikä sana tämä on?",
  "prompt": "lääkäri",
  "options": ["palkkiomalli", "toteaminen", "hoivakoti", "lääkäri"],
  "answer": "lääkäri"
}
```

Materialized:
- `front_text = "lääkäri"` (Finnish: "doctor")
- `back_prompt = "lääkäri"` (same Finnish word — no English translation)

---

## Nurse Content Quality Assessment

**Source file:** `apps/backend/practice/data/cards/nurse_cards.json`  
**Total cards:** 7,551  

Interestingly, nurse cards include the word `"lääkäri"` (doctor) as a prompt — meaning nurse cards contain doctor-specific vocabulary. This suggests the nurse card file was generated from a shared medical vocabulary database rather than nurse-specific workplace language.

**Type distribution (same as doctor):**
- `recognition` — MCQ with Finnish options, Finnish question
- `recall` — type Finnish word
- `reverse` — Finnish context question, Finnish answer
- `completion` — fill-in Finnish sentence

**Quality verdict: FAIL**  
Same issues as doctor: no English translations, Finnish-to-Finnish pairs.

**Published nurse materials exist and are NOT used:**  
`apps/backend/materials/cards/published/professional/nurse/`:
- `words/a1_a2.json`, `words/b1_b2.json`
- `phrases/a1_a2.json`, `phrases/b1_b2.json`, `phrases/c1_c2.json`
- `grammar/a1_a2.json`, `grammar/b1_b2.json`, `grammar/c1_c2.json`

Note: Nurse has a `phrases/c1_c2.json` which doctor lacks. Nurse is also missing `words/c1_c2.json` (present for doctor but not nurse in `published/`).

---

## Roleplay Flow Trace: Nurse

### Scenarios

`_SCENARIOS["nurse"]` = `[{"scenarioId": "nurse_shift_handover", "title": "Shift handover", "personaName": "Senior Nurse", "track": "healthcare"}]`

This is slightly more appropriate than doctor — shift handover is a real nurse scenario.

### Replies

Same 5 hardcoded appointment-booking replies as doctor. A nurse doing shift handover gets:
1. "What do you want to book an appointment for?"

This is completely wrong for a shift handover scenario.

---

## Nurse Flow Summary

| Step | Status | Issue |
|------|--------|-------|
| Frontend sends profession="nurse" | PASS | Correct string |
| Backend alias lookup | PASS | No alias needed |
| Card file found | PASS | nurse_cards.json exists |
| Cards filter | PASS | All filters match |
| Card content quality | FAIL | No English translations |
| Content domain relevance | WARN | Contains doctor vocabulary |
| Roleplay scenarios | WARN | Only 1 scenario |
| Roleplay replies | FAIL | Appointment-booking for shift handover |
| Roleplay finish report | FAIL | Empty feedback |
| Entitlement check | FAIL | Missing |
| Published materials | FAIL | Unused |

---

## Comparison: Nurse vs Doctor Cards

| Metric | Doctor | Nurse |
|--------|--------|-------|
| Total cards | 11,507 | 7,551 |
| Has English translations | No | No |
| Published materials | 8 files | 8 files |
| Published materials used | No | No |
| Roleplay scenario relevance | Low | Medium |
| Missing published files | None | words/c1_c2 |
