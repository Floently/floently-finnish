# Agent A — Protected Professional Roleplay Deep-Link Bridge Research

Date: 2026-08-18
Source baseline: `e3685e61cd207fa12c16cd9ffa4a85ecb7f95278`
Scope: non-production Wave-1 follow-up only

## Problem

Professional mission Roleplay descriptors already exist in Agent F's accepted source and carry canonical `profession`, `scenarioId`, `entryMode`, `missionId`, and `contextId` launch parameters. Practice preserves descriptor launch parameters. However the file-system `/speaking` entry currently mounts `AppShell requestedScreen="speaking-practice"` without a reviewed mission URL-to-preset bridge, so mission-specific Roleplay was deliberately excluded from Practice in the frozen UAT source.

## Existing owner contracts inspected

- `packages/core/professional/missions.mjs`
  - Agent F remains source authority for Professional mission descriptors.
  - Roleplay steps target `/speaking`.
  - Roleplay launch params include `missionId`, `contextId`, `profession`, `scenarioId`, `entryMode: 'workplace'`.
  - F-owned Roleplay mission task health is `degraded` until an integration bridge proves the launch.
- `apps/client/state/SpeakingRoute.tsx`
  - Existing protected runtime already accepts `initialProfession`, `initialScenarioId`, `lockProfession`, `entryMode`, and `contextLabel`.
  - Conversation surface passes profession/scenario into `RoleplayConversationScreen`.
  - Profession isolation is already enforced inside the route.
- `apps/client/state/AppShell.tsx`
  - Existing in-process Professional, YKI and Learning launches construct `SpeakingPreset` and pass it to `SpeakingRoute`.
  - It also owns background audio cleanup for ordinary app-shell routes.
- `apps/client/app/speaking/index.tsx`
  - Current ordinary file-system route is intentionally thin and stays behind AppShell.
- `apps/client/state/authStore.ts`
  - `hydrateSession()` restores/validates the stored authenticated session and updates the API auth token.
- `apps/client/state/subscriptionStore.ts`
  - exposes `hasLoaded`, `isLoading`, `status`, `hydrate(user)`, and entitlement-aware `setActiveContext`.
  - preview status is explicitly identifiable through `isPreview`.
  - `setActiveContext` refuses contexts outside the current allowed entitlements.
- `apps/client/features/practice/IntegratedPracticeRoute.tsx`
  - Practice preserves `launch.params` when pushing canonical task routes.
- `apps/client/features/professional/missionPracticeEntries.ts`
  - Reading and Writing mission entries are available.
  - Mission Roleplay was explicitly deferred until this bridge was reviewed.
- `apps/client/scripts/verify-navigation-invariants.mjs`
  - protects ordinary route reconciliation and drawer behavior.
- `apps/client/scripts/verify-wave1-professional-mission-integration.mjs`
  - permanently guarded the previous Roleplay deferral and is the natural place for positive/negative bridge tests.

## Safety requirements

1. Do not modify Agent F's accepted mission source files.
2. Do not modify `RoleplayConversationScreen`, microphone/STT, backend session ownership, voice identity, or the existing SpeakingRoute contract.
3. Parse only a complete canonical mission tuple. `missionId`, `profession`, `contextId`, `scenarioId`, and `entryMode` must all agree with the same Agent F mission/Roleplay step.
4. Ambiguous array params, unknown missions, unsafe identifiers, overlong identifiers, cross-profession, cross-context, wrong scenario, or wrong entry mode must fail closed.
5. URL params must never create an entitlement. A mission launch requires either internal-all-access or non-preview `professionalAccess` plus the exact profession entitlement.
6. A valid mission launch locks profession and opens the existing SpeakingRoute conversation surface.
7. Ordinary `/speaking` must remain byte-behaviorally unchanged behind AppShell and must not gain mission parsing.
8. Existing in-process Professional/YKI speaking launches must remain unchanged.
9. Practice may surface a cloned mission Roleplay descriptor as `available` only after the guarded adapter exists; Agent F's original descriptor must stay byte-identical, `degraded`, feature-flagged, and routed to `/speaking`.
10. Professional Listening remains unavailable.
11. The guarded mission route must not render mission content while auth or subscription state is unresolved.
12. Because the valid mission adapter renders `SpeakingRoute` directly, it must preserve AppShell's background audio release invariant.

## Architecture decision

The first implementation idea was to teach the large `AppShell.tsx` file to parse mission URL params. The available GitHub editing path only supports whole-file replacement for an existing large file, and a temporary self-patching workflow was not eligible as a branch-introduced PR workflow. Rather than reconstruct or broadly churn AppShell, that approach was abandoned and its temporary workflow removed.

The final narrow design is an integration-owned adapter route:

`/speaking/mission`

Key properties:

- ordinary `/speaking` remains exactly behind AppShell;
- Agent F's accepted descriptor remains unchanged and continues to target `/speaking` with `health: 'degraded'`;
- only the Agent-A Practice-facing clone changes its launch route to `/speaking/mission`, while preserving the exact F launch params;
- `professionalMissionSpeakingParams.mjs` validates the entire tuple against `PROFESSIONAL_MISSIONS` and has a declaration contract for the client;
- the mission route waits for auth hydration and authenticated subscription hydration;
- invalid/unauthorized tuples fall back to `<AppShell requestedScreen="speaking-practice" />` with no mission preset;
- authorized tuples call `setActiveContext` only after exact profession entitlement succeeds, then reuse `SpeakingRoute` with the validated preset;
- the route preserves background `audioSession.releaseAll('background')` cleanup;
- no Roleplay internals are imported by the adapter.

This is deliberately a separate guarded adapter rather than redefining the meaning of the shared `/speaking` route.

## Practice clone behavior

`missionPracticeEntries.ts` selects the existing Agent F `produce` / `roleplay` step and clones it. The clone changes only integration-owned launch availability fields:

- `launch.route: '/speaking/mission'`
- `health: 'available'`
- `featureFlag: undefined`

Task identity, content version, required entitlements, profession, mission/context/scenario params, skills, modality, topic, tags and authored content remain derived from the accepted F step.

## Regression coverage

Permanent tests must prove:

- ordinary `/speaking` remains behind AppShell and does not parse mission params;
- every doctor/nurse/practical_nurse canonical mission tuple parses exactly;
- unknown, ambiguous-array, unsafe and overlong identifiers fail closed;
- cross-profession, cross-context, wrong-scenario and wrong-entry-mode tuples fail closed;
- preview access fails closed even if preview status has Professional-looking fields;
- Professional access alone is insufficient without exact profession entitlement;
- exact profession entitlement alone is insufficient without Professional access;
- mission Roleplay Practice entry exists only for the active canonical profession;
- Practice clone targets `/speaking/mission` and preserves the canonical F params;
- Practice-facing clone is `available` while Agent F's original mission task remains `/speaking`, `degraded` and feature-flagged;
- the adapter route waits for auth/subscription hydration, reuses SpeakingRoute, locks profession, preserves background audio cleanup, and never imports RoleplayConversationScreen;
- no Professional Listening runtime is manufactured;
- navigation invariants, Roleplay audio/scenario tests, Practice composer/product-wiring tests and whole-client TypeScript remain green.

## Production boundary

No production deployment, server restart, database migration, OTA, App Store/Play action, canonical/main ref promotion, or live artifact action is authorized by this work. Frozen UAT PR #33 remains unchanged until this follow-up passes independent Agent-A QA and is deliberately considered for a later UAT candidate.
