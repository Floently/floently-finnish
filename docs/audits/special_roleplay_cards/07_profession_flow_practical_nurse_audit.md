# Practical Nurse Profession Flow Audit

**Scope:** Practical nurse card loading (lahioitaja), roleplay, alias mapping, content quality  
**Inspected:** 2026-04-19

---

## Critical Path: The Alias Issue

This profession has a CONFIRMED alias mapping issue. The file is named `lahioitaja_cards.json` (missing the ä/ö characters — ASCII-stripped version of "lähihoitaja").

### Alias Map in Backend

File: `apps/backend/app/runtime/cards_material_bank.py` lines 14–17

```python
_PROFESSION_ALIASES: dict[str, str] = {
    "lahioitaja": "practical_nurse",   # ✓ matches the stem
    "lähihoitaja": "practical_nurse",  # ✓ unicode version
}
```

### Loading Step

```python
raw_profession = "lahioitaja_cards".replace("_cards", "").lower()  # = "lahioitaja"
profession = _PROFESSION_ALIASES.get("lahioitaja", "lahioitaja")   # = "practical_nurse"
```

**Result:** Cards from `lahioitaja_cards.json` ARE correctly mapped to `profession='practical_nurse'`.

### Frontend Profession String

From `packages/core/api/roleplay.ts` line 4: `type RoleplayProfession = 'general' | 'nurse' | 'doctor' | 'practical_nurse'`

Frontend sends `profession="practical_nurse"` which matches the aliased backend value. ✓

---

## Card Flow Trace: Practical Nurse

### Step 1 — Frontend Initiates Session

```typescript
// GET /cards/session/adaptive/start?domain=professional&content_type=vocabulary_card&profession=practical_nurse
```

### Step 2 — Material Bank Loading

Source file: `apps/backend/practice/data/cards/lahioitaja_cards.json`

- `raw_profession = "lahioitaja"` → alias → `profession = "practical_nurse"` ✓
- All cards stored with `path='professional'`, `profession='practical_nurse'`
- Total: **9,784 cards**

### Step 3 — Filtering

```python
# domain == "professional" → PASS ✓
# content_type == "vocabulary_card" → PASS ✓
# profession == "practical_nurse" → card["profession"] == "practical_nurse" → PASS ✓
```

**Result:** All 9,784 practical nurse cards pass the filter.

### Step 4 — Sample Card

```json
{"type": "recognition", "question": "Mikä sana tämä on?", "prompt": "...", 
 "options": [...], "answer": "..."}
```

Same structure as doctor/nurse — same quality issues (Finnish-to-Finnish).

---

## "Don't Look Correct" Investigation

The user reported that practical nurse cards "don't look correct." Based on the audit, the specific issues are:

1. **Finnish-to-Finnish pairs** — same as doctor/nurse. But practical nurse specifically covers care work terminology (hygiene routines, mobility support, daily care). These words SHOULD be Finnish medical/care terms. The issue is there's no English gloss.

2. **File name mismatch** — the file is `lahioitaja_cards.json` (ASCII-stripped Finnish, missing ä). The display name shown in UI would derive from `profession='practical_nurse'`, which is correct. So the UI label "Practical Nurse" is correct. However, if anyone inspects the raw data, the filename looks wrong.

3. **Content domain overlap** — practical nurse cards likely share significant vocabulary with nurse cards (both cover care work). Without English translations, this overlap is hidden from learners.

4. **Missing words/a1_a2 in published materials** — `apps/backend/materials/cards/published/professional/practical_nurse/words/` only has `b1_b2.json`. No A1/A2 words file. This is a content gap (though these published files aren't loaded anyway).

---

## Practical Nurse Content Quality Assessment

**Source file:** `apps/backend/practice/data/cards/lahioitaja_cards.json`  
**Total cards:** 9,784  

**Published practical nurse materials exist but are NOT used:**  
`apps/backend/materials/cards/published/professional/practical_nurse/`:
- `grammar/a1_a2.json`, `grammar/b1_b2.json`, `grammar/c1_c2.json`
- `words/b1_b2.json` (only — NO a1_a2 or c1_c2)
- `phrases/a1_a2.json`, `phrases/b1_b2.json`

**Gap:** Missing `words/a1_a2.json` for practical nurse in published materials. Doctor has it, nurse has it (as `a1_a2.json` in their `words/` dirs). This is a content authoring gap.

**Quality verdict: FAIL** — same bilingual issue as doctor/nurse.

---

## Roleplay Flow Trace: Practical Nurse

### Scenarios

`_SCENARIOS["practical_nurse"]` = `[{"scenarioId": "practical_nurse_daily_care", "title": "Daily care update", "personaName": "Supervisor", "track": "healthcare"}]`

"Daily care update" is an appropriate scenario for a practical nurse.

### Replies

Same 5 hardcoded appointment-booking replies. A practical nurse updating their supervisor on daily care gets appointment-booking responses. This is contextually wrong.

---

## Practical Nurse Flow Summary

| Step | Status | Issue |
|------|--------|-------|
| Frontend sends profession="practical_nurse" | PASS | Correct string |
| Backend alias ("lahioitaja" → "practical_nurse") | PASS | Alias works correctly |
| Card file found | PASS | lahioitaja_cards.json exists |
| Cards filter | PASS | All filters match |
| Card content quality | FAIL | No English translations |
| File naming ("lahioitaja" vs "lähihoitaja") | WARN | ASCII-stripped but alias handles it |
| Published words/a1_a2 | FAIL | Missing in published materials |
| Roleplay scenario | PASS | Daily care is appropriate |
| Roleplay replies | FAIL | Appointment-booking for care update |
| Roleplay finish report | FAIL | Empty feedback |
| Entitlement check | FAIL | Missing |
| Published materials used | FAIL | Unused |

---

## Comparison: All Three Professions

| Metric | Doctor | Nurse | Practical Nurse |
|--------|--------|-------|-----------------|
| Practice cards | 11,507 | 7,551 | 9,784 |
| English translations | No | No | No |
| Alias needed | No | No | Yes (lahioitaja → practical_nurse) |
| Alias works | N/A | N/A | Yes |
| Published words/a1_a2 | Yes | Yes | Missing |
| Published materials used | No | No | No |
| Roleplay scenario relevance | Low | Medium | High |
| Roleplay reply relevance | Low | Low | Low |
