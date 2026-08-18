# Agent A — Protected Professional Roleplay Deep-Link Bridge Research

Date: 2026-08-18
Source baseline: `e3685e61cd207fa12c16cd9ffa4a85ecb7f95278`
Scope: non-production Wave-1 follow-up only

## Problem

Professional mission Roleplay descriptors already exist in Agent F's accepted source and carry canonical `profession`, `scenarioId`, `entryMode`, `missionId`, and `contextId` launch parameters. Practice preserves descriptor launch parameters. However the file-system `/speaking` entry currently mounts `AppShell requestedScreen="speaking-practice"` without a reviewed URL-to-preset bridge, so mission-specific Roleplay is deliberately excluded from Practice.

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
  - `useLocalSearchParams` is already an AppShell dependency.
- `apps/client/app/speaking/index.tsx`
  - Current file-system route is intentionally thin and does not parse params.
- `apps/client/features/practice/IntegratedPracticeRoute.tsx`
  - Practice preserves `launch.params` when pushing canonical task routes.
- `apps/client/features/professional/missionPracticeEntries.ts`
  - Reading and Writing mission entries are available.
  - Mission Roleplay is explicitly deferred until this bridge is reviewed.
- `apps/client/scripts/verify-navigation-invariants.mjs`
  - Protects route reconciliation and drawer behavior.
- `apps/client/scripts/verify-wave1-professional-mission-integration.mjs`
  - Permanently guards the current Roleplay deferral and is the natural place to replace that deferral with positive bridge assertions.

## Safety requirements

1. Do not modify Agent F's accepted mission source files.
2. Do not modify `RoleplayConversationScreen`, microphone/STT, audio ownership, backend session ownership, or voice identity.
3. Parse only known canonical values at the route boundary:
   - profession: `doctor | nurse | practical_nurse`
   - entryMode: `workplace | interview`
   - scenarioId/contextId/missionId: bounded non-empty strings used only as launch metadata/preset values.
4. Unknown/invalid profession or entry mode must fail closed to the existing generic protected speaking entry rather than creating cross-profession access.
5. URL params must never create an entitlement. Existing AppShell subscription guards and SpeakingRoute profession isolation remain authoritative.
6. A valid mission launch should lock profession and open the conversation surface directly.
7. Ordinary `/speaking` without mission params must retain current behavior.
8. Existing in-process Professional/YKI speaking launches must remain unchanged.
9. Practice may surface a cloned mission Roleplay descriptor as `available` only after the bridge is present; F's original descriptor must stay byte-identical and remain `degraded` in its source package.
10. Professional Listening remains unavailable.

## Implementation shape

Use a small pure parser/adapter module owned by Agent A, consumed by `AppShell` through its existing `useLocalSearchParams`. This keeps validation independently testable and avoids teaching the file-system route or Roleplay runtime about mission business logic.

The parser returns either:
- a validated speaking preset fragment for a canonical professional mission launch; or
- `null`, which preserves existing speaking behavior.

AppShell should seed `speakingPreset` from that parsed URL preset only for the `/speaking` route entry. Internal callbacks continue to set their own presets as today.

Then update `missionPracticeEntries.ts` to include the F-owned `produce` step as a cloned Practice entry with `health: 'available'`, preserving task identity, profession entitlements, mission/context/scenario params, and canonical `/speaking` route.

## Regression coverage

Permanent tests must prove:

- ordinary `/speaking` remains valid with no params;
- valid doctor/nurse/practical_nurse mission params parse exactly;
- profession cannot be invented by arbitrary strings;
- invalid entryMode fails closed;
- mission Roleplay Practice entry exists only for the active canonical profession;
- roleplay entry preserves `missionId`, `contextId`, `profession`, `scenarioId`, and `entryMode`;
- Practice-facing clone is `available` while F's original mission task remains `degraded`;
- no Professional Listening runtime is manufactured;
- navigation invariants, Roleplay audio/scenario tests and whole-client TypeScript remain green.

## Production boundary

No production deployment, server restart, database migration, OTA, App Store/Play action, canonical/main ref promotion, or live artifact action is authorized by this work.
