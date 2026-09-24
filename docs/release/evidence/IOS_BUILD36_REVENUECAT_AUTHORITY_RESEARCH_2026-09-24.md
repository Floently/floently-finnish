# Build 36 — RevenueCat V1 authority research and acceptance contract

Date: 2026-09-24. Scope: KieliValmis iOS billing only; no Read/Create routes, production mutation, app submission or Android billing replacement.

## Primary references

1. RevenueCat, [REST API V1](https://www.revenuecat.com/docs/api-v1), accessed 2026-09-24: server API base is `https://api.revenuecat.com/v1`, authenticate with `Authorization: Bearer <server secret>`, URL-encode subscriber ID. Secret key must not be in the mobile client or public source.
2. RevenueCat, [Customers](https://www.revenuecat.com/docs/api-v1/customers), accessed 2026-09-24: `GET /subscribers/{app_user_id}` returns current customer details **or creates an empty customer** if ID is new. An empty response is not proof of a purchase. Do not grant access from an empty response or from the client-supplied subscription payload.
3. RevenueCat, [Customer Info Model](https://www.revenuecat.com/docs/api-v1/customer-info-model), accessed 2026-09-24: `subscriber.subscriptions` is keyed by product ID; subscription entries include `store`, `purchase_date`, `expires_date`, `period_type`, `is_sandbox`, `unsubscribe_detected_at`, `billing_issues_detected_at`, `grace_period_expires_date` and `refunded_at`. `subscriber.entitlements` links entitlement IDs to current `product_identifier` and expiry.
4. RevenueCat, [Transactions](https://www.revenuecat.com/docs/api-v1/transactions), accessed 2026-09-24: RevenueCat V1 Google Play cancellation operation is **not** an Apple cancel API. Apple subscription cancellation/resumption must remain store-managed and authenticated state must be refreshed.
5. Existing protected repo policy: `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`: candidate must descend from independently proven deployed production source, preserve unrelated capabilities, pass protected regression suite and identify exact image/IPA.

## Verified user dashboard evidence

User screenshots on 2026-09-24: RevenueCat entitlements `yki_access`, `professional_access`, `combined_access` each contain their corresponding three Apple subscription product IDs plus corresponding Android products. User reports separate V1 backend secret generated and saved, **not installed**. Webhooks menu exists; no webhook configured. Fresh Apple YKI Monthly saved offer confirmation and real eligibility/StoreKit trial proof remain pending.

## Decisions and negative paths

- Derive the RevenueCat lookup ID only from authenticated backend `user_id`; mobile SDK must use exactly that stable ID when identifying. No email, client-selected app user ID or client-selected entitlement grants access.
- Only allow nine known iOS product IDs and exact entitlement mapping, with `store=app_store`. Never promote Android, promotional, unknown, refunded, stale or expired entries to active Apple access.
- Model `period_type=trial` as actual StoreKit trial, not a hard-coded three-day local trial. Detect billing issue, grace, cancellation at end, renewal, and expiration from authoritative dates. Renewal may change product; old expired product must not prevent validating new active product.
- If customer lookup fails or response shape is invalid, do not write a subscription state and return an actionable retryable error. If no matching purchase exists, do not grant access.
- A webhook is a trigger to fetch current subscriber state, **not** authority to grant access from its event body. First authenticate the request using a separate webhook secret, then reconcile through server API.
- No server-side secret installation/deploy until code, local tests, source lineage/reconciliation, rollback and canaries pass. No client-visible trial claim when introductory offer metadata/eligibility cannot confirm a genuine Apple trial.

## Acceptance gates

1. Unit + negative-path tests for all plan IDs; correct entitled active/trial/grace/cancelled/renewed and missing/wrong/refunded/expired cases.
2. Authenticated route tests prove forged client entitlements cannot grant access, and identity cannot be substituted.
3. Webhook auth and replay tests; verified server fetch and reconciliation.
4. Native iOS eligibility/price display, Apple sheet physical sandbox proof and RevenueCat customer-history correlation.
5. Full protected source tests, exact EAS artifact identity and separately approved forward-only production promotion.
