# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4G — Refined landing deployment + automated regression PASS; repeat desktop/iPhone visual approval pending**

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

### KieliValmis public-site deployment

- Vercel project: `kielivalmis-domain-static`
- Project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- Team/org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope: `kompyint-oys-projects`
- Stable Vercel alias: `https://kielivalmis-domain-static.vercel.app`
- Current refined deployment: `https://kielivalmis-domain-static-qu1mszuha-kompyint-oys-projects.vercel.app`
- Deployment Protection remains enabled; QA uses Protection Bypass for Automation + ordinary `curl`

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

### R3 — Isolated Vercel project created safely

- [x] Vercel token/scope validation PASS
- [x] Active scope: `kompyint-oys-projects`
- [x] Existing Floently `main-domain-static` remained separate
- [x] New KieliValmis project created: `kielivalmis-domain-static`
- [x] New project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- [x] First deployment created without changing Namecheap DNS
- [x] Production Hetzner checkout remained `preview/enable-all-languages` at `e92b98e7799c390bc52b42d724c57f197ffd5c0d`

### R4A-R4C — Beta `vercel curl` abandoned safely

Three attempts to use beta `vercel curl` failed because of CLI/system-curl argument parsing/forwarding behavior in Vercel CLI `58.9.0`. None of those attempts changed the project, deployment, domain, DNS, Nginx, Docker, or runtime. The release gate was moved to Vercel Protection Bypass for Automation plus ordinary system `curl`.

### R4D — Protection Bypass for Automation smoke PASS

- [x] Home request returned HTTP 200 through ordinary `curl` + `x-vercel-protection-bypass`
- [x] KieliValmis title marker matched
- [x] `Prepare for YKI` marker matched
- [x] `Guidance in 20 languages` marker matched
- [x] Production checkout remained unchanged

### R4E — Full deployed route/content/header/redirect QA PASS

Primary routes:

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
- [x] `x-robots-tag: index, follow`

Permanent legal aliases:

- [x] `/privacy-policy` -> HTTP 308 -> `/privacy`
- [x] `/legal/privacy-policy` -> HTTP 308 -> `/privacy`
- [x] `/account-deletion` -> HTTP 308 -> `/delete-account`
- [x] `/legal/account-deletion` -> HTTP 308 -> `/delete-account`

Final automated result:

- [x] `RESULT: KIELIVALMIS R4 AUTOMATED DEPLOYMENT QA PASS`
- [x] Production branch/commit unchanged
- [x] No custom domain or Namecheap DNS changes made

### R4F — First browser visual QA failed quality gate; responsive redesign committed

Browser inspection on desktop and an iPhone 15 Pro Max-class viewport found that the first design was functionally correct but not polished enough for release.

Observed issues:

- oversized hero and section typography
- presentation-like visual hierarchy rather than website-like hierarchy
- awkward narrow-width hero wrapping
- mobile header CTA competing with product identity
- excessive mobile vertical length
- overly tall stacked capability cards
- inconsistent card/body typography rhythm
- desktop spacing/alignment could be more disciplined

Refinement committed:

- [x] source: `apps/kielivalmis-domain-static/index.html`
- [x] commit: `feaa5a6c42e5f02f03d1dc05f342a4d83ff025c9`
- [x] refined system-UI typography stack
- [x] hero max reduced from 84px to 68px
- [x] smaller section/card typography and tighter line heights
- [x] improved desktop hero proportions
- [x] subtle section dividers
- [x] mobile header/logo/button footprint reduced
- [x] header CTA shortened to `Open app`
- [x] compact two-column capability cards at 390–700px widths
- [x] one-column capability cards retained below 390px
- [x] mobile action buttons normalized into a grid
- [x] mobile spacing/padding normalized
- [x] product copy, 20-language list, legal URLs, current web-app URL and Android package URL preserved

### R4G — Refined deployment + automated regression PASS

The refined design was fetched from `growth/discovery-seo-d2-20260807`, extracted into a temporary directory, re-verified, linked explicitly to the existing KieliValmis Vercel project, deployed, and regression-tested.

Deployment result:

- [x] Static regression contract PASS before deployment
- [x] Existing KieliValmis project linkage explicitly locked to `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- [x] Refined production deployment created: `https://kielivalmis-domain-static-qu1mszuha-kompyint-oys-projects.vercel.app`
- [x] Stable alias remains `https://kielivalmis-domain-static.vercel.app`
- [x] Deployment reported Ready in 4s

Refined deployment route QA:

- [x] `/` -> HTTP 200
- [x] `/privacy` -> HTTP 200
- [x] `/terms` -> HTTP 200
- [x] `/support` -> HTTP 200
- [x] `/delete-account` -> HTTP 200
- [x] `/robots.txt` -> HTTP 200
- [x] `/sitemap.xml` -> HTTP 200
- [x] `KIELIVALMIS_REFINED_HOME=PASS`

Refined legal redirect QA:

- [x] `/privacy-policy` -> HTTP 308 -> `/privacy`
- [x] `/legal/privacy-policy` -> HTTP 308 -> `/privacy`
- [x] `/account-deletion` -> HTTP 308 -> `/delete-account`
- [x] `/legal/account-deletion` -> HTTP 308 -> `/delete-account`

Final refined deployment result:

- [x] `RESULT: KIELIVALMIS R4F REFINED DEPLOYMENT QA PASS`
- [x] Temporary Vercel token/bypass values were removed from the server shell
- [x] Temporary deployment files were removed
- [x] Production Hetzner branch remained `preview/enable-all-languages`
- [x] Production Hetzner commit remained `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- [x] No custom domain or Namecheap DNS change occurred

## Current next step — repeat visual QA on refined deployment

Use the refined deployment/stable alias in the browser and hard refresh. Inspect desktop plus iPhone 15 Pro Max-class widths for:

- smaller, more website-like hero/section typography
- improved font rendering and alignment
- compact header with balanced KieliValmis identity + `Open app` CTA
- no horizontal overflow or clipping
- improved hero wrapping
- compact 2x2 capability cards at 430px-class width
- consistent YKI/work/language section spacing
- balanced CTA and footer alignment
- privacy, terms, support and delete-account pages still visually readable

If the refined browser visual QA passes, revoke/delete the temporary Vercel automation-bypass secret and advance to R5.

## Planned stages

- [x] R2 — isolated static package + regression PASS
- [x] R3 — isolated KieliValmis Vercel project + initial deployment
- [~] R4 — refined automated deployment QA PASS; repeat visual approval pending
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

**Only refined browser visual approval remains in R4.** Functional/static/deployed route QA has passed for the refined landing design. Custom domains and Namecheap DNS must remain unchanged until the user approves the refined desktop/mobile visual result.

Trademark filing/clearance remains a parallel business/legal workstream and is not represented here as completed legal clearance.