# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4H — R4G image-led deployment reached Vercel, but the external SVG hero returned HTTP 404. The hero is now embedded inline in `index.html`; verifier and cleanup are committed. Redeploy + automated QA + fresh visual approval pending.**

The previous two landing compositions were functionally correct but did **not** receive final visual approval, especially at an iPhone 15 Pro Max-class viewport. The R4G image-led composition is the active visual direction, but its first deployment exposed a Vercel static-asset delivery failure. Do not advance to custom-domain/DNS work until the inline-hero recovery passes both automated and visual QA.

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
- R4G deployment created: `https://kielivalmis-domain-static-pq08fyrx3-kompyint-oys-projects.vercel.app`
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

The isolated site lives at `apps/kielivalmis-domain-static` and includes:

- [x] landing page
- [x] privacy
- [x] terms
- [x] support
- [x] delete-account
- [x] robots.txt
- [x] sitemap.xml
- [x] vercel.json
- [x] regression verifier

The static regression contract has repeatedly passed for identity, 20 languages, legal pages, canonicals, sitemap, redirect locks and transition links.

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

Automated QA passed for the deployed site:

- [x] `/` -> HTTP 200
- [x] `/privacy` -> HTTP 200
- [x] `/terms` -> HTTP 200
- [x] `/support` -> HTTP 200
- [x] `/delete-account` -> HTTP 200
- [x] `/robots.txt` -> HTTP 200
- [x] `/sitemap.xml` -> HTTP 200
- [x] KieliValmis home identity contract PASS
- [x] 20-language contract PASS
- [x] privacy/terms/support/delete-account contracts PASS
- [x] robots + sitemap contracts PASS
- [x] `X-Content-Type-Options: nosniff`
- [x] `Referrer-Policy: strict-origin-when-cross-origin`
- [x] `x-robots-tag: index, follow`
- [x] `/privacy-policy` -> HTTP 308 -> `/privacy`
- [x] `/legal/privacy-policy` -> HTTP 308 -> `/privacy`
- [x] `/account-deletion` -> HTTP 308 -> `/delete-account`
- [x] `/legal/account-deletion` -> HTTP 308 -> `/delete-account`

### R4F — First typography/mobile refinement deployed but not approved visually

The first refinement reduced heading sizes, tightened typography and spacing, and attempted compact mobile cards. It deployed successfully and automated route QA remained PASS, but browser inspection still showed a cramped, clipped and card-heavy experience at iPhone 15 Pro Max-class widths.

Visual approval was therefore withheld again. Do not restore that layout as the final design.

## R4G — Image-led redesign candidate

The active source direction replaces the old card-heavy hero with a new editorial image-led composition.

### Design goals implemented

- [x] hero headline remains exactly: `Prepare for YKI. Prepare for work in Finland. In your language.`
- [x] calmer typography and narrower text measure
- [x] image-led two-column desktop hero
- [x] mobile-first single-column hero rather than shrinking the desktop grid
- [x] explicit `overflow-x:hidden` and min-width-safe layout rules
- [x] mobile CTA stack instead of side-by-side clipping
- [x] dark hero plus alternating light/soft/dark website sections
- [x] three outcome cards for YKI/work/guidance
- [x] dedicated YKI layout with all four subtests
- [x] dedicated work section
- [x] 20-language section with precise clarification that the YKI exam itself is not offered in 20 languages
- [x] final KieliValmis-by-Floently CTA and YKI independence disclaimer
- [x] existing web-app link preserved
- [x] existing Google Play package preserved
- [x] legal/footer links preserved
- [x] canonical and SEO identity remain KieliValmis

### AI illustration disclosure requirements

The visual is deliberately an illustration rather than a fake photograph. Requirements preserved:

- [x] visible tiny label: `AI-generated illustration`
- [x] machine-readable AI disclosure in page metadata
- [x] Schema.org `ImageObject` disclosure
- [x] `data-ai-generated="true"` on the hero figure
- [x] SVG `<metadata>` contains `aiGenerated: true`
- [x] creator metadata: `OpenAI ChatGPT (GPT-5.6 Sol)`
- [x] generation method
- [x] creation date `2026-08-08`
- [x] purpose and prompt summary

## R4G deployment incident — external hero SVG returned 404

R4G deployment successfully reached the existing KieliValmis Vercel project:

- Deployment: `https://kielivalmis-domain-static-pq08fyrx3-kompyint-oys-projects.vercel.app`
- Stable alias was updated to the new deployment
- Static source verification PASS before deployment
- Local AI hero asset verification PASS before deployment
- Primary deployed routes `/`, `/privacy`, `/terms`, `/support`, `/delete-account`, `/robots.txt`, `/sitemap.xml` all returned HTTP 200
- External hero request `/assets/kielivalmis-hero-ai.svg` returned HTTP 404
- Deployment QA correctly stopped on that failure
- SSH exited because `set -e` stopped after the failing asset gate
- No Namecheap DNS, Nginx, Docker, Learn runtime, Android, iOS or billing change occurred
- Live Learn production baseline before deployment remained `preview/enable-all-languages` at `e92b98e77...`

Important interpretation: the SVG existed in GitHub and in the local deployment archive, and no `.vercelignore` was found. The failure was therefore treated as a deployment-artifact delivery problem, not as a missing source file.

## R4H — Inline hero recovery committed

To eliminate the entire external-static-hero failure class, the hero illustration is now embedded directly in `index.html` as inline SVG.

Commits:

- `870dbb0121e07d615b2a32191c3baefd9c3cb515` — inline AI hero and remove broken external social-image references
- `58b43b837600e5ced23cb940c8a371b937e611ae` — verifier requires inline AI metadata/disclosure and forbids `/assets/kielivalmis-hero-ai.svg`
- `669e82dd8c189be0170ce9bb808b16b8b68bf6d7` — remove obsolete external SVG asset

Recovery properties:

- [x] no external hero image HTTP request is required
- [x] visible AI disclosure remains inside the rendered illustration
- [x] SVG metadata remains embedded directly in the page
- [x] page-level AI disclosure remains
- [x] Schema.org `ImageObject` remains without a broken `contentUrl`
- [x] broken `og:image` / `twitter:image` references were removed until a separately verified public social image is intentionally introduced
- [x] verifier now fails if the page reintroduces `/assets/kielivalmis-hero-ai.svg`
- [x] obsolete external hero file was deleted to keep one source of truth

## Current next step — R4H redeploy and visual gate

1. Fetch `growth/discovery-seo-d2-20260807` without changing the live production checkout.
2. Extract only `apps/kielivalmis-domain-static` to a temporary directory.
3. Run `npm run verify`; require `KIELIVALMIS_STATIC_INLINE_AI_HERO_DISCLOSURE=PASS`.
4. Deploy the package to existing Vercel project `kielivalmis-domain-static` using the known project/org IDs.
5. Re-run protected QA for `/`, legal routes, robots and sitemap.
6. Verify the deployed HTML contains the inline SVG AI metadata and visible disclosure.
7. Open the stable Vercel alias and perform fresh desktop visual QA.
8. Test an iPhone 15 Pro Max-class viewport and verify absolutely no horizontal clipping/overflow.
9. Only if the user visually approves this design may R4 be closed.
10. Revoke/delete the temporary automation-bypass secret after visual approval.
11. Only then advance to R5 custom-domain attachment.

## Remaining stages

- [~] R4 — inline image-led recovery committed; redeploy + automated QA + visual approval pending
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

**R4H redeploy and visual approval.** The R4G design direction remains active, but its external hero asset failed in Vercel with HTTP 404. The inline recovery is committed and removes that network dependency. Custom domains and Namecheap DNS remain blocked until the recovered image-led candidate passes deployment QA and desktop/mobile visual approval.

Trademark filing/clearance remains a separate legal/business workstream and is not represented here as completed legal clearance.