# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08  
**Last updated:** 2026-08-11

## Current milestone

**R4N VISUAL APPROVED AND FROZEN. R4O WEBSITE + APP SOURCE GATE PASS. R4P VISIBLE-BRAND REMEDIATION PASS. R4R TYPESCRIPT / NATIVE SOURCE COMPILE REMEDIATION PASS. R4S APPROVED NATIVE ASSET GATE PASS.**

The approved R4N visual direction is frozen. Do not redesign the landing unless a real regression is found.

The KieliValmis website/public-page source and existing Learn app source now pass the current rebrand contracts. Customer-visible `Floently Finnish` / `Floently Learn` naming debt is zero on the active and legacy gateway surfaces covered by the audit. The new KieliValmis landing compiles with TypeScript, targeted ESLint passes, Expo resolves the compatibility identifiers exactly as required, and the approved launcher/adaptive/monochrome/splash binaries are installed with exact-hash verification.

**Immediate next gate:** stage the R4O public pages without moving the stable alias, visually review EN/FI/AR including RTL, then run the 20-language landing/public-page quality audits before creating the first KieliValmis native preview build.

## Current Git / production safety state

GitHub source of truth:

- repository: `Floently/floently-finnish`
- branch: `growth/discovery-seo-d2-20260807`
- R4P commit: `fef679efc95c64f46207925136969c57ee2af2a2`
- R4R TypeScript remediation commit: `077599569809cfa6454f159c5675ab458c7d868f`
- R4R tracker checkpoint commit: `1edda56d02fe7d06a6dce6eff620c1d8f5c7ead5`
- R4S approved native asset commit: `6fef9bac3c0f05d1b93ddd46ea93acc0233aca8b`

Live Hetzner Learn remains untouched:

- repo: `/root/floently-finnish`
- branch: `preview/enable-all-languages`
- commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- expected working tree: clean
- web: `learn.floently.com`
- API: `learn-api.floently.com`

Every R4O/R4P/R4Q/R4R/R4S server operation ended with the live Learn checkout still on this baseline.

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

## R4S native launcher / splash gate — PASS

The approved KieliValmis native binary family is installed and verifier-locked. The asset transfer ZIP was hash-checked on the local machine and server, used only for the isolated R4S patch, and deleted from `/root/` after the successful push.

Current repository configuration:

- `./assets/images/kielivalmis-app-icon.png`
- `./assets/images/kielivalmis-android-foreground.png`
- `./assets/images/kielivalmis-android-monochrome.png`
- `./assets/images/kielivalmis-splash-icon.png`
- Android adaptive background: `#071832`
- light/dark splash background: `#071832`

Locked approved SHA-256 values:

- app icon: `44f807aa15544023ba7179bf7d4db7aeb8e981c70bd80bb2867d5f8a61a70a75`
- Android foreground: `d356ab8c45a24048ec369f061b27c1888a3b512a2df5af0fdeee825e3e126752`
- Android monochrome: `fa95aac34c15ef2fe977a7106be48cbec8e8479c6dd6c715bf4ed7ac0ab6029b`
- splash mark: `38e3b88ddebb450a6a3d24ef8c7a105c86ca92cf0ba247bab4b5af7a42bd34fc`

R4S verification:

- [x] 1024×1024 opaque app/store icon
- [x] 1024×1024 transparent Android adaptive foreground
- [x] 1024×1024 transparent Android monochrome mark
- [x] 1024×1024 transparent splash mark
- [x] exact binary hash verification
- [x] PNG dimensions / bit depth / color type verification
- [x] update `app.config.ts`
- [x] update `app.base.json`
- [x] verifier requires exact KieliValmis paths and hashes
- [x] verifier rejects legacy native visual paths
- [x] full TypeScript PASS
- [x] targeted ESLint PASS
- [x] visible-brand audit remains `0 / 0 / 0`
- [x] Expo JSON identity and asset paths PASS
- [x] technical package/bundle/scheme/runtime/EAS identifiers preserved
- [x] app version remains `1.0.0`
- [x] iOS build number remains `11`
- [x] `KIELIVALMIS_NATIVE_ICON=APPROVED_BINARY_READY`
- [x] `KIELIVALMIS_NATIVE_ASSET_HASHES=PASS`
- [x] `native_icon_gate=READY`
- [x] live Learn final safety PASS

Final R4S result:

`RESULT: KIELIVALMIS R4S NATIVE ASSET GATE PASS`

Do not redraw or silently replace these approved assets in later build/store work. A visual/build regression must be investigated without changing the locked logo geometry.

## Immediate next sequence

1. Stage the R4O website/public pages with `vercel deploy --prod --skip-domain`; prove the stable alias did not move.
2. Visually review Privacy/Terms/Support/Delete Account in English, Finnish and Arabic, including RTL behavior.
3. Run native-quality audit of all 20 landing translations and legal/public-page translations.
4. Audit Kurdish script/direction against the existing app locale.
5. Add localized SEO routes, canonicals, `hreflang` and `x-default`.
6. Promote the approved website/public-page state only after the staged and language-quality gates pass.
7. Only then create a native KieliValmis preview/test build using the existing app identity.
8. Run auth, Google, subscription/purchase/restore, YKI, cards/progress/streak, roleplay/audio/export and all-20-language layout/RTL regression.
9. Prepare store metadata/screenshots and then Android/iOS updates.

## Remaining quality / release gates

- [x] R4N visual approval
- [x] R4O website + app source gate
- [x] R4P visible-brand remediation
- [x] R4R TypeScript/native-source compile remediation
- [x] R4S approved native launcher/adaptive/monochrome/splash binaries installed
- [x] native asset gate READY
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
