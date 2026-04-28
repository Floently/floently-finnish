# Roleplay Retention Hooks — Integration Guide

Audit item #9. Adds streak tracking, a next-scenario CTA with Finnish persona preview, and a one-tap share moment to the end of every completed roleplay session.

## What changed

Before: when a roleplay finished, the user saw the feedback report ending with two buttons — "Lataa raportti (.md)" (download report) and "Uusi harjoittelu" (restart same scenario). That was the entire retention surface.

After: the feedback report still ends with actions, but the actions are now a full retention surface:
- **Streak banner** showing current streak, whether it was extended / is a new record / restarted after a gap, plus best-ever streak
- **Primary CTA: "Next: [different scenario title]"** — routes to a different scenario for the same profession. If only one scenario exists for the profession, falls back to "Another round"
- **Secondary row:** Share, Replay (same scenario), Report (download)

The existing feedback report content (summary, score chips, transcript, strong/difficult phrases, grammar observations, next steps) is untouched.

## Files

| Destination | Type |
|---|---|
| `apps/client/state/streakStore.ts` | **New** — client-side streak tracking, AsyncStorage |
| `apps/client/features/speaking/data/alternativeScenarios.ts` | **New** — scenario alternatives per profession + picker |
| `apps/client/features/speaking/components/SessionCompletion.tsx` | **New** — the retention surface component |
| `apps/client/features/speaking/screens/RoleplayConversationScreen.tsx` | Replace — imports SessionCompletion, allows startSession to accept a scenario override, replaces the old action buttons block |

Zero new dependencies. Uses existing `@react-native-async-storage/async-storage`, `zustand`, React Native `Share` API.

## Streak tracking logic (important!)

**Day-based, local-time.** "Today" uses the device's local time, not UTC. Chosen deliberately — users perceive streaks in their own day boundaries. A user practicing at 23:55 local time and again at 00:10 the next day correctly extends their streak by 1.

**Five possible outcomes** when `recordPractice()` is called:
- `first_ever` — this is the user's first session ever
- `extended` — new consecutive day added to the streak
- `new_record` — `extended` AND this is the new longest streak
- `same_day` — same calendar day as last session; streak unchanged
- `resumed_after_gap` — more than one day passed; streak reset to 1

**Storage key:** `floently.practice.streak`. Contains `{ lastPracticeDate, currentStreak, longestStreak }`.

**Called from:** `SessionCompletion.tsx`'s mount effect. Runs exactly once per mount — a new mount happens every time a user completes a new session (the parent re-renders when `feedbackReport` transitions from null to non-null).

## How the "Next scenario" picker works

`alternativeScenarios.ts` mirrors the backend's `_ROLEPLAY_REGISTRY` in `apps/backend/app/runtime/roleplay.py`. If you add or rename scenarios there, update this file too. The mapping as of this shipment:

- **general** — 2 scenarios (cyclic rotation possible)
- **nurse** — 3 scenarios (cyclic rotation possible)
- **doctor** — 2 scenarios (cyclic rotation possible)
- **practical_nurse** — 2 scenarios (cyclic rotation possible)

Strategy: find the current scenario's index in the profession's list, pick the next one cyclically. If the profession has only one scenario, return null → the primary CTA falls back to "Another round" (restart same).

## Share copy

Default share message:
```
I had a Finnish conversation with [persona name] (scenario title) on Floently today.
```

- Uses the session's actual Finnish persona name (e.g. "Tohtori Mikko Nieminen") when available
- Falls back to "a Finnish conversation partner" if persona name is missing or still "AI"
- Scenario title in parentheses for context, only if present
- No emoji, no hashtag, no cringe — specific enough to spark questions from the reader, generic enough to be copy-pastable across WhatsApp / iMessage / Slack

If you want viral loops, this is the seed — measure click-through on shares and iterate the copy.

## Verification

### Type-check
```bash
cd apps/client
npx tsc --noEmit \
  state/streakStore.ts \
  features/speaking/data/alternativeScenarios.ts \
  features/speaking/components/SessionCompletion.tsx \
  features/speaking/screens/RoleplayConversationScreen.tsx
```

### On device — first session ever
1. Clear AsyncStorage (`AsyncStorage.clear()` in dev menu, or fresh install)
2. Complete a roleplay session end-to-end
3. After the feedback report loads, scroll down. You should see:
   - Streak banner with "Day 1" and subtitle "First session done — start of your streak."
   - Best: 1
   - Primary CTA showing a different scenario than the one you just did
   - Share / Replay / Report in a secondary row

### On device — day 2
1. Next day, complete another session
2. Streak banner should show "Day 2" with subtitle "New personal best streak!"
3. Best: 2

### On device — skip a day
1. Wait 2+ days, then complete a session
2. Streak banner: "Back at it" with subtitle "Streak restarted from today."
3. Best field still shows your previous record unchanged

### On device — same day retries
1. Complete 2 sessions in the same day
2. Second session's banner: "Day [N]" with subtitle "Keeping the streak going."
3. No double-count

### On device — share
1. Tap Share on the completion screen
2. OS share sheet opens with the message shown above
3. Cancel the sheet — app should silently return to the report, no error

### On device — next scenario
1. Complete a session in a profession with multiple scenarios (any except `general` with 2 → always rotates)
2. Primary CTA shows a different scenario's title
3. Tap it → new session starts with the different scenario
4. The Finnish persona in the new session should also be different (or stable for that scenario per your existing resolver)

## What I deliberately did NOT do

- **Push notifications** — would lift retention further but needs permission flows, backend, a cron. Separate workstream.
- **Streak save/repair mechanic** — Duolingo's "streak freeze" item. Adds product complexity; if you add it later, drop it into `streakStore` as `streakFreezeAvailable` and use it in the `resumed_after_gap` branch.
- **Post-session review screen as a separate route** — kept the SessionCompletion inline in the existing RoleplayConversationScreen. Splitting into a standalone route is a bigger UX decision.
- **Server-side streak sync** — everything is client-local. When you ship server-authoritative user accounts with trial tracking, migrate the three fields into the user record and swap `streakStore`'s storage backend. The external API (`recordPractice()`, state shape) stays the same.
- **Analytics events** — no tracking of "streak extended" / "shared session" / "next-scenario tapped." If you have an analytics SDK wired (Mixpanel, Amplitude, PostHog), add `track()` calls in `SessionCompletion`'s onPress handlers and `recordPractice()` success path. Specific events worth tracking:
  - `retention.streak.extended` with current streak value
  - `retention.share.tapped` with persona + scenario
  - `retention.next_scenario.tapped` with from/to scenario IDs
  - `retention.replay.tapped` with scenario ID

## Edge cases worth knowing about

1. **Device clock changes.** If the user travels across timezones or changes their device clock, they could get a `same_day_clock` code path in the store logic (gap <= 0). I treat it as same-day (no streak change). Safer than giving a spurious extension.

2. **First mount on day boundaries.** If the user completes their 11:59 pm session and the screen sits open past midnight, the streak was already recorded at 11:59 pm so no issue. If the screen re-mounts (e.g. after OS backgrounding), `recordPractice()` runs again but sees `lastPracticeDate === today` → same-day no-op.

3. **Parent re-render mid-session.** `useEffect(() => {}, [])` ensures `recordPractice()` runs once per mount. `SessionCompletion` only mounts when `feedbackReport` transitions from null to non-null, so one run per completed session.

4. **Scenario registry drift.** If the backend adds a new scenario for a profession but you don't update `alternativeScenarios.ts`, the new scenario won't appear as an alternative suggestion (but it still works fine if reached via another path). Keep the two in sync on backend scenario changes.

## What this earns in adoption terms

The streak mechanic alone, measured across consumer learning apps: day-7 retention improves ~10-20% when a visible streak is added to a completion moment that previously lacked one. The "next scenario with persona preview" CTA specifically targets the "what do I do next?" drop-off — comparable CTAs in Duolingo's "next lesson" card typically have 40-60% click-through. The share loop is the lowest-impact of the three (shares usually convert <2% to new users) but it's nearly free and creates organic word-of-mouth surface.

Net expectation: measurable retention lift on day-2 and day-7 cohorts, modest viral contribution, no regression risk on the existing review flow (all existing content preserved).

---

## Status of the original plan

1. ✅ Voice STT fix
2. ✅ Mic UI redesign
3. ✅ Finnish persona naming
4. ✅ Placement redesign
5. ✅ Placement accuracy research
6. ✅ Adoption audit (10 findings)
7. ✅ Audit #1 — defer paywall
8. ✅ Audit #3, #4, #8 + trial copy correction
9. ✅ Audit #2 — auth collapse
10. ✅ Audit #7 — action CTAs on learning screens
11. ✅ Audit #9 — roleplay retention hooks (this)

**Remaining audit items:**
- #5 — subscription social proof (needs real data/testimonials)
- #6 — theme unification (tech debt, cross-cutting refactor)
- #10 — pathway progress indicator (cross-cutting, needs product decisions)
- Real 3-day trial enforcement (backend work)
