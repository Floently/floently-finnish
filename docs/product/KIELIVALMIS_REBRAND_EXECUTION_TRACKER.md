# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4F — Visual QA found typography/mobile-layout issues; refined landing patch committed, redeploy + repeat visual QA pending**

## Locked architecture

- Customer-facing Finnish-learning product: **KieliValmis**
- Transition identity: **KieliValmis by Floently**
- Parent/maker/product family: **Floently**
- Legal company: **Komplyint Oy**
- Primary purchased domain: **kielivalmis.com**
- Existing Android/iOS store records: preserve
- Android package / Apple Bundle ID: preserve `com.vitusidi.floently`
- Existing users, billing, RevenueCat, backend, YKI engine, cards and roleplay: preserve
- Existing `learn-api.floently.com`: preserve as compatibility infrastructure
- Existing `learn.floently.com`: preserve until parallel KieliValmis app-host regression passes

## Production rollback baseline

### Hetzner Learn runtime

- Host: `ubuntu-4gb-hel1-2`
- Repo: `/root/floently-finnish`
- Branch: `preview/enable-all-languages`
- Commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- Backend image: `floently-yki-report-calibration-overlay:20260729T183143Z`
- Web hostname: `learn.floently.com`
- API hostname: `learn-api.floently.com`

### Floently public site

- Existing Vercel project: `main-domain-static`
- Project ID: `prj_sTnnI02l9BLRIPcRIeGlblflul5Z`
- Team/org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope slug: `kompyint-oys-projects`
- Domains: `floently.com`, `www.floently.com`
- Repo root: `apps/main-domain-static`
- Must remain the Floently product-family gateway

### KieliValmis DNS baseline

- Namecheap nameservers remain authoritative
- Apex baseline: `192.64.119.155` (parking)
- `www` baseline: `parkingpage.namecheap.com.`
- No KieliValmis custom-domain DNS changes have been made yet

## Completed checkpoints

### R0 — Rebrand continuity lock

- [x] Master rebrand plan committed
- [x] Execution tracker committed
- [x] Surface inventory committed
- [x] Technical identifiers that must remain Floently documented
- [x] Store rebrand/screenshot strategy documented
- [x] Legal-route regression policy documented

### R1 — Production, Vercel and DNS baselines

- [x] Hetzner production branch/commit captured
- [x] Backend image captured
- [x] Nginx routing captured
- [x] `floently.com` confirmed on Vercel
- [x] Existing `main-domain-static` linkage captured
- [x] `kielivalmis.com` confirmed Namecheap parked
- [x] Separate Vercel-project architecture locked

### R2 — Isolated KieliValmis static package

Created under `apps/kielivalmis-domain-static` on the rebrand branch with:

- [x] landing page
- [x] privacy
- [x] terms
- [x] support
- [x] delete-account
- [x] robots.txt
- [x] sitemap.xml
- [x] vercel.json
- [x] regression verifier

Verifier PASS markers:

- [x] `KIELIVALMIS_STATIC_IDENTITY=PASS`
- [x] `KIELIVALMIS_STATIC_20_LANGUAGES=PASS`
- [x] `KIELIVALMIS_STATIC_LEGAL_PAGES=PASS`
- [x] `KIELIVALMIS_STATIC_CANONICALS=PASS`
- [x] `KIELIVALMIS_STATIC_SITEMAP=PASS`
- [x] `KIELIVALMIS_STATIC_REDIRECT_LOCKS=PASS`
- [x] `KIELIVALMIS_STATIC_TRANSITION_LINKS=PASS`
- [x] `RESULT: KIELIVALMIS STATIC SITE REGRESSION CONTRACT PASS`

### R3A — Device-login attempt safely aborted

- [x] Static package re-verified PASS
- [x] SSH disconnected during Vercel device authorization
- [x] No project/deployment/domain/DNS/runtime change occurred
- [x] Switched to short-lived token authentication

### R3B — Vercel token/scope validation PASS

- [x] CLI authenticated as `komplyint-3139`
- [x] Active scope: `kompyint-oys-projects`
- [x] Existing `main-domain-static` visible
- [x] CLI confirmed `--scope` should replace deprecated `--team`
- [x] Production Git checkout remained unchanged

### R3C — Isolated KieliValmis Vercel project created

Created successfully:

- Project: `kielivalmis-domain-static`
- Project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- Org/team ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Owner/scope: `kompyint-oys-projects`
- Framework preset: Other
- Project root at CLI-created project: `.` within the isolated deployment directory
- Node.js version shown by Vercel: 24.x

First deployment:

- Deployment URL: `https://kielivalmis-domain-static-jotbo1nkc-kompyint-oys-projects.vercel.app`
- Stable Vercel alias: `https://kielivalmis-domain-static.vercel.app`
- Vercel treated the first-ever project deployment as the initial production deployment automatically, even though `--prod` was not supplied
- Deployment reported `Ready in 4s`
- Production Git checkout after deployment remained `preview/enable-all-languages` at `e92b98e7799c390bc52b42d724c57f197ffd5c0d`

Deployment Protection finding:

- Direct unauthenticated HTTP to the generated deployment URL returned `302`
- Redirect target was Vercel `/sso-api`
- This indicates Vercel Authentication/Deployment Protection on the generated deployment URL, not an application failure

No custom domain has been added and Namecheap DNS remains untouched.

### R4A-R4C — `vercel curl` attempts rejected before application QA

Three attempts to use beta `vercel curl` failed because of CLI/system-curl parser and argument-forwarding behavior in Vercel CLI `58.9.0`. None of those attempts changed the project, deployment, domain, DNS, Nginx, Docker, or runtime. The release gate was moved to Vercel Protection Bypass for Automation plus ordinary system `curl`.

### R4D — Protection Bypass for Automation smoke PASS

A Vercel Protection Bypass for Automation secret was created for QA and entered only through a hidden server-terminal prompt. Ordinary system `curl` requested the protected KieliValmis deployment with the `x-vercel-protection-bypass` header.

Observed result:

- [x] Home request returned `HTTP_CODE=200`
- [x] `<title>KieliValmis...` marker matched
- [x] `Prepare for YKI` marker matched
- [x] `Guidance in 20 languages` marker matched
- [x] `KIELIVALMIS_PROTECTED_HOME=PASS`
- [x] Production branch remained `preview/enable-all-languages`
- [x] Production commit remained `e92b98e7799c390bc52b42d724c57f197ffd5c0d`

### R4E — Full deployed route/content/header/redirect QA PASS

Full automated QA was run against the actual protected deployment using ordinary `curl` plus the temporary `x-vercel-protection-bypass` header.

Primary route results:

- [x] `/` -> HTTP 200
- [x] `/privacy` -> HTTP 200
- [x] `/terms` -> HTTP 200
- [x] `/support` -> HTTP 200
- [x] `/delete-account` -> HTTP 200
- [x] `/robots.txt` -> HTTP 200
- [x] `/sitemap.xml` -> HTTP 200

Content contracts:

- [x] `KIELIVALMIS_DEPLOYED_HOME=PASS`
- [x] `KIELIVALMIS_DEPLOYED_20_LANGUAGES=PASS`
- [x] `KIELIVALMIS_DEPLOYED_PRIVACY=PASS`
- [x] `KIELIVALMIS_DEPLOYED_TERMS=PASS`
- [x] `KIELIVALMIS_DEPLOYED_SUPPORT=PASS`
- [x] `KIELIVALMIS_DEPLOYED_DELETE_ACCOUNT=PASS`
- [x] `KIELIVALMIS_DEPLOYED_ROBOTS=PASS`
- [x] `KIELIVALMIS_DEPLOYED_SITEMAP=PASS`

Security/SEO headers:

- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] Protected deployment returned `x-robots-tag: index, follow`
- [x] `KIELIVALMIS_DEPLOYED_SECURITY_HEADERS=PASS`

Permanent legal aliases:

- [x] `/privacy-policy` -> HTTP 308 -> `/privacy`
- [x] `/legal/privacy-policy` -> HTTP 308 -> `/privacy`
- [x] `/account-deletion` -> HTTP 308 -> `/delete-account`
- [x] `/legal/account-deletion` -> HTTP 308 -> `/delete-account`
- [x] `KIELIVALMIS_DEPLOYED_LEGAL_REDIRECTS=PASS`

Final automated result:

- [x] `RESULT: KIELIVALMIS R4 AUTOMATED DEPLOYMENT QA PASS`
- [x] Production branch after QA remained `preview/enable-all-languages`
- [x] Production commit after QA remained `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- [x] QA secret was removed from the server shell and temporary files were deleted
- [x] No custom domain or Namecheap DNS change occurred during R4E

### R4F — Browser visual QA required refinement; landing redesign patch committed

Browser inspection of the deployed landing page was performed on desktop and at an iPhone 15 Pro Max-class viewport. Functional content was present and automated QA remained valid, but visual approval was **not** granted for the first design.

Observed visual issues from the review:

- oversized white hero and section typography made the page feel presentation-like rather than website-like
- hero wrapping and text alignment were too aggressive at narrow widths
- mobile header CTA competed with the KieliValmis identity for horizontal space
- mobile vertical rhythm felt too long and loosely organized
- stacked capability cards consumed too much vertical space on a 430px-class viewport
- card headings and body text needed a clearer hierarchy and more restrained sizing
- desktop sections were functional but could use tighter alignment and more consistent spacing rhythm

Refinement committed:

- [x] landing source: `apps/kielivalmis-domain-static/index.html`
- [x] commit: `feaa5a6c42e5f02f03d1dc05f342a4d83ff025c9`
- [x] switched to a refined system-UI font stack with improved rendering and less display-like typography
- [x] reduced hero maximum from the previous 84px scale to a restrained responsive maximum of 68px
- [x] reduced section heading/card typography and tightened line heights/letter spacing
- [x] improved desktop hero grid proportions and spacing
- [x] added subtle section dividers to improve page rhythm
- [x] shortened the header CTA to `Open app`
- [x] reduced mobile header/logo/button footprint
- [x] created compact two-column capability cards for 390–700px widths, including iPhone 15 Pro Max-class widths
- [x] retained one-column capability cards below 390px
- [x] changed mobile action buttons to a consistent grid layout
- [x] reduced mobile section/card padding and normalized spacing
- [x] retained existing product copy, 20-language list, transition wording, legal links, web-app URL and Android package URL

The refinement has been committed but is **not yet visually approved**. It must be re-verified, redeployed to the isolated KieliValmis Vercel project, rerun through automated route QA, and reviewed again on desktop + mobile before R5.

## Current next step — R4F redeploy and repeat visual gate

1. Fetch `growth/discovery-seo-d2-20260807` without changing the live production checkout.
2. Extract only `apps/kielivalmis-domain-static` to a temporary directory.
3. Run `npm run verify` against the refined static package.
4. Deploy the refined package to the already-existing Vercel project `kielivalmis-domain-static` using the known project/org IDs.
5. Repeat protected automated route/content/header/redirect QA.
6. Repeat browser visual QA on desktop and an iPhone 15 Pro Max-class viewport.
7. Revoke/delete the temporary automation-bypass secret after R4 visual approval.
8. Only then advance to R5 custom-domain attachment.

## Planned stages

- [x] R2 — isolated static package + regression PASS
- [x] R3 — create isolated Vercel project and initial deployment
- [~] R4 — automated QA passed for first design; refined visual patch committed; redeploy + repeat visual QA pending
- [ ] R5 — add KieliValmis custom domains and capture Vercel DNS requirements
- [ ] R6 — change only KieliValmis Namecheap DNS + verify HTTPS/canonical behavior
- [ ] R7 — build `app.kielivalmis.com` parallel runtime hostname + auth/payment/YKI regression
- [ ] R8 — SEO old-to-new URL map + Search Console migration
- [ ] R9 — store metadata package
- [ ] R10 — store graphics/screenshots package
- [ ] R11 — native visible-brand patch, same package/bundle IDs
- [ ] R12 — full app regression gate
- [ ] R13 — Android KieliValmis update
- [ ] R14 — iOS KieliValmis update
- [ ] R15 — post-release verification
- [ ] R16 — legacy hostname retirement decision

## Regression blockers

Do not proceed to native/store submission if any of these fail: authentication; subscription purchase/restore; YKI completion/submission/evaluation/report; roleplay/export; card banks; streak/progress; legal URLs; support/delete-account; production web/API calls; app upgrade continuity.

## Active blocker

**R4 visual refinement redeploy/review.** The first design passed functional automated QA but did not pass final visual review. The refined source is committed, but custom domains and Namecheap DNS must remain unchanged until the refined deployment passes both automated QA and desktop/mobile visual approval.

Trademark filing/clearance remains a parallel business/legal workstream and is not represented here as completed legal clearance.