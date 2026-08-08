# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4L direction lock — R4I protected preview has passed full automated QA. The user has not yet visually reviewed the actual R4I preview; the latest screenshots were from the stable R4H alias. Before the next visual patch, the product direction is now locked around a dedicated KieliValmis endorsed brand, a more photographic human-centered hero, slightly smaller typography, restrained animation, and a permanent 20-language-first localization contract.**

Do not advance to custom-domain/DNS work until the final website design is visually approved and the 20-language website architecture is implemented and QA-ready.

## Locked product architecture

- Customer-facing Finnish-learning product: **KieliValmis**
- Transition identity: **KieliValmis by Floently**
- Parent/maker/product family: **Floently**
- Legal company: **Komplyint Oy**
- Primary purchased domain: **kielivalmis.com**
- Existing Android/iOS store records: preserve
- Android package / Apple Bundle ID: preserve `com.vitusidi.floently`
- Existing users, billing, RevenueCat, backend, YKI engine, cards and roleplay: preserve
- Existing `learn-api.floently.com`: preserve as compatibility infrastructure
- Existing `learn.floently.com`: preserve until a future parallel KieliValmis app-host alias passes auth/payment/YKI regression
- Existing Floently public Vercel project `main-domain-static`: preserve as Floently family gateway
- KieliValmis public marketing site: separate Vercel project `kielivalmis-domain-static`

## Brand direction now locked

- KieliValmis should have its **own product logo/wordmark/icon**.
- Floently should remain as the smaller endorsement: **by Floently**.
- Do not use the Floently logo alone as the KieliValmis product identity.
- KieliValmis, Floently, YKI and Komplyint Oy are proper/brand names and are not translated.
- The future app icon/store identity should follow the same KieliValmis visual system while preserving technical package/bundle IDs.

## Visual direction now locked

The current abstract inline SVG is not the intended final hero.

Next visual candidate should:

- keep the improved R4I mobile structure
- reduce hero typography slightly again
- use a premium human-centered AI-generated **photographic** hero rather than abstract dashboard-style artwork
- avoid fake/baked-in Finnish text inside the image
- place language-specific phrases, speaking feedback and similar UI as real HTML/CSS so they can be translated
- preserve a small visible AI-generated disclosure and machine-readable provenance
- use restrained motion only: slow ambient background movement, subtle waveform/feedback pulse, optional very gentle image drift
- respect `prefers-reduced-motion`
- avoid heavy autoplay video, bouncing text, mobile parallax and layout shift

Typography target direction:

- desktop hero: about 44–48 px maximum
- mobile hero: about 26–28 px
- desktop section headings: about 32–36 px
- mobile section headings: about 22–25 px

## Permanent 20-language contract

From this point onward, **every new customer-facing website feature, section, CTA, label, navigation item, notice and newly introduced copy must be designed and implemented for all 20 supported languages from the start.**

Supported languages:

`en, fi, sv, et, es, tr, ru, uk, ar, zh, ku, vi, bn, sq, tl, th, so, ne, fa, ur`

English, Finnish, Swedish, Estonian, Spanish, Turkish, Russian, Ukrainian, Arabic, Chinese, Kurdish, Vietnamese, Bengali, Albanian, Tagalog, Thai, Somali, Nepali, Persian, Urdu.

Localization rules:

- one source schema + locale dictionaries/content files; do not manually maintain 20 duplicated HTML pages
- generated localized routes/pages
- locale switcher
- localized titles/meta descriptions/SEO copy
- `hreflang` plus `x-default`
- explicit fallback behavior
- no raw translation keys may ship
- Arabic, Persian and Urdu require real RTL layout QA
- inspect the actual Kurdish script used by the existing product before assigning RTL/LTR behavior for `ku`
- translation QA must include expansion, wrapping, buttons, nav, headings, cards, legal/footer links and mobile layouts
- translations must be natural/native and suitable for a language-learning product, not literal machine output
- preserve the precision that the YKI exam itself is not offered in 20 languages; KieliValmis provides guidance/interface/explanations/feedback in supported languages while Finnish practice remains Finnish

## Website-first, app-second localization sequence

1. finish and visually approve the KieliValmis website design
2. finalize KieliValmis logo/wordmark and hero visual system
3. implement website localization architecture
4. complete and QA all 20 website translations
5. freeze an approved KieliValmis website/rebrand terminology + translation pack
6. build the app rebrand/localization pack from that same approved source
7. update the existing Android/iOS product without changing package/bundle identity
8. run full app functional + localization regression
9. update store metadata/assets and release only after the app pack passes

Do not independently rewrite website and app translations after the terminology pack is frozen.

## Production rollback baseline

### Hetzner Learn runtime

- Host: `ubuntu-4gb-hel1-2`
- Repo: `/root/floently-finnish`
- Branch: `preview/enable-all-languages`
- Commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- Backend image: `floently-yki-report-calibration-overlay:20260729T183143Z`
- Web hostname: `learn.floently.com`
- API hostname: `learn-api.floently.com`

The live Learn checkout has remained unchanged throughout all KieliValmis static-site work.

### Floently public site

- Vercel project: `main-domain-static`
- Project ID: `prj_sTnnI02l9BLRIPcRIeGlblflul5Z`
- Team/org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope slug: `kompyint-oys-projects`
- Domains: `floently.com`, `www.floently.com`

### KieliValmis Vercel project

- Project: `kielivalmis-domain-static`
- Project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- Org/team ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope: `kompyint-oys-projects`
- Stable Vercel alias: `https://kielivalmis-domain-static.vercel.app`
- Current stable rollback candidate: R4H at `https://kielivalmis-domain-static-lk9ns71uv-kompyint-oys-projects.vercel.app`
- Current protected R4I preview: `https://kielivalmis-domain-static-4ll5bamsm-kompyint-oys-projects.vercel.app`
- Deployment Protection is enabled
- Vercel Protection Bypass for Automation + normal system `curl` is the QA path

### KieliValmis DNS baseline

- Namecheap nameservers remain authoritative
- Apex: `192.64.119.155` (parking)
- `www`: `parkingpage.namecheap.com.`
- No KieliValmis custom-domain DNS changes have been made

**Do not change Namecheap DNS until the final visual design and localization architecture are approved, custom domains are attached to the correct Vercel project, and Vercel shows the exact required records.**

## R0–R3 completed

- [x] master rebrand plan
- [x] execution tracker
- [x] surface inventory
- [x] technical-ID preservation policy
- [x] store rebrand/screenshot strategy
- [x] legal-route regression policy
- [x] Hetzner/Nginx/backend rollback baseline
- [x] Floently domain/Vercel baseline
- [x] KieliValmis Namecheap parking baseline
- [x] separate KieliValmis Vercel project architecture
- [x] isolated static package with landing/legal/support/delete/robots/sitemap/verifier
- [x] isolated Vercel project created without touching `main-domain-static`

## R4 visual/deployment history

### R4F

First typography/mobile refinement deployed but was visually rejected: still cramped, clipped and card-heavy on iPhone 15 Pro Max-class viewport.

### R4G

Image-led redesign introduced an external SVG hero. Source/local verification passed but deployed `/assets/kielivalmis-hero-ai.svg` returned 404. QA stopped correctly. No DNS/runtime/app impact.

### R4H

Hero was embedded inline in `index.html`, eliminating the external asset request. Automated deployment QA passed, but final mobile visual approval was withheld because headings were still too large, the mobile header was crowded and the image appeared too late.

### R4I

Mobile-first rebuild committed as `133deb42c8ee9d64f25712159c8b63610a470c90`.

Key structural changes:

- mobile hero about 28–31 px
- mobile nav intended to be brand-only
- mobile ordering intended as kicker → headline → image → copy → focus points → CTA → transition note
- full-width primary mobile CTA
- compact 2x2 focus points
- smaller content/card typography
- inline AI hero + provenance preserved

Verifier false-negative occurred because the source used compact JSON (`"@type":"ImageObject"`) while the verifier expected whitespace. Verifier was corrected without weakening the requirement in commit `4e148f79554b7fbd66cbba55b8a3f42122c631c4`.

R4I protected preview created:

`https://kielivalmis-domain-static-4ll5bamsm-kompyint-oys-projects.vercel.app`

R4J protection diagnostic:

- [x] header bypass HTTP 200
- [x] query bypass HTTP 200
- [x] cookie flow HTTP 200
- [x] real KieliValmis HTML reached

R4K full protected-preview QA:

- [x] all primary routes HTTP 200
- [x] R4I mobile layout markers PASS
- [x] hero content PASS
- [x] AI disclosure + metadata PASS
- [x] all 20 language markers PASS
- [x] legal content PASS
- [x] robots + sitemap PASS
- [x] security headers PASS
- [x] `/privacy-policy` -> 308 -> `/privacy`
- [x] `/legal/privacy-policy` -> 308 -> `/privacy`
- [x] `/account-deletion` -> 308 -> `/delete-account`
- [x] `/legal/account-deletion` -> 308 -> `/delete-account`
- [x] `RESULT: KIELIVALMIS R4I PREVIEW FULL QA PASS`
- [x] final Learn production remained `preview/enable-all-languages` at `e92b98e7799c390bc52b42d724c57f197ffd5c0d`

## Important screenshot clarification

The screenshots supplied after R4K were from the stable hostname `kielivalmis-domain-static.vercel.app`, which remained the R4H stable candidate. The visible mobile top-right `Open app` button and picture-after-copy layout also match R4H, not the R4I mobile ordering.

Therefore:

- R4I is functionally QA-clean
- R4I has **not yet received a real browser visual review by the user**
- do not infer R4I visual approval from the latest screenshots

## Immediate next step

Before changing production or DNS:

1. visually inspect the actual R4I preview URL, not the stable alias
2. use that inspection only to preserve any R4I structural improvements worth keeping
3. create the next preview candidate with the newly locked direction: smaller typography, KieliValmis-specific endorsed logo, premium photographic hero, restrained motion, 20-language-first structure
4. keep the candidate preview-only
5. add localization completeness/RTL/SEO gates before any public-domain promotion
6. only after explicit user visual approval and 20-language readiness may R4 close and R5 begin

## Remaining stages

- [~] R4 — design/localization finalization, actual preview visual approval and promotion
- [ ] R5 — attach `kielivalmis.com` / `www.kielivalmis.com` to the KieliValmis Vercel project and capture exact DNS requirements
- [ ] R6 — change only KieliValmis Namecheap DNS + verify HTTPS/canonical/localized routing
- [ ] R7 — build `app.kielivalmis.com` parallel runtime hostname + auth/payment/YKI regression
- [ ] R8 — multilingual SEO URL map + Search Console/hreflang validation
- [ ] R9 — store metadata package in approved languages/markets
- [ ] R10 — store graphics/screenshots package
- [ ] R11 — app KieliValmis visible-brand + 20-language pack, same package/bundle IDs
- [ ] R12 — full app functional/localization regression gate
- [ ] R13 — Android KieliValmis update
- [ ] R14 — iOS KieliValmis update
- [ ] R15 — post-release verification
- [ ] R16 — legacy hostname retirement decision

## Regression blockers

Do not proceed to native/store submission if any of these fail: authentication; subscription purchase/restore; YKI completion/submission/evaluation/report; roleplay/export; card banks; streak/progress; legal URLs; support/delete-account; production web/API calls; app upgrade continuity; localization completeness; RTL layout; or critical translated UI overflow.

## Active blocker

**Final KieliValmis website visual system + 20-language website architecture and translation QA.** Custom domains and Namecheap DNS remain blocked.

Trademark filing/clearance remains a separate legal/business workstream and is not represented here as completed legal clearance.
