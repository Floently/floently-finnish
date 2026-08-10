# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4M — preview-only branded + photographic + animated + 20-language landing candidate committed in the Floently organization repository. Local/static contract PASS, including clean-URL base-path and no-index safety. Vercel preview deployment + protected QA + visual review are next.**

Do not replace the current root landing, attach KieliValmis custom domains, or change Namecheap DNS until R4M passes preview QA, visual approval and the remaining localization-quality gates.

## Repository move

- [x] GitHub source of truth is **`Floently/floently-finnish`**.
- [x] Working branch: `growth/discovery-seo-d2-20260807`.
- [x] Initial R4M implementation commit: `2c8809ea624fb11fc8d5d2efdbf58daf030cb25d`.
- [x] R4M clean-URL base-path verifier fix: `d0781fc2dcc5df049384b2dc3fd4ee642aa803be`.
- [x] All new GitHub writes target the organization repository.
- [ ] Before server-side fetch/deploy, inspect the Hetzner checkout remote because the live checkout may still show the former personal repository URL.

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

KieliValmis marketing work must not alter this live checkout state.

### KieliValmis Vercel

- Project: `kielivalmis-domain-static`
- Project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- Org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope: `kompyint-oys-projects`
- Stable alias: `https://kielivalmis-domain-static.vercel.app`
- R4H rollback deployment: `https://kielivalmis-domain-static-lk9ns71uv-kompyint-oys-projects.vercel.app`
- R4I preview: `https://kielivalmis-domain-static-4ll5bamsm-kompyint-oys-projects.vercel.app`
- Deployment Protection bypass + ordinary `curl` is the established automated-QA method

### DNS

- Namecheap nameservers remain authoritative
- Apex remains parked at `192.64.119.155`
- `www` remains parked at `parkingpage.namecheap.com.`
- No KieliValmis DNS changes have been made

## Approved logo — LOCKED

The user supplied and approved the KieliValmis **K + flowing wave** logo family. **Do not alter the symbol geometry.**

Usage:

- standalone K + wave = website/header mark and favicon source
- rounded-square K + wave = future app/store icon source
- website header = approved mark + live near-white `KieliValmis` + much smaller cyan/teal `by Floently`
- live wordmark text intentionally keeps the lockup short, responsive and visible on the dark background
- `by Floently` is not baked into the mobile app icon

## R4 history

- **R4F:** typography/mobile refinement functionally passed, visually rejected.
- **R4G:** external SVG hero returned deployed 404; QA stopped safely.
- **R4H:** inline hero automated QA passed; mobile visual approval withheld.
- **R4I:** mobile-first protected preview passed full automated route/content/legal/security QA.
- **R4L:** approved-logo + photographic-hero + smaller-type + subtle-motion + 20-language direction locked.
- **R4M:** active preview-only implementation candidate.

## R4M implementation

Path: `apps/kielivalmis-domain-static/r4m/`

The existing root landing remains unchanged.

### Visual + motion

- [x] approved K/wave mark, no geometry redesign
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

### AI provenance

- [x] optimized WebP hero
- [x] tiny localized visible AI disclosure
- [x] page-level AI disclosure metadata
- [x] Schema.org `ImageObject`
- [x] embedded WebP XMP provenance markers
- [x] JSON provenance sidecar with creator/model/date/purpose/prompt summary
- [x] verifier fails if provenance disappears

### Clean-URL/path safety

Vercel uses clean URLs and the R4M preview lives in a folder. R4M now includes:

`<base href="/r4m/">`

This prevents `styles.css`, `app.js`, images and `./locales/<code>.json` from resolving from `/` when the page is served as clean `/r4m` rather than `/r4m/`.

The R4M verifier now locks this requirement.

### Indexing safety

`vercel.json` places specific preview rules before the public catch-all:

- `/r4m` → `X-Robots-Tag: noindex, nofollow`
- `/r4m/(.*)` → `X-Robots-Tag: noindex, nofollow`
- normal public routes retain `index, follow`

The R4M HTML also contains `noindex,nofollow`.

## 20-language contract

Supported locales:

`en, fi, sv, et, es, tr, ru, uk, ar, zh, ku, vi, bn, sq, tl, th, so, ne, fa, ur`

R4M includes:

- [x] one shared component/page structure
- [x] 20 separate locale JSON dictionaries
- [x] identical complete key set across all 20 locale files
- [x] language switcher
- [x] browser/query/local-storage locale selection
- [x] Arabic/Persian/Urdu RTL handling
- [x] Kurdish currently Kurmanji Latin/LTR pending existing-app audit
- [x] translated visible AI disclosure
- [x] translated new landing CTAs/navigation/sections/footer labels

**Translation quality status:** structurally complete initial pack only. It is not yet the frozen native-quality pack. Natural/native closeness, UI wording, YKI terminology and language-learning suitability must be audited per locale before public launch and before reuse in the app.

## R4M automated contract

`r4m/verify-r4m.mjs` gates:

- exact 20-language set
- 20 locale files and identical non-empty key sets
- RTL set
- approved logo asset
- photographic hero asset
- AI disclosure, XMP provenance and provenance sidecar
- motion + reduced-motion contract
- desktop/mobile typography
- external optimized raster assets
- existing Learn/Google Play links
- `/r4m` no-index headers
- `/r4m/` base-path resolution

Local result:

`RESULT: KIELIVALMIS R4M PREVIEW CONTRACT PASS`

`package.json` runs the original site verifier plus the R4M verifier in Vercel build.

## Immediate next gate

1. Connect separately with `ssh root@77.42.44.201`.
2. Verify live branch/commit/clean state and inspect `git remote -v`.
3. Do **not** checkout the rebrand branch in the live working tree.
4. Fetch `growth/discovery-seo-d2-20260807` explicitly from `Floently/floently-finnish` into `FETCH_HEAD` and extract only `apps/kielivalmis-domain-static` to a temporary deployment directory.
5. Run both static verifier contracts.
6. Deploy **preview only** to the existing KieliValmis Vercel project — no `--prod`.
7. QA `/r4m`, CSS/JS/image assets, all 20 locale endpoints, AI provenance/disclosure and `X-Robots-Tag: noindex, nofollow`.
8. Visually review desktop and iPhone 15 Pro Max-class layouts, logo contrast, photograph and motion.
9. Keep stable root, Learn runtime and Namecheap untouched until explicit approval.

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

- [~] R4 — R4M source ready; Vercel preview QA + visual approval + translation-quality gates pending
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
