# M18-R7 Read Entitlement Gate

This patch separates Floently Read access from Floently Learn access in the native mobile app.

## Product rule

Floently Read is a separate product from Floently Learn/Floently Finnish. A Learn, YKI, Professional, or Combined subscription must not automatically unlock Read unless a backend bundle explicitly returns Read access later.

## Access rules

Read access is granted by one of these signals:

- `internal_all_access`
- explicit backend fields such as `readAccess`, `read_access`, `readerAccess`, or `reader_access`
- Read/Reader tiers such as `read_monthly`, `reader_monthly`, `read_premium`, or future `floently_read_*` tiers
- configured test emails through `EXPO_PUBLIC_READ_ACCESS_TEST_EMAILS`
- temporary built-in test access for `vitus.idi@floently.com` and `testuser@floently.com`

Create access remains internal/explicit only because Create is still a coming-soon product in the app.

## Safety

Read-only access does not unlock Learn screens. Learn-only access does not unlock Read screens. The drawer now separates suite visibility by product entitlement instead of treating any active subscription as access to every product.

## Payment status

This patch does not create Read mobile products or RevenueCat packages. It prepares the access gate so mobile Read products can be added later without mixing Read and Learn subscription logic.
