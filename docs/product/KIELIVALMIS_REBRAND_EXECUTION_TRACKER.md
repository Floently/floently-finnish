# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4N VISUAL APPROVED AND FROZEN. R4O website-page parity + native KieliValmis source rebrand is in progress.**

The user explicitly approved the R4N design on 2026-08-10 with “its good now.” Do not redesign the accepted landing unless a regression is found. Privacy, Terms, Support and Delete Account have now been rebuilt on a shared KieliValmis shell with a 20-language runtime, and the existing mobile Learn app now has a direct KieliValmis public entry, shared website/app landing copy, KieliValmis display name and a KieliValmis-branded canonical auth header. Source QA is the next gate.

**Do not release a new native build yet.** The approved rounded-square KieliValmis launcher/adaptive/splash binary asset gate is intentionally still pending. Do not increment build/version numbers, submit stores, change production Learn, promote the stable KieliValmis alias or touch Namecheap until the relevant gates pass.

## Locked identity / compatibility

- Customer-facing Finnish-learning product: **KieliValmis**
- Endorsement: **by Floently**
- Parent/maker/product family: **Floently**
- Legal operator: **Komplyint Oy**
- Floently Read/Create retain Floently branding; do not globally replace `Floently`
- Approved logo: user-supplied **K + flowing wave**; geometry must not change
- Android package: preserve `com.vitusidi.floently`
- iOS bundle ID: preserve `com.vitusidi.floently`
- Expo slug: preserve `client`
- deep-link scheme: preserve `floently`
- EAS project ID: preserve `fa02c141-0a3b-4dbc-9122-7c1cf31ba42c`
- runtimeVersion: preserve `1.0.2`
- owner: preserve `vitus-idi`
- API host: preserve `https://learn-api.floently.com`
- current learning web host: preserve `learn.floently.com` during transition
- accounts, progress, YKI, cards, roleplay, RevenueCat and subscriptions: preserve

## Repository / production baseline

GitHub source of truth: **`Floently/floently-finnish`**.

Live Hetzner Learn baseline:

- repo: `/root/floently-finnish`
- branch: `preview/enable-all-languages`
- commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- checkout must remain clean
- server `origin` may still show former personal repo; rebrand fetches explicitly use `git@github.com:Floently/floently-finnish.git`

KieliValmis Vercel:

- project: `kielivalmis-domain-static`
- project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- scope: `kompyint-oys-projects`
- stable alias: `https://kielivalmis-domain-static.vercel.app`
- stable baseline SHA: `025a5a767a430ce4d7bdd8b7beb0f3ed33e71f3c1a5453c0b4247727e6073f8f`
- approved R4N staged deployment: `https://kielivalmis-domain-static-bvfwu3a5z-kompyint-oys-projects.vercel.app/r4m`
- Namecheap KieliValmis DNS remains untouched/parked

## R4 visual history

- R4F — rejected mobile typography/layout
- R4G — external SVG 404; QA stopped safely
- R4H — automated QA passed; mobile visual rejected
- R4I — mobile-first protected preview passed automated QA
- R4L — approved-logo + photographic hero + restrained motion + 20-language direction locked
- R4M — branded photographic/animated/20-language candidate passed full staged QA; visually much better
- R4N — smaller/stylish hero typography; full staged QA PASS; **user visually approved; visual design frozen**

Approved R4N hero targets:

- desktop about 35–43px
- mobile about 23–25.5px
- lighter/calmer weight
- translated hero sentences use clear three-beat visual rhythm
- final sentence uses restrained teal highlight
- approved photo/motion/logo remain unchanged

## Supported 20 languages

`en, fi, sv, et, es, tr, ru, uk, ar, zh, ku, vi, bn, sq, tl, th, so, ne, fa, ur`

Arabic, Persian and Urdu are RTL. Kurdish currently uses Kurmanji Latin/LTR pending existing-app locale audit.

## R4O-A — public website page parity

The old Privacy, Terms, Support and Delete Account pages used duplicated inline styling, oversized headings, fake `KV` boxes and English-only content. They have been rebuilt using one shared KieliValmis shell.

### Shared page shell

- [x] `apps/kielivalmis-domain-static/shared/page-shell.css`
- [x] `apps/kielivalmis-domain-static/shared/page-shell.js`
- [x] approved K/wave mark + live `KieliValmis` + small `by Floently`
- [x] R4N-like typography and contrast
- [x] responsive mobile layout
- [x] locale query/browser/localStorage selection
- [x] `html lang` + RTL direction handling
- [x] localized title/meta-description runtime

### Public-page locale modules

- [x] `page-locales-1.js` — en, fi, sv, et, es
- [x] `page-locales-2.js` — tr, ru, uk, ar, zh
- [x] `page-locales-3.js` — ku, vi, bn, sq, tl
- [x] `page-locales-4.js` — th, so, ne, fa, ur
- [x] Privacy, Terms, Support and Delete Account content has a complete initial 20-language structure
- [x] proper names remain untranslated
- [x] account-deletion subject remains exactly `Delete my KieliValmis account`

Translation status: **structurally complete initial pack; not yet the final native/legal-language quality freeze.** Natural/native closeness, legal clarity, UI wording and terminology still require the language-quality audit before public promotion.

### Pages converted

- [x] `privacy/index.html`
- [x] `terms/index.html`
- [x] `support/index.html`
- [x] `delete-account/index.html`
- [x] canonicals preserved
- [x] old fake `KV` mark removed
- [x] old 58px temporary page heading removed
- [x] compatibility redirect URLs remain governed by `vercel.json`

Current approved mark is referenced from `/r4m/assets/kielivalmis-mark.png`. Before retiring the R4M preview folder, copy/promote that exact approved binary to a permanent shared/root asset path and update the verifier. Do not redraw it.

### Website verifier hardening

`verify-kielivalmis-domain-static.mjs` now additionally requires:

- shared shell on all four pages
- all four locale modules
- exact 20-locale set/order and complete non-empty key contracts
- ar/fa/ur RTL and ku LTR
- approved logo marker
- no fake `KV` mark / no old oversized heading
- English legal/support source markers
- exact account-deletion email subject

Expected new PASS markers include:

- `KIELIVALMIS_STATIC_PUBLIC_PAGE_SHELL=PASS`
- `KIELIVALMIS_STATIC_PUBLIC_PAGE_20_LOCALES=PASS`
- `KIELIVALMIS_STATIC_PUBLIC_PAGE_RTL=PASS`

This source has **not yet been server/staged QA-tested** after R4O changes.

## R4O-B — existing app visible KieliValmis rebrand

### Direct app entry + shared copy

- [x] new `features/kielivalmis/kielivalmisCopy.ts`
- [x] exact same 20 R4N website locale JSON files are statically reused by the app landing
- [x] new `features/kielivalmis/KieliValmisLandingScreen.tsx`
- [x] approved K/wave mark reused
- [x] approved AI hero reused
- [x] R4N-style smaller heading / motion / photo overlays
- [x] 20-language selector and ar/fa/ur RTL handling
- [x] `LandingRoute.tsx` now opens KieliValmis directly instead of the cross-product Floently gateway
- [x] Floently remains parent/maker; Read/Create remain separate Floently product identities

### Native display configuration

- [x] Expo display name -> `KieliValmis`
- [x] iOS `CFBundleDisplayName` -> `KieliValmis`
- [x] microphone permission copy -> KieliValmis
- [x] speech-recognition permission copy -> KieliValmis
- [x] technical IDs deliberately preserved
- [x] app version/build number deliberately unchanged during source work

### Canonical auth screen

- [x] existing auth logic retained; no duplicate auth implementation
- [x] old Floently auth logo reference removed
- [x] approved KieliValmis mark + `KieliValmis` + `BY FLOENTLY` header added
- [x] email/password login/register retained
- [x] Google sign-in retained
- [x] login-email storage retained
- [x] return routing retained

### Native source verifier + audit

- [x] `scripts/verify-kielivalmis-rebrand.mjs`
- [x] `npm run verify:kielivalmis-rebrand`
- [x] compatibility-ID locks
- [x] exact 20 shared website/app locale checks
- [x] direct KieliValmis landing guard
- [x] canonical auth-brand guard
- [x] source-only version/build guard
- [x] native icon gate reports **PENDING** while old launcher asset remains configured
- [x] `scripts/audit-kielivalmis-visible-brand.mjs`
- [x] `npm run audit:kielivalmis-visible-brand`
- [x] audit prints progress, file/line/snippet for remaining `Floently Finnish` / `Floently Learn` occurrences instead of globally replacing parent-brand references

## Native icon / splash gate — intentionally pending

Do not call the native rebrand complete yet.

The approved rounded-square K/wave icon must replace the current native launcher icon/adaptive foreground/monochrome/splash assets **before any new app build**. The GitHub text connector cannot safely create the required binary PNG files through the normal contents action, so source config intentionally still points at the current released icon until a dedicated binary-asset installation step is completed and verified.

Do not use a newly invented icon, do not redraw the approved symbol, and do not publish with the temporary old Floently icon under the KieliValmis display name.

## Immediate next gate

1. Fetch the latest organization branch into an isolated temporary directory; do not checkout rebrand code in the live Learn working tree.
2. Run the KieliValmis static website verifier and R4N verifier.
3. Run `npm run verify:kielivalmis-rebrand` from `apps/client`.
4. Run `npm run audit:kielivalmis-visible-brand` and inspect all remaining legacy Learn-brand hits by context.
5. Run TypeScript/lint/build-oriented checks for the new native landing/auth changes.
6. Fix any source/compile/audit failures before staging the updated public pages.
7. Stage the website with `--prod --skip-domain`, verify the stable alias hash is unchanged, then visually spot-check Privacy/Terms/Support/Delete Account in English, Finnish and Arabic.
8. Install the approved native binary asset pack, update icon/splash config and rerun the native source verifier until `native_icon_gate=READY`.
9. Only then proceed to a native preview/test build and full functional/localization regression.

## Remaining quality / release gates

- [ ] R4O source + compile verification
- [ ] R4O public-page staged QA
- [ ] public-page EN/FI/AR visual/RTL review
- [ ] native-quality audit of all 20 website/app landing translations
- [ ] native/legal-language audit of all 20 public-page translations
- [ ] Kurdish script/direction audit against existing app locale
- [ ] permanent shared approved-logo asset path
- [ ] localized SEO routes, canonicals, `hreflang`, `x-default`
- [ ] approved native launcher/adaptive/monochrome/splash binaries installed
- [ ] native KieliValmis preview build
- [ ] authentication + Google sign-in regression
- [ ] purchase/restore + RevenueCat regression
- [ ] YKI completion/submission/evaluation/report regression
- [ ] cards/progress/streak regression
- [ ] roleplay/audio/export regression
- [ ] all-20-language app layout/RTL/text-expansion regression
- [ ] store metadata + screenshots
- [ ] Android update
- [ ] iOS update
- [ ] post-release verification
- [ ] legacy-host retirement decision later

## Regression blockers

Do not proceed to native/store submission if any of these fail: authentication; Google sign-in; purchase/restore; subscription continuity; YKI completion/submission/evaluation/report; roleplay/audio/export; card banks; streak/progress; legal/support/delete-account; production web/API calls; app-upgrade continuity; localization completeness; RTL/layout; or critical translated UI overflow.

Trademark filing/clearance remains a separate legal/business workstream and is not represented here as completed legal clearance.
