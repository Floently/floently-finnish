# iOS App Review Remediation — Phase 1 Apple Subscription Evidence

**Rejection being remediated:** Apple App Review rejection received 2026-08-17  
**Rejected build:** 34  
**App Store Connect app:** KieliValmis / Apple ID `6767821805`  
**Evidence received:** 2026-08-21  
**Related master runbook:** `docs/release/IOS_APP_STORE_REJECTION_2026-08-17_RESUBMISSION_RUNBOOK.md`  
**Related live ledger:** `docs/release/IOS_APP_STORE_REJECTION_2026-08-17_REMEDIATION_STATUS.md`

## Definition-of-done rule

Only items supported directly by the supplied App Store Connect evidence are marked `[x]`. Product price/localization completeness, RevenueCat package mapping, entitlement membership, and physical StoreKit fetch/purchase behavior remain open until separately verified.

## Apple subscription groups

- [x] **Auto-renewable subscription groups exist in App Store Connect.**  
  **Definition of done:** App Store Connect → Subscriptions shows the groups and subscription counts.  
  **Evidence:** `Floently Read` contains 4 subscriptions; `Kielivalmis Premium` contains 9 subscriptions.

- [x] **The KieliValmis core subscription group is identified.**  
  **Definition of done:** group reference name and group ID are visible in Apple.  
  **Evidence:** group `Kielivalmis Premium`; Subscription Group ID `22077944`.

- [x] **The KieliValmis core group review state is identified.**  
  **Definition of done:** Apple displays the group review state.  
  **Evidence:** `Kielivalmis Premium` is shown as `In Review`.

- [x] **The KieliValmis core group localization exists.**  
  **Definition of done:** group localization is visible.  
  **Evidence:** English (U.S.); subscription group display name `Kielivalmis Premium`; app name `Kielivalmis`.

## KieliValmis Premium — nine Apple Product IDs

The Apple group detail proves all nine core KieliValmis subscriptions expected by the current RevenueCat/source model exist under the same Apple subscription group.

| Level | Reference name | Apple Product ID | Duration | Apple status |
|---:|---|---|---|---|
| 1 | Floently Combined 3 Months | `floently_combo_3months` | 3 months | In Review |
| 1 | Floently Combined Monthly | `floently_combo_monthly` | 1 month | In Review |
| 1 | Floently Combined Yearly | `floently_combo_yearly` | 1 year | In Review |
| 2 | Floently Professional 3 Months | `floently_prof_3months` | 3 months | In Review |
| 2 | Floently Professional Monthly | `floently_prof_monthly` | 1 month | In Review |
| 2 | Floently Professional Yearly | `floently_prof_yearly` | 1 year | In Review |
| 2 | Floently YKI 3 Months | `floently_yki_3months` | 3 months | In Review |
| 2 | Floently YKI Monthly | `floently_yki_monthly` | 1 month | In Review |
| 2 | Floently YKI Yearly | `floently_yki_yearly` | 1 year | In Review |

- [x] **All nine core Apple Product IDs are confirmed.**  
  **Definition of done:** all nine core subscription rows and exact Apple Product IDs are visible in App Store Connect.  
  **Evidence:** table above.

- [x] **All nine core subscription durations are confirmed.**  
  **Definition of done:** Apple displays a duration for every core product.  
  **Evidence:** monthly, 3-month and yearly durations shown for YKI, Professional and Combined products.

- [x] **All nine core subscription Apple statuses are confirmed.**  
  **Definition of done:** current Apple status is visible for every core product.  
  **Evidence:** all nine rows show `In Review`.

## Still open before Phase 1 can be declared complete

- [ ] **Individual product pricing is verified in App Store Connect.**  
  The group list does not show each product's price schedule/territories.

- [ ] **Individual product localization/metadata completeness is verified.**  
  The group-level English localization is proven, but each individual subscription detail still needs review for localization/reference/review metadata where applicable.

- [ ] **RevenueCat `default` offering package → Apple Product ID mapping is proven for all nine packages.**

- [ ] **RevenueCat entitlement product membership is proven for `yki_access`, `professional_access`, and `combined_access`.**

- [ ] **Physical TestFlight/StoreKit product fetch is proven.**

- [ ] **Native purchase sheet, successful purchase, entitlement synchronization, cancellation, and Restore Purchases are proven on the exact candidate.**

## Phase-1 state after this evidence

```text
APPLE_SUBSCRIPTION_GROUPS=PASS
APPLE_KIELIVALMIS_GROUP_ID=PASS
APPLE_CORE_PRODUCT_IDS=PASS
APPLE_CORE_DURATIONS=PASS
APPLE_CORE_REVIEW_STATUSES=PASS
APPLE_CORE_PRODUCT_PRICING=PENDING
APPLE_CORE_PRODUCT_METADATA_DETAIL=PENDING
REVENUECAT_PACKAGE_PRODUCT_MATRIX=PENDING
REVENUECAT_ENTITLEMENT_MEMBERSHIP=PENDING
PHYSICAL_STOREKIT_FETCH=PENDING
APPLE_REVENUECAT_CATALOG_RECONCILIATION=PARTIAL
```

The billing rejection must not be considered closed until the remaining RevenueCat mapping and physical StoreKit acceptance gates pass.