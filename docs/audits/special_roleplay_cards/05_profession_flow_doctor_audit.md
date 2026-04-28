# Doctor Profession Flow Audit

**Scope:** Doctor card loading, doctor roleplay, entitlement checks, content quality  
**Inspected:** 2026-04-19

---

## Card Flow Trace: Doctor

### Step 1 — Frontend Initiates Session

File: `apps/client/features/cards/services/cardsService.ts` + `packages/core/api/cards.ts`

```typescript
// cardsService.start('vocabulary', { domain: 'professional', profession: 'doctor', ... })
// → startCardSession({ domain: 'professional', content_type: 'vocabulary_card', profession: 'doctor' })
// → GET /cards/session/adaptive/start?domain=professional&content_type=vocabulary_card&profession=doctor
```

Frontend profession value sent: `"doctor"` (string literal from `CardProfession` type).

### Step 2 — Router Receives Request

File: `apps/backend/app/routers/v1_cards.py` lines 58–75

```python
@router.get("/session/adaptive/start")
def start_runtime_session(
    domain: str = Query("general"),
    content_type: str = Query("vocabulary_card"),
    profession: str | None = Query(default=None),
    ...
):
    return cards_service.start_runtime_session(
        user_id=_require_cards_user_id(authorization),
        domain="professional",
        content_type="vocabulary_card",
        profession="doctor",
        ...
    )
```

**AUTH CHECK:** `_require_cards_user_id()` → requires non-anonymous auth. ✓  
**ENTITLEMENT CHECK:** None. Any authenticated user can request doctor cards. ✗ (BLOCKER-005)

### Step 3 — Material Bank Loading

File: `apps/backend/app/runtime/cards_material_bank.py` lines 43–99

`_source_files()` returns sorted glob of `apps/backend/practice/data/cards/*.json`:
- `doctor_cards.json`
- `lahioitaja_cards.json`
- `nurse_cards.json`

For `doctor_cards.json`:
- `raw_profession = "doctor_cards".replace("_cards", "").lower()` = `"doctor"`
- `profession = _PROFESSION_ALIASES.get("doctor", "doctor")` = `"doctor"` (not in aliases)
- All items stored with `path='professional'`, `profession='doctor'`

### Step 4 — Filtering

File: `apps/backend/app/runtime/cards_logic.py` lines 122–144

```python
# domain = "professional" → check card["path"] == "professional" → PASS ✓
# content_type = "vocabulary_card" → check card["content_type"] == "vocabulary_card" → PASS ✓  
# profession = "doctor" → check card["profession"] == "doctor" → PASS ✓
```

**Result:** All 11,507 doctor cards from `doctor_cards.json` pass the filter.

### Step 5 — Card Materialization

Sample card materialized:
```json
{
  "id": "doctor_0",
  "front_text": "potilas",
  "back_prompt": "potilas",
  "served_follow_up": {
    "variant_type": "recognition_mcq",
    "prompt": "Mikä sana tämä on?",
    "options": [
      {"option_id": "opt_0", "text": "potilas"},
      {"option_id": "opt_1", "text": "palkkio"},
      ...
    ],
    "blank_template": null,
    "context_text": null,
    "stimulus_text": null
  }
}
```

**CONFIRMED DEFECT:** `back_prompt = "potilas"` (Finnish word, not English translation). Learner submits "potilas" → correct. This provides no vocabulary acquisition value.

### Step 6 — Frontend Renders Card

File: `apps/client/features/cards/components/CardPracticeSession.tsx` line 179

```tsx
<Text style={[styles.mainWord, { color: cardTone }]}>{displayedCard.front_text}</Text>
```

Card shows `"potilas"` (Finnish word on front).

When flipped, shows follow-up with MCQ options from `served_follow_up.options` — all Finnish words. Learner selects "potilas" from options — correct.

**Result: Doctor cards load and display but provide no pedagogical value.**

---

## Roleplay Flow Trace: Doctor

### Step 1 — Session Start

Frontend sends: `{ profession: "doctor", level_band: "B1-B2" }`

Backend (`roleplay.py` line 266):
```python
def list_scenarios(*, profession: str = "general", level_band: str = "B1-B2"):
    items = list(_SCENARIOS.get(profession, _SCENARIOS["general"]))
```

`_SCENARIOS["doctor"]` = `[{"scenarioId": "doctor_patient_consult", "title": "Patient consultation", "personaName": "Patient", "track": "healthcare"}]`

Opening message: `"Hei, miten voin auttaa sinua tanaan?"` (ASCII-stripped, generic)

For a doctor scenario, the opening should be patient-presenting-symptoms, not "how can I help you today" (appointment booking).

### Step 2 — Turn Submission

All 5 turns return the same hardcoded replies regardless of what the doctor says:
1. "Selva. Minka asian vuoksi haluaisit varata ajan?"
2. "Kiitos. Milloin sinulle sopisi parhaiten?"
3. "Hyva. Onko sinulla muita oireita tai toiveita?"
4. "Ymmarran. Vahvistan ajan viela ennen varauksen paatosta."
5. "Ole hyva. Aika on nyt varattu."

These are appointment-booking phrases. For a doctor doing a patient consultation, these make no sense. A patient doesn't say "I'll confirm the appointment before making the decision."

### Step 3 — Finish Session

`finish_session()` checks if session status is "completed". If yes, calls `get_roleplay_review()` which returns fixed scores (fluency=74, grammar=68, etc.) regardless of actual performance. No `transcriptAnnotated` is returned.

---

## Doctor Content Quality Assessment

**Source file:** `apps/backend/practice/data/cards/doctor_cards.json`  
**Total cards:** 11,507  
**Type distribution:**
- `recognition` — MCQ showing Finnish word, asking "Mikä sana tämä on?" with Finnish options
- `recall` — type the Finnish word (both prompt and answer are same word)
- `reverse` — context question in Finnish with Finnish answer
- `completion` — fill-in blank in Finnish sentence

**Quality verdict: FAIL**  
- Zero English translations anywhere in the file
- `answer` field contains the same Finnish word as `prompt` — no bilingual pair
- The `options` for MCQ cards contain Finnish words, not English translations
- Medical domain coverage: cards do include medical Finnish vocabulary (potilas=patient, lääkäri=doctor, keuhka=lung, suolisto=intestine, etc.) — the lexical domain is correct, but the bilingual pairing is absent

**Published material exists and is NOT used:**  
`apps/backend/materials/cards/published/professional/doctor/` contains:
- `words/a1_a2.json`, `words/b1_b2.json`, `words/c1_c2.json`
- `phrases/a1_a2.json`, `phrases/b1_b2.json`  
- `grammar/a1_a2.json`, `grammar/b1_b2.json`, `grammar/c1_c2.json`

These files have proper content schema with `content.front.term`, `content.back.gloss` (English translation), `follow_ups` with `variant_type: "recognition_mcq"`, proper `option_id`s, `answer_key`, etc. They are never loaded by the runtime.

---

## Entitlement Check for Doctor

**Backend:** No entitlement check at `/cards/session/adaptive/start` or `/api/v1/roleplay/session/start` for doctor profession.

**Frontend:** `normalizeSubscriptionStatus()` derives doctor access from `subscription_tier`. If tier contains "doctor" or is "professional_premium", `professions` = `['doctor']` and `professionalAccess` = `true`. However, the frontend does not gate the card practice UI on subscription status — any authenticated user can navigate to the doctor card screen.

---

## Doctor Flow Summary

| Step | Status | Issue |
|------|--------|-------|
| Frontend sends profession="doctor" | PASS | Correct string |
| Backend alias lookup | PASS | No alias needed, "doctor" passes through |
| Card file found | PASS | doctor_cards.json exists |
| Cards filter | PASS | Domain, content_type, profession all match |
| Card content quality | FAIL | Front=Finnish, Back=Finnish, no English |
| Roleplay scenarios | WARN | Only 1 scenario |
| Roleplay replies | FAIL | Generic appointment-booking text |
| Roleplay finish report | FAIL | Empty feedback |
| Entitlement check | FAIL | Missing |
| Published materials | FAIL | Unused |
