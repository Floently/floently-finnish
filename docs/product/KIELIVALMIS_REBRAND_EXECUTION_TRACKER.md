# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4M corrected staged deployment automated QA PASS.** The branded, photographic, animated, 20-language R4M candidate is deployed at a no-domain staged Vercel URL and has passed source, deployment, indexing, asset, locale, AI-provenance, legal-redirect and production-safety gates. **Visual review is now the only immediate R4M gate before translation-quality hardening.**

Do not replace the current root landing, attach KieliValmis custom domains, or change Namecheap DNS until R4M passes visual approval and the remaining localization-quality gates.

## Repository move

- [x] GitHub source of truth is **`Floently/floently-finnish`**.
- [x] Working branch: `growth/discovery-seo-d2-20260807`.
- [x] Initial R4M implementation commit: `2c8809ea624fb11fc8d5d2efdbf58daf030cb25d`.
- [x] R4M clean-URL base-path verifier fix: `d0781fc2dcc5df049384b2dc3fd4ee642aa803be`.
- [x] R4M header precedence fix: `280ced4afccc9045f2c186a75ea90744989650a3`.
- [x] R4M verifier precedence guard: `0c070d87e9aacd4de297b8faa3656bd17602ab0e`.
- [x] Header-incident tracker commit: `51040bdae818e0ca03cea4ee3ac62eabdee2ed47`.
- [x] Post-first-staged-deploy safety tracker commit: `0ae52d09df494754f4cba27be98b2cbc5c111444`.
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

The corrected deployment was created with `vercel --prod --skip-domain`. The stable alias was hashed immediately before and after the deployment and remained byte-for-byte identical to the baseline SHA above.

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

## Visual review URLs

- English: `https://kielivalmis-domain-static-1su1qlmv2-kompyint-oys-projects.vercel.app/r4m?lang=en`
- Finnish: `https://kielivalmis-domain-static-1su1qlmv2-kompyint-oys-projects.vercel.app/r4m?lang=fi`
- Arabic RTL: `https://kielivalmis-domain-static-1su1qlmv2-kompyint-oys-projects.vercel.app/r4m?lang=ar`

These URLs are the current R4M design-review source. Do not visually judge the older stable/root R4H page when deciding whether R4M is approved.

## Approved logo — LOCKED

The user supplied and approved the KieliValmis **K + flowing wave** logo family. **Do not alter the symbol geometry.**

Usage:

- standalone K + wave = website/header mark and favicon source
- rounded-square K + wave = future app/store icon source
- website header = approved mark + live near-white `KieliValmis` + much smaller cyan/teal `by Floently`
- live wordmark text intentionally keeps the lockup short, responsive and visible on the dark background
- `by Floently` is not baked into the mobile app icon

## R4M visual + motion implementation

Path: `apps/kielivalmis-domain-static/r4m/`

The existing root landing remains unchanged.

- [x] approved K/wave mark; no geometry redesign
- [x] high-contrast live `KieliValmis` + tiny `by Floently`
- [x] desktop H1 approximately 39–48 px
- [x] mobile H1 approximately 25.5–28 px
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

## 20-language contract

R4M includes one shared structure plus 20 locale JSON dictionaries, a locale switcher, browser/query/local-storage locale selection, RTL handling, localized AI disclosure and localized landing navigation/CTAs/sections/footer labels.

**Translation quality status:** structurally complete initial pack only. It is not yet the frozen native-quality pack. Natural/native closeness, UI wording, YKI terminology and language-learning suitability must be audited per locale before public launch and before reuse in the app.

## Immediate next gate

1. **Visual review only** of the corrected R4M staged deployment.
2. Review desktop and iPhone 15 Pro Max-class layouts in English.
3. Review Finnish for text expansion/wrapping and overall natural presentation.
4. Review Arabic for RTL alignment, logo/header behavior, CTA direction, card ordering and mobile overflow.
5. Judge approved logo contrast/size, smaller headline, photographic hero, visible AI disclosure and subtle motion.
6. If visual issues exist, patch only R4M and repeat staged QA; do not touch stable root or DNS.
7. If visually approved, begin native-quality audit of all 20 landing translations, Kurdish direction audit, legal/support localization, localized SEO/hreflang and terminology-pack freeze.

## After R4M visual approval

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

- [~] R4 — corrected R4M automated staged QA PASS; visual approval + translation-quality gates pending
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
