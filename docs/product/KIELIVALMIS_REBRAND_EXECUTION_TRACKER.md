# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4M — preview-only branded + photographic + animated + 20-language landing candidate committed in the Floently organization repository. Local/static R4M contract PASS. Vercel preview deployment, protected route QA and visual review are next.**

Do not replace the current root landing page, attach KieliValmis custom domains, or change Namecheap DNS until R4M is deployed as a preview, passes automated and visual QA, and the website localization gates below are complete.

## Repository move

- [x] GitHub source of truth moved from the personal repository to **`Floently/floently-finnish`**.
- [x] Working branch exists in the organization repository: `growth/discovery-seo-d2-20260807`.
- [x] R4M source commit created in the organization repository: `2c8809ea624fb11fc8d5d2efdbf58daf030cb25d`.
- [x] All new GitHub writes must target `Floently/floently-finnish`.
- [ ] Before server-side fetch/deploy commands, inspect the Hetzner checkout remote because the live checkout may still point at the former personal repository URL.

## Locked product architecture

- Customer-facing Finnish-learning product: **KieliValmis**
- Endorsed identity: **KieliValmis by Floently**
- Parent/maker/product family: **Floently**
- Legal operator: **Komplyint Oy**
- Purchased domain: **kielivalmis.com**
- Existing Android/iOS store records: preserve
- Android package / Apple bundle ID: preserve `com.vitusidi.floently`
- Existing accounts, subscriptions, RevenueCat, progress, YKI engine, card banks and roleplay: preserve
- Existing API host `learn-api.floently.com`: preserve
- Existing web app host `learn.floently.com`: preserve until a future KieliValmis runtime alias passes auth/payment/YKI regression
- Existing Floently public Vercel project `main-domain-static`: preserve as family gateway
- KieliValmis public marketing project: separate Vercel project `kielivalmis-domain-static`

## Production rollback baseline

### Hetzner Learn runtime

- Host: `ubuntu-4gb-hel1-2`
- IP: `77.42.44.201`
- Repo: `/root/floently-finnish`
- Live branch: `preview/enable-all-languages`
- Live commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- Web: `learn.floently.com`
- API: `learn-api.floently.com`

KieliValmis marketing work must not modify this live checkout state.

### KieliValmis Vercel

- Project: `kielivalmis-domain-static`
- Project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- Org/team ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope: `kompyint-oys-projects`
- Stable alias: `https://kielivalmis-domain-static.vercel.app`
- R4H stable rollback candidate: `https://kielivalmis-domain-static-lk9ns71uv-kompyint-oys-projects.vercel.app`
- R4I protected preview: `https://kielivalmis-domain-static-4ll5bamsm-kompyint-oys-projects.vercel.app`
- Deployment Protection bypass + ordinary `curl` is the established automated-QA path

### DNS baseline

- Namecheap nameservers remain authoritative
- Apex remains parked at `192.64.119.155`
- `www` remains parked at `parkingpage.namecheap.com.`
- No KieliValmis DNS changes have been made

## Brand rule — LOCKED

The user supplied and approved the KieliValmis **K + flowing wave** logo family. **Do not redesign or alter the symbol geometry.**

Approved usage:

- standalone K + wave = website/header mark and favicon source
- rounded-square K + wave = future app/store icon source
- website header uses the approved symbol plus live near-white `KieliValmis` text and a much smaller cyan/teal `by Floently` endorsement
- live text is intentional so the wordmark stays short, responsive and high-contrast on the dark website background
- `by Floently` is not baked into the app icon

## R4 history condensed

- **R4F:** first typography/mobile refinement functionally passed but was visually rejected as cramped/card-heavy.
- **R4G:** external SVG hero existed in source but returned deployed HTTP 404; QA stopped safely.
- **R4H:** hero moved inline; automated QA passed, but mobile visual approval was withheld.
- **R4I:** mobile-first structure created; protected preview passed full automated route/content/legal/security QA.
- **R4L:** direction locked around the approved KieliValmis brand, human-centered photographic hero, smaller typography, restrained animation and permanent 20-language-first implementation.
- **R4M:** current preview-only implementation candidate.

## R4M implementation

Path: `apps/kielivalmis-domain-static/r4m/`

The existing root landing page is intentionally unchanged.

### Visual system

- [x] approved K + wave mark used without geometry redesign
- [x] live high-contrast `KieliValmis` wordmark + tiny `by Floently`
- [x] desktop hero target approximately 39–48 px
- [x] mobile hero target approximately 25.5–28 px
- [x] human-centered AI-generated photographic hero replaces abstract dashboard art in R4M
- [x] language-specific text is HTML/CSS, not baked into the photograph
- [x] subtle CSS-only ambient aurora drift
- [x] subtle hero image drift on desktop
- [x] animated speaking waveform
- [x] feedback/status pulse
- [x] mobile photo drift disabled
- [x] `prefers-reduced-motion: reduce` supported

### AI image provenance

R4M hero files:

- `r4m/assets/kielivalmis-hero-ai.webp`
- `r4m/assets/kielivalmis-hero-ai.provenance.json`

Contract:

- [x] tiny visible localized `AI-generated image` disclosure
- [x] page-level AI disclosure metadata
- [x] Schema.org `ImageObject`
- [x] WebP contains embedded XMP provenance markers
- [x] provenance sidecar preserves creator/model/date/purpose/prompt summary
- [x] verifier fails if required provenance is lost

### Preview indexing safety

`vercel.json` now places explicit R4M rules before the public catch-all:

- `/r4m` → `X-Robots-Tag: noindex, nofollow`
- `/r4m/(.*)` → `X-Robots-Tag: noindex, nofollow`
- normal public routes retain `X-Robots-Tag: index, follow`

R4M also carries page-level `noindex,nofollow` metadata.

## Permanent 20-language contract

Supported set:

`en, fi, sv, et, es, tr, ru, uk, ar, zh, ku, vi, bn, sq, tl, th, so, ne, fa, ur`

English, Finnish, Swedish, Estonian, Spanish, Turkish, Russian, Ukrainian, Arabic, Chinese, Kurdish, Vietnamese, Bengali, Albanian, Tagalog, Thai, Somali, Nepali, Persian and Urdu.

R4M localization architecture:

- [x] one shared landing-page component structure
- [x] lightweight locale loader
- [x] 20 separate locale JSON dictionaries
- [x] every locale currently has the same complete key set as English
- [x] language switcher
- [x] browser/local-storage/query-parameter locale selection
- [x] Arabic, Persian and Urdu use RTL layout
- [x] Kurdish is currently treated as Kurmanji Latin/LTR pending explicit audit against the existing app locale
- [x] visible AI disclosure translates with the selected locale
- [x] mobile/desktop copy is rendered from the same locale keys

**Quality status:** the 20 dictionaries are an initial structurally complete translation pack, not yet a frozen native-quality pack. Language-by-language review for natural/native closeness, UI wording, YKI terminology and learning suitability is still required before public launch or reuse in the app.

## R4M verifier

`r4m/verify-r4m.mjs` currently gates:

- exact 20-language set
- 20 locale files and complete identical key sets
- RTL set
- approved logo asset presence
- photographic hero presence
- embedded XMP AI provenance
- provenance sidecar completeness
- AI disclosure markers
- motion/reduced-motion contract
- desktop/mobile typography contract
- external optimized raster assets rather than inline PNG/JPEG
- preserved Learn/Google Play links
- R4M no-index header rules

Local result:

`RESULT: KIELIVALMIS R4M PREVIEW CONTRACT PASS`

`package.json` now runs both the original static-site verifier and the R4M verifier during Vercel build.

## Immediate next gate

1. Connect to Hetzner separately with `ssh root@77.42.44.201`.
2. Inspect `/root/floently-finnish` branch/commit/clean state and inspect `git remote -v` before fetching because the GitHub repository moved to `Floently/floently-finnish`.
3. Do not checkout the rebrand branch in the live working tree.
4. Fetch/extract only `apps/kielivalmis-domain-static` from the organization branch into a temporary directory.
5. Run both static verification contracts.
6. Deploy **preview only** to the existing `kielivalmis-domain-static` Vercel project — no `--prod`.
7. QA `/r4m/`, its CSS/JS, image assets, all 20 locale JSON endpoints, no-index response header, AI provenance/disclosure and representative LTR/RTL locale switching.
8. Visually review desktop + iPhone 15 Pro Max-class layouts and the approved logo treatment.
9. Keep root/stable site, Namecheap DNS and Learn runtime unchanged until explicit visual approval.

## After R4M visual approval

Before public KieliValmis domain promotion:

- [ ] native-quality review of all 20 landing translations
- [ ] audit existing app `ku` script/direction and align website
- [ ] localized legal/support/delete-account pages where appropriate
- [ ] localized SEO titles/descriptions/routes
- [ ] canonical + `hreflang` + `x-default` strategy
- [ ] locale fallback and text-expansion QA
- [ ] RTL visual QA
- [ ] freeze approved KieliValmis terminology/translation pack

Then build the existing Android/iOS app rebrand from that same frozen source; do not independently rewrite translations in the app.

## Remaining stages

- [~] R4 — R4M source committed; Vercel preview QA + visual approval + translation-quality gates pending
- [ ] R5 — attach `kielivalmis.com` / `www.kielivalmis.com` to the correct Vercel project and capture exact DNS requirements
- [ ] R6 — change only KieliValmis Namecheap DNS + verify HTTPS/canonical behavior
- [ ] R7 — parallel `app.kielivalmis.com` runtime + auth/payment/YKI regression
- [ ] R8 — SEO migration/Search Console/hreflang work
- [ ] R9 — store metadata package
- [ ] R10 — store graphics/screenshots
- [ ] R11 — native visible-brand + localization pack, same package/bundle IDs
- [ ] R12 — full app functional/localization regression
- [ ] R13 — Android update
- [ ] R14 — iOS update
- [ ] R15 — post-release verification
- [ ] R16 — legacy hostname retirement decision

## Regression blockers

Do not proceed to native/store release if any of these fail: authentication; purchase/restore; existing subscription continuity; YKI completion/submission/evaluation/report; roleplay/export; card banks; streak/progress; legal/support/delete-account URLs; production web/API calls; app upgrade continuity; localization/RTL gates.

Trademark filing/clearance remains a separate legal/business workstream and is not represented here as completed legal clearance.
