# Cross-Flow Contracts and Entitlements Audit

**Scope:** Frontend/backend API contract analysis, field name consistency, entitlement enforcement  
**Inspected:** 2026-04-19

---

## Cards API Contract

### Start Session

**Backend returns** (`cards_logic.py` `start_cards_session()`):
```json
{
  "session": {
    "session_id": "cards_...",
    "status": "active",
    "current_card_index": 0,
    "total_cards": 10,
    "answered_count": 0,
    "created_at": "...",
    "updated_at": "..."
  },
  "first_card": {
    "id": "...",
    "state": "new",
    "front_text": "...",
    "back_prompt": "...",
    "seen_count": 0,
    "correct_rate": 0.0,
    "order_index": 0,
    "served_follow_up": { "variant_type": "...", "prompt": "...", "options": [...], ... },
    "content_type": "vocabulary_card",
    "level_band": "...",
    "path": "professional",
    "profession": "doctor",
    ...
  }
}
```

**Frontend reads** (`packages/core/api/cards.ts` line 132–139):
```typescript
session: res.data.session,         // ✓ matches
firstCard: requireCard(res.data.first_card, 'startCardSession')  // ✓ matches
```

**PASS** — shape is consistent.

### Answer Card

**Backend returns** (`cards_logic.py` `answer_card()`):
```json
{
  "correct": true,
  "is_correct": true,
  "correct_answer": { "value": "potilas", "option_id": "opt_0", "display_text": "potilas" },
  "accepted_variants": ["potilas"],
  "explanation": "Correct!",
  "next_recommended_action": "advance_session",
  "session_completed": false,
  "session": { ... },
  "next_card": { ... },
  "adaptive_update": { ... }
}
```

**Frontend reads** (`packages/core/api/cards.ts` lines 142–161):
```typescript
correct: res.data.correct,                       // ✓
explanation: res.data.explanation,               // ✓
correctAnswer: res.data.correct_answer?.value,   // ✓ correct_answer.value
acceptedVariants: res.data.accepted_variants,    // ✓
nextCard: mapCard(res.data.next_card),            // ✓
sessionCompleted: res.data.session_completed,    // ✓
```

**PASS** — all field names align.

### Deck Cards

**Backend returns** (`cards_logic.py` `list_cards()`):
```json
{
  "count": N,
  "cards": [{ "id": "...", "front_text": "...", "served_follow_up": {...}, ... }]
}
```

**Frontend reads** (`packages/core/api/cards.ts` line 183–185):
```typescript
const res = await apiClient.get<{ cards: BackendCard[] }>(`/cards/deck?...`);
return (res.data.cards ?? []).map(...)
```

**PASS** — `cards` array matches.

---

## Roleplay API Contract

### start_session

**Backend returns** (`roleplay.py` `start_session()`):
```json
{
  "sessionId": "rp_...",
  "session_id": "rp_...",
  "profession": "doctor",
  "levelBand": "B1-B2",
  "track": "professional",
  "scenarioId": "doctor_patient_consult",
  "scenario": {
    "id": "doctor_patient_consult",
    "title": "Doctor Patient Consult",
    "prompt": "Doctor Patient Consult",
    "keyPhrases": [],
    "grammarTip": "",
    "levelBand": "B1-B2",
    "profession": "doctor",
    "track": "professional"
  },
  "introText": "Harjoittelet suomea: Doctor Patient Consult.",
  "openingText": "Hei, miten voin auttaa sinua tanaan?",
  "voiceProfile": "female",
  "personaName": "Doctor Patient Consult",
  "maxUserTurns": 5
}
```

**Frontend reads** (`packages/core/api/roleplay.ts` `RoleplaySessionStart` type):
```typescript
sessionId: string;        // ✓
profession: ...;          // ✓
levelBand: ...;           // ✓
track: ...;               // ✓
scenario: { id, title, prompt, keyPhrases, grammarTip, levelBand, profession, track };  // ✓
introText: string;        // ✓
openingText: string;      // ✓
voiceProfile: string;     // ✓
personaName: string;      // ✓
maxUserTurns: number;     // ✓
```

**PASS** — all fields present. 

**Note:** `personaName` = `scenario_meta["title"]` = `"Doctor Patient Consult"` (the scenario title, not an actual person name). Should be the persona name from the scenario definition (e.g., `"Patient"` from `_SCENARIOS["doctor"][0]["personaName"]`). Backend uses `scenario_meta["title"]` instead of the actual `personaName` field.

**Evidence:**
```python
# roleplay.py line 297-299:
scenario_meta = _scenario_payload(chosen)  # only has scenario_id, family, title
"personaName": scenario_meta["title"],     # uses title, not _SCENARIOS persona name
```

The `_SCENARIOS["doctor"][0]` has `"personaName": "Patient"` but this is never returned to the frontend. `scenario_meta` comes from `_scenario_payload()` which only builds `{scenario_id, family, title}`.

### submit_turn

**Backend returns** (`roleplay.py` `submit_turn()`):
```json
{
  "sessionId": "rp_...",
  "session_id": "rp_...",
  "aiText": "Selva...",
  "aiReply": "Selva...",
  "voiceProfile": "female",
  "personaName": "Coach",
  "completed": false,
  "currentUserTurn": 1,
  "feedbackLine": null,
  "missingPhrases": []
}
```

**Frontend reads** (`RoleplayTurnResponse` type):
```typescript
aiText: string;         // ✓
personaName: string;    // ✓ (hardcoded "Coach" on backend, frontend uses it)
voiceProfile: string;   // ✓
completed: boolean;     // ✓
currentUserTurn: number; // ✓
feedbackLine?: string;  // ✓ null
missingPhrases?: string[]; // ✓ []
```

**PASS** — but `personaName` inconsistency: start_session returns scenario title, submit_turn returns hardcoded "Coach".

### finish_session

See BLOCKER-004. **FAIL** — response shape does not match expected `RoleplayFinishResponse`.

---

## TTS API Contract

### POST /api/v1/voice/tts/requests

**Backend returns** (wrapped in `success_payload`):
```json
{
  "data": {
    "audio": {
      "url": "/voice/tts/audio/{cache_key}.mp3",
      "duration_seconds": null,
      "provider": "openai",
      "replayable": true,
      "voice_profile": "female"
    },
    "cache_key": "tts_...",
    "cached": false,
    "requested_provider": null
  }
}
```

**Frontend reads** (`packages/core/api/voice.ts` lines 121–151):
```typescript
// unwrapEnvelope handles the { data: ... } wrapper
const audio = rawPayload?.audio;  // ✓
url: resolveApiUrl(audio.url),    // ✓ relative URL made absolute
durationSeconds: Number(audio.duration_seconds ?? 0),  // ✓ null → 0
provider: audio.provider,         // ✓
replayable: audio.replayable,     // ✓
voiceProfile: audio.voice_profile, // ✓
```

**PASS** — the shape aligns. 

**BUT:** The URL `/voice/tts/audio/{cache_key}.mp3` is served by `v1_roleplay_voice.py` (`GET /voice/tts/audio/{filename}`), which is registered WITHOUT a prefix. `resolveApiUrl()` prepends the base URL → `https://learn-api.floently.com/voice/tts/audio/{cache_key}.mp3`. This route is mounted. **PASS**.

---

## Entitlements Contract

### Backend Subscription Status

**Returns** (`subscription_service.py` `subscription_status()`):
```json
{
  "user_id": "...",
  "tier": "professional_doctor_monthly",
  "billing_tier": "professional_doctor_monthly",
  "features": {
    "general_finnish": { "available": true, "limit": -1 },
    "workplace": { "available": true, "limit": -1 },
    "yki": { "available": true, "limit": -1 }
  },
  "expires_at": "...",
  "trial_ends_at": null,
  "is_trial": false,
  "is_active": true
}
```

**Frontend reads** (`packages/core/api/entitlements.ts` `normalizeSubscriptionStatus()`):
```typescript
const rawTier = String(data.billing_tier ?? data.tier ?? 'free');
// rawTier = "professional_doctor_monthly"
// deriveProfessions → tier.includes('doctor') → ['doctor']
// professionalAccess → features.workplace.available = true
```

**PASS** — the entitlement normalization correctly reads the backend response. The frontend CAN derive profession access from the subscription status.

**BUT: The backend never enforces entitlements at the professional cards or roleplay endpoints.** The frontend reads the subscription status to control UI display (presumably), but the actual API calls are never gated server-side.

### Professional Access at Route Level

**Backend `v1_cards.py`** — no entitlement check for professional domain.  
**Backend `v1_roleplay.py`** — no entitlement check for any profession.

A user can directly call the API with a free token and get professional content.

---

## normalizeSubscriptionStatus Deep Dive

File: `packages/core/api/entitlements.ts` lines 182–281

Key behaviors:
1. **All-access test emails:** `EXPO_PUBLIC_ALL_ACCESS_TEST_EMAILS` env var — if user email is in this list → full access granted regardless of subscription
2. **Internal all-access tier:** If `billing_tier = "internal_all_access"` → all professions unlocked
3. **Profession derivation:** If tier string contains "doctor"/"nurse"/"practical_nurse" → profession derived
4. **Explicit professions array:** If backend returns `professions: [...]` field → use it directly (but current backend doesn't return this field)

**WARN:** Backend `subscription_status()` does NOT return `professions`, `yki_access`, `professional_access`, `workplace_access` fields. The frontend falls through to the tier-string-based derivation. This is fragile — any tier naming change breaks the derivation.

---

## Summary of Contract Issues

| Contract | Status | Severity |
|----------|--------|----------|
| Cards start session shape | PASS | — |
| Cards answer shape | PASS | — |
| Cards deck shape | PASS | — |
| Roleplay start_session shape | PASS (minor) | Low |
| Roleplay submit_turn shape | PASS | — |
| Roleplay finish_session shape | FAIL | High |
| TTS request/response shape | PASS | — |
| TTS URL resolution | PASS | — |
| Entitlement backend enforcement | FAIL | High |
| Entitlement frontend normalization | PASS | — |
| personaName consistency | WARN | Low |
| Backend doesn't return professions[] | WARN | Low |
