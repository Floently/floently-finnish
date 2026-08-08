# KieliValmis Rebrand Execution Tracker

**Source of truth:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`  
**Deployment addendum:** `docs/product/KIELIVALMIS_VERCEL_DEPLOYMENT_ARCHITECTURE.md`  
**Repository:** `galapoto/floently-finnish`  
**Working branch:** `growth/discovery-seo-d2-20260807`  
**Started:** 2026-08-08

## Current milestone

**R4 — Validate deployed KieliValmis site through protected-route QA before custom-domain/DNS work**

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
- Response included `x-robots-tag: noindex`
- This indicates Vercel Authentication/Deployment Protection on the generated deployment URL, not an application failure

No custom domain has been added and Namecheap DNS remains untouched.

### R4A attempt 1 — QA command parser failure before any route request

The first protected-route QA command did **not** reach the KieliValmis deployment. Vercel CLI exited while parsing arguments with:

`ArgError: option requires argument: -S (alias for --scope)`

Root cause: the QA script forwarded grouped native curl short flags `-sS`. Vercel CLI also reserves `-S` as the shorthand for its global `--scope` option, so the CLI parser interpreted the `S` in `-sS` as Vercel scope syntax instead of native curl `--show-error`.

Safety/result:

- [x] Failure occurred before route QA began
- [x] No KieliValmis site content or redirect result was evaluated
- [x] No Vercel project setting was changed
- [x] No deployment was changed
- [x] No custom domain was added
- [x] No Namecheap DNS was changed
- [x] No Nginx/Docker/runtime change was made

### R4B attempt 2 — global options forwarded to system curl

The minimal smoke command also did **not** reach the KieliValmis deployment. Vercel CLI started `vercel curl`, but the downstream system curl exited with:

`curl: option --token: is unknown`

Root cause: `--scope` and `--token` were placed after the `curl` subcommand/target. `vercel curl` is a passthrough wrapper around system curl, so those arguments were forwarded downstream rather than treated as Vercel global options.

Safety/result:

- [x] No application route was evaluated
- [x] No deployment/project/domain setting was changed
- [x] No custom domain was added
- [x] Namecheap DNS remains untouched

### R4C attempt 3 — documented global-option ordering still forwarded token in CLI 58.9.0

The corrected smoke command placed `--scope` and `--token` before the `curl` subcommand exactly as intended for Vercel global options, but Vercel CLI `58.9.0` still launched the downstream system curl with `--token`, which failed with:

`curl: option --token: is unknown`

Observed result:

- `VERCEL_CURL_EXIT_CODE=2`
- Production branch remained `preview/enable-all-languages`
- Production commit remained `e92b98e7799c390bc52b42d724c57f197ffd5c0d`
- No protected application route was reached
- No Vercel project/deployment/domain setting changed
- No Namecheap DNS changed

Decision after three beta-CLI parser/passthrough failures:

**Stop retrying `vercel curl` for this release path.** The official command is still marked beta, and the observed CLI behavior on 58.9.0 is not reliable enough for our release gate. Switch to Vercel's documented **Protection Bypass for Automation** method, then use ordinary system `curl` with the `x-vercel-protection-bypass` header. This keeps Deployment Protection enabled while giving our QA request explicit, revocable access.

## Current next step — R4 protected deployment QA via automation bypass

In the Vercel dashboard for `kielivalmis-domain-static`:

1. Open **Settings → Deployment Protection**.
2. Under **Protection Bypass for Automation**, create a short-lived QA bypass secret (suggested note/name: `kielivalmis-r4-qa`).
3. Do not paste the secret into chat or commit it.
4. Enter it only into the server terminal using a hidden `read -rsp` prompt.
5. Test the protected deployment with ordinary `curl` and the header `x-vercel-protection-bypass: <secret>`.
6. After R4 QA passes, revoke/delete the temporary bypass secret.

Validate at minimum:

- `/`
- `/privacy`
- `/terms`
- `/support`
- `/delete-account`
- `/robots.txt`
- `/sitemap.xml`
- permanent legal aliases from `vercel.json`
- expected KieliValmis identity/canonical markers
- expected security/SEO headers

Only after route/content QA passes should `kielivalmis.com` and `www.kielivalmis.com` be added to the Vercel project and the exact DNS records requested by Vercel captured.

## Planned stages

- [x] R2 — isolated static package + regression PASS
- [x] R3 — create isolated Vercel project and initial deployment
- [~] R4 — protected route/content QA + visual QA
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

**R4 deployed-route/content QA only.** The KieliValmis Vercel project and first deployment exist and are isolated correctly. Three `vercel curl` attempts failed before any protected application request because of CLI parser/passthrough behavior. Custom domains and Namecheap DNS must remain untouched until R4 passes through the supported automation-bypass route.

Trademark filing/clearance remains a parallel business/legal workstream and is not represented here as completed legal clearance.
