# Mobile Bundle Multi-Product Build Plan

## Goal

Bundle Floently Learn and Floently Read under one Floently app experience without damaging the ready Learn product.

## Current status

Learn is ready or close to release.

Read exists separately and is deployed on Render.

The current Learn mobile app already contains a public product gateway with Learn and Read surfaces. Read is preview-only / coming-soon.

## Phase 0: protect Learn

Before any Read integration work:

1. Confirm server repo is clean.
2. Confirm branch is correct.
3. Confirm latest Learn work is pushed to GitHub.
4. Do not change package name.
5. Do not increment app version.
6. Do not touch payment logic.
7. Do not touch generated dist/.expo output unless intentionally building.

## Phase 1: documentation and contract

Create and maintain:

- docs/architecture/floently_multi_product_mobile_architecture.md
- docs/architecture/product_entitlements_contract.md
- docs/runbooks/mobile_bundle_multi_product_build_plan.md

This phase is safe and does not require a mobile rebuild.

## Phase 2: public gateway review

Inspect and improve only the existing public gateway if necessary.

Current files of interest:
- apps/client/state/LandingRoute.tsx
- apps/client/features/publicMarketing/screens/NativePublicMarketingScreens.tsx

Keep Read preview-only until Read entitlement and access flow are ready.

## Phase 3: authenticated product chooser decision

Only add an authenticated ProductHomeScreen if there is a clear reason.

Possible choices:

A. Keep current Learn home as authenticated default.
B. Add a small "Switch product" entry later.
C. Add authenticated product chooser after login only when Read is actually usable.

For now, prefer A because Learn is ready and should not be disrupted.

## Phase 4: Read mobile preview

Possible preview approaches:

- coming-soon screen
- webview to a mobile-friendly Read URL
- deep link to external Read web app

Do not implement native Read screens inside Learn until access separation is ready.

## Phase 5: real Read integration

Only after Read product and access are clear:

1. Define Read entitlement.
2. Define Read RevenueCat products.
3. Add Read route/module.
4. Add Read paywall.
5. Add Read service boundary.
6. Add tests/checks.
7. Build development preview.
8. Then consider production release.

## Verification commands

Use these before code changes:

git status --short
git branch --show-current
git log --oneline -5

Use these after doc-only changes:

git diff -- docs/architecture docs/runbooks
git status --short

For client checks after code changes:

cd apps/client
npm run lint

## Release rule

Documentation-only changes do not require app store build.

Read preview UI changes may be OTA if compatible with the existing native binary.

Native module changes require a new native build.
