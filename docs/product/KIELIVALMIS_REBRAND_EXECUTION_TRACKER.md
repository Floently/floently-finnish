# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Visual/localization direction:** `docs/product/KIELIVALMIS_VISUAL_BRAND_LOCALIZATION_DIRECTION.md`  
**Repository:** `Floently/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08  
**Last updated:** 2026-08-13

## Current milestone

**R4N VISUAL APPROVED AND FROZEN. R4V 20-LANGUAGE QUALITY AUDIT PASS. FINAL ALL-20 REGRESSION PASS. KIELIVALMIS RELEASE-SURFACE WEB/NATIVE REMODEL PASS. DOMAIN + WEB RELEASE CUTOVER IN PROGRESS.**

The approved R4N visual direction is frozen. Do not redesign the landing unless a real regression is found.

The complete KieliValmis public website, localized public/legal pages, web-app brand shell, native-app brand surfaces, approved launcher/splash assets, Floently-to-KieliValmis gateway, and all 20 language surfaces have passed the source-level release gates. R4V is complete: all red, targeted and minor-polish locales were remediated and the final 2,220-string all-language regression passed, including RTL/bidi checks, Kurdish Kurmanji LTR checks, protected literals, static-site verification, native rebrand verification and TypeScript compilation.

**Immediate next gate:** complete the remaining App Store Connect-side remediation — KieliValmis metadata, corrected screenshots, reviewer access, subscriptions/IAP review state and reviewer notes — before creating the replacement iOS build. Do not resubmit iOS build 31.

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
- R4V targeted Batch A package SHA-256: `dca4bda5ab5909ea56dd8029466fcf1fc60ab5285a7c7f104f27feac6948b6e5`
- R4V targeted Batch A commit: `435f4d751285a34f342a7bba8f121a03008a36a8`
- R4V targeted Batch B package SHA-256: `8e9707fe81960058e4efe05777c75acd7c35da73cd7ac0dadae18a93391b407a`
- R4V targeted Batch B commit: `7c8dfbcec3e85dd86d3982bc04bd3312a2f6ee14`

Live Hetzner Learn remains untouched:

- repo: `/root/floently-finnish`
- branch: `preview/enable-all-languages`
- commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- expected working tree: clean
- web: `learn.floently.com`
- API: `learn-api.floently.com`

Every R4O/R4P/R4Q/R4R/R4S/R4T/R4U/R4V operation so far ended with the live Learn checkout still on this baseline.


## 2026-08-12 release-surface checkpoint

- [x] final R4V all-20 regression PASS
- [x] 20 × 111 = 2,220 landing/public strings covered
- [x] Arabic / Persian / Urdu bidi validation PASS
- [x] Kurdish Kurmanji Latin/LTR validation PASS
- [x] permanent KieliValmis public landing routes generated for all 20 languages
- [x] permanent KieliValmis web favicon/icon family installed from approved app icon
- [x] KieliValmis web-app hostname source changed to `app.kielivalmis.com`
- [x] legacy `learn.floently.com` compatibility retained
- [x] Floently parent gateway now points Finnish-learning entry toward KieliValmis
- [x] complete release-surface source commit: `3295aadb96e6979816d9fac395b2f05a5f73c850`
- [x] complete staged release verification PASS
- [x] TypeScript 5.9.3 `--noEmit` PASS
- [x] Vercel blocked-deployment cause diagnosed: `TEAM_ACCESS_REQUIRED` from a commit author identity not associated with the Hobby-team owner
- [x] exact committed KieliValmis Vercel production-environment deployment staged
  - deployment ID: `dpl_JBXLvvmFLGv6VLzEG6VCp5tyq7k4`
  - staged URL: `https://kielivalmis-domain-static-ihx2p6aqs-kompyint-oys-projects.vercel.app`
  - state: `READY / STAGED`
  - 20/20 localized landing route parity PASS
  - 4/4 legal/public page parity PASS
  - SEO + asset parity PASS
  - RTL + canonical + hreflang + x-default PASS

- [x] `app.kielivalmis.com` HTTP-only Nginx vhost selection PASS locally; DNS and TLS still unchanged
- [x] stale web `/learn` redirect corrected to primary `app.kielivalmis.com`
- [x] Expo 55 production web-export Babel repair committed: `8a66b89ceb934762fa3988956dfa645e7a1ad9ee`
- [x] isolated KieliValmis production web export PASS
  - production environment sourced from `apps/client/eas.json`
  - required application routes PASS
  - KieliValmis / primary-host / API build markers PASS
  - unresolved `EXPO_PUBLIC_*` references: `0`
  - build file manifest SHA-256: `22f9f0fc95a62ab7bb9cca768d36280145a08631cbe5c10bb6c3d67a0a759f66`
  - live `/var/www/learn` unchanged

- [x] certified KieliValmis versioned Hetzner web release installed
  - source commit: `8a66b89ceb934762fa3988956dfa645e7a1ad9ee`
  - active release: `/var/www/kielivalmis/releases/8a66b89ceb934762fa3988956dfa645e7a1ad9ee`
  - atomic pointer: `/var/www/kielivalmis/current`
  - Nginx app root: `/var/www/kielivalmis/current`
  - certified manifest SHA-256: `22f9f0fc95a62ab7bb9cca768d36280145a08631cbe5c10bb6c3d67a0a759f66`
  - installed files: `91`
  - local route content-parity QA PASS
  - local KieliValmis root-brand QA PASS
  - QA evidence: `/root/kielivalmis-local-web-qa-20260812T122417Z`
  - legacy `/var/www/learn` hash unchanged
  - legacy `learn.floently.com` HTTP/HTTPS regression PASS
  - backend unchanged
  - DNS unchanged
  - TLS not configured yet

- [ ] `www.kielivalmis.com` DNS + TLS live
- [ ] apex `kielivalmis.com` redirects to canonical `www`
- [ ] `app.kielivalmis.com` DNS + Nginx + TLS live
- [ ] production web-app auth / Google OAuth / CORS / billing return regression
- [ ] native Android/iOS release-candidate builds
- [ ] final store screenshots after RC UI freeze
- [ ] Android/iOS submission


## 2026-08-13 Apple rejection remediation checkpoint

Previous App Store version `1.0` was rejected. The rejection was treated as a multi-item remediation gate rather than resubmitting the same binary.

### Audited rejected-build baseline

- production source audited: `6201baabd4570b51e2ceef9399b2eb7a174efb31`
- rejected replacement candidate audited: iOS `1.0.0 (31)`
- EAS build ID: `2a3180b0-13cd-4195-a5de-f49f21a3a107`
- bundle ID preserved: `com.vitusidi.floently`
- display name: `KieliValmis`
- build 31 must **not** be resubmitted
- Android production build `1.0.0 (27)` remains separate and unchanged by this iOS remediation

### Apple rejection categories being remediated

- Guideline 2.3.10 — Accurate Metadata / other-platform references
- Guideline 4.8 — Login Services
- Guideline 2.1 — reviewer access / information needed
- Guideline 2.1(b) — subscriptions / in-app purchase completeness
- Guideline 5.1.1 — privacy purpose strings
- Guideline 2.5.4 — background audio capability

### Binary/source remediation completed

- [x] iOS no longer exposes Google Sign-In; email/password authentication remains available
- [x] Android/web Google Sign-In retained
- [x] iOS-visible account-deletion copy no longer names Google Play
- [x] photo-library purpose string now explains profile-picture use
- [x] microphone purpose string explains Finnish speaking/YKI/roleplay recording
- [x] speech-recognition purpose string explains transcription and learner review
- [x] unused iOS camera permission removed
- [x] `expo-image-picker` configured with `cameraPermission: false`
- [x] `expo-audio` configured with background playback disabled
- [x] `expo-audio` configured with background recording disabled
- [x] introspected `UIBackgroundModes=[]`
- [x] introspected `NSCameraUsageDescription=None`
- [x] KieliValmis native rebrand verifier PASS
- [x] visible-brand audit PASS with zero legacy visible-brand hits
- [x] iOS Expo export / Metro bundle PASS after remediation

### Store-side remediation still required before replacement iOS build

- [x] prepare replacement KieliValmis App Store metadata in repository
- [ ] upload corrected App Store screenshots in the accepted device-size slot
- [ ] configure a reviewer account with full application/subscription access
- [ ] ensure required subscriptions/IAP products are complete and submitted for Apple review
- [x] prepare App Review notes answering every previous rejection point
- [ ] only after the above gates are ready, create the replacement iOS production build
- [ ] verify replacement IPA identity and native plist
- [ ] submit the replacement build to App Store Connect
- [ ] select the replacement build for App Review

The next iOS production build is expected to auto-increment from build 31. Do not manually reuse build number 31.


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

Arabic, Persian and Urdu are RTL. Kurdish is Kurmanji in Latin script and LTR; R4V explicitly verified the website and app direction helpers and completed the targeted Kurmanji terminology cleanup in Batch B.

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
- [x] native/legal-language quality audit of all 20 translations — R4V PASS
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

### R4V targeted remediation Batch A — PASS

Batch A remediated `fi`, `es`, `ru`, `uk`, `ar` and `fa`.

Evidence:

- package SHA-256: `dca4bda5ab5909ea56dd8029466fcf1fc60ab5285a7c7f104f27feac6948b6e5`
- commit: `435f4d751285a34f342a7bba8f121a03008a36a8`
- exact changed-file count: 9
- Finnish semantic/native corrections PASS
- Spanish calque/roleplay corrections PASS
- Russian spelling/wording corrections PASS
- Ukrainian sign-in/wording corrections PASS
- Arabic mixed-script bidi isolation PASS
- Persian mixed-script bidi isolation PASS
- exact Arabic/Persian isolation audit: 222 RTL strings and 161 isolation spans checked
- protected literals preserved
- existing static-site verifier PASS
- live Learn safety PASS

A malformed Arabic isolation span was caught before commit and repaired. The stronger verifier now checks the exact contents of every isolation span rather than only balanced control characters.

### R4V targeted remediation Batch B — PASS

Batch B remediated `ku`, `bn`, `sq`, `th` and `ne`.

Evidence:

- package SHA-256: `8e9707fe81960058e4efe05777c75acd7c35da73cd7ac0dadae18a93391b407a`
- commit: `7c8dfbcec3e85dd86d3982bc04bd3312a2f6ee14`
- exact changed-file count: 4
- Kurdish/Kurmanji terminology cleanup PASS
- Kurdish Kurmanji Latin/LTR website + app direction verification PASS
- Bengali terminology cleanup PASS
- Albanian register and terminology cleanup PASS
- Thai terminology cleanup PASS
- Nepali terminology cleanup PASS
- 20-language public runtime PASS
- protected literals preserved
- existing static-site verifier PASS
- live Learn safety PASS

Batch B also fixed a verifier false positive: user-visible translation values are now audited separately from schema key names, so a key such as `overlayFeedback` cannot be mistaken for untranslated English copy.

The remediation verifier workflow now uses `git diff HEAD` where source-scope checks must work regardless of whether files are staged or unstaged.

R4V is **not yet a full PASS**. Only the five minor-polish locales `sv`, `et`, `tr`, `zh`, `vi` remain, followed by a fresh whole-corpus re-audit.

Source-level release verification also remains required before legal/public-page publication: reconcile the English Terms processor list (including Apple, Google, RevenueCat, Stripe and Paddle) and Privacy analytics/crash-reporting statements against the actual production integrations. Translation quality alone does not certify those legal statements as operationally accurate.

## Immediate next sequence

1. R4V minor-polish remediation: `sv, et, tr, zh, vi`.
2. R4V final 20-language semantic/mechanical/RTL re-audit; only then mark R4V PASS.
3. Promote the exact approved K/wave asset from `/r4m/assets/` to a permanent shared website asset path before retiring preview-only paths.
4. Add localized SEO routes, canonicals, `hreflang` and `x-default`.
5. Promote the approved website/public-page state only after staged visual and language-quality gates pass.
6. Create the native KieliValmis preview/test build using the existing app identity.
7. Run auth, Google, subscription/purchase/restore, YKI, cards/progress/streak, roleplay/audio/export and all-20-language layout/RTL regression.
8. Freeze the native release-candidate UI, then create the replacement Google Play/App Store screenshot and feature-graphic package from the real final app UI.
9. Prepare store metadata and Android/iOS updates.

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
- [x] R4V targeted fixes: `fi, es, ru, uk, ar, ku, bn, sq, th, ne, fa`
- [x] R4V targeted Batch A: `fi, es, ru, uk, ar, fa`
- [x] R4V targeted Batch B: `ku, bn, sq, th, ne`
- [ ] R4V minor polish: `sv, et, tr, zh, vi`
- [x] R4V Arabic/Persian mixed-script bidi language-quality cleanup
- [ ] R4V final whole-corpus re-audit and PASS decision
- [x] Kurdish script/direction finding: current Kurmanji Latin corpus is LTR
- [x] Kurdish targeted native wording/terminology cleanup
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

## 2026-08-13 Final iOS payment-surface compliance checkpoint

Final App Store remediation before the replacement iOS production build.

Verified:

- iOS Stripe/external-payment explanatory copy isolated from consumer UI
- employer/city organisation sales surface hidden on iOS
- Restore Purchases retained on iOS
- Apple mobile store purchase path retained
- web Stripe billing path retained
- Android/web payment behavior unchanged
- KieliValmis native rebrand verifier PASS
- KieliValmis visible-brand audit PASS
- iOS JavaScript export PASS
- NSCameraUsageDescription absent
- photo-library permission limited to profile-picture selection
- microphone and speech-recognition purpose strings remain specific
- UIBackgroundModes contains no audio mode

App Store Connect preparation:

- KieliValmis Premium subscription group configured
- Combined subscriptions are Level 1
- YKI subscriptions are Level 2
- Professional subscriptions are Level 2
- nine subscription review screenshots replaced with KieliValmis screenshots
- nine subscription review notes/localizations prepared
- subscriptions remain unsubmitted until the replacement app build is ready

Build 31 is retired and must not be resubmitted.

Next release gate:

1. create replacement iOS production build
2. expected auto-incremented build number: 32
3. verify the resulting IPA before App Store submission
4. select build 32 in App Store Connect
5. attach the prepared subscriptions to the review submission
6. submit the corrected version for App Review
