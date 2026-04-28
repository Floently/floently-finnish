# Roleplay Engine Audit

**Scope:** `apps/backend/app/runtime/roleplay.py`, `apps/backend/app/routers/v1_roleplay.py`, `apps/backend/app/services/roleplay_service.py`, session state, frontend screen.  
**Inspected:** 2026-04-19

---

## What Was Inspected

- `apps/backend/app/runtime/roleplay.py` (full file, 330 lines)
- `apps/backend/app/routers/v1_roleplay.py` (full file, 181 lines)
- `apps/client/features/speaking/screens/RoleplayConversationScreen.tsx` (722 lines)
- `apps/client/features/speaking/services/roleplayAudio.ts`
- `packages/core/api/roleplay.ts`
- `apps/backend/app/routers/v1_roleplay_voice.py`

---

## Architecture Overview

The roleplay system has two routing layers:

1. **New v2 routes** (unauthenticated, used by the current frontend):
   - `POST /api/v1/roleplay/session/start` → `runtime_start_session()`
   - `POST /api/v1/roleplay/session/{id}/turn` → `runtime_submit_turn()`
   - `POST /api/v1/roleplay/session/{id}/finish` → `runtime_finish_session()`
   - `GET /api/v1/roleplay/scenarios` → `runtime_list_scenarios()`

2. **Legacy authenticated routes** (not used by current client):
   - `POST /api/v1/roleplay/sessions` → authenticated session creation
   - `POST /api/v1/roleplay/sessions/{id}/turns` → authenticated turn submission
   - `GET /api/v1/roleplay/sessions/{id}` → session retrieval
   - `GET /api/v1/roleplay/sessions/{id}/transcript`
   - `GET /api/v1/roleplay/sessions/{id}/review`

The v2 routes use `user_id="preview"` — hardcoded for all sessions. **All roleplay sessions are attributed to a single preview user.**

---

## Findings

### F-RP-01: No Authentication on v2 Routes
**Verdict:** WARN  
**Severity:** High  
**File:** `apps/backend/app/routers/v1_roleplay.py` lines 63–110  

The `start_roleplay_session_route`, `submit_roleplay_turn_route`, and `finish_roleplay_session_route` endpoints accept no authorization header. All sessions use `user_id="preview"`. This means:
- Multiple users share the same session namespace key `"preview"`
- A session started by one user can be submitted to by another user if they know the session_id
- No per-user history, no per-user progress tracking

**Evidence:** `runtime.py` line 275: `session = create_roleplay_session(user_id="preview", ...)`

### F-RP-02: Hardcoded Finnish Replies Unrelated to Profession
**Verdict:** FAIL  
**Severity:** High  
**File:** `apps/backend/app/runtime/roleplay.py` lines 108–116  

```python
def _roleplay_reply(turn_number: int) -> tuple[str, str]:
    replies = {
        1: ("Selva. Minka asian vuoksi haluaisit varata ajan?", "professional"),
        2: ("Kiitos. Milloin sinulle sopisi parhaiten?", "professional"),
        3: ("Hyva. Onko sinulla muita oireita tai toiveita?", "professional"),
        4: ("Ymmarran. Vahvistan ajan viela ennen varauksen paatosta.", "professional"),
        5: ("Ole hyva. Aika on nyt varattu. Kiitos ja hyvaa paivanjatkoa.", "warm_professional"),
    }
```

These replies are generic appointment-booking phrases. They do NOT vary by:
- Profession (doctor, nurse, practical_nurse)
- Scenario (patient_consult, shift_handover, daily_care)
- Level band (A1-A2 vs C1-C2)
- What the user actually said

A doctor doing a "patient consultation" gets the same appointment-booking replies as a practical nurse doing "daily care update". The AI is completely non-adaptive.

### F-RP-03: start_session Returns Correct Shape
**Verdict:** PASS  
**File:** `apps/backend/app/runtime/roleplay.py` lines 273–301  

```python
return {
    "sessionId": session["session_id"],
    "session_id": session["session_id"],
    "profession": profession,
    "levelBand": level_band,
    "track": "professional" if profession != "general" else "general",
    "scenarioId": chosen,
    "scenario": { "id": chosen, "title": ..., "prompt": ..., "keyPhrases": [], "grammarTip": "", ... },
    "introText": f"Harjoittelet suomea: ...",
    "openingText": opening_text,   # present
    "voiceProfile": "female",       # present
    "personaName": scenario_meta["title"],
    "maxUserTurns": max_turns,
}
```

The frontend expects `sessionId`, `scenario`, `introText`, `openingText`, `voiceProfile`, `personaName`, `maxUserTurns` — all present.  
**One mismatch:** `scenario.keyPhrases` is always `[]`. Frontend renders key phrase pills from this — always empty for all professions.

### F-RP-04: submit_turn Returns Correct Core Shape
**Verdict:** PASS  
**File:** `apps/backend/app/runtime/roleplay.py` lines 304–320  

```python
return {
    "sessionId": session_id,
    "session_id": session_id,
    "aiText": ai_text,     # present
    "aiReply": ai_text,    # redundant alias
    "voiceProfile": "female",   # present
    "personaName": "Coach",     # present
    "completed": completed,
    "currentUserTurn": ...,
    "feedbackLine": None,       # always null — no per-turn feedback
    "missingPhrases": [],       # always empty — no phrase tracking
}
```

Frontend reads `response.aiText`, `response.voiceProfile`, `response.currentUserTurn`, `response.completed` — all present.

### F-RP-05: finish_session Shape Mismatch
**Verdict:** FAIL  
**Severity:** High  
**File:** `apps/backend/app/runtime/roleplay.py` lines 323–329  

See BLOCKER-004 in `02_release_blockers.md`. The review object fields do not align with the `RoleplayFinishResponse` TypeScript type.

Frontend gracefully degrades but shows empty feedback report. No annotated transcript, no strong/difficult phrases, no grammar observations.

### F-RP-06: Session Expiry Is Functional
**Verdict:** PASS  
**File:** `apps/backend/app/runtime/roleplay.py` lines 32–44  

TTL is `ROLEPLAY_SESSION_TTL_MINUTES` (default 60 min). The `_is_expired()` check is applied on every turn submission via `_assert_session_access()`. Works correctly.

### F-RP-07: Opening Message Has ASCII-Stripped Finnish
**Verdict:** WARN  
**Severity:** Low  
**File:** `apps/backend/app/runtime/roleplay.py` lines 63–70  

```python
opening = {
    "text": "Hei, miten voin auttaa sinua tanaan?",  # "tanaan" should be "tänään"
    ...
}
```

Turn replies also lack proper Finnish characters:
- `"Selva."` → should be `"Selvä."`
- `"Minka"` → should be `"Minkä"`
- `"Hyva"` → should be `"Hyvä"`
- `"Ymmarran"` → should be `"Ymmärrän"`

This happens because the strings are hardcoded without proper Unicode Finnish characters (ä, ö, etc.).

### F-RP-08: Session State Stored Under preview User ID
**Verdict:** WARN  
**Severity:** Medium  
**File:** `apps/backend/app/runtime/roleplay.py` line 275  

`create_roleplay_session(user_id="preview", ...)` — all v2 roleplay sessions are stored under user_id="preview". If two users start sessions simultaneously, sessions are isolated by `session_id` (not by user_id), so isolation IS maintained. But the history/analytics per user is lost. The `_assert_session_access()` check `session.get("user_id") != user_id` will always be `"preview" != "preview"` = False, so access is never denied, meaning ANY caller can read/modify ANY session by guessing its ID.

### F-RP-09: Scenario List Is Minimal and Correct
**Verdict:** PASS  
**File:** `apps/backend/app/runtime/roleplay.py` lines 250–270  

```python
_SCENARIOS = {
    "general": [...],
    "nurse": [{"scenarioId": "nurse_shift_handover", ...}],
    "doctor": [{"scenarioId": "doctor_patient_consult", ...}],
    "practical_nurse": [{"scenarioId": "practical_nurse_daily_care", ...}],
}
```

One scenario per profession. The frontend uses `listRoleplayScenarios()` to fetch these. The list works but each profession only has one scenario.

---

## Summary Table

| Finding | Verdict | Severity |
|---------|---------|----------|
| F-RP-01: No auth on v2 routes | WARN | High |
| F-RP-02: Hardcoded non-profession replies | FAIL | High |
| F-RP-03: start_session shape | PASS | — |
| F-RP-04: submit_turn shape | PASS | — |
| F-RP-05: finish_session shape mismatch | FAIL | High |
| F-RP-06: Session expiry | PASS | — |
| F-RP-07: ASCII-stripped Finnish text | WARN | Low |
| F-RP-08: Sessions under preview user | WARN | Medium |
| F-RP-09: Scenario list minimal | PASS | — |
