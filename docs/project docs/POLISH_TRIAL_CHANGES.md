# Polish + Trial Copy Shipment

Five audit items combined into one shipment, plus the 3-day trial copy correction.

## What's in here

| Audit item | Files |
|---|---|
| #3 Welcome screen rewrite | `features/onboarding/screens/WelcomeScreen.tsx` |
| #4 Intent quiz polish | `features/onboarding/screens/IntentQuizScreen.tsx` |
| Frequency screen polish | `features/onboarding/screens/PracticeFrequencyScreen.tsx` |
| Trial copy correction (3-day + access split) | `features/onboarding/screens/PlanSelectionScreen.tsx`, `features/billing/screens/SubscriptionScreen.tsx` |
| #8 Empty states across learning hub | NEW `features/shared/EmptyState.tsx` + 5 learning screens |

**Total:** 1 new file, 10 patched files. All theme-consistent with your existing `colors`/`floentlyPalette` system. No new dependencies.

## Files to install

| Destination | Type |
|---|---|
| `apps/client/features/onboarding/screens/WelcomeScreen.tsx` | Replace |
| `apps/client/features/onboarding/screens/IntentQuizScreen.tsx` | Replace |
| `apps/client/features/onboarding/screens/PracticeFrequencyScreen.tsx` | Replace |
| `apps/client/features/onboarding/screens/PlanSelectionScreen.tsx` | Replace |
| `apps/client/features/billing/screens/SubscriptionScreen.tsx` | Replace |
| `apps/client/features/shared/EmptyState.tsx` | **New** |
| `apps/client/features/learning/screens/ConfidenceTrackerScreen.tsx` | Replace |
| `apps/client/features/learning/screens/RevisionVaultScreen.tsx` | Replace |
| `apps/client/features/learning/screens/YkiPlannerScreen.tsx` | Replace |
| `apps/client/features/learning/screens/WorkplaceIncidentLabScreen.tsx` | Replace |
| `apps/client/features/learning/screens/PersonalPhraseBankScreen.tsx` | Replace |

## Trial copy — grounded in your actual route guards

The trial messaging throughout uses the precise access split from your own code:

**Trial covers** (free preview mode):
- 1 roleplay session
- 1 card session
- 1 YKI practice (YKI preview only, 0 for professional previews)
- Home, Billing, Help, Settings, Progress always accessible
- Speaking Practice accessible in professional previews (doctor/nurse/practical_nurse)
- Professional Finnish accessible in professional previews
- YKI Practice accessible in YKI preview

**Paid-only** (blocked in preview):
- Learning + Daily Practice (requires `entitlements.learnAccess` and `!isPreview`)
- YKI Exam (preview always blocked)
- Unlimited roleplay/cards/YKI practice

Source references from your codebase:
- Route guards: `apps/client/state/AppShell.tsx:235-258`
- Preview block: `apps/client/state/AppShell.tsx:478`
- Session limits: `apps/client/state/subscriptionStore.ts:188`
- Preview entry: `apps/client/state/BillingRoute.tsx:14`

If the gates ever change, update `TRIAL_INCLUDES` and `TRIAL_EXCLUDES` at the top of `SubscriptionScreen.tsx` and the `What the 3-day trial covers` panel in `PlanSelectionScreen.tsx`. Those two lists are the source of truth for user-facing trial copy.

## Notable design decisions

### Welcome screen
- **One CTA, not two.** "Get started" routes to intent. Removed the "Explore pathways" duplicate.
- **Specific promise headline:** "Talk to Finnish patients, colleagues, and clients with confidence" replaces the generic "Build your Finnish path."
- **Audience signal:** "Built for nurses, doctors, practical nurses, and YKI candidates." Specificity IS the social proof when you don't have user numbers yet.
- **Pre-CTA reassurance:** "Quick 2-minute setup · 3-day free trial on selected features" — honest, not hidden.
- **Sign-in link** added for returning users so they don't mistakenly go through onboarding.

### Intent quiz
- **Shorter cards.** 80+ words per card became ~25. Each has: label, one-line audience, one-line "first lesson" preview.
- **"MOST POPULAR" highlight** on the Bundle option. Subtle: thicker border, small pill badge at top. Nudges toward the higher-margin option without being pushy.
- **Progress eyebrow** ("STEP 1 OF 3") added for flow orientation.

### Practice frequency
- **Three options reframed:** removed marketing-speak ("pathway", "realistic mix of...") in favor of direct descriptions.
- **Minute estimates** added per option — ~10 min / session, ~10 min / day, ~25 min / day. Users pick based on realistic time budgets, not aspirational frequency labels.
- **Footer reassurance:** "No commitment yet — you'll see your Finnish level first." Reinforces the value-first framing.

### Subscription screen
- **Billing period toggle** (yearly/monthly pill) replaces the old approach of showing all plans mixed.
- **Recommended plan highlighted** with a pill badge and thicker border. Picked automatically: bundle for BOTH intent, otherwise the first plan in the user's category.
- **"Start 3-day free trial" CTA** on every plan instead of implicit "buy now."
- **Explicit access split panel** showing what the trial covers and what unlocks with paid.
- **Demoted the organisations footer** from a full-weight card to a small underlined link. User attention is reserved for the user-relevant options.
- **Per-plan filtering:** plans are filtered by the user's onboarding intent when available, so a YKI user doesn't see three professional bundles they don't need.

### Empty states
- **Shared `EmptyState` component.** Accepts icon, title, description, CTA label, and CTA action.
- **Theme-aware** via `getFloentlyPalette(themeMode)`, same pattern as `FeatureScaffold`.
- **Each learning screen** routes its CTA to the action that would populate that screen:
  - Confidence Tracker → Speaking (practice sessions generate confidence data)
  - Revision Vault → Learn (phrases from the bank enter the vault)
  - YKI Planner → YKI Practice (practice sessions build milestones)
  - Workplace Incident Lab → Professional (workplace roleplays seed incidents)
  - Phrase Bank → Speaking (roleplays are the easiest way to discover saveable phrases)

## Verification

```bash
cd apps/client
npx tsc --noEmit \
  features/onboarding/screens/WelcomeScreen.tsx \
  features/onboarding/screens/IntentQuizScreen.tsx \
  features/onboarding/screens/PracticeFrequencyScreen.tsx \
  features/onboarding/screens/PlanSelectionScreen.tsx \
  features/billing/screens/SubscriptionScreen.tsx \
  features/shared/EmptyState.tsx \
  features/learning/screens/ConfidenceTrackerScreen.tsx \
  features/learning/screens/RevisionVaultScreen.tsx \
  features/learning/screens/YkiPlannerScreen.tsx \
  features/learning/screens/WorkplaceIncidentLabScreen.tsx \
  features/learning/screens/PersonalPhraseBankScreen.tsx
```

On device, fresh install:
1. Launch → Welcome (new copy, single CTA)
2. Tap "Get started" → Intent quiz (new cards with "First lesson" preview, MOST POPULAR badge on Bundle)
3. Pick an intent → Profession (if non-YKI) or Frequency
4. Pick frequency → Register (or subscription if already logged in)
5. Register → home → placement (from previous shipment)
6. Placement complete → subscription (new trial-start framing, highlighted recommended plan, explicit access split)

Logged-in user, visit learning hub screens with no data:
1. Confidence Tracker → empty state with "Start a practice session" CTA
2. Revision Vault → empty state with "Add to your phrase bank" CTA
3. YKI Planner → empty state with "Start YKI practice" CTA
4. Workplace Incident Lab → empty state with "Try a workplace roleplay" CTA
5. Phrase Bank → empty state appears below the add-phrase form with "Try a roleplay to collect phrases" CTA

## What this doesn't cover

- **Audit #2** (collapse auth screens) — 3×800-line screens. Separate larger shipment.
- **Audit #5** subscription redesign beyond copy/structure — no social proof module, no currency localization, no testimonials. The framework is in place to add these later without further structural changes.
- **Audit #6** theme unification — hard-coded hex values still exist throughout. This shipment added no new drift but didn't clean up existing drift.
- **Audit #7** action CTAs on learning screens — the empty state CTAs are a first step but the *populated* state still doesn't have a "practice now" button. That's a separate focused shipment.
- **Audit #9** roleplay retention hooks and **#10** pathway progress indicator — both require reading more code than was in scope here.
- **Real trial enforcement** (server-side `trial_started_at`, 3-day expiry, downgrade logic). The copy is honest, but the actual gating is still whatever your `subscriptionStore` and `paymentService` do today.

## What to check on device before shipping

- The "MOST POPULAR" pill position on Intent quiz should sit clearly at the top-left of the Bundle card, not overlap text. If your font sizing renders it tight, nudge the `top: -10` value.
- The Subscription screen billing-period toggle default is `yearly` (better for conversion + margin). Change the `useState<BillingPeriod>('yearly')` default to `'monthly'` if that contradicts your pricing strategy.
- The Empty State default theme is `'dark'`. If any of the learning screens run in light mode, pass `themeMode={themeMode}` explicitly — I left that as a prop so you can opt in where it matters.
- The `/speaking`, `/yki-practice`, `/professional`, `/learn` routes used by empty state CTAs — verify these are the correct path strings in your router. They match what I saw in `navigationModel.ts` but a quick tap test will confirm.

## Next audit items, sorted by remaining impact

1. **#7 Action CTAs on populated learning screens** — now that empty states route correctly, the natural next step is "when you do have data, here's what to practice next." Adds the "Practice weak words →" button pattern. Medium effort, high retention impact.
2. **#1 full trial implementation** — server-side 3-day window, expiry, downgrade. Backend work required; I can design the client side once backend is ready.
3. **#5 Social proof on subscription** — testimonials module, "X% of doctors pass YKI" stat. Needs real data.
4. **#2 Collapse auth screens** — tech debt. Medium effort, mostly invisible to users but significantly improves maintainability.
5. **#6 Theme unification** — cross-cutting refactor. Visible polish across every screen.
6. **#9 Roleplay end-of-session retention** — one of the highest-leverage retention hooks. Needs a proper read of the 835-line file.
7. **#10 Pathway progress indicator** — high-touch but cross-cutting, needs product decisions.
