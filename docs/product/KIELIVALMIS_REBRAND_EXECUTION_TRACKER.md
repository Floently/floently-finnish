# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08  
**Last updated:** 2026-08-11

## Current milestone

**R4N VISUAL APPROVED AND FROZEN. R4O WEBSITE + APP SOURCE GATE PASS. R4P VISIBLE-BRAND REMEDIATION PASS. R4R TYPESCRIPT / NATIVE SOURCE COMPILE REMEDIATION PASS. R4S APPROVED NATIVE ASSET GATE PASS. R4T STAGED PUBLIC-PAGE QA PASS. R4U EN/FI/AR VISUAL + RTL REVIEW PASS. R4V 20-LANGUAGE QUALITY AUDIT IN PROGRESS; TL/SO/UR RED-LOCALE REMEDIATION CHECKPOINT PASS.**

The approved R4N visual direction is frozen. Do not redesign the landing unless a real regression is found.

The KieliValmis website/public-page source, existing Learn app source, approved native launcher/splash family, staged public pages, and EN/FI/AR rendered visual/RTL surfaces pass the completed rebrand gates. R4V has now audited the complete 20-language landing/public-page corpus and begun remediation. The three release-blocking red locales identified in the first audit — Tagalog/Filipino (`tl`), Somali (`so`) and Urdu (`ur`) — have been remediated, verifier-checked, committed and pushed. Full R4V is **not** complete until the targeted-fix and minor-polish locales are corrected and the whole corpus is re-audited.

**Immediate next gate:** remediate the 11 targeted-fix locales `fi, es, ru, uk, ar, ku, bn, sq, th, ne, fa`; then complete the five minor-polish locales `sv, et, tr, zh, vi`; then run the final 20-language quality/RTL re-audit before website promotion or the first KieliValmis native preview build.

## Current Git / production safety state

GitHub source of truth:

- repository: `Floently/floently-finnish`
- branch: `growth/discovery-seo-d2-20260807`
- R4P commit: `fef679efc95c64f46207925136969c57ee2af2a2`
- R4R TypeScript remediation commit: `077599569809cfa6454f159c5675ab458c7d868f`
- R4R tracker checkpoint commit: `1edda56d02fe7d06a6dce6eff620c1d8f5c7ead5`
- R4S approved native asset commit: `6fef9bac3c0f05d1b93ddd46ea93acc0233aca8b`
- R4S tracker checkpoint commit: `6c81ddbb83451732e3c018a472e555a58f6905c5`
- R4T staged deployment source head: `6c81ddbb83451732e3c018a472e555a58f6905c5`
- R4T tracker checkpoint commit: `4835c38663d6010151f21754e17663c433aff173`
- R4U tracker checkpoint commit: `cf79db0bd2ba6750fa7968f08711c0ddbecfee55`
- R4U evidence pack SHA-256: `4b85336f60208c9222844021bbde5ecde95646de45faf82a6686f5fbc30815c0`
- R4V audit-input pack SHA-256: `bb7074041ed8aeadda0ee8c1956821c295d5923e8fa47d7e74080e79567dfe83`
- R4V red-locale remediation package SHA-256: `eafd53df37dd4b80dd171ba8a53ebdbd90826b389f239a66a8ca2cae09540ebe`
- R4V red-locale remediation commit: `685f3b2824d8abd960c6ece6dbb338be02fc50c9`

Live Hetzner Learn remains untouched:

- repo: `/root/floently-finnish`
- branch: `preview/enable-all-languages`
- commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- expected working tree: clean
- web: `learn.floently.com`
- API: `learn-api.floently.com`

Every R4O/R4P/R4Q/R4R/R4S/R4T/R4U/R4V operation so far ended with the live Learn checkout still on this baseline.

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

Arabic, Persian and Urdu are RTL. Kurdish is Kurmanji in Latin script and LTR in the current corpus; R4V confirmed that direction is correct, while Kurmanji wording/terminology still requires the targeted quality pass.

## Approved website state

### R4N landing — visually approved and frozen

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

Earlier approved R4N staged deployment:

`https://kielivalmis-domain-static-bvfwu3a5z-kompyint-oys-projects.vercel.app/r4m`

Stable KieliValmis alias intentionally remains unchanged:

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
- [x] staged Vercel QA after R4O changes — R4T PASS
- [x] EN/FI/AR visual/RTL review — R4U PASS
- [ ] native/legal-language quality audit of all 20 translations — R4V IN PROGRESS
- [x] `tl`/`so`/`ur` red-locale remediation checkpoint

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

### Visible-brand audit — R4P PASS

- [x] two `subscriptionStore.ts` access summaries -> `KieliValmis full access is active.`
- [x] legacy gateway `Floently Learn` -> `KieliValmis`
- [x] legacy Read-preview `Floently Finnish` -> `KieliValmis`
- [x] `legacy_visible_brand_hits=0`
- [x] `active_kielivalmis_surface_hits=0`
- [x] `legacy_gateway_hits=0`

## R4Q / R4R compile validation — PASS

R4Q found TypeScript problems only in the newly added KieliValmis landing. R4R fixed and verifier-guarded them.

- [x] explicit `ImageStyle` typing for the KieliValmis mark
- [x] explicit `ImageStyle` typing for the hero image
- [x] unsupported React Native font weights replaced with supported weights
- [x] verifier rejects unsupported non-standard weights
- [x] verifier requires explicit image style typing
- [x] full TypeScript `--noEmit` PASS
- [x] targeted ESLint PASS
- [x] `KIELIVALMIS_NATIVE_REACT_NATIVE_STYLE_TYPES=PASS`
- [x] native rebrand source contract PASS
- [x] visible-brand audit remains zero

Resolved Expo compatibility values remain:

- `name="KieliValmis"`
- `slug="client"`
- `scheme="floently"`
- `runtimeVersion="1.0.2"`
- `ios.bundleIdentifier="com.vitusidi.floently"`
- `android.package="com.vitusidi.floently"`
- `extra.eas.projectId="fa02c141-0a3b-4dbc-9122-7c1cf31ba42c"`

Final R4R result:

`RESULT: KIELIVALMIS R4R TYPESCRIPT REMEDIATION PASS`

## R4S native launcher / splash gate — PASS

The approved KieliValmis native binary family is installed and verifier-locked.

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

- [x] exact binary hash verification
- [x] PNG dimensions / bit depth / color type verification
- [x] exact KieliValmis Expo asset paths
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

Do not redraw or silently replace these approved assets in later build/store work.

## R4T staged public-page QA — PASS

R4T staged the current KieliValmis static site into the KieliValmis-only Vercel project using a production-environment deployment with `--skip-domain`. The stable alias and Namecheap DNS were not moved.

Certified staged deployment:

- deployment ID: `dpl_dsk4RUEFzXG9eE6nyU1TAbjug2UD`
- URL: `https://kielivalmis-domain-static-g7twr1par-kompyint-oys-projects.vercel.app`
- Vercel target: `production`
- deployment status: `Ready`
- source head: `6c81ddbb83451732e3c018a472e555a58f6905c5`
- project: `kielivalmis-domain-static`
- Vercel scope: `kompyint-oys-projects`

R4T infrastructure notes:

- Vercel CLI `58.9.1` was installed globally on the Hetzner server because no Vercel CLI was previously present.
- authenticated Vercel account: `komplyint-3139`
- active team: `kompyint-oys-projects`
- the first automation bypass secret tested was stale/wrong for this project and continued to redirect to Vercel SSO
- a new project-specific **Protection Bypass for Automation** secret was created in Vercel and validated with HTTP `200`
- the secret is not stored in GitHub/tracker/chat and must remain secret
- use ordinary `curl` with `x-vercel-protection-bypass`; do not expose the secret in logs or chat

R4T verification:

- [x] exact staged deployment ID/status checked with `vercel inspect`
- [x] staged deployment access with project-specific bypass secret PASS
- [x] `/` -> 200
- [x] `/privacy` -> 200
- [x] `/terms` -> 200
- [x] `/support` -> 200
- [x] `/delete-account` -> 200
- [x] `/robots.txt` -> 200
- [x] `/sitemap.xml` -> 200
- [x] `/r4m` -> 200
- [x] Privacy/Terms/Support/Delete Account all contain the shared KieliValmis page shell
- [x] public routes emit `X-Robots-Tag: index, follow`
- [x] `/r4m` remains `noindex`
- [x] `/privacy-policy` -> permanent 308 `/privacy`
- [x] `/legal/privacy-policy` -> permanent 308 `/privacy`
- [x] `/account-deletion` -> permanent 308 `/delete-account`
- [x] `/legal/account-deletion` -> permanent 308 `/delete-account`
- [x] shared CSS/runtime/four locale modules all return 200
- [x] all 20 R4N locale JSON files return 200 and contain required landing keys
- [x] EN/FI/AR R4N entry routes return 200
- [x] delete-account mail subject remains `Delete my KieliValmis account`
- [x] sitemap contains all expected `www.kielivalmis.com` canonical URLs
- [x] robots.txt references `https://www.kielivalmis.com/sitemap.xml`
- [x] stable alias body SHA stayed exactly `025a5a767a430ce4d7bdd8b7beb0f3ed33e71f3c1a5453c0b4247727e6073f8f`
- [x] GitHub source head remained unchanged during staged QA
- [x] live Learn final safety PASS

Final R4T result:

`RESULT: KIELIVALMIS R4T STAGED PUBLIC-PAGE QA PASS`

## R4U EN/FI/AR visual + RTL review — PASS

R4U captured and visually reviewed real browser-rendered screenshots from the exact R4T staged deployment. This was a review of rendered output, not only source or DOM assertions.

Evidence pack:

- server package: `/root/kielivalmis-r4u-visual-qa.zip`
- SHA-256: `4b85336f60208c9222844021bbde5ecde95646de45faf82a6686f5fbc30815c0`
- files: 24 page screenshots + 6 contact sheets + `manifest.json` + render log
- staged deployment ID: `dpl_dsk4RUEFzXG9eE6nyU1TAbjug2UD`
- staged URL: `https://kielivalmis-domain-static-g7twr1par-kompyint-oys-projects.vercel.app`

R4U coverage:

- pages: Privacy, Terms, Support, Delete Account
- languages: English, Finnish, Arabic
- viewports: desktop 1440×1000 and mobile 390×844
- total real page screenshots: 24
- contact sheets: 6
- structural issues reported by browser runner: 0
- every rendered page returned HTTP 200
- every page had the intended locale selected
- EN/FI rendered LTR
- Arabic rendered `dir=rtl` with RTL body direction
- horizontal overflow: 0/24

Visual inspection result:

- [x] approved K/wave and KieliValmis/by Floently treatment remains coherent
- [x] desktop and mobile hierarchy is clean and consistent
- [x] heading size and card spacing remain readable without oversized temporary styling
- [x] language selector remains usable on mobile
- [x] buttons remain visible and appropriately sized
- [x] footer remains readable and contained
- [x] Finnish text expansion fits without clipping or layout damage
- [x] Arabic navigation/header/card/footer mirroring is coherent
- [x] Arabic cards and CTAs align correctly for RTL
- [x] no visible clipping, overlap, broken card boundary or horizontal scroll regression found

Non-blocking language-quality note for the next gate:

- Arabic text that mixes Latin tokens such as `support@floently.com`, `KieliValmis`, provider names (`Apple`, `Google`, `RevenueCat`, `Stripe`, `Paddle`) and the quoted English deletion subject shows some bidi punctuation/spacing roughness in places. The layout itself remains correct. Fix this during the dedicated Arabic/native-language quality pass using appropriate wording and/or Unicode bidi isolation where needed; do not redesign the page shell to solve a content-level issue.

Final R4U result:

`RESULT: KIELIVALMIS R4U EN/FI/AR VISUAL + RTL REVIEW PASS`

**Do not promote this deployment yet.** The 20-language language-quality, permanent asset-path and localized SEO gates remain outstanding.

## R4V 20-language native-quality audit — IN PROGRESS

R4V extracted and audited the complete current KieliValmis landing/app-copy and public-page translation corpus before any release promotion.

Audit corpus:

- source head audited: `cf79db0bd2ba6750fa7968f08711c0ddbecfee55`
- audit input package: `/root/kielivalmis-r4v-language-audit-input.zip`
- audit input SHA-256: `bb7074041ed8aeadda0ee8c1956821c295d5923e8fa47d7e74080e79567dfe83`
- languages: 20
- strings: 2,220
- landing keys per language: 41
- mechanical blockers: 0
- source-language baseline: English

Initial quality classification:

- release-blocking major/substantial rewrite: `tl`, `so`, `ur`
- targeted fixes: `fi`, `es`, `ru`, `uk`, `ar`, `ku`, `bn`, `sq`, `th`, `ne`, `fa`
- minor polish: `sv`, `et`, `tr`, `zh`, `vi`
- Kurdish direction: Kurmanji Latin/LTR is correct; remaining Kurdish work is wording/terminology quality
- mixed-script RTL: Arabic, Persian and Urdu require safe handling of Latin product/provider/email/URL/subject tokens

### R4V red-locale remediation checkpoint — PASS

The first remediation batch repaired the three release-blocking locales `tl`, `so` and `ur` in an isolated clone before commit.

Remediation evidence:

- package SHA-256: `eafd53df37dd4b80dd171ba8a53ebdbd90826b389f239a66a8ca2cae09540ebe`
- remediation commit: `685f3b2824d8abd960c6ece6dbb338be02fc50c9`
- commit message: `Remediate KieliValmis Tagalog Somali and Urdu copy`
- exact changed-file count: 5
- `apps/kielivalmis-domain-static/r4m/locales/tl.json`
- `apps/kielivalmis-domain-static/r4m/locales/so.json`
- `apps/kielivalmis-domain-static/r4m/locales/ur.json`
- `apps/kielivalmis-domain-static/shared/page-locales-3.js`
- `apps/kielivalmis-domain-static/shared/page-locales-4.js`

Semantic remediation counts:

- `tl`: landing 20/41 strings changed; public pages 54/70 changed
- `so`: landing 19/41 strings changed; public pages 28/70 changed
- `ur`: landing 20/41 strings changed; public pages 46/70 changed

Verification after remediation:

- [x] exact five-file patch scope
- [x] JS syntax for modified public-locale modules
- [x] 20-language public runtime
- [x] landing/public key parity for all three locales
- [x] Tagalog generic-English rewrite gate
- [x] Somali generic-English rewrite gate
- [x] Urdu bidi isolation gate — 110 strings checked
- [x] protected literal preservation
- [x] existing KieliValmis static verifier PASS
- [x] isolated worktree clean after commit
- [x] branch push verified to exact remediation commit
- [x] live Learn final safety PASS

R4V is **not yet a full PASS**. The 11 targeted-fix locales and five minor-polish locales remain, followed by a final whole-corpus re-audit.

Source-level release verification also remains required before legal/public-page publication: reconcile the English Terms processor list (including Apple, Google, RevenueCat, Stripe and Paddle) and Privacy analytics/crash-reporting statements against the actual production integrations. Translation quality alone does not certify those legal statements as operationally accurate.

## Immediate next sequence

1. R4V targeted remediation: `fi, es, ru, uk, ar, ku, bn, sq, th, ne, fa`.
2. R4V minor-polish remediation: `sv, et, tr, zh, vi`.
3. R4V final 20-language semantic/mechanical/RTL re-audit; only then mark R4V PASS.
4. Promote the exact approved K/wave asset from `/r4m/assets/` to a permanent shared website asset path before retiring preview-only paths.
5. Add localized SEO routes, canonicals, `hreflang` and `x-default`.
6. Promote the approved website/public-page state only after staged visual and language-quality gates pass.
7. Create the native KieliValmis preview/test build using the existing app identity.
8. Run auth, Google, subscription/purchase/restore, YKI, cards/progress/streak, roleplay/audio/export and all-20-language layout/RTL regression.
9. Freeze the native release-candidate UI, then create the replacement Google Play/App Store screenshot and feature-graphic package from the real final app UI.
10. Prepare store metadata and Android/iOS updates.

## Remaining quality / release gates

- [x] R4N visual approval
- [x] R4O website + app source gate
- [x] R4P visible-brand remediation
- [x] R4R TypeScript/native-source compile remediation
- [x] R4S approved native launcher/adaptive/monochrome/splash binaries installed
- [x] native asset gate READY
- [x] R4T public-page staged QA
- [x] R4U public-page EN/FI/AR visual/RTL review
- [ ] R4V native-quality audit of all 20 website/app landing translations — IN PROGRESS
- [ ] R4V native/legal-language audit of all 20 public-page translations — IN PROGRESS
- [x] R4V `tl`/`so`/`ur` red-locale remediation checkpoint
- [x] R4V Urdu mixed-script bidi isolation cleanup
- [ ] R4V targeted fixes: `fi, es, ru, uk, ar, ku, bn, sq, th, ne, fa`
- [ ] R4V minor polish: `sv, et, tr, zh, vi`
- [ ] R4V Arabic/Persian mixed-script bidi language-quality cleanup
- [ ] R4V final whole-corpus re-audit and PASS decision
- [x] Kurdish script/direction finding: current Kurmanji Latin corpus is LTR
- [ ] Kurdish targeted native wording/terminology cleanup
- [ ] production legal/processor/analytics statement reconciliation
- [ ] permanent shared approved-logo asset path
- [ ] localized SEO routes/canonicals/hreflang/x-default
- [ ] website promotion / DNS decision after all gates
- [ ] native KieliValmis preview build
- [ ] authentication + Google sign-in regression
- [ ] purchase/restore + RevenueCat regression
- [ ] YKI completion/submission/evaluation/report regression
- [ ] cards/progress/streak regression
- [ ] roleplay/audio/export regression
- [ ] all-20-language layout/RTL/text-expansion regression
- [ ] final native release-candidate UI freeze
- [ ] replacement Google Play/App Store screenshots + feature graphic from final real app UI
- [ ] store metadata
- [ ] Android update
- [ ] iOS update
- [ ] post-release verification
- [ ] legacy-host retirement decision later

## Regression blockers

Do not proceed to website promotion/native/store submission if any relevant gate fails: authentication; Google sign-in; purchase/restore; subscription continuity; YKI completion/submission/evaluation/report; roleplay/audio/export; card banks; streak/progress; legal/support/delete-account; production web/API calls; app-upgrade continuity; localization completeness; RTL/layout; translated UI overflow; public-page visual integrity; sitemap/canonical integrity; or stable-host safety.

Trademark filing/clearance remains a separate legal/business workstream and is not represented here as completed legal clearance.
