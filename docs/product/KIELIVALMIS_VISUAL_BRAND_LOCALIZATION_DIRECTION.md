# KieliValmis Visual Brand, Hero and Localization Direction

**Status:** Locked for the active R4M preview  
**Date:** 2026-08-10  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`

## 1. Brand architecture

Locked hierarchy:

- Product/customer-facing brand: **KieliValmis**
- Endorsement: **by Floently**
- Parent/maker/product family: **Floently**
- Legal operator: **Komplyint Oy**

KieliValmis, Floently, YKI and Komplyint Oy are proper/brand names and are not translated.

## 2. Approved logo — DO NOT REDESIGN

The user supplied and approved the KieliValmis logo family. The core mark is a stylized **K crossed by a flowing blue/cyan wave**.

This geometry is locked. Do not redraw, simplify, substitute, reinterpret or generate a different K/wave mark unless the user explicitly changes direction.

Approved roles:

- **standalone K + wave:** website/header mark and favicon source
- **rounded-square K + wave:** future mobile app/store icon source
- **horizontal lockup:** reference for symbol/wordmark proportions

Website treatment:

- preserve the approved symbol artwork
- use live HTML text for `KieliValmis` so it can be smaller and remain readable/responsive
- use near-white/icy-white `KieliValmis` on the dark website background so the name does not disappear
- place a much smaller cyan/teal `by Floently` directly beneath the product wordmark
- keep the overall lockup short and visually compact
- do not bake `by Floently` into the mobile app icon

The color treatment may be adapted for contrast and accessibility, but the approved mark geometry must not change.

## 3. Hero image direction

The final direction is a premium, human-centered AI-generated photographic hero rather than dashboard-style abstract artwork.

Requirements:

- one adult learner in a believable modern Finnish/Nordic environment
- natural, calm, trustworthy photography
- learner actively listening/speaking/studying with a laptop/tablet/headset
- profession-neutral and inclusive
- suitable for landscape desktop and narrow mobile crops
- no fake Finnish or translated wording baked into the image
- language-specific phrases, speaking states, guidance and feedback remain real HTML/CSS overlays

R4M currently uses an optimized WebP photographic hero derived from the already-generated KieliValmis visual asset set.

## 4. AI provenance/disclosure contract

Any shipped AI-generated hero must preserve explicit provenance.

Required:

- tiny visible localized `AI-generated image` label
- page-level machine-readable disclosure
- Schema.org `ImageObject`
- asset metadata where technically feasible
- provenance sidecar containing creator/model/date/purpose/prompt summary
- regression verifier that fails if provenance disappears

R4M implements all of these, including embedded XMP markers in the WebP and a JSON sidecar.

## 5. Motion direction

Motion supports the message; it must never dominate it.

R4M uses:

- very slow ambient gradient/aurora drift
- subtle speaking waveform animation
- gentle feedback/status pulse
- small desktop image drift/zoom

Rules:

- no bouncing headings
- no autoplay video/audio
- no large mobile parallax
- no animation-dependent meaning
- no layout shift caused by animation
- mobile receives the lighter motion profile
- `prefers-reduced-motion: reduce` must disable/reduce movement
- prefer CSS/SVG over heavy animation libraries

## 6. Typography direction

The landing page should feel like a premium software/language-learning website rather than a presentation slide.

R4M targets:

- desktop hero: approximately **39–48 px**
- mobile hero: approximately **25.5–28 px**
- desktop section headings: approximately **29–36 px**
- mobile section headings: approximately **22–25 px**
- website brand wordmark: approximately 17 px desktop / 14.5 px mobile, with much smaller endorsement text

Body text keeps comfortable reading size and line length; do not compensate for smaller headings by making all text excessively bold.

## 7. Permanent 20-language website contract

Every new customer-facing feature, section, CTA, label, navigation item, notice and new copy must be designed for all 20 supported languages from the start.

Supported locales:

`en, fi, sv, et, es, tr, ru, uk, ar, zh, ku, vi, bn, sq, tl, th, so, ne, fa, ur`

English, Finnish, Swedish, Estonian, Spanish, Turkish, Russian, Ukrainian, Arabic, Chinese, Kurdish, Vietnamese, Bengali, Albanian, Tagalog, Thai, Somali, Nepali, Persian and Urdu.

R4M architecture:

- one shared page structure
- stable translation keys
- one JSON dictionary per locale
- locale switcher
- query/local-storage/browser locale selection
- Arabic, Persian and Urdu RTL handling
- current Kurdish assumption: Kurmanji Latin/LTR; audit against existing app resources before freeze
- translated AI disclosure and all new landing UI copy

Do not maintain 20 manually duplicated HTML pages.

## 8. Translation quality contract

The current R4M dictionaries are a **structurally complete initial translation pack**, not yet the frozen native-quality pack.

Each language must be reviewed for:

- natural/native closeness
- UI wording
- language-learning suitability
- YKI/Finnish terminology accuracy
- CTA tone
- text expansion and line wrapping
- mobile layout
- legal/support clarity when those pages are localized

Do not translate the product claim as if YKI itself were offered in 20 languages. Finnish practice remains Finnish; KieliValmis provides interface guidance, explanations and feedback in supported languages.

## 9. RTL requirements

- Arabic (`ar`) — RTL
- Persian (`fa`) — RTL
- Urdu (`ur`) — RTL
- Kurdish (`ku`) — currently Kurmanji Latin/LTR in R4M pending audit

Use logical CSS properties where practical and test actual layout, icons/arrows, buttons, overlays, footer links and mobile wrapping.

## 10. Website-first, app-second sequence

Required sequence:

1. finish and visually approve the KieliValmis website design
2. finalize approved logo application + photographic hero + motion treatment
3. complete the 20-language website architecture
4. review and QA all 20 website translations
5. localize required legal/support/delete-account surfaces and SEO metadata/routes
6. freeze the approved KieliValmis terminology/translation pack
7. build the app rebrand/localization pack from that same frozen source
8. update the existing Android/iOS product without changing package/bundle identity
9. run full functional + localization + RTL regression
10. update store metadata/assets and release only after the app pack passes

Do not independently rewrite website and app translations after the terminology pack is frozen.

## 11. App rebrand/localization pack

The later app pack must cover the full customer-facing app, including:

- KieliValmis product identity
- approved K/wave icon/wordmark assets
- `by Floently` endorsement rules
- onboarding/login/account-facing rebrand copy
- subscription/rebrand notices where needed
- YKI surfaces
- Professional/work surfaces
- speaking/roleplay surfaces
- support/legal/delete-account entry points
- all newly introduced strings in all 20 languages
- RTL/layout QA for applicable languages

Existing working translations must be preserved and reconciled, not casually overwritten.

## 12. Active R4M implementation

Preview-only path:

`apps/kielivalmis-domain-static/r4m/`

R4M intentionally does not replace the current root landing page yet.

The candidate includes:

- approved K/wave mark
- high-contrast live wordmark and `by Floently`
- smaller responsive typography
- human photographic AI hero
- AI disclosure + provenance
- restrained accessible motion
- 20 locale dictionaries
- RTL handling
- explicit `/r4m` no-index response-header safety rules
- automated R4M contract integrated into Vercel build

Promotion remains blocked until preview deployment QA, visual approval and translation-quality gates pass.
