# iOS Rejection Phase 1 Evidence — RevenueCat `default` Offering

**Evidence date:** 2026-08-21  
**Rejection remediated:** Apple App Review rejection received 2026-08-17, version 1.0 build 34  
**Repository:** `Floently/floently-finnish`  
**Purpose:** durable evidence for the RevenueCat offering/package/product portion of the iOS resubmission catalog reconciliation.

## Evidence received

RevenueCat dashboard path:

`Floently` → Product catalog → Offerings → `default`

The screenshot proves:

- Offering identifier: `default`
- Display name: `Default`
- Nine core package cards are present
- Every package contains one Apple/iOS product and the corresponding Android product

## RevenueCat package → Apple Product ID matrix

| RevenueCat package | RevenueCat Apple product | Apple Product ID shown in RevenueCat | Matching App Store Connect product | Result |
|---|---|---|---|---|
| `combo_yearly` | Floently Combined Yearly | `floently_combo_yearly` | `floently_combo_yearly` | PASS |
| `combo_3months` | Floently Combined 3 Months | `floently_combo_3months` | `floently_combo_3months` | PASS |
| `combo_monthly` | Floently Combined Monthly | `floently_combo_monthly` | `floently_combo_monthly` | PASS |
| `prof_yearly` | Floently Professional Yearly | `floently_prof_yearly` | `floently_prof_yearly` | PASS |
| `prof_3months` | Floently Professional 3 Months | `floently_prof_3months` | `floently_prof_3months` | PASS |
| `prof_monthly` | Floently Professional Monthly | `floently_prof_monthly` | `floently_prof_monthly` | PASS |
| `yki_yearly` | Floently YKI Yearly | `floently_yki_yearly` | `floently_yki_yearly` | PASS |
| `yki_3months` | Floently YKI 3 Months | `floently_yki_3months` | `floently_yki_3months` | PASS |
| `yki_monthly` | Floently YKI Monthly | `floently_yki_monthly` | `floently_yki_monthly` | PASS |

## Comparison with App Store Connect evidence

Prior App Store Connect evidence from the `Kielivalmis Premium` subscription group proved these exact nine Apple Product IDs exist and are currently `In Review`.

The RevenueCat offering screenshot therefore proves that all nine KieliValmis core packages point to the corresponding Apple products that exist in the Apple subscription group.

## Comparison with current remediation source

Current repair source in `apps/client/features/billing/services/storeBillingService.ts` maps application plan IDs to the same RevenueCat package identifiers:

```text
yki_monthly                 -> yki_monthly
yki_3_months / yki_3months  -> yki_3months
yki_yearly                  -> yki_yearly

professional_monthly        -> prof_monthly
professional_3_months       -> prof_3months
professional_yearly         -> prof_yearly

combined_monthly            -> combo_monthly
combined_3_months           -> combo_3months
combined_yearly             -> combo_yearly
```

Therefore the complete source → RevenueCat package → Apple Product ID path for all nine core KieliValmis subscription plans is reconciled.

## Definition-of-done decisions supported by this evidence

- [x] RevenueCat core product mappings confirmed.
- [x] KieliValmis `default` offering/package contract confirmed for the nine core plans.
- [x] Every visible core KieliValmis package maps to the intended Apple Product ID.
- [x] Source package aliases for the nine core KieliValmis plans match the RevenueCat dashboard package identifiers.

## Items this screenshot does NOT prove

- [ ] RevenueCat entitlement membership for each product (`yki_access`, `professional_access`, `combined_access`).
- [ ] Individual App Store Connect subscription pricing/localization/territory availability metadata.
- [ ] Physical iOS/TestFlight StoreKit product fetch.
- [ ] Native Apple purchase-sheet opening.
- [ ] Purchase completion and RevenueCat entitlement activation.
- [ ] Restore Purchases behavior.

## Gate result

```text
REVENUECAT_DEFAULT_OFFERING=PASS
REVENUECAT_PACKAGE_PRODUCT_MATRIX=PASS
SOURCE_REVENUECAT_PACKAGE_ALIGNMENT=PASS
EVERY_CORE_PACKAGE_APPLE_PRODUCT_MAPPING=PASS
REVENUECAT_ENTITLEMENT_MEMBERSHIP=PENDING
APPLE_CORE_PRODUCT_PRICING=PENDING
PHYSICAL_STOREKIT_FETCH=PENDING
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PARTIAL
```

Phase 1 remains PARTIAL until entitlement membership and the remaining Apple product metadata/runtime StoreKit checks are proven.