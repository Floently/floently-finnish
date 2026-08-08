# KieliValmis Visual Brand, Hero and Localization Direction

**Status:** Locked product direction before the next R4 visual iteration  
**Date:** 2026-08-08  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`

## 1. Brand architecture

KieliValmis must become an endorsed product brand rather than merely displaying the Floently master logo as the product identity.

Locked hierarchy:

- Product/customer-facing brand: **KieliValmis**
- Endorsement: **by Floently**
- Parent/maker/product family: **Floently**
- Legal operator: **Komplyint Oy**

Recommended visual lockup:

`KieliValmis`  
`by Floently`

The KieliValmis wordmark/icon should be unique enough to function as the website logo, mobile app icon, store identity and marketing mark, while retaining visual DNA from Floently through color, geometry and the small `by Floently` endorsement.

Do not use the Floently logo alone as the KieliValmis product logo. Floently remains visibly connected as the maker/parent, but KieliValmis should be recognizable as its own Finnish-learning product.

The product name `KieliValmis`, the maker name `Floently`, `YKI`, and the legal company name `Komplyint Oy` are brand/proper names and must not be translated.

## 2. Hero visual direction

The current R4I abstract/editorial illustration is a useful structural placeholder, but it should not be the final customer-facing hero.

Replace it with a **premium, human-centered AI-generated photographic hero** that communicates Finnish learning, speaking practice, YKI preparation and readiness for working life.

Preferred visual direction:

- one adult learner in a believable modern Finnish/Nordic environment
- natural, premium photography rather than stock-photo posing
- learner actively speaking, listening, practising or using a laptop/tablet/headset
- subtle Finnish/workplace context without relying on stereotypes
- composition suitable for desktop landscape crop and mobile crop
- calm, trustworthy and modern rather than playful/gamified
- inclusive and profession-neutral so the image does not imply that KieliValmis is only for one profession or demographic
- no fake Finnish text baked into the generated image
- no large text, speech bubbles or UI labels rendered as pixels inside the source photo

Language-specific words, Finnish examples, speaking indicators, feedback labels and similar messaging should be real HTML/CSS overlays so they can be translated and remain accessible.

## 3. AI provenance/disclosure contract

Any AI-generated final hero must keep explicit provenance.

Required:

- tiny visible label: `AI-generated image` or the natural localized equivalent where appropriate
- page-level machine-readable disclosure
- Schema.org image metadata
- image asset metadata/provenance retained in the shipped source asset where technically feasible
- source-generation record containing creator/model, date, purpose and prompt summary
- regression QA must verify that disclosure/provenance survives deployment

Do not silently strip the disclosure to improve aesthetics.

## 4. Motion/animation direction

The landing page may use subtle motion to feel more alive, but animation must support comprehension rather than become decoration-heavy.

Recommended motion:

- very slow ambient gradient/aurora drift
- subtle speech/audio waveform movement near the hero
- gentle feedback/status pulse
- optional 1–2% slow photo drift/zoom on desktop
- small entrance transition for hero overlays after page load

Rules:

- no bouncing headings
- no continuous large parallax on mobile
- no autoplay video with audio
- no motion that changes or hides meaning
- no animation required for navigation or core functionality
- respect `prefers-reduced-motion: reduce`
- mobile receives a lighter motion profile than desktop
- animation must not cause layout shift or horizontal overflow
- keep implementation primarily CSS/SVG where possible rather than adding a heavy animation dependency

## 5. Typography direction

R4I is structurally much better on mobile, but final typography should be slightly calmer again.

Target direction:

- desktop hero: approximately 44–48 px maximum rather than 54+ px
- mobile hero: approximately 26–28 px
- desktop section headings: approximately 32–36 px
- mobile section headings: approximately 22–25 px
- body text should retain comfortable reading size and line height
- line length should remain intentionally limited
- do not compensate for smaller headings by making everything bold

The page should read like a premium software/language-learning website, not a presentation slide.

## 6. 20-language website contract

From this point forward, every new user-facing website feature, page section, CTA, navigation item, notice, label and newly introduced customer-facing copy must be designed for the full supported localization set from the start.

Supported public languages:

1. `en` — English
2. `fi` — Finnish
3. `sv` — Swedish
4. `et` — Estonian
5. `es` — Spanish
6. `tr` — Turkish
7. `ru` — Russian
8. `uk` — Ukrainian
9. `ar` — Arabic
10. `zh` — Chinese
11. `ku` — Kurdish
12. `vi` — Vietnamese
13. `bn` — Bengali
14. `sq` — Albanian
15. `tl` — Tagalog
16. `th` — Thai
17. `so` — Somali
18. `ne` — Nepali
19. `fa` — Persian
20. `ur` — Urdu

This is not only a landing-page translation task. It is a permanent product localization requirement.

## 7. Website localization architecture

Do not hand-maintain 20 duplicated HTML pages.

Recommended architecture for `apps/kielivalmis-domain-static`:

- one canonical content/schema source
- locale dictionaries/content files keyed by stable translation IDs
- generated localized routes at build time
- English may remain the default/root entry while localized paths are generated deliberately
- locale switcher available from the public site
- `hreflang` for every supported locale plus `x-default`
- localized `<title>`, meta description and meaningful SEO copy
- canonical URLs must remain self-consistent per locale strategy
- localized legal/support pages where legally/content-appropriate
- fallback behavior must be explicit and tested
- no visible raw translation key may ever ship

RTL requirements:

- Arabic, Persian and Urdu must receive real RTL layout handling
- inspect the actual supported Kurdish script before assuming RTL/LTR behavior for `ku`
- components must use logical CSS properties where practical
- icons/arrows and layout direction must be tested, not only translated text

Translation QA must test text expansion, line wrapping, buttons, navigation, headings, cards, forms, footer/legal links and mobile layouts.

## 8. Translation quality contract

Translations must be natural customer-facing language, not literal machine translations.

Each locale should be reviewed for:

- natural/native closeness
- language-learning suitability
- UI wording
- Finnish/YKI terminology accuracy
- CTA tone
- legal/support clarity
- consistency between website and app

Do not translate the claim as if the YKI exam itself is offered in 20 languages. The product provides guidance/interface/explanations/feedback in 20 supported languages while Finnish practice remains Finnish.

## 9. Website-first, app-second release sequence

The website is the first implementation surface for the KieliValmis rebrand.

Required sequence:

1. finish and visually approve the KieliValmis website design
2. finalize the KieliValmis logo/wordmark and hero direction
3. implement the website localization architecture
4. complete and QA all 20 website translations
5. freeze an approved KieliValmis website/rebrand copy pack
6. build an app rebrand/localization pack from the same approved terminology and translations
7. update the existing Android/iOS product without changing package/bundle identity
8. perform full app regression and localization QA
9. release store metadata/assets and app update only after the app pack passes

Do not independently rewrite website and app translations after freeze; use the same approved terminology source so customer wording does not drift.

## 10. App rebrand/localization pack requirements

The later app pack must cover the entire customer-facing app, not only the landing screen.

It must include:

- KieliValmis product identity
- KieliValmis logo/icon/wordmark assets
- `by Floently` endorsement rules
- navigation labels
- onboarding/login/account-facing new copy introduced by the rebrand
- subscription/rebrand notices where applicable
- YKI surfaces
- Professional/work surfaces
- speaking/roleplay surfaces
- support/legal/delete-account entry points
- new visual assets introduced by the website/rebrand
- all newly introduced strings in all 20 supported languages
- RTL/layout QA for applicable languages

Existing working translation resources must be preserved and reconciled rather than casually overwritten.

## 11. Immediate next visual iteration

The next R4 candidate should keep the successful R4I mobile structural improvements while making only the intentional next-step changes:

1. reduce hero/section heading sizes slightly
2. design/select the dedicated KieliValmis logo direction
3. replace the abstract hero art with the final high-end AI-generated photographic direction
4. place meaningful text/UI as translatable HTML overlays, not image pixels
5. add restrained accessible motion
6. preserve all existing functional/legal/AI-disclosure QA gates
7. keep the candidate preview-only until visual approval

Do not change Namecheap DNS or promote custom domains merely because this design direction is locked.
