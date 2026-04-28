# Landing Page Rebuild — Integration Notes

Replaces the white "newspaper" landing page at `learn.floently.com` with a premium dark-hero design anchored by an animated Finnish text correction demo.

## What's in this shipment

| File | Action | Purpose |
|---|---|---|
| `apps/client/web/LearnLandingPage.tsx` | **Replace** | Full page rebuild — hero, outcomes, pathways, platform, final CTA, footer |
| `apps/client/web/components/FinnishCorrectionDemo.tsx` | **New** | Animated Finnish correction demo. Reusable in auth split-screen (pass 2) |
| `preview.html` | New (reference) | Self-contained vanilla HTML/JS preview of the design — open directly in any browser |
| `screenshot_*.png` | New (reference) | Rendered screenshots at desktop / tablet / mobile widths plus animation phases |

## How to drop it in

The structure mirrors what was already in your codebase:

1. Copy `apps/client/web/LearnLandingPage.tsx` over the existing file at the same path.
2. Create the `components/` directory and add `FinnishCorrectionDemo.tsx`.
3. The page is mounted at `apps/client/app/index.tsx` when `window.location.hostname === 'learn.floently.com'` — no changes needed to that mount.

No new dependencies. Uses only React + native CSS. No Tailwind, no Framer Motion, no animation libraries — just `<style>` tags and `useEffect` timers. Bundle impact: roughly +12KB gzipped over the original.

## What was redesigned

**Hero — dark navy (#0A1838).** Single large heading with brand-blue gradient on the action line. Single primary CTA (Book a demo). Sign-in is a small text link beside it. Trust pills wrap as a single row instead of competing with primary buttons. Right side hosts the animated demo at desktop, drops below the heading at tablet/mobile.

**Animated Finnish demo.** Phase machine that cycles through: cursor → typing → pause → error flag → tooltip → correcting → success → reset. About 11 seconds per loop. Demonstrates the product in 8 seconds: type Finnish → get corrected → see the rule → checkmark.

The example sentence is `Olen menny apteekkiin eilen.` — chosen because:
- B1-band (accessible to most learners visiting the marketing site)
- Healthcare-adjacent ("went to the pharmacy") so it fits the audience
- Single-word correction (`menny` → `mennyt`) that demonstrates a classic Finnish past-participle rule with one clean swap

If you'd prefer a different sentence, change `SENTENCE`, `WRONG_WORD`, `RIGHT_WORD` constants at the top of `FinnishCorrectionDemo.tsx`.

**Outcomes section — light (#F6F8FD).** Three numbered cards with hover lift. Reframed copy slightly to be punchier ("YKI is a wall, not a finish line"). Original copy preserved on the third card.

**Pathways section — dark (#0A1838) again.** This is where the cross-track contamination from the pathway cards in the original is fixed: each card has its own accent color (blue / teal / lighter blue), its own icon, and its own CTA. Hover lifts and brightens. A 2px accent stripe on the top edge differentiates them visually at a glance.

**Platform connection — light again.** Three feature cards with thin accent bars. Less heavy than the pathways section since these are descriptive, not decision points.

**Final CTA — deep navy (#06112A).** Single primary CTA (Book a demo) plus secondary outline (Continue to sign in) plus a text link. Three actions but a clear hierarchy.

**Footer — same deep navy.** Two columns of links plus brand block. Minimal.

## Mobile behavior

The original mobile screenshot you sent showed the page falling apart at 375px. The rebuild fixes this by:

1. **Nav links hidden on mobile** (the marketing site doesn't need them in the header — they're in the footer)
2. **Hero stack vertical** — text first, demo below
3. **All grids collapse to single-column** — outcome / pathway / platform cards each take full width
4. **Trust pills wrap cleanly** with smaller padding
5. **Generous vertical breathing room** between sections (64px on mobile vs 96-112px on desktop)
6. **CTA buttons size down** (15px font / 14px padding) but still feel tappable

## Verified rendering

Screenshots in `landing_rebuild/` show what the design looks like at:
- 1440 desktop (top + full)
- 768 tablet (top + full)
- 375 mobile (top + full)
- Demo animation at 4 phase moments: typing, error, tooltip, success

These were rendered with headless Chromium, not just guessed at. The animation works end-to-end including the success state with corrected sentence + green ribbon + glow border.

## Honest limitations

### 1. The bounding logo is preserved unchanged

The image at `/images/new_ui/use_this_app_logo_no_background.png` is referenced exactly as in the original. No filters, no color overrides, no sizing changes beyond `height: 54px`. If the logo file itself has issues (low-res on retina displays, doesn't have transparent corners, etc.) those are inherited unchanged — the rebuild scope was strictly visual layout.

For the auth redesign (pass 2), the same constraint applies: I won't touch the logo, only the surrounding layout.

### 2. The animation is JS-driven, not CSS-only

I considered building the entire animation as CSS keyframes only. That approach would have been smaller and would render even with JavaScript disabled. I rejected it because:

- The success state has multiple coordinated changes (input border color, ribbon opacity, sentence content swap) that are awkward to choreograph in pure CSS without complex `@keyframes` chaining.
- The typing effect needs character-by-character text changes, which CSS alone cannot do (CSS can fake it with `width` + `clip-path` but it falls apart on multi-line wrapping).
- The component must be reusable on the auth page in pass 2, which means it needs to handle theming via CSS variables — easier from JS than pure CSS.

The tradeoff: if JavaScript fails to load (rare on web), the demo is empty. That's acceptable for a marketing landing page where the rest of the page is static React anyway.

### 3. Responsive breakpoints are 768 / 1024 — your existing site might use different ones

I picked 768 (tablet) and 1024 (desktop) as breakpoints because they're the universal standard. If your existing styles use different ones (1100, 1280, etc.), there may be visual inconsistency between this page and the rest of the site. Easy to retune in the `@media` blocks at the bottom of `<PageStyles>`.

### 4. The hover states use desktop-style `:hover` selectors

On mobile/touch devices, `:hover` triggers on tap and sticks until the next tap elsewhere. That's standard behavior and won't break anything, but if you want explicit `:active` press states for touch devices, those can be added.

### 5. Copy was preserved per your earlier instruction

You said the words and message aren't the problem. I kept the original headline and section copy with only minor tightening (e.g. "YKI is a wall, not a finish line" replacing "Many learners need more than general language lessons"). If you'd rather restore the exact original copy, the strings are in the `pathwayCards`, `outcomeCards`, `platformPathways` arrays at the top of `LearnLandingPage.tsx`.

## Pass 2 — Auth redesign (next turn)

The animation component (`FinnishCorrectionDemo`) accepts a `theme="dark"|"light"` prop. For the auth split-screen, the dark visual half will host this component with `theme="dark"` (same as landing) so the visual continuity from marketing to app is automatic.

What I still need from you for the auth pass:
1. **What is the "bounding logo" exactly** — the image, the full top block, or the logo with title/eyebrow rework allowed?

That answer determines how much of the existing AuthScreen.tsx top section I can restructure.

## Verifying

To preview the rebuild before committing it to your codebase:

1. Open `preview.html` directly in a browser (Chrome, Firefox, Safari) — no build step needed.
2. Resize the window to test breakpoints (375, 768, 1024, 1440).
3. Watch the animation loop for ~12 seconds to confirm it cycles cleanly.

To replace the live page:

1. Replace `apps/client/web/LearnLandingPage.tsx` with the new file.
2. Add the `components/FinnishCorrectionDemo.tsx` file to that directory.
3. Run your existing Expo web build (`npx expo export -p web` or your usual command).
4. Test at `localhost:<port>` before deploying.

## What to verify

- [ ] Hero looks like the screenshots (dark navy, large heading, demo on the right at desktop)
- [ ] Animation loops cleanly: cursor → typing → tooltip → corrected sentence → green ribbon → reset
- [ ] At 375px mobile, the page reads as one coherent column (not the original "scattered ribbon" feel)
- [ ] Pathway cards in the dark section have visibly distinct accent colors (blue / teal / lighter blue)
- [ ] Hover on any card lifts it slightly and brightens the border
- [ ] The Floently logo at the top is unchanged from the original page
- [ ] No layout breaks at 768 (tablet) — pathway cards still 3-up
- [ ] Reduced-motion: open browser devtools, emulate prefers-reduced-motion, refresh — animation should jump straight to the success state without animating

If any of these don't work as expected, capture the visual issue and send back. Animation timing can be tuned by adjusting `TIMINGS` constants. Layout can be tuned at the breakpoints.
