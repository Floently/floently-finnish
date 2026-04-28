# Pass 2 Merge Log

## Merge actions completed

1. Confirmed `apps/client/features/*` already held the active client feature authority
   - no feature code needed to be merged from `apps/client/src/features/*`

2. Confirmed the YKI speaking AppShell patch was already integrated
   - inspected `apps/client/src/features/yki_speaking/AppShell_yki_speaking_patch.ts`
   - verified equivalent behavior already exists in:
     - `apps/client/state/AppShell.tsx`
     - `apps/client/state/YkiPracticeRoute.tsx`
   - no code merge required

3. Confirmed navigation authority already survived outside `apps/client/src/navigation/*`
   - active authority remains in `apps/client/state/navigationModel.ts`, `apps/client/app/*`, and feature-local route helpers
   - no code merge required

4. Consolidated client API/config authority to `packages/core/api/apiConfig.ts`
   - `apps/client/core/api/apiConfig.ts` was a weaker duplicate
   - no live imports needed rewriting because aliases already resolve to `packages/core/api/apiConfig.ts`

## Net result

Pass 2 removed duplicate residue rather than rewriting live client behavior. The active authority was already canonical before quarantine.
