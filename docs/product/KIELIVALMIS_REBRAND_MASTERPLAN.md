# KieliValmis Rebrand Master Plan

**Status:** APPROVED DIRECTION / EXECUTION IN PHASES  
**Decision date:** 2026-08-08  
**Primary production repository:** `galapoto/floently-finnish`  
**Current marketing/SEO working branch:** `growth/discovery-seo-d2-20260807`  
**Company:** Komplyint Oy  
**Parent/maker brand:** Floently  
**Customer-facing Finnish learning product:** KieliValmis  
**Purchased primary product domain:** `kielivalmis.com`

---

## 1. Purpose of this document

This document is the source-of-truth continuity plan for renaming the current Finnish-learning product from Floently/Floently Learn/Floently Finnish to **KieliValmis**, while preserving the existing product, technical infrastructure, users, subscriptions, content, YKI engine, card bank, and release history.

The goal is a **brand and domain migration, not a product migration**.

Future executors must not reinterpret this as an instruction to create a new Android app, new Apple app, new database, new RevenueCat project, new backend, new card bank, or new account system.

The existing product remains the same product. Only the customer-facing identity changes.

---

## 2. Final brand architecture

### Company

**Komplyint Oy**

### Parent / maker / product family

**Floently**

Floently remains useful as the wider product family and maker brand.

Long-term ecosystem:

```text
Komplyint Oy
└── Floently
    ├── KieliValmis       <- Finnish learning / YKI / working-life Finnish
    ├── Floently Read     <- separate Read product
    └── Floently Create   <- separate Create product
```

### Finnish learning product

**KieliValmis**

Transition identity:

**KieliValmis by Floently**

Once the migration is established, “by Floently” may become secondary and live mainly in About, legal, support, footer, and company attribution surfaces.

### Primary product domain

**kielivalmis.com**

### Core positioning

**Prepare for YKI. Prepare for work in Finland. In your language.**

Supporting line:

**YKI preparation and Finnish working-life practice with guidance in 20 languages.**

Campaign line:

**20 languages. One goal: be ready for Finland.**

The product must not claim that the YKI exam itself is available in 20 languages. The accurate differentiator is that task guidance, UI, explanations, learning support, and feedback can be delivered in the learner’s language while the Finnish-learning and YKI practice remain Finnish.

---

## 3. Trademark and business-name decision

Registering a company name is not the same as owning a registered trademark.

The KieliValmis domain has been purchased. A preliminary search did not reveal an obvious exact registered KieliValmis mark, but this is **not legal clearance** and must not be described as such.

Operational work may proceed with the chosen brand, while trademark filing/clearance remains a separate business/legal workstream.

If a trademark application is made later, search for identical and confusingly similar marks and company names in Finland, EU registrations, international registrations designating Finland, and relevant goods/services classes before filing.

Do not block normal software preparation merely because the trademark application itself has not yet been filed, unless a new conflicting right is discovered.

---

## 4. Absolute non-negotiable rule

> Change the customer-facing identity. Preserve the technical identity unless there is a proven technical reason to change it.

This is how KieliValmis inherits the existing application instead of becoming a dangerous second product.

---

## 5. Technical identities that MUST remain unchanged

Unless a future migration has a separate approved engineering plan, keep all of the following:

- Android package: `com.vitusidi.floently`
- Apple bundle identifier: existing `com.vitusidi.floently`
- Existing Apple app record / Apple ID
- Existing Google Play app record
- Existing EAS project identity
- Existing runtime lineage and update channel strategy
- Existing signing credentials
- Existing users and authentication identities
- Existing database and tables
- Existing backend APIs
- Existing YKI engine
- Existing canonical Finnish card bank and overlays
- Existing roleplay engine
- Existing subscription history
- Existing RevenueCat project, entitlements, offerings, and product mappings
- Existing Apple/Google subscription products unless a separate billing migration is explicitly approved
- Existing internal environment-variable names such as `FLOENTLY_*`
- Existing internal storage keys such as `floently_user_id`
- Existing internal module/component names where changing them adds no customer value
- Existing repository name `floently-finnish`
- Existing deep-link scheme `floently://` unless a carefully tested compatibility migration is later approved

Do **not** create a new package ID or new Bundle ID for KieliValmis. Doing so would create a different store app and would jeopardize update continuity, users, subscriptions, reviews, and release history.

---

## 6. Customer-facing surfaces that SHOULD change

The next controlled rebrand release should change visible product identity, including:

- Google Play app name
- Apple App Store app name
- Store subtitle / short description
- Store full description
- Store feature graphic
- Store screenshots
- Store promotional graphics that visibly say Floently/Floently Finnish/Floently Learn
- Installed app display/launcher name
- Splash branding
- Main visible app header/logo where it refers to the learning product
- Public Learn landing-page product name
- Login page product name
- Signup/onboarding product name
- Pricing/paywall product name where customer-facing
- YKI report branding
- Roleplay report branding
- exported report title/footer where customer-facing
- About screen
- Support page
- Privacy/terms/delete-account page display wording
- OpenGraph/Twitter/social metadata for the Finnish-learning product
- SEO titles/descriptions/canonical URLs for migrated Learn pages
- transactional email sender/display wording where user-facing and safe to change

During transition, use:

**KieliValmis by Floently**

Legal/support attribution should use a formulation such as:

**KieliValmis is a Floently product by Komplyint Oy.**

---

## 7. What Floently.com becomes

Do not destroy Floently as a product-family brand.

`floently.com` should become a small, stable product gateway/company ecosystem page.

Target structure:

```text
Floently

Products by Floently

KieliValmis
Prepare for YKI and work in Finland with guidance in 20 languages.
[Visit KieliValmis]

Floently Read
Coming soon.

Floently Create
Coming soon.
```

The useful informational content currently on Floently Learn—YKI preparation, grammar, workplace Finnish, etc.—must not disappear. That content should move to the KieliValmis site where it supports the KieliValmis product and SEO strategy.

Floently Read and Floently Create must not be moved under the KieliValmis brand. They remain separate Floently products.

---

## 8. Domain migration architecture

### Marketing domain

New primary Finnish-learning marketing domain:

`kielivalmis.com`

### Application hostname

Do **not** immediately force `learn.floently.com` to redirect.

Authentication, cookies, OAuth callbacks, password-reset links, CORS, billing redirects, deep links, review credentials, and other runtime behavior can depend on the current hostname.

First introduce a parallel hostname:

`app.kielivalmis.com`

Target transition state:

```text
kielivalmis.com       -> KieliValmis public website / marketing / SEO
app.kielivalmis.com   -> same Learn web application
learn.floently.com    -> remains functional during verification period
floently.com          -> Floently product-family gateway
```

Only after the KieliValmis app hostname passes the complete production regression checklist should `learn.floently.com` be considered for a permanent redirect.

### URL-by-URL migration

Do not redirect every old URL to the new homepage.

Map equivalent pages to equivalent pages, for example:

```text
floently.com/learn                     -> kielivalmis.com/
floently.com/learn/yki                 -> kielivalmis.com/yki
floently.com/learn/grammar             -> kielivalmis.com/grammar
floently.com/learn/workplace-finnish   -> kielivalmis.com/workplace-finnish
floently.com/learn/privacy             -> kielivalmis.com/privacy
floently.com/learn/terms               -> kielivalmis.com/terms
floently.com/learn/support             -> kielivalmis.com/support
floently.com/learn/delete-account      -> kielivalmis.com/delete-account
```

Actual mapping must be generated from the real route inventory before redirects are enabled.

Use permanent server-side redirects (`301` or `308`) for migrated public pages.

Keep redirects long-term. Do not remove them after a few days or weeks.

---

## 9. SEO migration rules

The migration must preserve discovery work already completed.

Rules:

1. Do not simultaneously change domain, route taxonomy, information architecture, and visual design if avoidable.
2. First reproduce the existing valuable Learn content on `kielivalmis.com` with equivalent routes.
3. Add self-referencing KieliValmis canonical URLs on the new domain.
4. Update hreflang annotations to KieliValmis URLs.
5. Update internal links to point directly to KieliValmis URLs instead of through redirects.
6. Generate a new KieliValmis sitemap.
7. Keep an inventory mapping every old indexed/public URL to a new destination.
8. Verify old and new domains and relevant variants in Google Search Console.
9. Inspect the newly purchased domain for previous manual actions/removals/history before migration.
10. Submit the new sitemap.
11. Use Google Search Console’s site-move/Change-of-Address workflow where applicable.
12. Monitor crawl errors, indexing, redirects, canonical selection, traffic, and server capacity.
13. Preserve the old domain and permanent redirects for at least the long transition period; do not allow the old domain to lapse.
14. Do not remove useful old content until its KieliValmis equivalent is live and verified.

Temporary ranking/index fluctuations are expected during a domain move. A migration is not considered complete merely because the homepage changes.

---

## 10. Legal-page regression lock

The privacy and delete-account pages have regressed to 404 in the past. The rebrand must make this safer, not worse.

The following must always return a public successful response without login:

KieliValmis target pages:

- `/privacy`
- `/terms`
- `/support`
- `/delete-account`

Legacy Floently compatibility pages must continue to resolve or permanently redirect to the correct KieliValmis equivalents.

Minimum requirements for the rebranded legal pages:

- Product name: KieliValmis
- Attribution: a Floently product by Komplyint Oy
- clear privacy contact/support route
- account deletion instructions
- what gets deleted
- what may be retained for legal/tax/payment/security/dispute reasons
- subscription cancellation clarification
- deletion page publicly accessible without login
- no route duplication after `</html>` or malformed generated HTML

Add automated HTTP regression checks for all legal URLs on every website deployment.

A legal-page deployment is not successful until the public routes are checked from outside the authenticated app session.

---

## 11. Store-name strategy

### Google Play

Preferred store title:

**KieliValmis: YKI & Work**

Alternative transition title if we want the maker visible:

**KieliValmis by Floently**

Google Play currently limits app titles to 30 characters, so every localized title must be validated against that limit before submission.

Preferred short description:

**Prepare for YKI and work in Finland with guidance in 20 languages.**

The full description should naturally cover:

- YKI speaking, reading, listening, and writing preparation
- Finnish for working life
- professional roleplay
- grammar
- vocabulary
- sentence practice
- everyday Finnish
- guidance in 20 languages
- web/mobile continuity where currently true
- independent status: not affiliated with the official YKI examination authorities

Do not keyword-stuff or make unverifiable claims.

### Apple App Store

Preferred app name:

**KieliValmis**

Preferred subtitle:

**YKI & Work in 20 Languages**

Apple currently limits the app name and subtitle to 30 characters each.

The App Store name can be changed when the app/version is in an editable state or as part of a new version. Do not create a second Apple app record.

---

## 12. Installed app display name

The store listing name and the installed launcher name are different layers.

The launcher/display name should become:

**KieliValmis**

The existing native identity remains:

`com.vitusidi.floently`

Changing the installed app name/splash/icon is a native-binary-facing rebrand step. Treat it as the **next controlled native release**, not as a casual OTA-only change.

Do not bump native versions/build numbers until the rebrand patch, regression checks, and store assets are ready together.

---

## 13. Store image / screenshot strategy

All store graphics that still present the learning product as Floently/Floently Finnish/Floently Learn must be replaced in the rebrand submission.

### Visual identity during transition

Primary wordmark:

**KieliValmis**

Secondary attribution:

**by Floently**

The user should never install an app called KieliValmis and then encounter a first-run/store visual that makes it appear they installed an unrelated Floently product.

### Google Play feature graphic

Core message:

```text
KieliValmis
YKI + WORK IN FINLAND
GUIDANCE IN 20 LANGUAGES
```

Optional small attribution:

```text
by Floently
```

The feature graphic should not be a small logo floating in empty white space. It should function as a clear acquisition asset with strong hierarchy and legibility on a phone-sized store surface.

### Screenshot narrative

Preferred first five screenshot messages:

1. **Prepare for YKI in your language**
2. **Guidance in 20 languages**
3. **Prepare for work in Finland**
4. **Practise real workplace conversations**
5. **Speaking, grammar and vocabulary for real life**

Additional screenshots may show:

6. YKI evaluation/reporting
7. roleplay
8. grammar/vocabulary/sentence cards
9. progress/streaks
10. professional Finnish pathway

### Asset rules

- Screenshots must show the real current UI.
- Do not fabricate app functionality that users do not receive.
- Text overlays may explain the value proposition, but screenshots must remain representative.
- Update “Floently” text in graphics to “KieliValmis” or “KieliValmis by Floently.”
- Use the existing Floently visual system as transitional lineage where helpful, rather than unnecessarily redesigning every visual element at once.
- Localize graphic text only where we can maintain quality; do not create poor automated translations just to fill every locale.
- Apple permits up to 10 screenshots per supported device size; store screenshots can be changed with the next editable/new app version after an approved version.
- Google Play supports localized graphic assets and should receive the same strategic narrative as Apple.

Do not submit mismatched store images where the listing title says KieliValmis but screenshots still lead with Floently Finnish.

---

## 14. App icon strategy

The icon does not necessarily need a complete artistic reinvention in the first rebrand version.

Safer transition options:

### Option A — preserve visual equity

Keep the recognizable existing icon shape/color system, but remove any visible “Floently” wordmark and adapt the mark to KieliValmis.

### Option B — KieliValmis monogram

Create a simple, legible `KV` or `K` symbol using the existing Floently design language.

The icon must remain recognizable at small sizes. Do not place the full “KieliValmis by Floently” phrase inside the launcher icon.

The wordmark belongs in splash, store graphics, and marketing; the icon should remain a symbol.

---

## 15. Website migration phases

### Phase W0 — freeze and inventory

- preserve the current production site and release
- capture route inventory
- capture current canonical/hreflang/sitemap behavior
- capture legal URLs
- capture auth/billing callback URLs
- capture all public `Floently`, `Floently Learn`, and `Floently Finnish` strings
- do not redirect yet

### Phase W1 — build KieliValmis marketing copy in parallel

- create KieliValmis brand constants/copy
- update public learning-product headings
- keep Floently product gateway as parent brand
- keep Read/Create as Floently products
- preserve current feature content and SEO pages
- no destructive route removal

### Phase W2 — publish `kielivalmis.com` without redirecting old app hostname

- TLS/HTTPS works
- public site loads
- privacy/terms/support/delete-account work
- sitemap works
- canonical points to KieliValmis
- robots allow intended indexing
- analytics works

### Phase W3 — introduce `app.kielivalmis.com`

Serve the existing Learn web app through the new hostname while keeping `learn.floently.com` operational.

Regression test:

- signup
- login
- logout
- password reset
- Google auth
- Apple auth where relevant
- session persistence
- subscription purchase flow
- subscription restore
- YKI
- cards
- roleplay
- reports/export
- streak/progress
- privacy/terms/support/delete account
- deep links
- CORS
- API calls

### Phase W4 — public URL redirects

Enable URL-by-URL permanent redirects for the migrated **marketing/SEO/legal** pages.

Do not automatically redirect the runtime app hostname until Phase W3 passes.

### Phase W5 — Search Console migration

- verify KieliValmis properties
- submit sitemap
- inspect important pages
- use Change of Address where appropriate
- monitor old/new indexing
- monitor redirect errors and soft 404s

### Phase W6 — legacy application hostname retirement (later)

Only after verified production stability should `learn.floently.com` redirect to `app.kielivalmis.com`.

If keeping the old hostname improves compatibility with legacy links or integrations, it may remain as a supported alias longer.

---

## 16. Native/store release phases

### Phase N0 — do not disturb the current released binary

No rebrand change should be mixed with unrelated evaluation/YKI/audio/payment/native dependency work.

### Phase N1 — prepare rebrand branch

Update only customer-visible brand surfaces and associated tests.

### Phase N2 — regression gate

Before producing new binaries, verify:

- auth
- subscriptions
- restore purchases
- YKI exam start/complete/submit
- speaking timer autosave behavior
- YKI evaluation/report generation
- roleplay and export
- cards
- streak/progress
- legal/support links
- privacy/delete-account URLs
- web links
- app store review credentials

### Phase N3 — Android rebrand release

Keep package ID unchanged.

Update:

- app store name/metadata
- store images
- launcher display name
- splash/icon as approved
- visible app brand strings

Build a new signed AAB only after the regression gate passes.

### Phase N4 — iOS rebrand release

Keep Bundle ID unchanged.

Create a new editable app version, update name/metadata/screenshots, attach the tested KieliValmis build, and submit normally.

Do not create another App Store Connect app record.

### Phase N5 — post-release verification

Install each app from the public store as an ordinary user and verify:

- store listing says KieliValmis
- installed app says KieliValmis
- first launch says KieliValmis
- account/subscription continuity is intact
- old users upgrade in place
- restore purchase works
- no duplicate app appears

---

## 17. Central brand configuration recommendation

Do not continue scattering literal brand strings throughout the code.

Create a small source-of-truth brand configuration during implementation, conceptually containing:

```text
PRODUCT_NAME = KieliValmis
PRODUCT_NAME_WITH_MAKER = KieliValmis by Floently
MAKER_NAME = Floently
LEGAL_ENTITY = Komplyint Oy
PRODUCT_DOMAIN = kielivalmis.com
APP_DOMAIN = app.kielivalmis.com
LEGACY_MARKETING_DOMAIN = floently.com
LEGACY_APP_DOMAIN = learn.floently.com
```

Use it for new customer-facing code where practical.

Do **not** use this as an excuse to rename internal database fields, environment variables, package IDs, entitlement IDs, repositories, or other technical identifiers.

---

## 18. Current repository observations relevant to the migration

The current marketing branch still contains customer-facing strings such as:

- `Floently Product Gateway`
- `Choose Your Floently Product`
- `Floently Learn`
- `Floently Finnish`
- `Floently Home`
- `Floently · live correction`

These are expected findings and are not to be bulk-replaced blindly.

Correct semantic replacements:

- Learning product references -> **KieliValmis** / **KieliValmis by Floently**
- Parent product gateway -> **Floently** remains Floently
- Floently Read -> remains **Floently Read**
- Floently Create -> remains **Floently Create**
- company/legal entity -> remains **Komplyint Oy**

A global search-and-replace of `Floently` is prohibited because it would incorrectly rename the maker, Read/Create, internal identifiers, APIs, and technical compatibility surfaces.

---

## 19. Rebrand regression locks

Add tests/checks that fail if:

- `com.vitusidi.floently` changes unintentionally
- RevenueCat entitlement/product identifiers change unintentionally
- EAS project ID changes unintentionally
- OAuth redirect/deep-link compatibility is lost
- legal pages return non-2xx or require login
- old public Floently learning URLs have no equivalent KieliValmis destination
- KieliValmis canonical pages point back to old Floently learning URLs
- the new sitemap emits legacy primary URLs
- the KieliValmis store title is paired with screenshots that still lead with Floently Finnish/Floently Learn
- the user upgrades and loses subscription/account state
- YKI or roleplay reports retain the wrong product name after the rebrand release

Do not make the regression guard a simplistic “no Floently string anywhere” test. Floently is intentionally retained as maker/product-family and in technical identifiers.

---

## 20. Rollback strategy

Every implementation phase must be reversible independently.

### Web rollback

- keep old Floently pages available until KieliValmis pages are verified
- keep a pre-migration server config snapshot
- maintain the old DNS configuration record
- disable redirects before deleting/moving content if rollback is needed

### App rollback

- do not change package/bundle identifiers
- preserve the last known-good release tag/commit
- do not delete store history
- if a KieliValmis binary has a functional regression, publish a corrected build on the same app record instead of reverting to a second app

### SEO rollback

Because redirects and canonicals affect indexing, do not repeatedly flip domains back and forth. Fix individual mapping/configuration errors while keeping the long-term KieliValmis destination stable whenever possible.

---

## 21. Executor discipline

Every future AI/engineer working on the rebrand must follow these rules:

1. Inspect before patching.
2. Make narrow changes.
3. Preserve existing working YKI, roleplay, cards, auth, payments, and reports.
4. Never rename package IDs or Bundle IDs as part of branding.
5. Never bulk-replace every occurrence of Floently.
6. Keep Floently Read and Floently Create under Floently.
7. Keep KieliValmis focused on Finnish learning/YKI/work in Finland.
8. Do not deploy a domain redirect before equivalent KieliValmis routes exist.
9. Do not retire `learn.floently.com` before `app.kielivalmis.com` passes production auth/billing regression tests.
10. Run legal-page checks after every website deployment.
11. Run store/installed-app consistency checks before store submission.
12. Update the execution tracker after every completed stage.
13. Record exact branch, commit, deployment, test result, and rollback point.
14. Do not mix rebrand changes with unrelated feature or evaluation changes in the same release unless explicitly approved.
15. Preserve this document as the migration source of truth.

---

## 22. Immediate next actions

1. Freeze the chosen spelling as **KieliValmis** and domain as `kielivalmis.com`.
2. Preserve Floently as maker/product family.
3. Create the execution tracker in this repository.
4. Inventory customer-facing branding on the current marketing branch.
5. Add a central customer-facing brand configuration without renaming technical identifiers.
6. Prepare the KieliValmis landing/marketing version in a branch only.
7. Prepare new KieliValmis store metadata.
8. Prepare the new feature graphic and screenshot narrative.
9. Set up `kielivalmis.com` and legal-page routes in parallel, without redirecting the runtime app hostname.
10. Add `app.kielivalmis.com` only after DNS/TLS/server setup is known and test it alongside `learn.floently.com`.
11. Complete the regression matrix.
12. Only then enable public URL redirects and produce the native KieliValmis store release.

---

## 23. Definition of done

The rebrand is complete only when all of the following are true:

- KieliValmis is the clear customer-facing name for the Finnish-learning product.
- `kielivalmis.com` is the primary public Finnish-learning domain.
- Floently remains the maker/product-family brand.
- Floently Read and Floently Create remain correctly branded.
- Android upgrades the existing app rather than installing a second app.
- iOS upgrades the existing app rather than installing a second app.
- Existing accounts remain accessible.
- Existing paid entitlements/subscriptions restore correctly.
- YKI, roleplay, cards, reports, streaks, and progress work at least as well as before the rebrand.
- privacy, terms, support, and account-deletion URLs are public and reliable.
- old public learning URLs permanently redirect to their correct KieliValmis equivalents.
- Search Console sees and indexes the new KieliValmis URLs.
- store screenshots, feature graphic, listing name, installed app name, splash, and primary in-app branding agree with each other.
- the old technical identifiers remain intentionally Floently where preserving them protects compatibility.
- this master plan and the execution tracker are current enough for a new executor to take over without guessing.

---

## 24. Official platform references used for this plan

Platform behavior should be rechecked before each irreversible release step because store/search rules can change.

Reference topics:

- Google Play: app creation/store listing and app-name limits
- Google Play: preview assets and store-listing graphics
- Apple App Store Connect: app information/name editability
- Apple App Store Connect: screenshot upload/specifications
- Google Search Central: site moves with URL changes, canonicals, sitemaps, permanent redirects, Search Console
- PRH: difference between trademarks and company names; risk of confusion; pre-filing searches

Do not treat this document as legal advice or trademark clearance.
