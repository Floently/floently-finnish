# Card level-gating and staged-difficulty research — 2026-09-27

Branch: `feature/build47-card-level-gate-20260927`
Base: `1b0782b342aa2cd47c0db3c6eec4f6ff6494976d`
Scope: issue #46 Card UX only; preserve the existing adaptive review engine and published card authority.

## Research gate

`RESEARCH_GATE=PASS`

## External evidence

### Council of Europe — CEFR common reference levels

Sources:
- https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions
- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors

Accessed: 2026-09-27.

Relevant findings:
- CEFR organises proficiency as A1, A2, B1, B2, C1 and C2.
- The levels are progressive reference points and can be grouped into broader bands for curriculum/material design.
- CEFR explicitly supports using reference levels to design learning materials and orient learners.

Implementation decision:
- KieliValmis Cards will expose its already-supported broad bands `A1–A2`, `B1–B2`, `C1–C2` because the canonical published card bank is organised primarily in those bands.
- Level choice is a real server filter, not a cosmetic label.
- No card session may begin before the learner explicitly confirms the band.

### Finnish National Agency for Education — YKI proficiency levels

Source:
- https://www.oph.fi/en/education-and-qualifications/selecting-right-yki-test-test-days

Accessed: 2026-09-27.

Relevant findings:
- YKI uses a six-point scale corresponding to CEFR A1–C2.
- Basic = A1/A2, intermediate = B1/B2, advanced = C1/C2.
- Learners must choose the YKI test level they take.

Implementation decision:
- The three existing KieliValmis card bands map cleanly to basic/intermediate/advanced proficiency groupings.
- Cards remain general learning material; selecting a band does not turn ordinary Cards into YKI-specific content.

## Repository findings

1. `CardPracticeSession` currently parses an optional `level` route parameter but immediately mounts `useCardPractice(...)`.
2. When no route level exists, `scope.level` is null and `cardsService.start(...)` starts an unscoped session.
3. `cardsService` already sends the selected level to both adaptive-session and deck endpoints.
4. Backend `LevelBand` already supports `A1_A2`, `B1_B2`, and `C1_C2`.
5. The canonical validated bank is predominantly organised in those broad bands, so offering unsupported fine-grained A1/A2/etc. choices would create avoidable empty sessions.
6. The backend repository already filters cards strictly by `level_band`.
7. Adaptive review state and repetition already operate on the filtered candidate set; level gating does not require a second scheduler.
8. `DifficultyBand` already defines `intro`, `core`, `stretch`.
9. The runtime `CardSelector` already prefers easier difficulty early when it appends cards dynamically.
10. The initial adaptive queue builder does **not** currently include authored card difficulty in its sort key. New cards with otherwise equal state can therefore enter in card-ID order rather than authored difficulty order.
11. No native dependency, billing/auth change, database migration, or card schema change is required.

## Product contract

Before every new Card session:

1. Show one compact level-choice screen.
2. Preselect the route-requested or last-used level when available.
3. Require an explicit **Start** action; preselection never auto-starts.
4. Starting passes a non-null level filter to the existing Cards API.
5. Switching Vocabulary / Phrases / Grammar creates a new session and therefore returns to level confirmation.
6. Restarting a completed session also returns to level confirmation.
7. Remember the last confirmed band locally so reopening can pre-highlight it without bypassing confirmation.

Difficulty contract inside a confirmed level:

- authored `intro` cards precede `core`, and `core` precede `stretch` when review-state priority is otherwise equal;
- due/weak review remains adaptive and is not discarded;
- no cross-level candidate can enter the session because repository filtering happens before adaptive scheduling.

## Acceptance criteria

1. No Cards session request runs while level confirmation is pending.
2. Confirmed level is always one of `A1_A2`, `B1_B2`, `C1_C2`.
3. A route-provided compatible level is preselected but still requires confirmation.
4. Last-used level is persisted and may be preselected on reopen.
5. Mode change invalidates confirmation before a replacement session can start.
6. Restart invalidates confirmation before a replacement session can start.
7. Existing review banks, hints, audio, reporting and answer flow remain unchanged once a session has started.
8. Initial adaptive ordering uses authored difficulty as a deterministic tie-breaker.
9. Permanent client/backend tests guard the level gate and staged ordering.
10. No YKI-specific card claim is introduced.
11. No production deployment, OTA publication, App Store action, native dependency, auth/billing change or migration.

## Rejected alternatives

- Fine-grained A1/A2/B1/B2/C1/C2 selector: rejected for this tranche because published coverage is primarily broad-band and an exact level can be legitimately empty.
- Client-side filtering after download: rejected; the backend already provides authoritative level filtering.
- Replacing adaptive review with a fixed linear deck: rejected; it would discard spaced/retrieval behaviour.
- Auto-starting from a remembered level: rejected; issue #46 explicitly requires confirmation before a new session.

`PRODUCTION_ACTIONS=NONE`
