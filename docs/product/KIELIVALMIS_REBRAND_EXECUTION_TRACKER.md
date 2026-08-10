# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08  
**Last updated:** 2026-08-10

## Current milestone

**R4N VISUAL APPROVED AND FROZEN. R4O WEBSITE + APP SOURCE GATE PASS. R4P VISIBLE-BRAND REMEDIATION PASS. R4R TYPESCRIPT / NATIVE SOURCE COMPILE REMEDIATION PASS.**

The approved R4N visual direction is frozen. Do not redesign the landing unless a real regression is found.

The KieliValmis website/public-page source and existing Learn app source now pass the current rebrand contracts. Customer-visible `Floently Finnish` / `Floently Learn` naming debt is zero on the active and legacy gateway surfaces covered by the audit. The new KieliValmis landing compiles with TypeScript, targeted ESLint passes, and Expo resolves the compatibility identifiers exactly as required.

**Immediate native blocker:** the approved KieliValmis launcher/adaptive/monochrome/splash binary asset pack is not yet installed in the repository. Do not create or publish a new native build until this gate reports READY.

## Current Git / production safety state

GitHub source of truth:

- repository: `Floently/floently-finnish`
- branch: `growth/discovery-seo-d2-20260807`
- R4P commit: `fef679efc95c64f46207925136969c57ee2af2a2`
- R4R TypeScript remediation commit: `077599569809cfa6454f159c5675ab458c7d868f`

Live Hetzner Learn remains untouched:

- repo: `/root/floently-finnish`
- branch: `preview/enable-all-languages`
- commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- expected working tree: clean
- web: `learn.floently.com`
- API: `learn-api.floently.com`

Every R4O/R4P/R4Q/R4R server operation ended with the live Learn checkout still on this baseline.

## Locked identity / compatibility

- customer-facing Finnish-learning product: **KieliValmis**
- endorsement: **by Floently**
- parent/maker/product family: **Floently**
- legal operator: **Komplyint Oy**
- Floently Read/Create retain Floently branding
- approved logo: user-supplied **K + flowing wave**; geometry must not change
- Android package: `com.vitusidi.floently` — preserve
- iOS bundle ID: `com.vitusidi.floently` — preserve
- Expo slug: `client` — preserve
- deep-link scheme: `floently` — preserve
- EAS project ID: `fa02c141-0a3b-4dbc-9122-7c1cf31ba42c` — preserve
- runtimeVersion: `1.0.2` — preserve
- Expo owner: `vitus-idi` — preserve
- API host: `https://learn-api.floently.com` — preserve
- accounts, progress, YKI, cards, roleplay, RevenueCat and subscriptions — preserve

Do not globally replace the word `Floently`; only the Finnish-learning product identity becomes KieliValmis.

## Supported 20 languages

`en, fi, sv, et, es, tr, ru, uk, ar, zh, ku, vi, bn, sq, tl, th, so, ne, fa, ur`

Arabic, Persian and Urdu are RTL. Kurdish currently uses Kurmanji Latin/LTR pending the dedicated locale-direction audit.

## Approved website state

### R4N landing

- [x] photographic R4M composition retained
- [x] approved K/wave mark
- [x] live `KieliValmis` + small `by Floently`
- [x] desktop hero about 35–43px
- [x] mobile hero about 23–25.5px
- [x] lighter three-beat heading treatment
- [x] restrained teal final-line highlight
- [x] user visually approved R4N
- [x] R4N visual direction frozen
- [x] 20 locale dictionaries structurally complete
- [x] ar/fa/ur RTL implementation present

Approved staged R4N deployment:

`https://kielivalmis-domain-static-bvfwu3a5z-kompyint-oys-projects.vercel.app/r4m`

Stable KieliValmis alias remains intentionally unchanged:

`https://kielivalmis-domain-static.vercel.app`

Stable baseline body SHA:

`025a5a767a430ce4d7bdd8b7beb0f3ed33e71f3c1a5453c0b4247727e6073f8f`

Namecheap KieliValmis DNS remains untouched/parked.

### R4O public-page parity

Privacy, Terms, Support and Delete Account have been rebuilt on the shared KieliValmis shell.

- [x] `apps/kielivalmis-domain-static/shared/page-shell.css`
- [x] `apps/kielivalmis-domain-static/shared/page-shell.js`
- [x] approved K/wave mark
- [x] responsive R4N-like visual hierarchy
- [x] language selection/runtime localization
- [x] complete initial 20-language structure
- [x] ar/fa/ur RTL handling
- [x] canonicals preserved
- [x] compatibility redirects preserved
- [x] old fake `KV` boxes removed
- [x] old oversized temporary headings removed
- [x] static website regression contract PASS
- [x] public-page shell contract PASS
- [x] public-page 20-locale contract PASS
- [x] public-page RTL contract PASS
- [ ] staged Vercel QA after R4O changes
- [ ] EN/FI/AR visual/RTL review
- [ ] native/legal-language quality audit of all 20 translations

## Existing app KieliValmis rebrand state

### Entry / brand / localization

- [x] direct KieliValmis public entry via `LandingRoute.tsx`
- [x] `features/kielivalmis/KieliValmisLandingScreen.tsx`
- [x] shared R4N website/app landing copy
- [x] exact 20-language locale set
- [x] ar/fa/ur RTL handling
- [x] approved K/wave mark on landing
- [x] approved photographic hero on landing
- [x] Expo display name `KieliValmis`
- [x] iOS `CFBundleDisplayName` `KieliValmis`
- [x] microphone/speech-recognition permission copy uses KieliValmis
- [x] canonical auth header uses KieliValmis + `BY FLOENTLY`
- [x] email/password auth logic preserved
- [x] Google sign-in preserved
- [x] auth return routing/storage preserved
- [x] active web metadata uses KieliValmis
- [x] product drawer Learn entry uses KieliValmis
- [x] Floently Read/Create labels preserved

### Visible-brand audit

R4P completed the remaining four runtime replacements.

- [x] two `subscriptionStore.ts` access summaries -> `KieliValmis full access is active.`
- [x] legacy gateway `Floently Learn` -> `KieliValmis`
- [x] legacy Read-preview `Floently Finnish` -> `KieliValmis`
- [x] `legacy_visible_brand_hits=0`
- [x] `active_kielivalmis_surface_hits=0`
- [x] `legacy_gateway_hits=0`

## R4Q / R4R compile validation

R4Q found TypeScript problems only in the newly added KieliValmis landing. There was no compatibility-ID, lint, Expo-config or live-runtime regression.

R4R fixed and verifier-guarded those issues:

- [x] explicit `ImageStyle` typing for the KieliValmis mark
- [x] explicit `ImageStyle` typing for the hero image
- [x] unsupported React Native `620` weight -> supported `600`
- [x] unsupported `650` -> `700`
- [x] unsupported `750` -> `700`
- [x] unsupported `850` -> `800`
- [x] verifier rejects unsupported non-standard weights
- [x] verifier requires explicit image style typing
- [x] full TypeScript `--noEmit` PASS
- [x] targeted ESLint PASS
- [x] `KIELIVALMIS_NATIVE_REACT_NATIVE_STYLE_TYPES=PASS`
- [x] native rebrand source contract PASS
- [x] visible-brand audit remains zero

### Expo identity validation

The original R4R attempt stopped on a brittle text `grep`; the separate JSON diagnostic proved Expo itself was healthy. The final R4R run used JSON parsing and passed.

Resolved values:

- [x] `name="KieliValmis"`
- [x] `slug="client"`
- [x] `scheme="floently"`
- [x] `runtimeVersion="1.0.2"`
- [x] `ios.bundleIdentifier="com.vitusidi.floently"`
- [x] `android.package="com.vitusidi.floently"`
- [x] `extra.eas.projectId="fa02c141-0a3b-4dbc-9122-7c1cf31ba42c"`
- [x] `R4R_EXPO_CONFIG_JSON_IDENTITY=PASS`

Final R4R result:

`RESULT: KIELIVALMIS R4R TYPESCRIPT REMEDIATION PASS`

## Native launcher / splash gate — NEXT

Current repository configuration still intentionally references the released Floently binaries:

- `./assets/images/floently-finnish-icon.png`
- `./assets/images/android-icon-foreground.png`
- `./assets/images/android-icon-monochrome.png`
- `./assets/images/splash-icon.png`

Current verifier state:

`KIELIVALMIS_NATIVE_ICON=PENDING_APPROVED_BINARY_INSTALL`

`native_icon_gate=PENDING`

The next native patch must install the approved KieliValmis binary family without redrawing the symbol:

- [ ] 1024×1024 opaque app/store icon
- [ ] 1024×1024 transparent Android adaptive foreground
- [ ] 1024×1024 transparent Android monochrome mark
- [ ] 1024×1024 transparent splash mark
- [ ] update `app.config.ts`
- [ ] update `app.base.json`
- [ ] update verifier to require exact KieliValmis asset paths/dimensions/properties
- [ ] rerun TypeScript, ESLint, Expo JSON identity and rebrand contracts
- [ ] require `native_icon_gate=READY`
- [ ] no app version/build-number increment during this source gate

Do not publish with the old Floently launcher icon under the KieliValmis display name.

## Immediate next sequence

1. Install and verify the approved KieliValmis native launcher/adaptive/monochrome/splash binaries.
2. Rerun native source, TypeScript, ESLint, Expo JSON identity and visible-brand gates; require `native_icon_gate=READY`.
3. Stage the R4O website/public pages with `vercel deploy --prod --skip-domain`; prove the stable alias did not move.
4. Visually review Privacy/Terms/Support/Delete Account in English, Finnish and Arabic.
5. Run native-quality audit of all 20 landing translations and legal/public-page translations.
6. Audit Kurdish script/direction against the existing app locale.
7. Add localized SEO routes, canonicals, `hreflang` and `x-default`.
8. Only then create a native preview/test build.
9. Run auth, Google, subscription/purchase/restore, YKI, cards/progress/streak, roleplay/audio/export and all-20-language layout/RTL regression.
10. Prepare store metadata/screenshots and then Android/iOS updates.

## Remaining quality / release gates

- [x] R4N visual approval
- [x] R4O website + app source gate
- [x] R4P visible-brand remediation
- [x] R4R TypeScript/native-source compile remediation
- [ ] approved native launcher/adaptive/monochrome/splash binaries installed
- [ ] native asset gate READY
- [ ] R4O public-page staged QA
- [ ] public-page EN/FI/AR visual/RTL review
- [ ] native-quality audit of all 20 website/app landing translations
- [ ] native/legal-language audit of all 20 public-page translations
- [ ] Kurdish script/direction audit
- [ ] permanent shared approved-logo asset path
- [ ] localized SEO routes/canonicals/hreflang/x-default
- [ ] native KieliValmis preview build
- [ ] authentication + Google sign-in regression
- [ ] purchase/restore + RevenueCat regression
- [ ] YKI completion/submission/evaluation/report regression
- [ ] cards/progress/streak regression
- [ ] roleplay/audio/export regression
- [ ] all-20-language layout/RTL/text-expansion regression
- [ ] store metadata + screenshots
- [ ] Android update
- [ ] iOS update
- [ ] post-release verification
- [ ] legacy-host retirement decision later

## Regression blockers

Do not proceed to native/store submission if any of these fail: authentication; Google sign-in; purchase/restore; subscription continuity; YKI completion/submission/evaluation/report; roleplay/audio/export; card banks; streak/progress; legal/support/delete-account; production web/API calls; app-upgrade continuity; localization completeness; RTL/layout; or critical translated UI overflow.

Trademark filing/clearance remains a separate legal/business workstream and is not represented here as completed legal clearance.
