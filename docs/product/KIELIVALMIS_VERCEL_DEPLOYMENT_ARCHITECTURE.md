# KieliValmis Vercel Deployment Architecture

**Decision date:** 2026-08-08  
**Status:** LOCKED BEFORE DNS CHANGE  
**Parent plan:** `docs/product/KIELIVALMIS_REBRAND_MASTERPLAN.md`

## Decision

Do **not** make `kielivalmis.com` a normal production alias of the existing Vercel project `main-domain-static`.

The existing Vercel project must remain the public Floently product-family gateway.

Create a second isolated Vercel project for KieliValmis from the same GitHub repository.

Target architecture:

```text
galapoto/floently-finnish

apps/main-domain-static
    -> Vercel project: main-domain-static
    -> floently.com / www.floently.com
    -> Floently product-family gateway
       - KieliValmis
       - Floently Read
       - Floently Create

apps/kielivalmis-domain-static
    -> Vercel project: kielivalmis-domain-static
    -> kielivalmis.com / www.kielivalmis.com
    -> KieliValmis marketing / SEO / legal site
```

The runtime learning application remains separately hosted during migration:

```text
learn.floently.com
    -> existing Hetzner/Nginx web application

learn-api.floently.com
    -> existing Hetzner/Nginx API
```

Later, after full regression testing:

```text
app.kielivalmis.com
    -> existing Learn runtime/application
```

`learn.floently.com` remains functional until the new app hostname is proven safe.

## Why this isolation is required

If `kielivalmis.com` is simply attached to the same normal production deployment as `floently.com`, both domains will receive the same static site unless additional host-specific routing or branch/domain logic is introduced.

That conflicts with the approved product architecture:

- `floently.com` must remain the Floently ecosystem/gateway.
- `kielivalmis.com` must become the dedicated Finnish-learning/YKI/work product site.

A separate Vercel project provides a cleaner regression boundary:

- independent domains
- independent production deployments
- independent redirects/canonicals/sitemaps
- independent legal route verification
- no need to modify the working Floently gateway merely to launch KieliValmis
- easier rollback
- clearer ownership for future executors

## Vercel project rules

### Existing project — do not repurpose

- Project name: `main-domain-static`
- Project ID: `prj_sTnnI02l9BLRIPcRIeGlblflul5Z`
- Team/org ID: `team_Pi5Ylt8nVh9Jzc60Ck7rl5I6`
- Current domains: `floently.com`, `www.floently.com`
- Repository root directory: `apps/main-domain-static`

This project stays Floently-branded.

### New project

Recommended project name:

`kielivalmis-domain-static`

Recommended repository root directory:

`apps/kielivalmis-domain-static`

Recommended framework preset:

Static / Other, using the repository package verification/build command.

The new project should first receive a Vercel-generated preview/production URL. Only after the KieliValmis site passes verification should `kielivalmis.com` and `www.kielivalmis.com` be added.

## DNS rules

Current 2026-08-08 baseline:

- `kielivalmis.com` apex -> Namecheap parking IP `192.64.119.155`
- `www.kielivalmis.com` -> `parkingpage.namecheap.com.`
- authoritative nameservers remain Namecheap (`dns1.registrar-servers.com`, `dns2.registrar-servers.com`)

Do not alter nameservers merely for this migration.

Keep DNS hosted at Namecheap unless there is a later explicit reason to move it.

After the new KieliValmis Vercel project exists and both custom domains are added there, use the **exact A/CNAME/TXT values shown by Vercel for that project/domain**. Do not assume a generic value if Vercel displays a project-specific target.

Recommended canonical web-host approach:

- keep both `kielivalmis.com` and `www.kielivalmis.com` working
- prefer `www.kielivalmis.com` as the canonical host if Vercel recommends it for the configured project
- redirect the apex to the canonical host
- marketing may still simply display `kielivalmis.com`

The final canonical-host decision must be reflected consistently in:

- canonical tags
- sitemap
- OpenGraph URLs
- structured data
- Search Console
- internal links
- redirect rules

## Pre-DNS verification gate

Before changing Namecheap DNS, the new project must have:

- dedicated KieliValmis HTML/content
- correct KieliValmis title/description
- KieliValmis legal pages
- working privacy page
- working terms page
- working support page
- working delete-account page
- KieliValmis sitemap
- robots.txt
- verification script passing
- no accidental Floently Learn/Floently Finnish primary branding
- Floently attribution retained only where intentional (`by Floently` / product-family references)

## Post-DNS verification gate

After DNS is changed:

- apex resolves to Vercel target
- `www` resolves to Vercel target
- HTTPS certificate is valid
- HTTP -> HTTPS behavior is correct
- apex/www canonical redirect is correct
- `/privacy` returns expected permanent/clean route behavior
- `/terms` works
- `/support` works
- `/delete-account` works without login
- no soft 404s
- sitemap is public
- robots.txt is public
- page source uses KieliValmis canonical URLs

## Floently regression lock

Changing KieliValmis DNS/project must not change:

- `floently.com`
- `www.floently.com`
- `learn.floently.com`
- `learn-api.floently.com`
- existing Vercel project `main-domain-static`
- current Hetzner Nginx configuration
- current backend image/container

The first KieliValmis website deployment is successful only if the old Floently URLs still behave exactly as before.
