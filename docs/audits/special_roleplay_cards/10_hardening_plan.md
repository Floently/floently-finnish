# Hardening Plan

**Priority order:** Critical → High → Medium → Low  
**Each item includes:** Owner, file, change type, effort estimate

---

## CRITICAL — Must fix before release

### H-01: Fix load_runtime_bank() KeyError

**Owner:** Backend  
**File:** `apps/backend/app/runtime/cards_material_bank.py` line 105  
**Change:** Replace `item['prompt']` with `item.get('follow_up_prompt') or item.get('front') or ''`  
**Effort:** 5 minutes  
**Test:** `GET /cards/session?mode=vocabulary` returns 200 with items

### H-02: Fix Doctor/Nurse/Practical_Nurse Card Content (Add English Translations)

**Owner:** Content  
**Files:** `apps/backend/practice/data/cards/doctor_cards.json`, `nurse_cards.json`, `lahioitaja_cards.json`  
**Change:** Add `"english"` or `"translation"` field to each card item, or regenerate from bilingual source. Alternatively, switch the runtime to load from `materials/cards/published/` which has proper bilingual content (pending verifying that published files have English glosses).  
**Effort:** Large (content work) or Medium (if switching to published materials)  
**Priority:** Critical for product value, even if not a code crash

### H-03: Configure TTS Provider in Production

**Owner:** Infra  
**Files:** `.env` on production server  
**Change:** Set `OPENAI_API_KEY` (and/or `GOOGLE_TTS_CREDENTIALS_PATH`) in production environment  
**Effort:** Ops task, minutes once credentials are available  
**Test:** `GET /api/v1/voice/tts/health` shows `providers.openai: "ok"` or `providers.google: "ok"`

### H-04: Fix Roleplay finish_session Response Shape

**Owner:** Backend  
**File:** `apps/backend/app/runtime/roleplay.py` lines 216–247  
**Change:** Update `get_roleplay_review()` to return fields matching `RoleplayFinishResponse`: `summary`, `transcriptAnnotated`, `strongPhrases`, `difficultPhrases`, `grammarObservations`, `nextSteps`, `nextAction`, `personaName`, `track`, `trackLabel`, `levelBand`, `scenario`  
**Effort:** 2 hours (even static/placeholder values are better than missing fields)  
**Test:** Complete a roleplay session, call finish — feedback report shows populated data

---

## HIGH — Fix before public launch

### H-05: Add Entitlement Check on Professional Cards Endpoint

**Owner:** Backend  
**File:** `apps/backend/app/routers/v1_cards.py` lines 58–75  
**Change:** After `_require_cards_user_id()`, when `domain == "professional"`, call `require_feature(user=user, feature='workplace')`. Requires loading the user object from auth token.  
**Effort:** 1 hour  
**Test:** Free user token + professional domain request → 403 ENTITLEMENT_REQUIRED

### H-06: Add Entitlement Check on Roleplay Session Start

**Owner:** Backend  
**File:** `apps/backend/app/routers/v1_roleplay.py` lines 63–79  
**Change:** Add optional auth header, resolve user, check `require_feature` for non-"general" professions  
**Effort:** 1 hour  
**Test:** Free user token + profession=doctor → 403

### H-07: Fix Grammar/Phrase Mode (Content Type Mismatch)

**Owner:** Backend  
**File:** `apps/backend/app/runtime/cards_material_bank.py` line 83  
**Change:** Derive `content_type` from card data (type field in source JSON) rather than hardcoding `'vocabulary_card'`. OR: populate grammar and phrase cards from appropriate source files.  
**Effort:** 2 hours  
**Test:** `GET /cards/session/adaptive/start?content_type=grammar_card` returns cards

### H-08: Fix Roleplay Finnish Text (Add Proper Unicode Characters)

**Owner:** Backend  
**File:** `apps/backend/app/runtime/roleplay.py` lines 63–70, 108–116  
**Change:** Replace ASCII-stripped text with proper Finnish: `"tanaan"` → `"tänään"`, `"Selva"` → `"Selvä"`, `"Minka"` → `"Minkä"`, `"Hyva"` → `"Hyvä"`, `"Ymmarran"` → `"Ymmärrän"`  
**Effort:** 5 minutes  
**Test:** Start roleplay session, verify opening text has proper ä/ö characters in TTS output

### H-09: Fix personaName in start_session

**Owner:** Backend  
**File:** `apps/backend/app/runtime/roleplay.py` line 299  
**Change:** Use the actual persona name from `_SCENARIOS` rather than `scenario_meta["title"]`:
```python
scenario_entry = next((s for s in _SCENARIOS.get(profession, []) if s["scenarioId"] == chosen), {})
persona_name = scenario_entry.get("personaName") or scenario_meta["title"]
"personaName": persona_name,
```  
**Effort:** 15 minutes  
**Test:** Start doctor session — `personaName` should be `"Patient"` not `"Doctor Patient Consult"`

### H-10: Add Profession-Specific Roleplay Replies

**Owner:** Backend / Product  
**File:** `apps/backend/app/runtime/roleplay.py` lines 108–116  
**Change:** Replace hardcoded generic replies with profession-specific and scenario-specific reply sets. Or integrate an LLM for dynamic responses.  
**Effort:** Large (content work for static, ML/API work for dynamic)  
**Note:** This is the #1 product quality issue with roleplay

---

## MEDIUM — Fix soon after launch

### H-11: Switch Card Runtime to Load from materials/cards/published/

**Owner:** Backend  
**Files:** `apps/backend/app/runtime/cards_material_bank.py` lines 11–12  
**Change:** Update `CARDS_DIR` to read from `MATERIALS_DIR / "cards" / "published"` and update the loading logic to handle the nested directory structure and different schema (content.front.term, content.back.gloss, follow_ups, etc.)  
**Effort:** 4 hours  
**Value:** High — published materials have proper bilingual content, quality scores, IDs

### H-12: Add STORE Cleanup for Expired Sessions

**Owner:** Backend  
**File:** `apps/backend/app/runtime/roleplay.py` or a maintenance task  
**Change:** Periodic cleanup of sessions where `expires_at < utc_now()` from the STORE  
**Effort:** 1 hour

### H-13: Add Rate Limiting to TTS Endpoint

**Owner:** Backend  
**File:** `apps/backend/app/routers/v1_voice.py` line 54  
**Change:** Add auth requirement or rate limiting to `POST /api/v1/voice/tts/requests`  
**Effort:** 1 hour

### H-14: Add Practical Nurse words/a1_a2 Published Cards

**Owner:** Content  
**Files:** `apps/backend/materials/cards/published/professional/practical_nurse/words/`  
**Change:** Create `a1_a2.json` with A1-A2 level practical nurse vocabulary cards (bilingual)  
**Effort:** Content authoring

---

## LOW — Can defer

### H-15: Document Process Restart Required for Content Updates

**Owner:** Backend / Ops  
**Change:** Add comment to `load_authority_cards()` and deployment docs noting LRU cache requires restart

### H-16: Add Backend professions[] Field to Subscription Status

**Owner:** Backend  
**File:** `apps/backend/app/services/subscription_service.py`  
**Change:** Add `professions` list to `subscription_status()` response so frontend doesn't need to derive it from tier string  
**Effort:** 30 minutes

### H-17: Add Roleplay v2 Session Ownership Auth

**Owner:** Backend  
**File:** `apps/backend/app/routers/v1_roleplay.py`  
**Change:** Accept optional auth token in v2 routes, use actual user_id if provided, fall back to "preview" for unauthenticated access  
**Effort:** 1 hour
