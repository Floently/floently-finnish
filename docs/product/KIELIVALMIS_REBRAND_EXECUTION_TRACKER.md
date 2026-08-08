# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R0 — Rebrand decision locked and documented**

## Current status

- Product name: **KieliValmis**
- Primary domain: **kielivalmis.com** (purchased)
- Parent/maker brand: **Floently**
- Company: **Komplyint Oy**
- Technical package/bundle IDs: **must remain unchanged**
- Current Android/iOS production apps: **must remain the same store records**
- Current task: inventory customer-facing branding and prepare parallel KieliValmis web/store implementation without disturbing released binaries

## Completed

### 2026-08-08 — R0A Documentation lock

- [x] Confirmed production repository: `galapoto/floently-finnish`
- [x] Confirmed future separate native rebuild repository exists: `galapoto/floently-native`
- [x] Confirmed current discovery/marketing branch: `growth/discovery-seo-d2-20260807`
- [x] Recorded KieliValmis/Floently architecture and migration policy
- [x] Recorded technical identifiers that must remain unchanged
- [x] Recorded domain migration strategy
- [x] Recorded legal-page regression requirements
- [x] Recorded Google Play / App Store image migration strategy
- [x] Recorded rollback and executor rules
- [x] Created this progress tracker

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

## Next stage

### R1 — Read-only branding inventory

Before patching runtime code, collect exact file/path inventory for:

- public landing pages
- login/signup/onboarding
- product gateway
- SEO metadata/canonical/hreflang/sitemap
- legal/support pages
- native display name/splash/icon
- report/export branding
- payment/paywall customer-facing wording
- email/support wording
- Google Play / App Store metadata and asset source files

**No global search-and-replace.**

## Planned stages

- [ ] R1 — Read-only branding inventory
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

## Rollback point

Current released Floently production application remains the rollback baseline. No runtime rebrand change has been deployed as part of R0.

## Last completed repository commit

`78cb36c949fa92d3e9952d1b3769ebcbf4a0b48a` — Document KieliValmis rebrand and migration strategy

## Active blockers

None for documentation/inventory work.

Trademark filing/clearance remains a parallel business/legal workstream and is not represented here as completed legal clearance.
