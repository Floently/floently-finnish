# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R1 — Read-only branding/domain inventory in progress**

## Current status

- Product name: **KieliValmis**
- Primary domain: **kielivalmis.com** (purchased)
- Parent/maker brand: **Floently**
- Company: **Komplyint Oy**
- Technical package/bundle IDs: **must remain unchanged**
- Current Android/iOS production apps: **must remain the same store records**
- Live server branch at R1 baseline: `preview/enable-all-languages`
- Live server commit at R1 baseline: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- Current task: finish exact web/runtime/store surface inventory, then prepare parallel KieliValmis implementation without disturbing the released binaries

## Completed

### 2026-08-08 — R0A Documentation lock

- [x] Confirmed production repository: `galapoto/floently-finnish`
- [x] Confirmed future separate native rebuild repository exists: `galapoto/floently-native`
- [x] Confirmed discovery/marketing working branch: `growth/discovery-seo-d2-20260807`
- [x] Recorded KieliValmis/Floently architecture and migration policy
- [x] Recorded technical identifiers that must remain unchanged
- [x] Recorded domain migration strategy
- [x] Recorded legal-page regression requirements
- [x] Recorded Google Play / App Store image migration strategy
- [x] Recorded rollback and executor rules
- [x] Created this progress tracker

### 2026-08-08 — R1A Live server baseline captured

Read-only production inspection performed on `ubuntu-4gb-hel1-2`.

Confirmed:

- [x] Server repo path: `/root/floently-finnish`
- [x] Active server branch: `preview/enable-all-languages`
- [x] Active server commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- [x] At inspection time, server also reported local/remote discovery branch ref at the same pre-documentation commit
- [x] Backend container healthy/up for 9 days at inspection time
- [x] Backend image: `floently-yki-report-calibration-overlay:20260729T183143Z`
- [x] No KieliValmis hostname was present in live Nginx configuration at the baseline
- [x] `learn.floently.com` is the active web/app hostname in Nginx
- [x] `learn-api.floently.com` is the active API hostname in Nginx
- [x] `.env.local` still points API/audio traffic to `https://learn-api.floently.com`
- [x] Existing TLS certificates are for `learn.floently.com` and `learn-api.floently.com`
- [x] Current live Nginx proxies requests to backend on `127.0.0.1:8000`
- [x] Historical Nginx backup contains legacy legal redirects, confirming legal routing has changed/regressed before and needs a permanent regression lock

Safety conclusion:

**Do not rename `learn-api.floently.com` or API environment variables during the first customer-facing rebrand.** The API hostname is a compatibility surface, not a branding requirement.

**Do not redirect `learn.floently.com` yet.** A parallel `app.kielivalmis.com` hostname must be tested first.

The first server command pasted through chat was partially line-wrapped/mangled by formatting, but the required read-only baseline sections still executed and produced sufficient evidence. No server write/deployment was performed.

## Repository findings already confirmed

The current marketing branch still contains visible learning-product branding that must be changed semantically, including:

- `Floently Product Gateway`
- `Choose Your Floently Product`
- `Floently Learn`
- `Floently Finnish`
- `Floently Home`
- `Floently · live correction`

Important distinction:

- Learning product -> KieliValmis
- Floently product-family gateway -> stays Floently
- Floently Read -> stays Floently Read
- Floently Create -> stays Floently Create
- Technical identifiers -> stay Floently where compatibility requires it

The current discovery commit `e92b98e77` also contains Floently-focused SEO metadata, sitemap entries, canonical URLs, structured data, Google Play attribution URLs, and public Learn content. Those must be migrated deliberately rather than discarded.

## R1 inventory still required

Before patching runtime code, finish exact file/path inventory for:

- public landing pages and Floently suite gateway
- login/signup/onboarding
- SEO metadata/canonical/hreflang/sitemap/structured data
- legal/support pages
- live website deployment target for `floently.com`
- native display name/splash/icon
- report/export branding
- payment/paywall customer-facing wording
- email/support wording
- Google Play / App Store metadata and asset source files
- auth/OAuth/reset/deep-link host dependencies

**No global search-and-replace.**

## Planned stages

- [~] R1 — Read-only branding/domain inventory
- [ ] R2 — Central customer-facing brand configuration
- [ ] R3 — KieliValmis public marketing copy in branch
- [ ] R4 — KieliValmis legal/support pages + automated route locks
- [ ] R5 — `kielivalmis.com` parallel deployment
- [ ] R6 — `app.kielivalmis.com` parallel runtime hostname + auth/payment regression
- [ ] R7 — SEO mapping, sitemap, canonical, redirects, Search Console migration
- [ ] R8 — Store metadata package
- [ ] R9 — Store graphic/screenshot package
- [ ] R10 — Native visible-brand patch, same package/bundle IDs
- [ ] R11 — Full regression gate
- [ ] R12 — Android KieliValmis update
- [ ] R13 — iOS KieliValmis update
- [ ] R14 — Public post-release verification
- [ ] R15 — Legacy URL/app-host retirement decision

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
- production web API calls
- app upgrade continuity

## Rollback baseline

### Released app/runtime baseline

- Server host: `ubuntu-4gb-hel1-2`
- Repo path: `/root/floently-finnish`
- Branch: `preview/enable-all-languages`
- Commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- Backend image: `floently-yki-report-calibration-overlay:20260729T183143Z`
- Web hostname: `learn.floently.com`
- API hostname: `learn-api.floently.com`

This remains the rollback baseline. No runtime rebrand change has been deployed as part of R0/R1.

### Documentation branch

KieliValmis documentation is being added on `growth/discovery-seo-d2-20260807` after the runtime baseline commit. The live server must not `git pull` this branch merely to obtain documentation.

## Last completed repository commits

- `78cb36c949fa92d3e9952d1b3769ebcbf4a0b48a` — Document KieliValmis rebrand and migration strategy
- `82dc126c50b351916595436d8bf97994becf9222` — Add KieliValmis execution tracker
- `4a8a54b3538178d225e2775d9a9435811f45ddf6` — Add KieliValmis surface inventory
- This tracker update records the live R1 server baseline

## Active blockers

No blocker for documentation/inventory work.

Before any DNS/Nginx write, determine where the public `floently.com` site is currently deployed and inspect the complete active `/etc/nginx/sites-enabled/learn` routing contract.

Trademark filing/clearance remains a parallel business/legal workstream and is not represented here as completed legal clearance.
