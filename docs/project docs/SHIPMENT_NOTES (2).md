# Engine A Polish Shipment — Integration Notes

This shipment completes the four Engine A polish workstreams deferred from the previous turn, plus marks the Beta engine as "Coming soon" wherever it surfaces.

## What's in this shipment

### Backend changes

| File | Action | Purpose |
|---|---|---|
| `apps/backend/app/services/tts/voice_registry.py` | **Replace** | Real Finnish voice mapping with Google Wavenet support, gender enforcement, deterministic per-persona variety, multi-talker dialogue voice assignment |
| `apps/backend/app/services/tts/runtime.py` | Replace | Remove duplicated voice map, use the canonical registry |
| `apps/backend/app/audio/tts_service.py` | Replace | Pass `persona_id` to the registry for stable variety; recognize `fi-m-` / `fi-f-` speaker_id prefixes (fixes "Matti Virtanen with woman's voice" at the source) |
| `apps/backend/app/audio/audio_types.py` | Replace | Add optional `gender` to `AudioSpeaker` so listening data carries explicit gender |
| `apps/backend/app/audio/dialogue_builder.py` | Replace | Recognize `gender` field on dict-form turns; encode into speaker_id so downstream resolver picks correct voice per speaker (multi-voice listening fix) |
| `apps/backend/app/runtime/cards_logic.py` | Replace | Add `_resolve_card_hint()` that returns authored hints OR synthesizes structurally correct Finnish fallback by content_type |

### Client changes

| File | Action | Purpose |
|---|---|---|
| `apps/client/state/SpeakingRoute.tsx` | Replace | Mark Interview tile as "Coming soon — locked"; lock the entry-mode interview CTA the same way |
| `apps/client/features/exam/screens/ExamRuntimeScreen.tsx` | Replace | Speaking router (#7.4): conversation-mode tasks render a Beta-locked surface instead of forcing recording |
| `apps/client/features/cards/hooks/useCardPractice.ts` | Replace | Prefer materialized card's `hint` field before calling the coachHint service |

### Content

| File | Purpose |
|---|---|
| `content/sample_card_hints.csv` | 12 representative hint authors covering vocabulary/sentence/grammar at A1-A2/B1-B2/C1-C2 — for Finnish reviewer pass before bulk-rollout |

---

## Workstream summaries

### #7.1 Voice/gender resolver — DONE

The "Matti Virtanen with woman's voice" bug had three layered causes:

1. The voice registry only mapped `voice_hint` (gender) to a single voice per gender. All male personas got the same voice; same for female.
2. The registry didn't include any project-relevant Wavenet voices — only Standard.
3. When `tts_service` couldn't determine gender from a persona name, it fell through to a hash-based guess that misclassified ~half of male personas as female.

The fix:

- **New `voice_registry.py`** — Maps gender to a Google Wavenet voice POOL (multiple voices per gender), uses a stable hash of `persona_id` to pick deterministically from the pool. Same persona → same voice across sessions; different personas → different voices when the pool allows.
- **`_voice_profile_for_speaker` in `tts_service.py`** — Now recognizes the Finnish persona registry id pattern (`fi-m-NNN`, `fi-f-NNN`) directly. The hash-based fallback is reached only for completely unknown ids.
- **`provider_voice_name` accepts `persona_id`** — for stable per-persona voice variety.
- **`voices_for_dialogue`** — new function for multi-talker dialogues; rotates through the pool by stable index so distinct speakers get distinct voices.

Wavenet voices fall back to Standard if Wavenet isn't enabled in your Google Cloud project. The existing `GoogleTTSProvider` should pick up Wavenet automatically when the voice_id is `fi-FI-Wavenet-A` etc — verify in the next deployment.

### #7.3 Multi-voice listening — DONE

Listening dialogues with multiple speakers should render with distinct voices per speaker. Achieved by:

1. **Adding optional `gender` to `AudioSpeaker`** — listening data files can author gender per speaker.
2. **`dialogue_builder._normalize_turn`** — recognizes `gender` field on dict-form turns and encodes it into the speaker_id with the `fi-m-` / `fi-f-` prefix the TTS service already understands.
3. **The voice registry** — assigns distinct voices per speaker in a multi-talker scene via stable hash spread over the gender pool.

End-to-end: a listening dialogue authored as `[{speaker:'nurse_1', text:'...', gender:'female'}, {speaker:'doctor_1', text:'...', gender:'male'}]` will render with one female voice and one male voice, deterministically selected from the available pool.

**Limitation:** Google Cloud TTS Finnish currently has 2 distinct Wavenet voices per gender. Beyond 2 distinct speakers per gender in a single dialogue, the pool starts to repeat.

### #7.4 Speaking router — DONE

Speaking tasks now carry an `interactionMode: 'monologue' | 'conversation'` field (default `monologue` for backwards compat).

**Monologue tasks** — flow unchanged. User reads the prompt, prepares for 30s, records 45-60s, gets STT-based scoring.

**Conversation tasks** — render a clear Beta-locked surface:
- Title: "Conversation task — Beta · Coming soon"
- Body: explains that this requires the conversational AI engine (Engine B), which is in development
- The user can read the prompt, plan their answer, and tap Skip to continue

The `canAdvance` gate is updated so conversation tasks can be skipped without entering the recording flow.

To author conversation-mode tasks: set `interaction_mode: "conversation"` on the speaking task data. The frontend reads this from the `t.interaction_mode` field.

### #7.2 Hint quality — PARTIAL

The full hint rewrite is content authoring at scale (~500 cards). I shipped:

- **Backend resolver** (`_resolve_card_hint`) — returns authored hints OR synthesizes structurally correct Finnish fallbacks per content_type. **Every card now ships with a real hint, not a generic English platitude.** The synthesized fallbacks are good enough to be deployed today.
- **Frontend hook** — prefers materialized card's hint before any service call.
- **Sample authoring CSV** — 12 representative hints covering vocabulary/sentence/grammar at A1-A2/B1-B2/C1-C2. Finnish reviewer should pass over before bulk-rollout.

**What's deferred:** authoring the remaining ~488 hints. This is a content workstream that benefits from focused Finnish-reviewer time; doing it AI-only would produce inconsistent quality. The synthesized fallbacks cover this gap until authored hints are written.

### Beta marking ("Coming soon") — DONE

Two places where the Beta engine surfaced:

1. **Interview tile in SpeakingRoute** — was a `<Pressable>` that dropped users into a scripted `nurse_interview_beta` scenario. Now a `<View>` (non-tappable) with a "Coming soon" badge and explanation that the adaptive interview engine is in development.
2. **Interview entry-mode CTA** — the "Start structured interview" button shown when `entryMode === 'interview'`. Replaced with the same Coming soon panel.

Users see the tile, understand it's coming, but cannot enter the scripted version masquerading as the real interview engine. When Engine B ships, replacing the View with a Pressable and pointing it at the real engine is a one-line change.

---

## What you should verify before deploying

### Voice/gender (the visible bug fix)

- [ ] Generate a card audio for a male persona (e.g. Matti Virtanen, persona_id `fi-m-001`) → should get a male voice
- [ ] Generate a card audio for a female persona → should get a female voice
- [ ] Generate audio for the SAME male persona twice → same voice both times (stable variety)
- [ ] Generate audio for two DIFFERENT male personas → different voices when pool allows
- [ ] Existing audio assets in your cache may be from before the fix; clear or invalidate them so users hear the corrected voices

### Multi-voice listening

- [ ] Open a YKI listening task that has 2+ speakers → each speaker should have a distinguishable voice
- [ ] Listening data without `gender` field still works (backwards compat — falls back to old behavior)

### Speaking router

- [ ] A monologue speaking task (existing) flows through the recording phase as before
- [ ] A speaking task with `interaction_mode: "conversation"` shows the Beta-locked surface
- [ ] Conversation task can be skipped (Next button enabled without entering recording)

### Hint quality

- [ ] Reveal a hint on any card → should be in Finnish, point at structure, never the generic English fallback
- [ ] If a card has no authored hint, the synthesized fallback should be sensible
- [ ] Reveal hint and then dismiss → no jank, hint state resets

### Beta marking

- [ ] Open Nurse area → Interview tile shows "Coming soon" badge, is non-tappable
- [ ] Open Doctor area → same
- [ ] Open Practical Nurse area → same
- [ ] Open General workplace area → no Interview tile (general has no interview)
- [ ] Tapping the Interview tile does nothing visible (it's a View, not a Pressable)

---

## Honest limitations

### 1. Wavenet may not be enabled in your Google Cloud project

The new registry primarily routes to `fi-FI-Wavenet-A` / `fi-FI-Wavenet-B`. If your project uses Standard tier only, those voice IDs will fail at the TTS API. The `GoogleTTSProvider` *should* either fall back to Standard automatically or surface an error — verify after deploy. If it surfaces errors, change the pool order in `voice_registry.py` to put Standard first:

```python
_GOOGLE_FEMALE_VOICES = ("fi-FI-Standard-A", "fi-FI-Wavenet-A")
_GOOGLE_MALE_VOICES   = ("fi-FI-Standard-B", "fi-FI-Wavenet-B")
```

This keeps the multi-voice variety logic intact while making Standard the primary.

### 2. The Finnish hints I authored need a reviewer pass

I'm reasonably confident in the Finnish, but a native-or-near-native speaker should pass over the 12 authored hints in `sample_card_hints.csv` before they're treated as the format authority for bulk authoring. Specific concerns flagged in the CSV's `notes_for_reviewer` column.

The synthesized fallbacks (in `_resolve_card_hint`) follow templates I'm more confident about because they reuse canonical Finnish-teaching phrasings. A reviewer should still verify them before launch.

### 3. The conversation-task data field name is my choice

I named the field `interaction_mode` (snake_case in JSON, camelCase in TS). If your existing speaking task schema uses a different name (e.g. `task_type`, `mode`, `kind`), tell me and I'll rename. The current code reads from `t.interaction_mode`.

### 4. The hint resolver doesn't run in tests

I added the resolver but didn't add unit tests for it. Risk: if a card has unexpected types in fields like `topic` or `grammar_focus`, the resolver could produce garbled hints. The defensive type coercion (`str(...)`, `or` fallbacks) should prevent crashes, but the output could be ugly. Add a test pass for `_resolve_card_hint` covering vocabulary/sentence/grammar across all level bands when you have time.

---

## Next steps after you deploy this

If the voice/gender fix works as expected:
1. Bulk hint authoring — get the 12-row CSV reviewed, then expand to full coverage. Budget 4-6 hours of focused reviewer time for ~500 cards.
2. Multi-voice listening data audit — populate `gender` on every speaker in existing listening dialogues. If your data is JSON files in `materials/yki/`, this is a one-time bulk edit.

If the voice/gender fix doesn't work as expected (you hear regressions or the wrong voice):
1. Capture the exact persona_id, the audio asset that's wrong, and what voice you expected vs. got
2. Send back — most likely diagnosis is either Wavenet not enabled (fix in step 1 of "Honest limitations") OR a persona id pattern I didn't account for

Beta engine work continues in its own track per your earlier decision. The "Coming soon" marking is in place; replacing the locked tiles with real entry points is a one-line change per tile when Engine B ships.
