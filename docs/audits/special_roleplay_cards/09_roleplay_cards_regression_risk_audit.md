# Regression Risk Audit

**Scope:** Regression risks for roleplay and cards features  
**Inspected:** 2026-04-19

---

## RR-01: lru_cache on load_authority_cards — Content Stuck After Deploy

**Risk:** High  
**Likelihood:** Certain  

The `@lru_cache(maxsize=1)` on `load_authority_cards()` means card content is loaded once at startup and never reloaded. If card files are updated without restarting the process:
- New cards are never served
- Fixed content bugs are never applied
- The demo fallback card (hardcoded "Hei"/"hello") persists if files fail at startup

**Trigger condition:** Hot content updates without process restart.

**Regression scenario:** Content team fixes doctor card English translations, deploys the JSON files, but the running process still serves old broken content. Support tickets arrive saying "nothing changed."

**Mitigation:** Document that process restart is required after content changes, OR add a manual cache-bust endpoint.

---

## RR-02: load_runtime_bank() KeyError — Any Legacy Cards Endpoint Breaks

**Risk:** Critical  
**Likelihood:** Certain (the bug exists today)  

Any call to `load_runtime_bank()` raises `KeyError: 'prompt'`. This breaks:
- `GET /cards/session`
- `POST /cards/answer` (legacy)

If any old client integration, test script, or monitoring call hits these endpoints, they get 500 errors. This could mask other problems (e.g., logs flooded with tracebacks).

**Regression scenario:** A previous client version or healthcheck hits `GET /cards/session` → 500 Internal Server Error.

---

## RR-03: TTS Cache Key Collision Risk

**Risk:** Low  
**Likelihood:** Unlikely  

`cache_key = f'tts_{uuid.uuid5(uuid.NAMESPACE_URL, f"{provider}:{voice}:{voice_profile}:{speed}:{text}").hex}'`

UUID5 is deterministic — same inputs always produce the same key. This is intentional for caching. However:
- `voice_profile` can be `None` in the key
- `provider` can be `None`
- If provider changes (e.g., switching from openai to google), the old cache key returns audio from the old provider

**Regression scenario:** Switch from Google to OpenAI TTS — cached Google audio is served for old texts. Unlikely to cause user-facing issues since the audio content is the same text.

---

## RR-04: STORE State Persistence and Roleplay Session Collisions

**Risk:** Medium  
**Likelihood:** Low  

All roleplay v2 sessions use `user_id="preview"`. Sessions are stored in STORE under `("roleplay_sessions", session_id)`. Sessions are unique by session_id (UUID-based), so isolation is maintained. However:
- STORE persists to `apps/backend/app/runtime/state.json` every 30 seconds
- If the state file grows large with many preview sessions, STORE operations slow down
- No cleanup/expiry mechanism for completed/expired sessions

**Regression scenario:** After extended use, state.json contains thousands of roleplay sessions. STORE lock contention increases. Turn submission latency grows.

---

## RR-05: Roleplay Session Expiry During Turn Submission

**Risk:** Medium  
**Likelihood:** Low  

If a session expires between start and turn submission (TTL is 60 min), `submit_turn` raises `AppError(410, "SESSION_EXPIRED")`. The frontend has no error handling for 410 status — it will show a generic "Failed to submit turn" error. The user loses their session with no recovery option.

**Regression scenario:** User leaves app open for 60+ minutes, returns, submits a turn → error, no restart option visible.

---

## RR-06: Grammar/Phrase Mode → 404 with No Error Message Explanation

**Risk:** Medium  
**Likelihood:** Certain (the bug exists today)  

When user taps "Grammar" or "Phrases" tab in `CardPracticeSession`, the mode changes → `cardsService.start(mode, scope)` → `startCardSession({ content_type: "grammar_card" })` → backend returns 404 CARDS_NO_AUTHORITY_MATCH → `useCardPractice` sets `error` → UI shows "Card session failed to start" with the error code.

The error message is unfriendly but the flow does degrade gracefully (no crash, error state shown). However, users will be confused about why Grammar mode shows an error.

**Regression scenario:** User taps Grammar tab → "Card session failed to start: No cards matched the requested filters" — no explanation.

---

## RR-07: TTS Request Without Auth — Token Exposure Risk

**Risk:** Low  
**Likelihood:** Low  

`POST /api/v1/voice/tts/requests` accepts an optional authorization header but does NOT require it. Any unauthenticated caller can trigger TTS synthesis, consuming OpenAI/Google API credits.

The endpoint is rate-limited only by the underlying providers (not by the app). A public endpoint that can generate billable API calls is a cost-risk.

**Regression scenario:** Someone discovers the TTS endpoint and scripts requests → API costs spike.

---

## RR-08: Frontend CardDeckScope Reference Stability

**Risk:** Low  
**Likelihood:** Previously occurred (fix was applied)  

In `CardPracticeSession.tsx` lines 87–98, the `scope` object is memoized using individual primitive params to prevent infinite render loops. A comment specifically notes this was previously causing issues:

```tsx
// Extract primitive values so scope object reference stays stable across renders.
// useLocalSearchParams() returns a new object each render, which would cause
// scope → loadBanks → load to all get new references and trigger an infinite loop.
```

This is a regression risk if someone refactors the memoization back to using `useLocalSearchParams()` directly.

---

## Summary Table

| Risk | Severity | Likelihood | Impact |
|------|----------|------------|--------|
| RR-01: lru_cache content stuck | High | Certain | Content bugs persist |
| RR-02: load_runtime_bank KeyError | Critical | Certain | Legacy endpoints 500 |
| RR-03: TTS cache collision | Low | Unlikely | Wrong audio provider |
| RR-04: STORE growth | Medium | Low | Latency creep |
| RR-05: Session expiry during turn | Medium | Low | User error, no recovery |
| RR-06: Grammar mode 404 | Medium | Certain | Confusing error |
| RR-07: TTS endpoint no auth | Low | Low | Cost risk |
| RR-08: scope reference stability | Low | Low | Infinite loop regression |
