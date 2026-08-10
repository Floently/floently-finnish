# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4N staged typography deployment automated QA PASS.** The R4M design direction remains the accepted visual base. R4N changes only the hero-heading treatment: smaller desktop/mobile sizing, lighter weight, clearer three-sentence rhythm, and a restrained teal highlight on the final line. The staged deployment passed source, deployment, noindex, all-20-locale, Finnish-copy, stable-alias and live-Learn safety gates. **Visual approval of the R4N hero is now the only immediate design gate.**

Do not replace the current stable/root landing, attach KieliValmis custom domains, or change Namecheap DNS until the R4N visual is approved and the remaining localization-quality gates are complete.

## Repository move

- [x] GitHub source of truth is **`Floently/floently-finnish`**.
- [x] Working branch: `growth/discovery-seo-d2-20260807`.
- [x] Initial R4M implementation: `2c8809ea624fb11fc8d5d2efdbf58daf030cb25d`.
- [x] R4M clean-URL base-path fix: `d0781fc2dcc5df049384b2dc3fd4ee642aa803be`.
- [x] R4M Vercel header-precedence fix: `280ced4afccc9045f2c186a75ea90744989650a3`.
- [x] R4M header-precedence verifier guard: `0c070d87e9aacd4de297b8faa3656bd17602ab0e`.
- [x] R4M full staged-QA tracker: `1431314708f3a1b29468c4b6541466ac6e5374e0`.
- [x] R4N hero typography source: `186766e45197b26c937bf2d0a4528fcd9bff8822`.
- [x] R4N typography verifier guard: `6aa83349cdefe868bdeb77f946c3308d9f8d8331`.
- [x] R4N pre-deploy tracker: `e6a57dffda7664c3a60f0599129657b0dc5eadd5`.
- [x] All new GitHub writes target the organization repository.
- [x] Hetzner checkout `origin` still points to the former personal repository; deployment fetches explicitly use `git@github.com:Floently/floently-finnish.git` without changing the live working tree.

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

The R4N staged-deployment run ended with this branch/commit unchanged and the checkout clean.

### KieliValmis Vercel

- Project: `kielivalmis-domain-static`
- Project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- Org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope: `kompyint-oys-projects`
- Stable alias: `https://kielivalmis-domain-static.vercel.app`
- R4H rollback deployment: `https://kielivalmis-domain-static-lk9ns71uv-kompyint-oys-projects.vercel.app`
- R4I preview: `https://kielivalmis-domain-static-4ll5bamsm-kompyint-oys-projects.vercel.app`
- Corrected R4M staged deployment: `https://kielivalmis-domain-static-1su1qlmv2-kompyint-oys-projects.vercel.app`
- **R4N staged deployment:** `https://kielivalmis-domain-static-bvfwu3a5z-kompyint-oys-projects.vercel.app`
- Stable-alias baseline SHA: `025a5a767a430ce4d7bdd8b7beb0f3ed33e71f3c1a5453c0b4247727e6073f8f`
- Deployment Protection bypass + ordinary `curl` is the established automated-QA method

The R4N staged deployment was created using the established no-domain staging flow. The stable alias was hashed before and after and remained byte-for-byte identical to the baseline SHA above.

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
- **R4N:** smaller/stylish hero typography refinement; staged automated QA PASS; visual approval pending.

## R4M/R4N visual + motion implementation

Path: `apps/kielivalmis-domain-static/r4m/`

The existing stable/root landing remains unchanged.

- [x] approved K/wave mark; no geometry redesign
- [x] high-contrast live `KieliValmis` + tiny `by Floently`
- [x] human-centered AI-generated photographic hero
- [x] language-specific copy kept outside the photograph
- [x] ambient aurora drift
- [x] desktop image drift
- [x] speaking waveform
- [x] feedback/status pulse
- [x] lighter mobile motion
- [x] `prefers-reduced-motion: reduce`
- [x] `<base href="/r4m/">` clean-URL/path safety
- [x] HTML `noindex,nofollow` plus deployed response-header noindex

### R4N hero typography

The user specifically requested the Finnish hero:

`Valmistaudu YKI-kokeeseen. Valmistaudu työelämään Suomessa. Omalla kielelläsi.`

to be smaller and slightly more stylish.

R4N changes:

- [x] desktop hero reduced from approximately `39–48px` to `35–43px`
- [x] mobile hero reduced from approximately `25.5–28px` to `23–25.5px`
- [x] lighter/calmer weight
- [x] each translated hero sentence rendered as its own block for clearer visual rhythm
- [x] final `heroTitleC` line uses a restrained teal highlight/glow treatment
- [x] wording and all 20 locale dictionaries unchanged
- [x] approved logo, photograph, animation system, AI disclosure and page layout unchanged
- [x] verifier fails if the reduced sizes or editorial sentence/accent treatment disappear

## R4N staged deployment — AUTOMATED QA PASS

Run date: 2026-08-10.

### Source/build gates

- [x] live Learn baseline PASS
- [x] organization branch/head PASS at `e6a57dffda7664c3a60f0599129657b0dc5eadd5` for the deployed source
- [x] organization source fetched without checkout
- [x] original KieliValmis static regression contract PASS
- [x] R4M/R4N brand, AI, motion, localization, noindex and typography contract PASS
- [x] `R4N_TYPOGRAPHY_SOURCE=PASS`

### Staged deployment gates

- [x] staged URL created: `https://kielivalmis-domain-static-bvfwu3a5z-kompyint-oys-projects.vercel.app`
- [x] `/r4m` HTTP 200
- [x] `R4N_NOINDEX=PASS`
- [x] new desktop/mobile typography reached Vercel
- [x] `R4N_DEPLOYED_TYPOGRAPHY=PASS`
- [x] Finnish hero copy unchanged and present
- [x] `R4N_FINNISH_HERO_COPY=PASS`

### 20-language gates

All 20 locale endpoints returned HTTP 200:

`en, fi, sv, et, es, tr, ru, uk, ar, zh, ku, vi, bn, sq, tl, th, so, ne, fa, ur`

- [x] `R4N_20_LOCALES=PASS`
- [x] Arabic/Persian/Urdu RTL implementation remains enabled
- [x] Kurdish remains Kurmanji Latin/LTR pending existing-app locale audit

### Production-safety gates

- [x] stable alias predeploy SHA matched baseline
- [x] stable alias after-deploy SHA matched baseline
- [x] `STABLE_KIELIVALMIS_ALIAS_UNCHANGED=PASS`
- [x] live Learn final branch/commit/clean state unchanged
- [x] `LIVE_LEARN_FINAL_SAFETY=PASS`

Final result:

`RESULT: KIELIVALMIS R4N TYPOGRAPHY STAGED QA PASS`

## R4N visual review URLs

Use these exact URLs for the current design review:

- Finnish: `https://kielivalmis-domain-static-bvfwu3a5z-kompyint-oys-projects.vercel.app/r4m?lang=fi`
- English: `https://kielivalmis-domain-static-bvfwu3a5z-kompyint-oys-projects.vercel.app/r4m?lang=en`
- Arabic RTL: `https://kielivalmis-domain-static-bvfwu3a5z-kompyint-oys-projects.vercel.app/r4m?lang=ar`

Do not use the stable alias when judging R4N because the stable alias intentionally remains unchanged.

## 20-language contract

R4M/R4N use one shared structure plus 20 locale JSON dictionaries, a locale switcher, browser/query/local-storage locale selection, RTL handling, localized AI disclosure and localized landing navigation/CTAs/sections/footer labels.

**Translation quality status:** structurally complete initial pack only. It is not yet the frozen native-quality pack. Natural/native closeness, UI wording, YKI terminology and language-learning suitability must be audited per locale before public launch and before reuse in the app.

## Immediate next gate

1. **Visual review only** of the R4N staged deployment.
2. Review Finnish desktop and iPhone 15 Pro Max-class hero first.
3. Spot-check English and Arabic for the new three-block heading rhythm, wrapping and RTL behavior.
4. Judge hero size, stylishness, logo/header balance, photograph and motion; do not change the accepted R4M composition unless a real visual problem remains.
5. If R4N is visually approved, begin native-quality audit of all 20 landing translations.
6. Then audit Kurdish direction, localize legal/support/delete-account surfaces, implement localized SEO/hreflang, and freeze the terminology/translation pack for app reuse.
7. Keep the stable root, Learn runtime and Namecheap untouched until those website gates are complete.

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

- [~] R4 — R4N staged automated QA PASS; visual approval + translation-quality gates pending
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
