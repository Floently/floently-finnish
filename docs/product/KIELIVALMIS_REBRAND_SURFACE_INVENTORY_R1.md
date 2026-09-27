# KieliValmis Rebrand Surface Inventory — R1

**Date:** 2026-08-08  
**Branch:** `growth/discovery-seo-d2-20260807`  
**Status:** READ-ONLY INVENTORY / NO LIVE DEPLOYMENT

## Confirmed customer-facing brand surfaces

### Public/native marketing

`apps/client/features/publicMarketing/screens/NativePublicMarketingScreens.tsx`

Confirmed visible strings include:

- `Floently`
- `Floently · live correction`
- `Floently Product Gateway`
- `Choose Your Floently Product`
- `Floently Learn`
- `Floently Finnish`
- `Floently Home`
- `Floently Read`
- `Floently Create`

Semantic migration rule:

- Finnish-learning product references -> `KieliValmis` or `KieliValmis by Floently`
- Parent gateway/product-family references -> remain `Floently`
- `Floently Read` -> remain unchanged
- `Floently Create` -> remain unchanged

### Marketing translations

`apps/client/web/i18n/publicMarketingCopy.ts`

This file carries public marketing copy for 20 enabled languages and contains brand-sensitive common strings such as `floentlyHome` and `backToFloently`, plus Learn/YKI/workplace positioning copy.

Do not globally replace `Floently` in this file. Determine whether each reference means parent Floently or the Finnish-learning product.

### Native technical app configuration

`apps/client/app.json`

Current technical compatibility identifiers include:

- iOS bundle identifier: `com.vitusidi.floently`
- Android package: `com.vitusidi.floently`
- URL/deep-link scheme: `floently`
- EAS project ID remains existing Floently project

These are locked and must not be renamed during the customer-facing rebrand.

Customer-visible configuration that may change in the next controlled binary includes display name, splash/icon branding, and microphone usage wording.

### Dynamic Expo config

`apps/client/app.config.ts`

Currently wraps the existing app configuration and Google OAuth URL scheme handling. No rebrand change is required merely because internal config names still use Floently.

### Legal URLs

`apps/client/config/legalUrls.ts`

Current defaults:

- privacy: `https://floently.com/learn/privacy`
- terms: `https://floently.com/learn/terms`
- support: `https://floently.com/learn/support`
- deletion: `https://floently.com/learn/delete-account`

These old URLs must not simply be deleted during migration. First publish the KieliValmis equivalents, then either update the app-facing configuration in the next controlled release or keep the old URLs permanently redirecting to the correct KieliValmis pages.

Because Play publication previously caught 404 regressions on privacy and deletion pages, both old and new legal URLs need automated public HTTP regression checks.

## Store asset inventory

Repository code search did not identify a clearly named canonical source directory for the currently submitted App Store / Google Play screenshot set or feature graphic.

Before regenerating store graphics, locate the original asset/source package used for the current submissions. Do not invent a new screenshot set from stale UI.

Required rebrand asset outputs:

- Google Play feature graphic
- Android phone screenshots
- Apple iPhone screenshots for required supported display classes
- App icon/launcher branding if approved for the binary rebrand
- optional marketing/social share graphics

Target first-five screenshot narrative:

1. Prepare for YKI in your language
2. Guidance in 20 languages
3. Prepare for work in Finland
4. Practise real workplace conversations
5. Speaking, grammar and vocabulary for real life

Primary visible brand: `KieliValmis`
Secondary attribution during transition: `by Floently`

## R1 items still to inspect

- web route implementation for `/learn`, `/learn/privacy`, `/learn/terms`, `/learn/support`, `/learn/delete-account`
- SEO metadata and canonical generation
- sitemap generation
- login/signup/onboarding visible branding
- paywall/subscription visible branding
- YKI PDF branding
- roleplay report/export branding
- email templates
- About/settings support branding
- source files for current store screenshots and feature graphic
- production/server routing rules for floently.com and learn.floently.com

## Safety conclusion

There must be no repository-wide replacement of `Floently`.

The migration is semantic:

```text
KieliValmis = Finnish-learning product
Floently    = maker/product family + legacy technical lineage
```

This distinction is a regression lock.
