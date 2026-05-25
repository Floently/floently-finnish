# Deferred card overlay/API work before mobile release

Date: 2026-05-25

This note records a deliberate release decision.

## What was deferred

The following uncommitted files contained experimental/runtime card overlay and card API changes:

- apps/backend/app/routers/v1_cards.py
- apps/backend/app/runtime/card_i18n_overlay_runtime.py
- apps/backend/app/services/cards_service.py
- packages/core/api/cards.ts

The work attempted to add or improve:

- ui_language support on the older /cards/session endpoint
- runtime card overlay application
- a new launch_overlay_bank lookup path
- English leakage blocking for non-English card UI
- client-side cleanup of unsafe card/API text such as HTML or 502 responses

## Why it was deferred

The existing committed/core overlay folder still exists:

- apps/backend/card_bank/overlays

But the uncommitted code referenced an additional generated folder:

- apps/backend/card_bank/canonical_bank/launch_overlay_bank

That generated launch_overlay_bank folder was not present in the current release tree.

Live testing showed that the missing launch_overlay_bank did not crash the backend, but the uncommitted code did not reliably solve the tested Swedish card leakage problem. The /cards/session?ui_language=sv test still returned English prompts/options for sampled cards.

Because the final mobile release must avoid unverified runtime dependencies, this overlay/API work was deferred instead of being included in the release.

## Patch backup

The uncommitted work was saved outside the repo before restore:

- /root/floently-saved-work/card-overlay-api-deferred-before-release-20260525_155836.patch
- /root/floently-saved-work/card-overlay-api-deferred-before-release-20260525_155836.patch.sha256

Checksum:

fb9d117d1c2c68129867c5b5b0b72e9e200cf8142b0c8c041f42a773249fc33a  /root/floently-saved-work/card-overlay-api-deferred-before-release-20260525_155836.patch

## Release decision

For the current mobile release:

- do not include the unverified launch_overlay_bank dependency
- keep the existing committed overlay system
- do not delete the existing apps/backend/card_bank/overlays folder
- revisit this patch after release with full overlay-bank validation

## Required future validation before reapplying

Before this work is allowed back into release code:

1. Confirm whether launch_overlay_bank is required or optional.
2. Recreate or intentionally remove launch_overlay_bank support.
3. Test /cards/session/adaptive/start with authenticated app flow.
4. Test /cards/deck with authenticated app flow.
5. Test at least 5 non-English UI languages.
6. Confirm non-English cards do not show English prompts/options/explanations.
7. Confirm no cards are silently filtered to empty decks.
8. Add a regression guard for English leakage in non-English card UI.
