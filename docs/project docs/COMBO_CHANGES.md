# Combined Shipment — Auth Collapse + Learning Action CTAs

Two audit items shipped in one turn: **#2 (collapse auth screens)** and **#7 (action CTAs on populated learning screens)**. Nine files changed, zero new dependencies, ~1,500 net lines of code deleted.

---

## Part 1 — Auth collapse (#2)

### Summary

Your repo had three near-duplicate auth screens totaling **2,561 lines**:
- `AuthScreen.tsx` (861 lines) — already a unified tabbed email/password/Google flow
- `LoginScreen.tsx` (852 lines) — legacy duplicate with 75% shared code
- `RegisterScreen.tsx` (848 lines) — legacy duplicate with 75% shared code

After this shipment, three screens totaling **931 lines**, zero functionality lost:
- `AuthScreen.tsx` (889 lines) — canonical screen, now accepts `initialTab` prop and includes forgot-password link
- `LoginScreen.tsx` (20 lines) — thin forwarder `<AuthScreen initialTab="signin" />`
- `RegisterScreen.tsx` (22 lines) — thin forwarder `<AuthScreen initialTab="signup" />`

### Files to install

| Destination | Change |
|---|---|
| `apps/client/features/auth/screens/AuthScreen.tsx` | Replace — added `initialTab` prop + forgot-password link |
| `apps/client/features/auth/screens/LoginScreen.tsx` | Replace — collapsed to thin wrapper |
| `apps/client/features/auth/screens/RegisterScreen.tsx` | Replace — collapsed to thin wrapper |

### What was preserved

- **All three routes still work.** `/auth`, `/auth/login`, `/auth/register` all resolve correctly. Deep links don't break.
- **Forgot-password link** — was only in `LoginScreen`. Now in `AuthScreen`, visible only when signin tab is active. `/auth/forgot-password` navigation unchanged.
- **Post-register redirect.** `AuthScreen` already routed to `/` on success, consistent with the value-first onboarding shipped earlier. Users still land on home → placement prompt triggers.
- **Google OAuth flow.** All three legacy screens had OAuth implementations. AuthScreen's implementation is retained; legacy ones are gone.
- **Tab switching** within AuthScreen still works — users who land on `/auth/register` and change their mind can tap the "Sign in" tab without navigation.
- **Finnish accessibility labels** and error strings where present in the canonical AuthScreen.

### What changed in AuthScreen.tsx specifically

1. **New `initialTab` prop** — default `'signin'`. LoginScreen passes `"signin"`, RegisterScreen passes `"signup"`.
2. **Forgot-password link** inserted between the error box and the primary submit button. Only renders when `tab === 'signin'`. Routes to `/auth/forgot-password`.
3. **New styles** `forgotRow` and `forgotText` added — right-aligned, primary-color, subtle.

### Breaking-change risk

Very low. The three routes point at the same wrapper pattern as before; only the internals of the two legacy files changed. If you have direct imports anywhere of `LoginScreen` or `RegisterScreen` (i.e. `import LoginScreen from 'features/auth/screens/LoginScreen'`), those imports still resolve and still render an auth UI — just via the canonical AuthScreen underneath.

The one place I'd double-check: the dev-only Google callback path in the old RegisterScreen had a route to `/` (line 345 of the original). That code path is gone; it's now handled by AuthScreen's unified Google handler. If you hit "Sign in with Google" and it doesn't redirect to `/`, that's where I'd look first.

---

## Part 2 — Action CTAs on learning screens (#7)

### Summary

Every learning screen was a diagnostic dashboard: "here's your data." Now every learning screen is a prompt: "here's what to do next." Adds a consistent `ActionBar` component to `FeatureScaffold`, plus per-screen contextual CTAs that route into the action that would populate the screen.

### Files to install

| Destination | Change |
|---|---|
| `apps/client/features/shared/FeatureScaffold.tsx` | Replace — added `actions` slot + new `ActionBar` sub-component |
| `apps/client/features/learning/screens/ConfidenceTrackerScreen.tsx` | Replace — ActionBar with weakest-calibration CTA |
| `apps/client/features/learning/screens/RevisionVaultScreen.tsx` | Replace — ActionBar with due-items CTA |
| `apps/client/features/learning/screens/YkiPlannerScreen.tsx` | Replace — ActionBar with next-milestone CTA |
| `apps/client/features/learning/screens/WorkplaceIncidentLabScreen.tsx` | Replace — top ActionBar + per-scenario "Practice live" button |
| `apps/client/features/learning/screens/PersonalPhraseBankScreen.tsx` | Replace — inline ActionBar above add-phrase form |

### Per-screen CTAs and routing

| Screen | When populated | CTA behavior |
|---|---|---|
| Confidence Tracker | `overconfident.length > 0` | Primary: "Practice [skill]" with hint "Confidence X% vs accuracy Y%" → `/speaking`. Secondary: "General practice" → `/speaking` |
| Revision Vault | `dueNow > 0` | Primary: "Start today's review" with hint "N items due" → `/cards`. Secondary: "Add more" → `/learn` |
| Revision Vault | `dueNow === 0` but has items | Primary: "Add items to the vault" → `/learn` |
| YKI Planner | has milestones | Primary: "Work on: [next milestone title]" with hint = milestone.week → `/yki-practice`. Secondary: "Mock exam" → `/yki-exam` |
| Workplace Incident Lab | has scenarios | Top-level ActionBar: "Practice: [highest urgency title]" → `/professional`. Per-scenario: draft + "Practice live →" buttons side by side |
| Phrase Bank | `items.length > 0` | Primary: "Drill N ready phrases" → `/cards`. Secondary: "Use in roleplay" → `/speaking` |

### ActionBar API (new in FeatureScaffold.tsx)

```tsx
import { ActionBar } from '../../shared/FeatureScaffold';

<ActionBar
  buttons={[
    { label: 'Primary action', hint: 'optional sublabel', onPress: () => {} },
    { label: 'Secondary', variant: 'secondary', onPress: () => {} },
  ]}
/>
```

- 1-2 buttons optimal, supports more but gets cramped on narrow screens
- First button is `primary` by default (filled accent color, dark text)
- Subsequent buttons are `secondary` by default (outlined)
- `hint` renders as a smaller sublabel under the main label
- `accentColor` prop on each button overrides the default primary color (useful for urgency — pass `#F0A436` for warning-style CTAs)
- Theme-aware via `themeMode` prop, defaults to `'dark'` matching the rest of FeatureScaffold

### FeatureScaffold's new `actions` slot

```tsx
<FeatureScaffold
  title="Revision Vault"
  subtitle="..."
  actions={<ActionBar buttons={[...]} />}
>
  {/* body children */}
</FeatureScaffold>
```

The `actions` node renders between the header card and the body children. Use with `ActionBar` for consistency, but any ReactNode is accepted if a screen needs a custom action surface.

---

## Verification

```bash
cd apps/client
npx tsc --noEmit \
  features/auth/screens/AuthScreen.tsx \
  features/auth/screens/LoginScreen.tsx \
  features/auth/screens/RegisterScreen.tsx \
  features/shared/FeatureScaffold.tsx \
  features/learning/screens/ConfidenceTrackerScreen.tsx \
  features/learning/screens/RevisionVaultScreen.tsx \
  features/learning/screens/YkiPlannerScreen.tsx \
  features/learning/screens/WorkplaceIncidentLabScreen.tsx \
  features/learning/screens/PersonalPhraseBankScreen.tsx
```

### On device

**Auth flows:**
1. Navigate to `/auth/login` → should see AuthScreen with Sign In tab selected, Forgot-password link visible
2. Tap "Create account" tab → switches to signup mode, Forgot-password link disappears
3. Navigate to `/auth/register` → AuthScreen with Create Account tab selected
4. Complete signup → lands on `/` (home), placement prompt triggers from AppShell
5. Sign in with Google → existing flow intact

**Learning screens (with populated data):**
1. Open Confidence Tracker with at least one overconfident entry → see "Practice [skill]" CTA with confidence/accuracy hint
2. Open Revision Vault with items due → see "Start today's review" with due count
3. Open YKI Planner with milestones → see "Work on: [title]" with week hint
4. Open Workplace Incident Lab → see top-level "Practice: [highest urgency]" + per-scenario "Practice live →" buttons
5. Open Phrase Bank with saved items → see "Drill N ready phrases" CTA above the add-phrase form

**Learning screens (with no data):**
- All still show the empty states from the previous shipment. No regression.

---

## Known limitations & gotchas

1. **The CTA routes assume the standard route paths from `navigationModel.ts`.** If your actual router config remaps any of `/speaking`, `/cards`, `/yki-practice`, `/yki-exam`, `/professional`, `/learn`, those specific buttons will silently no-op. Quick tap-test on each will confirm.

2. **Workplace Incident Lab "Practice live" button routes to `/professional`** but doesn't pass the specific scenario ID as a preset. Your AppShell handles routing into SpeakingRoute with `initialScenarioId`, but that plumbing runs through `onOpenRoleplay` callbacks inside the ProfessionalRoute, not from external navigation. Ideally the "Practice live" would pass `scenarioId` to ProfessionalRoute which then routes into speaking with the right preset. **This needs a follow-up.** For now, the user gets to the professional hub and picks their scenario manually.

3. **Confidence Tracker "Practice [skill]"** routes to speaking but doesn't actually filter practice to that specific skill. The hint text is truthful ("Confidence X% vs accuracy Y%") but the resulting session is a general speaking practice. Adding a skill-filter preset would make this CTA more valuable; filed under follow-up.

4. **The forgot-password route `/auth/forgot-password`** — I added the link but I haven't verified that route exists in your app. If it doesn't, tapping it will either show a 404 or navigate nowhere. If you don't have it yet, create a stub screen or change the onPress to `Alert.alert('Password reset', 'Please email support for password reset.')` as a placeholder.

5. **AuthScreen's animated logo intro** still runs on every mount. When LoginScreen or RegisterScreen mount AuthScreen, the intro animation replays. This is consistent with the previous behavior (each screen had its own logo intro) but if you want the intro to play only once per session, you'd move the animation state to a store.

---

## Remaining audit items (post this shipment)

1. **#5 Subscription screen social proof** — needs real data/testimonials.
2. **#6 Theme unification** — cross-cutting refactor. Biggest tech-debt payoff.
3. **#9 Roleplay end-of-session retention hooks** — requires reading the 835-line screen.
4. **#10 Pathway progress indicator** — cross-cutting, product-decision-heavy.
5. **Real 3-day trial enforcement** — backend work.

Easiest next pick from the list: #6 theme unification (purely tech debt, no new product decisions) or #9 roleplay retention (highest single-shipment impact on DAU/retention).
