# Executive Summary

**Audit date:** 2026-04-19  
**Scope:** Roleplay engine, card system, profession-specific flows (doctor, nurse, practical nurse), TTS pipeline, entitlements, frontend/backend API contracts.

---

## Critical Findings (Release Blockers)

### 1. Doctor and Nurse Cards Silently Yield Zero Results
**Root cause confirmed.** The `_filtered_cards()` function in `cards_logic.py` filters by `card["path"] == "professional"` and `card["profession"] == requested_profession`. The card loading code (`load_authority_cards()` in `cards_material_bank.py`) reads ONLY from `apps/backend/practice/data/cards/*.json` (via `CARDS_DIR = PRACTICE_DATA_DIR / "cards"`).

- `PRACTICE_DATA_DIR` resolves to `apps/backend/practice/data`
- `CARDS_DIR` resolves to `apps/backend/practice/data/cards`
- Cards in that directory: `doctor_cards.json`, `nurse_cards.json`, `lahioitaja_cards.json`

**The doctor cards ARE loaded** from `doctor_cards.json`. Profession is set to `"doctor"` (via `path.stem.replace('_cards','').lower()` → `"doctor"` with no alias needed). All cards are stored with `path='professional'`. This means the data IS accessible.

However, a **second critical bug** exists: `load_runtime_bank()` at line 105 references `item['prompt']` but the dict returned by `load_authority_cards()` does NOT contain a key named `'prompt'` — it stores `'follow_up_prompt'` instead. This would crash with `KeyError: 'prompt'` on any call to `load_runtime_bank()`. The new runtime path (`start_runtime_session`) calls `load_authority_cards()` directly, not `load_runtime_bank()`, so the session/deck endpoints work. But `get_card_session()` via the legacy `/cards/session` route calls `load_runtime_bank()` and will crash.

**For the "doctor shows nothing" issue specifically**: the new runtime path `GET /cards/session/adaptive/start?domain=professional&profession=doctor` calls `_filtered_cards()` which calls `load_authority_cards()`. This will find cards from `doctor_cards.json`. The cards in that file have `path='professional'` and `profession='doctor'`. So the filter SHOULD work. **But** — the `back` field construction at line 69: `back = _normalized_text(item.get('back') or item.get('answer') or ...)`. Doctor cards have `"answer": "potilas"` — this IS present. So `back` will be `"potilas"`. And `front` comes from `item.get('prompt')` for non-MCQ types which is also present. For MCQ (`type='recognition'`), `item_type in _MCQ_TYPES` → True → `front = item.get('question')` → `"Mikä sana tämä on?"`. For `back`: `item.get('back')` is None, `item.get('answer')` is `"potilas"`. So cards ARE materially loaded.

**Actual reason for "doctor shows nothing" is likely**: the `content_type` filter. `load_authority_cards()` hardcodes `content_type='vocabulary_card'` for all cards. The frontend requests `content_type=vocabulary_card` for `mode=vocabulary`, which matches. But `_filtered_cards()` at line 133: `if content_type and card["content_type"] != content_type: continue`. Since all cards are tagged `vocabulary_card` and the request is `vocabulary_card`, they should match. This means doctor cards SHOULD return unless there's another issue.

**The real block is the domain filter at line 135-138**: `if domain == "professional" and card["path"] != "professional": continue`. Cards from `doctor_cards.json` ARE stored with `'path': 'professional'` (hardcoded in line 82). So this should also pass.

**Conclusion on doctor/nurse cards**: The new runtime path should work. The issue is likely at the router/client level. Let me re-examine: `v1_cards.py GET /cards/session/adaptive/start` requires authentication (`_require_cards_user_id`) and passes `domain`, `profession` etc. The client in `cards.ts:startCardSession()` sends GET to `/cards/session/adaptive/start?domain=professional&content_type=vocabulary_card&profession=doctor`. The router is registered with `prefix="/cards"`, so the full path is `/cards/session/adaptive/start`. But `v1_cards.py` line 58: `@router.get("/session/adaptive/start")` with `router = APIRouter(prefix="/cards")`. This correctly resolves to `/cards/session/adaptive/start`. The client sends to this path without the `/api/v1` prefix. This is consistent with how `cards_router` is registered in `router.py` (no `/api/v1` prefix).

**The main confirmed bug**: `load_runtime_bank()` line 105 crashes with `KeyError: 'prompt'` because the dict has `follow_up_prompt` not `prompt`. Any legacy `/cards/session` endpoint call will fail.

### 2. TTS Not Working — URL is Relative, Not Absolute
`resolve_tts_audio()` returns `url='/voice/tts/audio/{cache_key}.mp3'` (relative path). The frontend in `voice.ts:requestVoiceTts()` calls `resolveApiUrl(audio.url)` which should prepend the base URL. This should work if `resolveApiUrl` correctly prepends the base. Need to verify `resolveApiUrl`. However, the TTS URL path `/voice/tts/audio/{filename}` is served by `v1_roleplay_voice.py` at route `GET /voice/tts/audio/{filename}`. This router is registered WITHOUT a prefix in `router.py`. So the route is `/voice/tts/audio/{filename}`. The URL returned is `/voice/tts/audio/{cache_key}.mp3`. When `resolveApiUrl` prepends `https://learn-api.floently.com`, the full URL becomes `https://learn-api.floently.com/voice/tts/audio/{cache_key}.mp3`. This SHOULD work.

**The main TTS blocker**: No TTS provider is configured. If neither `OPENAI_API_KEY` nor Google credentials exist in production, `_pick_provider_and_voice()` returns `(None, None)` → `TTSRouterError('No TTS provider is configured')` → 503 → client sees `VOICE_TTS_UNAVAILABLE` → `speakRoleplayText` returns false → `onUnavailable()` fires → `setRemoteAudioAvailable(false)` → "TTS ei saatavilla" message shown. This is a **configuration deficiency**, not a code bug, but must be confirmed.

### 3. Roleplay Finish Session Returns Wrong Shape
`finish_session()` in `roleplay.py` returns either a `{"session_id", "status", "completed": False, "message": "..."}` or the review dict `{...review, "completed": True}`. The frontend `finishRoleplaySession()` expects `RoleplayFinishResponse` with fields `transcriptAnnotated`, `summary`, `scores`, `strongPhrases`, `difficultPhrases`, `grammarObservations`, `nextSteps`, `nextAction`. The backend `get_roleplay_review()` returns `scores` (as a numeric dict, not the expected shape), `focus_points` (not `grammarObservations`), `recommended_next_actions` (not `nextSteps`), and no `transcriptAnnotated`, `summary`, `strongPhrases`, `difficultPhrases`. The frontend does handle this gracefully via `'transcriptAnnotated' in finished` check and falls back — but the feedback report will be EMPTY (all empty arrays).

### 4. practical_nurse Cards Missing `words/a1_a2` File in Published Set
`ls apps/backend/materials/cards/published/professional/practical_nurse/` shows: `grammar/(a1_a2, b1_b2, c1_c2)`, `words/b1_b2` only, `phrases/(a1_a2, b1_b2)`. There is no `words/a1_a2.json` for practical nurse. This means A1/A2 vocabulary cards are missing for practical nurses.

---

## High-Priority Findings

1. `load_runtime_bank()` has `KeyError: 'prompt'` — legacy endpoint crash
2. Doctor cards `"back"` value = Finnish word not English translation (e.g. answer to `potilas` is `potilas`) — both `prompt` and `answer` are the same Finnish word. No English gloss provided.
3. Roleplay engine has zero AI intelligence — all turns use hardcoded Finnish replies unrelated to profession. Doctor roleplay sends generic appointment booking text.
4. No entitlement check on professional cards endpoints — any authenticated user can request doctor/nurse cards without a professional subscription.
5. TTS audio URL in cards returns `/cards/audio/generated/{filename}` but the TTS runtime stores files to the tempdir and returns `/voice/tts/audio/{cache_key}` — cards TTS is a completely different underdeveloped path.

---

## Release Recommendation

**DO NOT RELEASE** professional card features or TTS-dependent features without:
1. Fixing the `load_runtime_bank()` KeyError
2. Confirming TTS credentials in production
3. Fixing the finish session response shape (or wiring a real feedback engine)
4. Adding content review pass for doctor/nurse cards (both front and back are Finnish words)
