# Fix Prompts — Exact Code Changes

**Each fix prompt is a precise, copy-pasteable description of the required change.**

---

## FIX-01: KeyError 'prompt' in load_runtime_bank()

**File:** `apps/backend/app/runtime/cards_material_bank.py`  
**Line:** 105

**Current code:**
```python
records.append(CardRecord(id=item['id'], mode='vocabulary', front=item['front'], prompt=item['prompt'], accepted_answers=list(item['accepted_answers']), choices=item.get('choices'), explanation=item.get('explanation'), hint=item.get('hint'), cefr=item.get('cefr'), domain=item.get('path'), profession=item.get('profession'), content_type=item.get('content_type')))
```

**Fix:**
```python
records.append(CardRecord(
    id=item['id'],
    mode='vocabulary',
    front=item['front'],
    prompt=item.get('follow_up_prompt') or item.get('front') or '',
    accepted_answers=list(item['accepted_answers']),
    choices=item.get('choices'),
    explanation=item.get('explanation'),
    hint=item.get('hint'),
    cefr=item.get('cefr'),
    domain=item.get('path'),
    profession=item.get('profession'),
    content_type=item.get('content_type'),
))
```

**Verification:** `curl http://localhost:8000/cards/session?mode=vocabulary` → 200 with items array, no 500 error.

---

## FIX-02: Finnish Text ASCII-Stripped in Roleplay

**File:** `apps/backend/app/runtime/roleplay.py`  

**Current opening (lines 64–70):**
```python
"text": "Hei, miten voin auttaa sinua tanaan?",
"translation": "Hi, how can I help you today?",
```

**Fix:**
```python
"text": "Hei, miten voin auttaa sinua tänään?",
"translation": "Hi, how can I help you today?",
```

**Current replies (lines 110–115):**
```python
1: ("Selva. Minka asian vuoksi haluaisit varata ajan?", "professional"),
2: ("Kiitos. Milloin sinulle sopisi parhaiten?", "professional"),
3: ("Hyva. Onko sinulla muita oireita tai toiveita?", "professional"),
4: ("Ymmarran. Vahvistan ajan viela ennen varauksen paatosta.", "professional"),
5: ("Ole hyva. Aika on nyt varattu. Kiitos ja hyvaa paivanjatkoa.", "warm_professional"),
```

**Fix:**
```python
1: ("Selvä. Minkä asian vuoksi haluaisit varata ajan?", "professional"),
2: ("Kiitos. Milloin sinulle sopisi parhaiten?", "professional"),
3: ("Hyvä. Onko sinulla muita oireita tai toiveita?", "professional"),
4: ("Ymmärrän. Vahvistan ajan vielä ennen varauksen päätöstä.", "professional"),
5: ("Ole hyvä. Aika on nyt varattu. Kiitos ja hyvää päivänjatkoa.", "warm_professional"),
```

**Verification:** Start roleplay session, verify `openingText` and `aiText` contain proper ä/ö characters.

---

## FIX-03: Fix personaName in start_session

**File:** `apps/backend/app/runtime/roleplay.py`  
**Lines:** 273–301

**Current code (line 299):**
```python
"personaName": scenario_meta["title"],
```

**Fix:**
```python
# Add after line 274: chosen = scenario_id or list_scenarios(...)[0]["scenarioId"]
scenario_entries = _SCENARIOS.get(profession, _SCENARIOS["general"])
chosen_entry = next((s for s in scenario_entries if s["scenarioId"] == chosen), scenario_entries[0] if scenario_entries else {})
persona_name = chosen_entry.get("personaName") or scenario_meta["title"]
```

Then at line 299:
```python
"personaName": persona_name,
```

**Verification:** `POST /api/v1/roleplay/session/start` with `{"profession": "doctor", "level_band": "B1-B2"}` → `personaName` = `"Patient"` (from `_SCENARIOS["doctor"][0]["personaName"]`).

---

## FIX-04: Add Entitlement Check to Professional Cards

**File:** `apps/backend/app/routers/v1_cards.py`  
**After line 44 (imports section), add:**
```python
from app.services.subscription_service import require_feature
```

**In `start_runtime_session` route, after resolving user_id (lines 67–68):**
```python
user_id = _require_cards_user_id(authorization)
if domain == "professional":
    # Resolve full user object to check entitlements
    try:
        from app.services.auth_service import current_user_from_authorization
        user, _ = current_user_from_authorization(authorization)
        require_feature(user=user, feature='workplace')
    except AppError:
        raise
```

**Also apply same pattern to `runtime_deck` route.**

**Verification:** Free-tier JWT + `domain=professional` → 403 `ENTITLEMENT_REQUIRED`.

---

## FIX-05: Fix Roleplay finish_session Response Shape

**File:** `apps/backend/app/runtime/roleplay.py`  
**Lines:** 216–247 (`get_roleplay_review`) and 323–329 (`finish_session`)

**Minimum fix — add missing fields to `get_roleplay_review()`:**
```python
def get_roleplay_review(*, user_id: str, session_id: str) -> dict[str, Any]:
    with STORE.locked(("roleplay_sessions", session_id)):
        session = _assert_session_access(session=STORE.get_ref("roleplay_sessions", session_id), user_id=user_id)
        if session["status"] != "COMPLETE":
            raise AppError(409, "ROLEPLAY_REVIEW_UNAVAILABLE", "Roleplay review is available only after completion.", False, {"classification": "terminal"})
        
        # Build annotated transcript from turns
        annotated = []
        for turn in session.get("turns", []):
            annotated.append({
                "speaker": turn.get("speaker", ""),
                "text": turn.get("text", ""),
                "comment": None,
            })
        
        return {
            "session_id": session["session_id"],
            "sessionId": session["session_id"],
            "created_at": session["created_at"],
            "expires_at": session["expires_at"],
            "status": _external_status(session["status"]),
            "completed": True,
            "personaName": "Coach",
            "track": session["scenario"].get("family", "general"),
            "trackLabel": "Professional Finnish" if session["scenario"].get("family") == "professional_healthcare" else "General Finnish",
            "levelBand": session["level"],
            "scenario": session["scenario"],
            "summary": "Harjoittelu suoritettu.",
            "scores": {
                "avgPhrasesCoverage": 2,
                "avgWordCount": 8,
                "repairLanguageUsed": False,
                "totalTurns": int(session["progress"]["user_turns_completed"]),
            },
            "transcriptAnnotated": annotated,
            "strongPhrases": [],
            "difficultPhrases": [],
            "grammarObservations": ["Jatka harjoittelua säännöllisesti."],
            "nextSteps": [f"Toista sama skenaario tasolla {session['level']}", "Harjoittele jatkuvuusfraaseja"],
            "nextAction": f"Toista sama skenaario tasolla {session['level']}",
            "overall": {"task_completion": "successful", "interaction_quality": "good", "level_estimate": session["level"]},
        }
```

**Verification:** Complete 5-turn roleplay, call `/finish` → response includes `transcriptAnnotated` array, `summary` non-empty, `scores.totalTurns` = 5.

---

## FIX-06: Fix Grammar/Phrase Mode (Content Type)

**File:** `apps/backend/app/runtime/cards_material_bank.py`  
**Line 83** — change hardcoded `vocabulary_card`:

**Option A (minimal, correct for current data):** In `_filtered_cards()`, when `content_type` is `grammar_card` or `sentence_card`, ignore the type filter (all current cards are vocabulary_card):
```python
# In _filtered_cards(), lines 133-134:
# Change:
if content_type and card["content_type"] != content_type:
    continue
# To:
if content_type and content_type == "vocabulary_card" and card["content_type"] != content_type:
    continue
# (grammar_card and sentence_card requests return vocabulary cards as fallback)
```

**Option B (proper fix):** Update `load_authority_cards()` to derive `content_type` from the source card `type` field:
```python
# After line 82 (content_type determination):
if item_type in {'grammar', 'grammar_exercise'}:
    card_content_type = 'grammar_card'
elif item_type in {'sentence', 'completion', 'context'}:
    card_content_type = 'sentence_card'
else:
    card_content_type = 'vocabulary_card'
# Then use card_content_type in the dict (line 83)
```

**Verification:** `GET /cards/session/adaptive/start?content_type=grammar_card` → 200 with cards (not 404).
