# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R3 — Create isolated KieliValmis Vercel project and preview deployment**

## Locked product architecture

- Customer-facing Finnish-learning product: **KieliValmis**
- Transition identity: **KieliValmis by Floently**
- Parent/maker/product family: **Floently**
- Legal company: **Komplyint Oy**
- Primary purchased domain: **kielivalmis.com**
- Existing Android/iOS store records: **preserve**
- Android package / Apple Bundle ID: **preserve `com.vitusidi.floently`**
- Existing users, billing, RevenueCat, backend, YKI engine, cards and roleplay: **preserve**

## Production rollback baseline

### Hetzner Learn runtime

- Host: `ubuntu-4gb-hel1-2`
- Repo: `/root/floently-finnish`
- Branch: `preview/enable-all-languages`
- Commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- Backend image: `floently-yki-report-calibration-overlay:20260729T183143Z`
- Backend status at baseline: healthy / up 9 days
- Web hostname: `learn.floently.com`
- API hostname: `learn-api.floently.com`
- API/audio environment still points to `https://learn-api.floently.com`

**Do not rename `learn-api.floently.com`.** It is a compatibility surface, not a branding requirement.

**Do not redirect `learn.floently.com` yet.** A future `app.kielivalmis.com` alias must first pass auth/payment/YKI regression testing.

### Floently public site

- Hosting: Vercel
- Existing project: `main-domain-static`
- Vercel project ID: `prj_sTnnI02l9BLRIPcRIeGlblflul5Z`
- Vercel team/org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Repo root: `apps/main-domain-static`
- Domains: `floently.com`, `www.floently.com`
- DNS: Namecheap nameservers
- Apex baseline: `76.76.21.21`
- `www` baseline: `cname.vercel-dns.com.`
- Public response: HTTP 200 from Vercel

This project remains the **Floently product-family gateway** and must not be repurposed as the dedicated KieliValmis site.

### KieliValmis domain baseline

- DNS provider/nameservers: Namecheap
- Apex baseline: `192.64.119.155` (parking)
- `www` baseline: `parkingpage.namecheap.com.`
- HTTPS baseline: not working / timed out
- No live KieliValmis Nginx configuration exists

**Do not change Namecheap DNS until the new isolated KieliValmis Vercel project exists and Vercel shows the exact records required.**

## Completed checkpoints

### R0 — Rebrand continuity lock

- [x] Master rebrand plan committed
- [x] Execution tracker committed
- [x] Surface inventory committed
- [x] Technical identifiers that must remain Floently documented
- [x] Store rebrand / screenshot strategy documented
- [x] Legal-page regression requirements documented
- [x] Rollback discipline documented

### R1A — Live server baseline

- [x] Active branch/commit captured
- [x] Active backend image captured
- [x] Active Nginx routing captured
- [x] `learn.floently.com` and `learn-api.floently.com` dependencies captured
- [x] Existing legal-route regression history identified
- [x] No server write/deploy performed

### R1B — Vercel + DNS baseline

- [x] Confirmed `floently.com` is hosted by Vercel, not Hetzner Nginx
- [x] Confirmed existing Vercel project linkage
- [x] Confirmed Floently DNS configuration
- [x] Confirmed KieliValmis is still Namecheap parked
- [x] Confirmed no KieliValmis HTTPS site exists yet
- [x] Confirmed server working tree/runtime remained unchanged

### R1C — Deployment isolation decision

- [x] Locked separate Vercel-project architecture
- [x] Existing `main-domain-static` stays Floently gateway
- [x] New repo directory: `apps/kielivalmis-domain-static`
- [x] Recommended new Vercel project: `kielivalmis-domain-static`
- [x] DNS must remain untouched until project verification

### R2A — Isolated KieliValmis static site created

Created on the working branch only; not deployed:

- [x] `apps/kielivalmis-domain-static/package.json`
- [x] `apps/kielivalmis-domain-static/vercel.json`
- [x] `apps/kielivalmis-domain-static/index.html`
- [x] `apps/kielivalmis-domain-static/privacy/index.html`
- [x] `apps/kielivalmis-domain-static/terms/index.html`
- [x] `apps/kielivalmis-domain-static/support/index.html`
- [x] `apps/kielivalmis-domain-static/delete-account/index.html`
- [x] `apps/kielivalmis-domain-static/robots.txt`
- [x] `apps/kielivalmis-domain-static/sitemap.xml`
- [x] `apps/kielivalmis-domain-static/verify-kielivalmis-domain-static.mjs`

Current KieliValmis landing strategy includes:

- YKI + work in Finland + learner's language
- guidance in 20 supported languages
- speaking, grammar, vocabulary, sentence practice and roleplay
- all four YKI skills
- explicit independent-YKI disclaimer
- transition statement connecting KieliValmis to the existing Floently Finnish service
- existing web app link retained at `learn.floently.com` during transition
- existing Google Play package link retained
- Floently attribution retained intentionally

Current legal strategy:

- Product identity: KieliValmis
- Attribution: Floently product by Komplyint Oy
- Existing support address preserved: `support@floently.com`
- deletion page explicitly states uninstalling the app is not account deletion
- subscription cancellation remains separate from account deletion
- legal aliases are locked in `vercel.json`

### R2B — Isolated static regression contract PASS

Read-only verification was executed from the server by fetching the rebrand branch, extracting only `apps/kielivalmis-domain-static` into a temporary directory, running the package verifier, then returning to the production checkout.

PASS markers captured:

- [x] `KIELIVALMIS_STATIC_IDENTITY=PASS`
- [x] `KIELIVALMIS_STATIC_20_LANGUAGES=PASS`
- [x] `KIELIVALMIS_STATIC_LEGAL_PAGES=PASS`
- [x] `KIELIVALMIS_STATIC_CANONICALS=PASS`
- [x] `KIELIVALMIS_STATIC_SITEMAP=PASS`
- [x] `KIELIVALMIS_STATIC_REDIRECT_LOCKS=PASS`
- [x] `KIELIVALMIS_STATIC_TRANSITION_LINKS=PASS`
- [x] `RESULT: KIELIVALMIS STATIC SITE REGRESSION CONTRACT PASS`

Production safety proof after verification:

- [x] Branch remained `preview/enable-all-languages`
- [x] Commit remained `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- [x] No production checkout, Nginx, Docker, DNS or runtime changes were made
- [x] Remote rebrand branch was successfully fetched at `96871c54dff8eaa8ee975fbbc3f1084d55b8ffe9` before this tracker update

R2 verification is complete.

## Next stages

- [x] R2 — Verify isolated static package
- [~] R3 — Create isolated Vercel project and preview deployment
- [ ] R4 — Visual/content QA of preview + legal-route QA
- [ ] R5 — Add `kielivalmis.com` / `www.kielivalmis.com` to new project and capture exact DNS requirements
- [ ] R6 — Change only KieliValmis Namecheap DNS and verify HTTPS/canonical behavior
- [ ] R7 — Build `app.kielivalmis.com` parallel runtime hostname and run auth/payment regression
- [ ] R8 — SEO old-to-new URL map + Search Console migration
- [ ] R9 — Store metadata package
- [ ] R10 — Store graphics/screenshots package
- [ ] R11 — Native visible-brand patch, same package/bundle IDs
- [ ] R12 — Full app regression gate
- [ ] R13 — Android KieliValmis update
- [ ] R14 — iOS KieliValmis update
- [ ] R15 — Public post-release verification
- [ ] R16 — Legacy hostname retirement decision

## Regression blockers

Do not proceed to native/store submission if any of these fail:

- authentication
- subscription purchase/restore
- YKI completion/submission/evaluation/report
- roleplay/export
- card banks
- streak/progress
- legal URLs
- support/delete-account
- production web/API calls
- app upgrade continuity

## Recent repository commits

- `78cb36c949fa92d3e9952d1b3769ebcbf4a0b48a` — master rebrand strategy
- `82dc126c50b351916595436d8bf97994becf9222` — initial tracker
- `4a8a54b3538178d225e2775d9a9435811f45ddf6` — surface inventory
- `b3cf7bc93ddd84d4345697b324e2c9a310644efc` — live server baseline
- `4ef5970c0b5bb4a1b1f90aba7c6bb15a37d8d7bf` — Vercel/DNS baseline
- `177175788bb35d65e1e456adbcb006cc77c29b98` — isolated Vercel architecture
- `8680b912921d4575a698a7940eea2a15742fee62` through `fedaf6c09bac20a4b2e3e48a39e1449d4741f98b` — initial isolated KieliValmis static site package
- `96871c54dff8eaa8ee975fbbc3f1084d55b8ffe9` — advance tracker to isolated static verification
- This tracker update records R2 regression PASS and advances work to R3

## Active blocker

**New isolated Vercel project does not exist yet.**

Create `kielivalmis-domain-static` as a separate Vercel project rooted at `apps/kielivalmis-domain-static`, deploy a preview, and test it before adding custom domains or changing Namecheap DNS.

Trademark filing/clearance remains a parallel business/legal workstream and is not represented here as completed legal clearance.
