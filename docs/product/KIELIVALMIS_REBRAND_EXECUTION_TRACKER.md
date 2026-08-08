# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4I — R4H passed automated QA but did not pass mobile visual approval. A new mobile-first landing rebuild is committed; deploy + automated QA + fresh desktop/mobile visual review pending.**

The user explicitly rejected the R4H mobile presentation because the headings remained too large and the hero illustration was not visible early enough in the mobile experience. Do not advance to custom-domain/DNS work until the R4I candidate is deployed and visually approved.

## Locked product architecture

- Customer-facing Finnish-learning product: **KieliValmis**
- Transition identity: **KieliValmis by Floently**
- Parent/maker/product family: **Floently**
- Legal company: **Komplyint Oy**
- Primary purchased domain: **kielivalmis.com**
- Existing Android/iOS store records: preserve
- Android package / Apple Bundle ID: preserve `com.vitusidi.floently`
- Existing users, billing, RevenueCat, backend, YKI engine, cards and roleplay: preserve
- Existing `learn-api.floently.com`: preserve as compatibility infrastructure
- Existing `learn.floently.com`: preserve until a future parallel KieliValmis app-host alias passes auth/payment/YKI regression
- Existing Floently public Vercel project `main-domain-static`: preserve as Floently family gateway
- KieliValmis public marketing site: separate Vercel project `kielivalmis-domain-static`

## Production rollback baseline

### Hetzner Learn runtime

- Host: `ubuntu-4gb-hel1-2`
- Repo: `/root/floently-finnish`
- Branch: `preview/enable-all-languages`
- Commit: `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- Backend image: `floently-yki-report-calibration-overlay:20260729T183143Z`
- Web hostname: `learn.floently.com`
- API hostname: `learn-api.floently.com`

The live Learn checkout has remained unchanged throughout all KieliValmis static-site work.

### Floently public site

- Vercel project: `main-domain-static`
- Project ID: `prj_sTnnI02l9BLRIPcRIeGlblflul5Z`
- Team/org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope slug: `kompyint-oys-projects`
- Domains: `floently.com`, `www.floently.com`
- Repo root: `apps/main-domain-static`

### KieliValmis Vercel project

- Project: `kielivalmis-domain-static`
- Project ID: `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- Org/team ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Scope: `kompyint-oys-projects`
- Stable Vercel alias: `https://kielivalmis-domain-static.vercel.app`
- R4G deployment with failed external SVG: `https://kielivalmis-domain-static-pq08fyrx3-kompyint-oys-projects.vercel.app`
- Current deployed R4H rollback candidate: `https://kielivalmis-domain-static-lk9ns71uv-kompyint-oys-projects.vercel.app`
- Deployment Protection is enabled; use Vercel Protection Bypass for Automation plus ordinary `curl` for automated QA

### KieliValmis DNS baseline

- Namecheap nameservers remain authoritative
- Apex baseline: `192.64.119.155` (parking)
- `www` baseline: `parkingpage.namecheap.com.`
- No KieliValmis custom-domain DNS changes have been made yet

**Do not change Namecheap DNS until the final visual design is approved, the custom domains are attached to the correct Vercel project, and Vercel shows the exact required records.**

## Completed checkpoints

### R0-R1 — Rebrand and infrastructure baselines

- [x] Master rebrand plan committed
- [x] Execution tracker created
- [x] Surface inventory created
- [x] Technical identifiers that must stay Floently documented
- [x] Store rebrand / screenshot strategy documented
- [x] Legal-route regression policy documented
- [x] Hetzner branch/commit/Nginx/backend baseline captured
- [x] `floently.com` confirmed on existing Vercel project
- [x] `kielivalmis.com` confirmed Namecheap parked
- [x] Separate Vercel-project architecture locked

### R2 — Isolated KieliValmis static package

The isolated site lives at `apps/kielivalmis-domain-static` and includes landing, privacy, terms, support, delete-account, robots, sitemap, Vercel config and a static regression verifier.

The static regression contract has repeatedly passed for identity, 20 languages, legal pages, canonicals, sitemap, redirect locks, transition links and AI-hero disclosure requirements.

### R3 — Isolated Vercel project created

- [x] Short-lived Vercel token validated against scope `kompyint-oys-projects`
- [x] Existing `main-domain-static` confirmed visible and untouched
- [x] New project `kielivalmis-domain-static` created with project ID `prj_RJPEDkC38WfDxcwWbSsQdRKBSpjd`
- [x] First deployment created successfully
- [x] No custom domains added
- [x] Namecheap DNS untouched
- [x] Production Learn checkout remained at `e92b98e77...`

### R4 automated deployment QA baseline

After abandoning unreliable beta `vercel curl` behavior in CLI `58.9.0`, QA switched to Vercel Protection Bypass for Automation plus ordinary system `curl`.

Automated route/content/header/redirect QA has passed for the deployed site, including primary routes, legal pages, robots, sitemap, security headers and permanent legal aliases.

### R4F — First typography/mobile refinement not visually approved

The first refinement reduced heading sizes and attempted compact mobile cards, but the browser still showed a cramped, clipped and card-heavy experience on an iPhone 15 Pro Max-class viewport. Visual approval was withheld.

### R4G — Image-led redesign and external-SVG deployment incident

The landing was redesigned around an AI-generated editorial illustration. The external hero asset existed in source and local archive but returned HTTP 404 on Vercel. QA correctly stopped. No DNS, Nginx, runtime, billing or app changes occurred.

### R4H — Inline hero recovery and automated deployment QA PASS

The hero illustration was embedded directly in `index.html`, eliminating the external image request. The verifier forbids reintroducing `/assets/kielivalmis-hero-ai.svg`.

Recovery commits:

- `870dbb0121e07d615b2a32191c3baefd9c3cb515` — inline AI hero
- `58b43b837600e5ced23cb940c8a371b937e611ae` — verifier guards inline AI disclosure
- `669e82dd8c189be0170ce9bb808b16b8b68bf6d7` — remove obsolete external SVG
- `317ed4e62a8dad0612676043908005840a88313b` — record SVG 404/recovery

R4H deployed successfully:

- Deployment: `https://kielivalmis-domain-static-lk9ns71uv-kompyint-oys-projects.vercel.app`
- [x] all primary routes HTTP 200
- [x] inline hero SVG present in deployed HTML
- [x] AI metadata and visible `AI-generated illustration` disclosure present
- [x] four legal compatibility redirects HTTP 308
- [x] static regression contract PASS
- [x] final Learn production branch/commit remained unchanged
- [x] Namecheap DNS remained untouched

However, R4H **did not pass final visual approval**. At the iPhone 15 Pro Max-class viewport the user reported:

- headings still too large
- mobile layout still felt like a compressed desktop page
- top-right app CTA continued competing with brand identity
- hero picture was not visible early enough in the mobile page

## R4I — Active mobile-first visual rebuild

Landing source:

`apps/kielivalmis-domain-static/index.html`

Commit:

`133deb42c8ee9d64f25712159c8b63610a470c90`

R4I deliberately replaces the R4H layout rather than layering another small CSS override on it.

### R4I design changes

- [x] exact hero headline preserved: `Prepare for YKI. Prepare for work in Finland. In your language.`
- [x] desktop hero maximum reduced to about 54px
- [x] desktop section headings reduced to about 40px maximum
- [x] mobile hero headline reduced to roughly 28–31px
- [x] mobile section headings reduced to roughly 24–28px
- [x] mobile navigation is brand-only; the top-right `Open app` CTA is hidden
- [x] mobile hero is explicitly reordered as kicker -> headline -> illustration -> short copy -> focus points -> primary CTA -> transition note
- [x] hero illustration is therefore visible immediately after the headline instead of below the entire text/CTA block
- [x] mobile primary action is full width
- [x] Android remains available as a quiet secondary text link, preserving the existing Google Play package URL
- [x] mobile focus points use a compact 2x2 grid
- [x] content/card typography and padding reduced throughout mobile sections
- [x] mobile remains strictly single-column for YKI/work content
- [x] inline AI illustration remains self-contained with no external network asset dependency
- [x] visible tiny `AI-generated illustration` label remains inside the SVG and in the caption
- [x] page-level `ai-content-disclosure`, Schema.org `ImageObject`, `data-ai-generated="true"`, SVG metadata, creator, generation method, date, purpose and disclosure remain
- [x] legal/footer links, canonical identity, 20 languages, YKI clarification, web-app URL and Android package URL remain

## Current next step — deploy R4I and repeat gates

1. Fetch `growth/discovery-seo-d2-20260807` without changing the live Learn checkout.
2. Extract only `apps/kielivalmis-domain-static` into a temporary deployment directory.
3. Run `npm run verify` and require the inline AI disclosure PASS marker.
4. Deploy to the existing Vercel project `kielivalmis-domain-static` using the known project/org IDs.
5. Verify `/`, legal routes, robots and sitemap through the protection-bypass header.
6. Verify deployed HTML contains the inline hero and AI metadata.
7. Open the stable Vercel alias and hard refresh.
8. Review desktop typography and hero composition.
9. Test the same iPhone 15 Pro Max-class viewport and verify the picture is visible directly after the smaller headline, the navigation is brand-only, and there is no horizontal clipping.
10. Only after explicit user visual approval may R4 close and R5 custom-domain attachment begin.

## Remaining stages

- [~] R4 — R4I mobile-first candidate committed; deploy + automated QA + visual approval pending
- [ ] R5 — add `kielivalmis.com` / `www.kielivalmis.com` to KieliValmis Vercel project and capture exact DNS requirements
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

**R4I deployment and visual approval.** Functional infrastructure is healthy, but visual approval has not been granted. Custom domains and Namecheap DNS remain blocked.

Trademark filing/clearance remains a separate legal/business workstream and is not represented here as completed legal clearance.