# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4N — R4M design direction visually accepted as much better; hero-heading typography refinement committed and verifier-guarded.** The user specifically requested the Finnish hero `Valmistaudu YKI-kokeeseen. Valmistaudu työelämään Suomessa. Omalla kielelläsi.` to be smaller and slightly more stylish. R4N keeps the approved R4M logo, photographic hero, animations, 20-language architecture and layout unchanged while reducing the hero scale and introducing a cleaner three-beat sentence rhythm with a restrained teal accent treatment on the final line. **R4N staged redeploy + visual review are next.**

Do not replace the current root landing, attach KieliValmis custom domains, or change Namecheap DNS until the refined candidate passes visual approval and the remaining localization-quality gates.

## Repository move

- [x] GitHub source of truth is **`Floently/floently-finnish`**.
- [x] Working branch: `growth/discovery-seo-d2-20260807`.
- [x] Initial R4M implementation commit: `2c8809ea624fb11fc8d5d2efdbf58daf030cb25d`.
- [x] R4M clean-URL base-path verifier fix: `d0781fc2dcc5df049384b2dc3fd4ee642aa803be`.
- [x] R4M header precedence fix: `280ced4afccc9045f2c186a75ea90744989650a3`.
- [x] R4M verifier precedence guard: `0c070d87e9aacd4de297b8faa3656bd17602ab0e`.
- [x] Header-incident tracker commit: `51040bdae818e0ca03cea4ee3ac62eabdee2ed47`.
- [x] Post-first-staged-deploy safety tracker commit: `0ae52d09df494754f4cba27be98b2cbc5c111444`.
- [x] R4M full staged-QA tracker commit: `1431314708f3a1b29468c4b6541466ac6e5374e0`.
- [x] R4N hero typography source commit: `186766e45197b26c937bf2d0a4528fcd9bff8822`.
- [x] R4N typography verifier guard: `6aa83349cdefe868bdeb77f946c3308d9f8d8331`.
- [x] All new GitHub writes target the organization repository.
- [x] Hetzner checkout `origin` still points to the former personal repository; deployment fetches therefore explicitly use `git@github.com:Floently/floently-finnish.git` without changing the live working tree.

## Locked product architecture

- Product: **KieliValmis**
- Endorsement: **by Floently**
- Parent/maker: **Floently**
- Legal operator: **Komplyint Oy**
- Purchased domain: **kielivalmis.com**
- Existing Android/iOS records and package/bundle ID `com.vitusidi.floently`: preserve
- Existing accounts, RevenueCat, subscriptions, progress, YKI engine, card banks and roleplay: preserve
- `learn-api.floently.com` and `learn.floently.com`: preserve during transition
- `main-domain-static`: preserve as Floently family gateway
- KieliValmis marketing: separate Vercel project `kielivalmis-domain-static`

## Production rollback baseline

### Hetzner Learn

- IP: `77.42.44.201`
- Repo: `/root/floently-finnish`
- Branch: `preview/enable-all-languages`
- Commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- Web: `learn.floently.com`
- API: `learn-api.floently.com`

The corrected R4M staged-deployment run ended with this branch/commit unchanged and the checkout clean.

### KieliValmis Vercel

- Project: `kielivalmis-domain-static`
- Project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- Org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope: `kompyint-oys-projects`
- Stable alias: `https://kielivalmis-domain-static.vercel.app`
- R4H rollback deployment: `https://kielivalmis-domain-static-lk9ns71uv-kompyint-oys-projects.vercel.app`
- R4I preview: `https://kielivalmis-domain-static-4ll5bamsm-kompyint-oys-projects.vercel.app`
- First R4M staged deployment: `https://kielivalmis-domain-static-drguv6948-kompyint-oys-projects.vercel.app`
- **Corrected R4M staged deployment:** `https://kielivalmis-domain-static-1su1qlmv2-kompyint-oys-projects.vercel.app`
- Stable-alias baseline SHA: `025a5a767a430ce4d7bdd8b7beb0f3ed33e71f3c1a5453c0b4247727e6073f8f`
- Deployment Protection bypass + ordinary `curl` is the established automated-QA method

The corrected R4M deployment was created with `vercel --prod --skip-domain`. The stable alias was hashed immediately before and after and remained byte-for-byte identical to the baseline SHA above.

## R4M corrected staged deployment — FULL AUTOMATED QA PASS

Run date: 2026-08-10.

### Source/build gates

- [x] live Learn baseline PASS
- [x] Floently organization branch/head PASS
- [x] organization source fetched into `FETCH_HEAD` without checkout
- [x] original KieliValmis regression contract PASS
- [x] R4M 20-language/brand/AI/motion/typography/noindex contract PASS
- [x] Vercel header precedence source order PASS: global index `0`, `/r4m` index `1`, `/r4m/(.*)` index `2`
- [x] stable alias predeploy hash PASS

### Deployed routing/indexing gates

- [x] staged public root HTTP 200
- [x] staged public root retains `X-Robots-Tag: index, follow`
- [x] `/r4m` HTTP 200
- [x] deployed R4M HTML markers PASS
- [x] `/r4m` returns `X-Robots-Tag: noindex, nofollow`
- [x] R4M CSS/JS/locale loader/logo/hero/provenance assets all HTTP 200
- [x] all R4M assets remain noindex

### 20-language deployed gates

All 20 locale endpoints returned HTTP 200 and valid JSON:

`en, fi, sv, et, es, tr, ru, uk, ar, zh, ku, vi, bn, sq, tl, th, so, ne, fa, ur`

- [x] all 20 locale endpoints PASS
- [x] all locale endpoints remain noindex
- [x] Arabic/Persian/Urdu RTL implementation remains enabled
- [x] Kurdish is currently Kurmanji Latin/LTR pending existing-app locale audit

### AI provenance gates

- [x] hero WebP still contains `OpenAI ChatGPT`
- [x] `aiGenerated` marker survives deployment
- [x] KieliValmis hero purpose marker survives deployment
- [x] visible `AI-generated image` disclosure marker survives deployment
- [x] provenance JSON parses and preserves `aiGenerated=true`, creator, created date, purpose and prompt summary

### Compatibility/safety gates

- [x] `/privacy-policy` → HTTP 308 → `/privacy`
- [x] `/legal/privacy-policy` → HTTP 308 → `/privacy`
- [x] `/account-deletion` → HTTP 308 → `/delete-account`
- [x] `/legal/account-deletion` → HTTP 308 → `/delete-account`
- [x] stable KieliValmis alias after-hash exactly equals baseline SHA
- [x] live Learn final branch remains `preview/enable-all-languages`
- [x] live Learn final commit remains `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- [x] live Learn final checkout clean

Final result:

`RESULT: KIELIVALMIS R4M CORRECTED STAGED DEPLOYMENT QA PASS`

## R4N hero typography refinement

The user visually reviewed R4M and said the overall design is **much better**. The remaining requested visual change is the hero-heading treatment.

R4N keeps every other R4M design and product decision intact.

### Hero typography changes

- [x] desktop hero reduced from approximately `39–48px` to `35–43px`
- [x] mobile hero reduced from approximately `25.5–28px` to `23–25.5px`
- [x] font weight reduced to a calmer `625` desktop / `620` mobile treatment
- [x] line-height relaxed slightly for Finnish and other expanding translations
- [x] each translated hero sentence is rendered as its own block for clearer visual rhythm
- [x] final `heroTitleC` line remains teal but now receives a restrained highlight/glow rather than relying on oversized weight
- [x] wording and all 20 locale dictionaries remain unchanged
- [x] approved K/wave logo, photograph, motion system, AI disclosure and layout remain unchanged
- [x] R4M verifier now fails if the reduced sizes or editorial sentence/accent treatment disappear

The Finnish copy remains exactly:

`Valmistaudu YKI-kokeeseen. Valmistaudu työelämään Suomessa. Omalla kielelläsi.`

## Visual review URLs

Current deployed R4M reference before R4N redeploy:

- English: `https://kielivalmis-domain-static-1su1qlmv2-kompyint-oys-projects.vercel.app/r4m?lang=en`
- Finnish: `https://kielivalmis-domain-static-1su1qlmv2-kompyint-oys-projects.vercel.app/r4m?lang=fi`
- Arabic RTL: `https://kielivalmis-domain-static-1su1qlmv2-kompyint-oys-projects.vercel.app/r4m?lang=ar`

Do not treat these URLs as containing R4N until a new staged deployment is created from the latest branch head.

## Approved logo — LOCKED

The user supplied and approved the KieliValmis **K + flowing wave** logo family. **Do not alter the symbol geometry.**

Usage:

- standalone K + wave = website/header mark and favicon source
- rounded-square K + wave = future app/store icon source
- website header = approved mark + live near-white `KieliValmis` + much smaller cyan/teal `by Floently`
- live wordmark text intentionally keeps the lockup short, responsive and visible on the dark background
- `by Floently` is not baked into the mobile app icon

## R4 visual history

- **R4F:** typography/mobile refinement functionally passed, visually rejected.
- **R4G:** external SVG hero returned deployed 404; QA stopped safely.
- **R4H:** inline hero automated QA passed; mobile visual approval withheld.
- **R4I:** mobile-first protected preview passed full automated route/content/legal/security QA.
- **R4L:** approved-logo + photographic-hero + smaller-type + subtle-motion + 20-language direction locked.
- **R4M:** branded photographic/animated/20-language staged candidate passed full automated QA and was visually judged much better.
- **R4N:** active hero typography refinement; source and verifier committed, staged deployment pending.

## 20-language contract

R4M/R4N use one shared structure plus 20 locale JSON dictionaries, a locale switcher, browser/query/local-storage locale selection, RTL handling, localized AI disclosure and localized landing navigation/CTAs/sections/footer labels.

**Translation quality status:** structurally complete initial pack only. It is not yet the frozen native-quality pack. Natural/native closeness, UI wording, YKI terminology and language-learning suitability must be audited per locale before public launch and before reuse in the app.

## Immediate next gate

1. Create a new no-domain staged deployment from the latest organization-branch head containing R4N.
2. Re-run original + R4M/R4N contracts, deployed noindex/asset/locale/provenance/legal gates and stable-alias/live-Learn safety checks.
3. Visually review the refined Finnish hero on desktop and iPhone 15 Pro Max-class viewport.
4. Spot-check English and Arabic to ensure the block-sentence rhythm behaves correctly for LTR and RTL.
5. If the hero refinement is visually approved, move into native-quality audit of all 20 landing translations, Kurdish direction audit, legal/support localization, localized SEO/hreflang and terminology-pack freeze.
6. Keep stable root, Learn runtime and Namecheap untouched until explicit approval.

## After visual approval

Before public-domain promotion:

- [ ] native-quality audit all 20 landing translations
- [ ] audit the app's Kurdish script/direction and align website
- [ ] localize required legal/support/delete-account surfaces
- [ ] localized SEO titles/descriptions/routes
- [ ] canonical + `hreflang` + `x-default`
- [ ] fallback/text-expansion/RTL QA
- [ ] freeze approved KieliValmis terminology/translation pack

Then build the existing Android/iOS rebrand from the same frozen terminology source; do not independently rewrite translations in the app.

## Remaining stages

- [~] R4 — R4N typography refinement source ready; staged QA + visual approval + translation-quality gates pending
- [ ] R5 — attach `kielivalmis.com` / `www.kielivalmis.com` and capture exact DNS requirements
- [ ] R6 — Namecheap DNS + HTTPS/canonical verification
- [ ] R7 — parallel `app.kielivalmis.com` runtime + auth/payment/YKI regression
- [ ] R8 — SEO/hreflang/Search Console
- [ ] R9 — store metadata
- [ ] R10 — store graphics/screenshots
- [ ] R11 — native brand/localization pack, same package/bundle IDs
- [ ] R12 — full app functional/localization regression
- [ ] R13 — Android update
- [ ] R14 — iOS update
- [ ] R15 — post-release verification
- [ ] R16 — legacy-host retirement decision

## Regression blockers

Do not proceed to native/store release if any of these fail: authentication; purchase/restore; subscription continuity; YKI completion/submission/evaluation/report; roleplay/export; card banks; streak/progress; legal/support/delete-account URLs; production web/API calls; app upgrade continuity; localization/RTL gates.

Trademark filing/clearance remains a separate legal/business workstream and is not represented here as completed legal clearance.
