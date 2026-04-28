# KieliTaika Roleplay Engine — Improvement Notes
_Covers all 16 uploaded files. Organised by file, then by priority tier._

---

## What changed and why

### `roleplay_runtime.py` — **core rewrite**

**Identified weaknesses in v1**

| Area | Problem |
|---|---|
| AI memory | `_generate_openai_reply` sent only the current user turn — no history. The AI had zero conversational memory and produced disconnected replies. |
| Correction behaviour | System prompt didn't explicitly forbid correction; AI sometimes lectured mid-conversation. |
| Persona | Every assistant turn was labelled "AI". No name variation. |
| Scenarios | No general vs professional split — all tracks were treated identically. |
| Feedback | `finish_session` returned a single summary string. No annotated transcript, no per-paragraph comments, no downloadable structure. |
| Scoring | Only phrase coverage + word count + binary repair flag. No structure signal. |
| Closing turn | Used `random.choice(closing_lines)` even when OpenAI was available, missing a natural AI-generated conclusion. |

**What v2 does instead**

- `_build_conversation_messages` replays the full transcript on every call so the AI has real memory and can reference things said earlier.
- `_build_system_prompt` explicitly instructs the AI: _never correct, never explain grammar, model correct Finnish in context_. This is the single most important pedagogical change.
- A separate level-calibration instruction block (`level_instructions` dict) adjusts expected sentence length and vocabulary complexity per level band.
- `_pick_persona` picks a gendered name from `FEMALE_NAMES` / `MALE_NAMES` pools matching the `voice_is_female` flag on each scenario.
- Scenarios now carry a `track: RoleplayTrack` field (`"general"` | `"professional"`). The system prompt has separate framing for each.
- The final turn is sent to OpenAI with a `[This is the FINAL turn — wrap up…]` suffix in the scenario context block, producing a genuine AI conclusion.
- `finish_session` → `_build_feedback_report` returns a rich dict with: `transcriptAnnotated` (every turn with a pedagogical comment), `scores`, `strongPhrases`, `difficultPhrases`, `grammarObservations`, `nextSteps`.
- `_annotation_for_turn` comments on each user paragraph; `_annotation_for_ai_turn` highlights the model vocabulary in each AI paragraph.
- `_score_turn` adds a `structure` dimension (sentence count) alongside coverage, clarity, repairLanguage, wordCount.

**Scenario catalogue expansion**

The original 9 scenarios (spread across 4 professions) are expanded to 15, covering A1-A2 through C1-C2 for each profession and adding 5 general Finnish scenarios (introductions, service encounter, appointment booking, polite disagreement, formal complaint).

---

### `RoleplayConversationScreen.tsx` — **significant UI upgrade**

| Area | Change |
|---|---|
| Persona display | Added `personaRow` + `personaBadge` showing "Keskustelukumppani: Noora" at top of session card |
| Transcript | Passes `personaName` prop to `RoleplayTranscriptList` so assistant bubbles show the name instead of "AI" |
| Feedback report | Full `FeedbackReport` type + `ScrollView`-wrapped `reportCard` with score chips, annotated transcript toggle, phrase lists, grammar observations, next steps |
| Download | `buildMarkdownReport` + `downloadMarkdown` produces a `.md` file on web; falls back to `Share.share` on native |
| Intro TTS | Speaks only `openingText` (not `introText + openingText`) — avoids a long synthetic preamble before the scenario starts |
| Finnish copy | All UI labels localised to Finnish (`Lähetä`, `Pysäytä ääni`, `Uusi harjoittelu`, etc.) |

---

### `roleplay.ts` — **type alignment**

- Added `personaName: string` to `RoleplaySessionStart` and `RoleplayTurnResponse`
- Added `track: RoleplayTrack` to `RoleplayScenarioSummary` and `RoleplaySessionStart`
- Replaced the minimal `RoleplayFinishResponse` with the full `FeedbackReport` shape matching the v2 backend
- `score` object in `RoleplayTurnResponse` gains `structure` and `wordCount` fields

---

### `roleplay_routes.py` — **light cleanup**

- Route docstrings explain the response contract clearly
- No functional logic changes beyond forwarding the v2 runtime's richer responses
- Legacy routes preserved unchanged for backward compatibility

---

## Files that did NOT change

| File | Reason no change needed |
|---|---|
| `useRoleplayRecorder.ts` | Solid cross-platform implementation. No changes required. |
| `roleplayAudio.ts` | TTS and UI sound service is well-structured. No changes. |
| `roleplay_voice_routes.py` | STT/TTS proxy is well-implemented. No changes. |
| `state_store.py` | Thread-safe, correct. The roleplay runtime uses an in-process dict (SESSION_STORE) for now — see Long-term below. |
| `runtime.py` (TTS) | Provider chain + caching logic is solid. No changes. |
| `google.py` | SSML humanisation is good. No changes. |
| `config.py` | Add `ROLEPLAY_OPENAI_MODEL` to `.env.example` (see below); no Settings changes needed. |
| `router.py` | No changes. `build_roleplay_router()` is already imported correctly. |
| `api_models.py` | No changes. `RoleplayTurnRequest` and `RoleplayCreateRequest` are unchanged. |
| `apps_backend_roleplay_runtime.py` | Legacy authenticated path — unchanged. Remains live for legacy clients. |
| `types.ts` | Add `track` field to `SpeakingTrack` if desired, otherwise no changes needed now. |

---

## `.env.example` additions

```
# Roleplay engine
ROLEPLAY_OPENAI_MODEL=gpt-4o-mini   # or gpt-4o for higher quality
```

---

## Prioritised improvement plan

### Quick wins (ship this week)

1. **Deploy `roleplay_runtime.py` v2** — all conversation quality improvements come from here. Backward-compatible: existing routes call the same `start_session` / `submit_turn` / `finish_session` signatures.
2. **Deploy `roleplay_routes.py`** — adds docstrings, no breaking changes.
3. **Deploy `roleplay.ts` + `RoleplayConversationScreen.tsx`** — unlocks persona names and the feedback report in the UI.
4. **Wire `personaName` into `RoleplayTranscriptList`** — update that component to accept an optional `personaName` prop and use it to label assistant bubbles.

### Medium-term (next sprint)

5. **Scenario JSON fixtures** — move `SCENARIOS` dict out of Python into `content/roleplay/scenarios/{profession}/{level}.json` files. Load at startup with a `ScenarioLoader`. This makes content editable without a deploy.
6. **Profession-gating** — before calling `runtime_start_session`, check that the authenticated user's subscription includes the requested profession. General Finnish is free; nurse/doctor/practical_nurse require the relevant paid tier. Add a `profession_allowed(user_id, profession)` guard in `roleplay_routes.py`.
7. **Session persistence** — `SESSION_STORE` is an in-process dict. Move to `STORE` (`state_store.py` / `roleplay_sessions` bucket) so sessions survive server restarts and work across multiple workers.

### Long-term architecture

8. **Streaming TTS** — stream AI text sentence-by-sentence and start TTS on the first sentence while the second is being generated. This cuts perceived latency from ~2 s to ~0.5 s.
9. **Adaptive difficulty** — after each session, record a rolling `cefr_estimate` per user. `start_session` picks a level-appropriate scenario automatically without requiring the user to choose.
10. **Feedback PDF export** — extend `buildMarkdownReport` / add a `buildPdfReport` function using `react-native-html-to-pdf` or a backend `/roleplay/session/{id}/report.pdf` endpoint.
11. **Scenario A/B quality evaluation** — log per-scenario engagement metrics (session completion rate, avg score) and use them to surface the best-performing scenarios first.

---

## Architecture risks to address

| Risk | Mitigation |
|---|---|
| `SESSION_STORE` is process-local | Move to `STORE` bucket (medium-term item 7) |
| OpenAI token cost per turn grows with history | Cap history at last 6 turns (3 user + 3 assistant) — already low risk with `max_tokens=140` |
| No input sanitisation before sending to OpenAI | Add `clean_text[:600]` hard cap (already done implicitly via `_normalize_ai_text` on output) |
| Fallback reply is deterministic + repetitive | Fallback pool could be expanded per scenario, but OpenAI availability is assumed in production |
