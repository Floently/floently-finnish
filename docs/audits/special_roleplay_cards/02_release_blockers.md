# Release Blockers

**Audit date:** 2026-04-19

---

## BLOCKER-001 — load_runtime_bank() KeyError: 'prompt'

**Verdict:** FAIL  
**Severity:** Critical  
**Deployment impact:** Blocks  
**Owner:** Backend  

**File:** `apps/backend/app/runtime/cards_material_bank.py` line 105  

**Evidence:**
```python
# Line 105:
records.append(CardRecord(id=item['id'], mode='vocabulary', front=item['front'], 
    prompt=item['prompt'],  # <-- KeyError: dict has no 'prompt' key
    accepted_answers=list(item['accepted_answers']), ...))
```

The dict built by `load_authority_cards()` (lines 79–96) contains these keys:
`id, path, profession, content_type, level_band, front, back, variant_type, follow_up_prompt, blank_template, accepted_answers, choices, explanation, hint, cefr, _source_path`

There is NO `'prompt'` key. The key is `'follow_up_prompt'`.

**Impact:** Any call to `load_runtime_bank()` raises `KeyError: 'prompt'`. This breaks the legacy `/cards/session` endpoint (`GET /cards/session?mode=vocabulary`). The new adaptive endpoints call `load_authority_cards()` directly via `_filtered_cards()` so they are unaffected. However, `cardsService.get_session()` in the service layer calls `load_runtime_bank()`, and the `CardRecord` dataclass has a required `prompt: str` field.

**Remediation:**
```python
# Line 105 fix:
records.append(CardRecord(
    id=item['id'],
    mode='vocabulary',
    front=item['front'],
    prompt=item.get('follow_up_prompt') or item.get('front') or '',  # FIXED
    accepted_answers=list(item['accepted_answers']),
    ...
))
```

**Verification:** Call `GET /cards/session?mode=vocabulary` — should return items without 500 error.

---

## BLOCKER-002 — Doctor/Nurse Card Content: Front=Finnish, Back=Finnish (No English Gloss)

**Verdict:** FAIL  
**Severity:** Critical  
**Deployment impact:** Blocks  
**Owner:** Content  

**File:** `apps/backend/practice/data/cards/doctor_cards.json`  

**Evidence:**
```json
{
  "type": "recognition",
  "question": "Mikä sana tämä on?",
  "prompt": "potilas",
  "options": ["potilas", "palkkio", "suolisto", "keuhka"],
  "answer": "potilas"
}
```

In `load_authority_cards()` line 69:
```python
front = _normalized_text(item.get('prompt') or item.get('front') or ...)
back = _normalized_text(item.get('back') or item.get('answer') or ...)
```

For this card: `front = "potilas"`, `back = "potilas"` (same value). The card presents a Finnish word on front and expects the same Finnish word as the answer. For MCQ recognition cards, `front = item.get('question')` = `"Mikä sana tämä on?"` which is a generic question. The `accepted_answers` = `["potilas"]`. This is Finnish-to-Finnish — not Finnish-to-English, which is what a language learner needs.

Same pattern applies to all 11,507 doctor cards and 7,551 nurse cards.

**Impact:** All professional cards are effectively "Finnish word → same Finnish word" flashcards with no translation. Learners cannot use them for vocabulary acquisition.

**Remediation:** Content team must add English gloss to all cards. At minimum, the `answer` field should be the English translation. The `prompt` field should show the Finnish term, and `answer` should show the English translation (or vice versa depending on direction). Cards should be regenerated or patched with bilingual content.

**Verification:** Spot-check 20 cards from doctor_cards.json — at least 18 should show Finnish front / English back.

---

## BLOCKER-003 — TTS Provider Not Configured → Silent Failure in Production

**Verdict:** FAIL (contingent on credentials)  
**Severity:** Critical  
**Deployment impact:** Blocks TTS feature  
**Owner:** Infra  

**File:** `apps/backend/app/services/tts/runtime.py` lines 149–180, `apps/backend/app/core/config.py` lines 151–165  

**Evidence:**
```python
# config.py:
tts_default_provider: str = "google"
tts_fallback_provider: str = "openai"
google_tts_credentials_path: str | None = None  # if not set
openai_api_key: str = ""  # if OPENAI_API_KEY not in env
```

`_pick_provider_and_voice()` in `runtime.py`:
- Tries `google` first: `GoogleTTSProvider.configured()` returns `bool(settings.google_tts_enabled and settings.google_tts_credentials_path)`. If no credentials path → `False`
- Tries `openai`: `OpenAIProvider.configured()` returns `bool(self.settings.openai_api_key)`. If no key → `False`
- Falls through to `(None, None)`
- `resolve_tts_audio()` raises `TTSRouterError('No TTS provider is configured')`
- Voice service raises `AppError(503, "VOICE_TTS_UNAVAILABLE")`
- Frontend `requestRoleplayTts()` catches exception, returns `null`
- `speakRoleplayText()`: `audio?.url` is null → calls `onUnavailable()` → sets `remoteAudioAvailable = false` → displays "TTS ei saatavilla" warning

**Impact:** Roleplay TTS is completely silent. The screen shows a warning but no audio. Even if the code path is correct (which it mostly is after recent fixes), without credentials nothing plays.

**Additional note:** Even if credentials ARE present, the TTS URL `/voice/tts/audio/{cache_key}.mp3` is returned as a relative URL. The frontend calls `resolveApiUrl(audio.url)` which should prepend the base URL. Need to verify `resolveApiUrl` implementation but this is lower risk.

**Remediation:**
1. Set `OPENAI_API_KEY` in production `.env`
2. OR set `GOOGLE_TTS_CREDENTIALS_PATH` pointing to a valid service account JSON
3. Verify `TTS_DEFAULT_PROVIDER` is set to the available provider

**Verification:** Call `GET /api/v1/voice/tts/health` — `providers.openai` or `providers.google` must show `"ok"`. Then call `POST /api/v1/voice/tts/requests` with `{"text":"Hei","voice_preference":"female"}` — should return `audio.url`.

---

## BLOCKER-004 — Roleplay finish_session Returns Incompatible Shape

**Verdict:** FAIL  
**Severity:** High  
**Deployment impact:** Should fix before release  
**Owner:** Backend  

**File:** `apps/backend/app/runtime/roleplay.py` lines 323–329, `apps/backend/app/routers/v1_roleplay.py` lines 101–110  

**Evidence — backend returns:**
```python
# get_roleplay_review() returns:
{
  "session_id": ...,
  "overall": {"task_completion": "successful", "interaction_quality": "good", "level_estimate": ...},
  "scores": {"fluency": 74, "grammar": 68, "vocabulary": 71, "appropriateness": 79},
  "focus_points": [{"label": "...", "description": "..."}],
  "recommended_next_actions": ["Retry same scenario at B1_B2", "Practice follow-up phrases"]
}
```

**Frontend expects** (`packages/core/api/roleplay.ts` lines 51–76):
```typescript
type RoleplayFinishResponse = {
  sessionId: string;
  completed: boolean;
  personaName: string;
  track: RoleplayTrack;
  trackLabel: string;
  levelBand: string;
  scenario: RoleplayScenarioSummary;
  summary: string;
  scores: { avgPhrasesCoverage: number; avgWordCount: number; repairLanguageUsed: boolean; totalTurns: number; };
  transcriptAnnotated: Array<{speaker: string; text: string; comment: string | null;}>;
  strongPhrases: string[];
  difficultPhrases: string[];
  grammarObservations: string[];
  nextSteps: string[];
  nextAction: string;
};
```

**Missing from backend response:** `summary`, `transcriptAnnotated`, `strongPhrases`, `difficultPhrases`, `grammarObservations`, `nextSteps`, `nextAction`, `personaName`, `track`, `trackLabel`, `levelBand`, `scenario`.

**Frontend graceful degradation** (`RoleplayConversationScreen.tsx` line 274): checks `'transcriptAnnotated' in finished` — since it's missing, falls into the else branch and creates a degraded report. The `summary` will be `finished.summary ?? ''` = `''` (empty). The feedback report shows no useful information.

**Remediation:** Align the `finish_session()` return value with the expected shape, OR update the frontend to read from the actual fields the backend returns (`focus_points`, `recommended_next_actions`, `scores.fluency`, etc.).

**Verification:** Complete a 5-turn roleplay session, call `POST /api/v1/roleplay/session/{id}/finish` — response should include `transcriptAnnotated` array with turn data.

---

## BLOCKER-005 — No Entitlement Check on Professional Cards

**Verdict:** FAIL  
**Severity:** High  
**Deployment impact:** Should fix — business blocker  
**Owner:** Backend  

**File:** `apps/backend/app/routers/v1_cards.py` lines 58–75  

**Evidence:**
```python
@router.get("/session/adaptive/start")
def start_runtime_session(
    domain: str = Query("general"),
    content_type: str = Query("vocabulary_card"),
    profession: str | None = Query(default=None),
    ...
    authorization: str | None = Header(default=None),
):
    return cards_service.start_runtime_session(
        user_id=_require_cards_user_id(authorization),
        ...
    )
```

`_require_cards_user_id()` only checks that the user is authenticated (not anonymous). There is NO call to `require_feature(user=user, feature='workplace')` or any profession-specific entitlement check. Any authenticated user can request doctor/nurse cards regardless of subscription.

`subscription_service.py` defines `require_feature()` which checks the `workplace` feature — this is what should be called for professional card access. The subscription tiers DO have this logic (`"workplace": {"available": False}` for `general_premium`), but it is never enforced at the cards endpoint.

**Remediation:** In `v1_cards.py`, when `domain == "professional"`, call `require_feature(user=user, feature='workplace')` after resolving the user.

**Verification:** Attempt to access doctor cards with a free-tier token → should receive 403 ENTITLEMENT_REQUIRED.
