# Floently Product Entitlements Contract

## Core principle

Floently Learn and Floently Read are separate paid products.

A user may see both products in the same Floently brand/app experience, but access must be granted separately unless a future explicit all-products bundle is created.

## Existing Learn entitlements

Learn currently uses these entitlement concepts:

- yki_access
- professional_access
- combined_access
- internal all-access test state
- preview access state

Learn products:
- floently_yki
- floently_prof
- floently_combo

These must continue to unlock only Learn-side functionality.

## Read entitlement

Read must later use its own entitlement:

- read_access

Read products should be separate from Learn products.

Proposed Read products:
- floently_read monthly
- floently_read three-months
- floently_read yearly

## Important separation rules

combined_access does not unlock Read.

yki_access does not unlock Read.

professional_access does not unlock Read.

read_access does not unlock Learn.

A future all-product bundle may exist, but it must be explicit, for example:

- all_products_access

Do not silently treat combined_access as all-products access.

## Mobile behavior

Public unauthenticated user:
- may see Learn card
- may see Read card
- Read may show preview / coming soon until Read mobile access is implemented

Authenticated Learn user:
- must not lose existing Learn flow
- must not be forced into Read
- must not have Learn payment behavior changed

Authenticated Read user in future:
- should enter Read only if read_access or all_products_access exists
- otherwise should see a Read paywall, not the Learn paywall

## Backend rule

Learn backend remains the authority for Learn subscriptions and Learn access.

Read should have its own backend/service access model or a clearly separated access namespace before production activation.

## RevenueCat rule

Use separate RevenueCat products and entitlements for Read.

Do not reuse Learn package IDs for Read.
