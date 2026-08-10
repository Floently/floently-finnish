# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4M staged deployment reached Vercel successfully and the R4M page itself returned HTTP 200, but automated QA correctly stopped because `/r4m` returned `X-Robots-Tag: index, follow` instead of `noindex, nofollow`. Root cause was Vercel header precedence: the public catch-all header rule followed the R4M-specific rules and overwrote the robots header. GitHub fixes are now committed; redeploy + full protected QA are next.**

Do not replace the current root landing, attach KieliValmis custom domains, or change Namecheap DNS until R4M passes staged-deployment QA, visual approval and the remaining localization-quality gates.

## Repository move

- [x] GitHub source of truth is **`Floently/floently-finnish`**.
- [x] Working branch: `growth/discovery-seo-d2-20260807`.
- [x] Initial R4M implementation commit: `2c8809ea624fb11fc8d5d2efdbf58daf030cb25d`.
- [x] R4M clean-URL base-path verifier fix: `d0781fc2dcc5df049384b2dc3fd4ee642aa803be`.
- [x] R4M header precedence fix: `280ced4afccc9045f2c186a75ea90744989650a3`.
- [x] R4M verifier precedence guard: `0c070d87e9aacd4de297b8faa3656bd17602ab0e`.
- [x] All new GitHub writes target the organization repository.
- [x] Hetzner checkout inspection showed `origin` still points to the former personal repository URL; deployment fetches therefore explicitly use `git@github.com:Floently/floently-finnish.git` without changing the live working tree.

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
- First R4M staged deployment: `https://kielivalmis-domain-static-drguv6948-kompyint-oys-projects.vercel.app`
- Stable-alias SHA captured immediately before first R4M staged deployment: `025a5a767a430ce4d7bdd8b7beb0f3ed33e71f3c1a5453c0b4247727e6073f8f`
- Deployment Protection bypass + ordinary `curl` is the established automated-QA method

The first R4M staged deployment was created with `vercel --prod --skip-domain`. Vercel reported a production-class deployment URL and a generated project/team alias. QA stopped before the scripted stable-alias after-hash, so the next command must explicitly verify that `https://kielivalmis-domain-static.vercel.app` still hashes to the captured pre-deployment SHA before another deploy.

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
- **R4M:** active staged/preview-only implementation candidate.

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

Vercel uses clean URLs and the R4M preview lives in a folder. R4M includes:

`<base href="/r4m/">`

This prevents `styles.css`, `app.js`, images and `./locales/<code>.json` from resolving from `/` when the page is served as clean `/r4m` rather than `/r4m/`.

The R4M verifier locks this requirement.

### Indexing safety and R4M header incident

The first staged deployment returned:

`X-Robots-Tag: index, follow`

for `/r4m`, even though R4M-specific `noindex` rules existed. The public `/(.*)` header rule was listed after the R4M-specific rules, so its later `X-Robots-Tag` value won on the deployed response.

Fixed configuration order:

1. public `/(.*)` → `X-Robots-Tag: index, follow`
2. `/r4m` → `X-Robots-Tag: noindex, nofollow`
3. `/r4m/(.*)` → `X-Robots-Tag: noindex, nofollow`

The R4M verifier now checks both the values and this precedence order. The R4M HTML independently contains `noindex,nofollow` as a second indexing-safety layer.

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
- `/r4m` no-index header values **and precedence order**
- `/r4m/` base-path resolution

Local result before first staged deploy:

`RESULT: KIELIVALMIS R4M PREVIEW CONTRACT PASS`

The first staged deploy also passed:

- `/r4m` HTTP 200
- deployed R4M HTML markers

and then stopped correctly at the robots-header gate.

`package.json` runs the original site verifier plus the R4M verifier in Vercel build.

## Immediate next gate

1. Connect separately with `ssh root@77.42.44.201`.
2. Verify live Learn branch/commit/clean state.
3. Verify the stable KieliValmis alias still hashes to `025a5a767a430ce4d7bdd8b7beb0f3ed33e71f3c1a5453c0b4247727e6073f8f` before any new deployment.
4. Fetch the latest `growth/discovery-seo-d2-20260807` explicitly from `Floently/floently-finnish` into `FETCH_HEAD`; do not checkout the rebrand branch in the live working tree.
5. Run both static verifier contracts and confirm the new header-precedence guard passes.
6. Create a staged production build using `vercel --prod --skip-domain`; this is the documented no-production-domain-assignment path for a staged production build.
7. QA `/r4m`, the actual `X-Robots-Tag: noindex, nofollow`, CSS/JS/image assets, all 20 locale endpoints and AI provenance/disclosure.
8. Re-hash the stable alias after the staged deploy and require an exact match with the captured baseline.
9. Visually review desktop and iPhone 15 Pro Max-class layouts, logo contrast, photograph, motion, Finnish and at least one RTL language.
10. Keep stable root, Learn runtime and Namecheap untouched until explicit approval.

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

- [~] R4 — R4M header fix committed; staged redeploy QA + visual approval + translation-quality gates pending
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
