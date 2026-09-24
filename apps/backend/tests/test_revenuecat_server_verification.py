"""Contract tests for authoritative Apple subscriptions; no live API calls or keys."""
from __future__ import annotations

import json
from datetime import timedelta

import pytest

from app.core.utils import utc_now
from app.services.revenuecat_server_verification import (
    RevenueCatVerificationError,
    fetch_revenuecat_v1_subscriber,
    verify_apple_subscriber,
    verify_store_subscriber,
)


def when(days: int) -> str:
    return (utc_now() + timedelta(days=days)).replace(microsecond=0).isoformat()


def subscriber(
    *,
    product: str = "floently_yki_monthly",
    entitlement: str = "yki_access",
    period: str = "trial",
    expiry_days: int = 3,
    store: str = "app_store",
) -> dict:
    expiry = when(expiry_days)
    return {
        "subscriber": {
            "subscriptions": {
                product: {
                    "period_type": period,
                    "purchase_date": when(-1),
                    "expires_date": expiry,
                    "store": store,
                    "is_sandbox": True,
                    "refunded_at": None,
                    "unsubscribe_detected_at": None,
                    "billing_issues_detected_at": None,
                    "grace_period_expires_date": None,
                }
            },
            "entitlements": {
                entitlement: {"product_identifier": product, "expires_date": expiry}
            },
        }
    }


def verify(payload: dict, expected: str | None = "yki_monthly"):
    return verify_apple_subscriber(
        app_user_id="usr_authenticated_001", payload=payload, expected_plan_id=expected
    )


def test_three_day_apple_trial_is_not_reported_as_paid():
    value = verify(subscriber())
    assert value is not None
    assert value.status == "trialing"
    assert value.grants_access
    assert value.period_type == "trial"
    assert value.plan_id == "yki_monthly"
    assert value.entitlement_id == "yki_access"
    assert value.app_user_id == "usr_authenticated_001"


def test_normal_period_after_trial_converts_to_active():
    value = verify(subscriber(period="normal"))
    assert value is not None
    assert value.status == "active"
    assert value.grants_access


def test_expired_trial_does_not_grant_access():
    value = verify(subscriber(expiry_days=-1))
    assert value is not None
    assert value.status == "expired"
    assert not value.grants_access


def test_cancelled_but_unexpired_trial_remains_available():
    payload = subscriber()
    payload["subscriber"]["subscriptions"]["floently_yki_monthly"]["unsubscribe_detected_at"] = when(-1)
    value = verify(payload)
    assert value is not None
    assert value.status == "trialing"
    assert value.grants_access
    assert value.cancellation_detected_at


def test_refund_revokes_access_immediately():
    payload = subscriber()
    payload["subscriber"]["subscriptions"]["floently_yki_monthly"]["refunded_at"] = when(-1)
    value = verify(payload)
    assert value is not None
    assert value.status == "refunded"
    assert not value.grants_access


def test_expired_with_active_grace_returns_grace_period():
    payload = subscriber(expiry_days=-1)
    row = payload["subscriber"]["subscriptions"]["floently_yki_monthly"]
    row["grace_period_expires_date"] = when(1)
    payload["subscriber"]["entitlements"]["yki_access"]["expires_date"] = when(1)
    value = verify(payload)
    assert value is not None
    assert value.status == "grace_period"
    assert value.grants_access


@pytest.mark.parametrize(
    "product,entitlement,plan",
    [
        ("floently_prof_monthly", "professional_access", "professional_monthly"),
        ("floently_combo_3months", "combined_access", "combined_3_months"),
        ("floently_yki_yearly", "yki_access", "yki_yearly"),
    ],
)
def test_all_access_paths_are_mapped_to_verified_apple_products(product, entitlement, plan):
    value = verify(subscriber(product=product, entitlement=entitlement), expected=plan)
    assert value is not None
    assert value.plan_id == plan
    assert value.entitlement_id == entitlement


def test_old_expired_product_without_entitlement_cannot_block_new_plan():
    old = subscriber(product="floently_yki_monthly", expiry_days=-10)
    new = subscriber(product="floently_yki_yearly", expiry_days=40, period="normal")
    old["subscriber"]["subscriptions"].update(new["subscriber"]["subscriptions"])
    old["subscriber"]["entitlements"] = new["subscriber"]["entitlements"]
    current = verify(old, expected=None)
    assert current is not None
    assert current.plan_id == "yki_yearly"
    assert current.status == "active"
    assert current.grants_access


def test_expired_product_without_current_entitlement_is_not_active():
    old = subscriber(expiry_days=-10)
    old["subscriber"]["entitlements"] = {}
    value = verify(old)
    assert value is not None
    assert value.status == "expired"
    assert not value.grants_access


def test_grace_ends_at_verified_grace_expiration_not_old_invoice_date():
    value = verify(subscriber(expiry_days=-1))
    assert value is not None
    assert not value.grants_access
    payload = subscriber(expiry_days=-1)
    row = payload["subscriber"]["subscriptions"]["floently_yki_monthly"]
    row["grace_period_expires_date"] = when(2)
    payload["subscriber"]["entitlements"]["yki_access"]["expires_date"] = when(3)
    grace = verify(payload)
    assert grace is not None
    assert grace.grants_access
    assert grace.status == "grace_period"
    assert grace.expires_at == when(2)



@pytest.mark.parametrize(
    "product,entitlement,plan",
    [
        ("floently_yki:monthly", "yki_access", "yki_monthly"),
        ("floently_yki:three-months", "yki_access", "yki_3_months"),
        ("floently_yki:yearly", "yki_access", "yki_yearly"),
        ("floently_prof:monthly", "professional_access", "professional_monthly"),
        ("floently_prof:three-months", "professional_access", "professional_3_months"),
        ("floently_prof:annual", "professional_access", "professional_yearly"),
        ("floently_combo:monthly", "combined_access", "combined_monthly"),
        ("floently_combo:three-months", "combined_access", "combined_3_months"),
        ("floently_combo:yearly", "combined_access", "combined_yearly"),
    ],
)
def test_android_exact_revenuecat_product_and_entitlement_mapping(product, entitlement, plan):
    value = verify_store_subscriber(
        app_user_id="usr_authenticated_001",
        payload=subscriber(product=product, entitlement=entitlement, store="play_store"),
        platform="android",
        expected_plan_id=plan,
    )
    assert value is not None
    assert value.product_id == product
    assert value.entitlement_id == entitlement
    assert value.grants_access


def test_apple_product_never_verified_as_android_and_vice_versa():
    with pytest.raises(RevenueCatVerificationError, match="Expected subscription"):
        verify_store_subscriber(
            app_user_id="usr_authenticated_001",
            payload=subscriber(product="floently_yki_monthly", store="app_store"),
            platform="android",
            expected_plan_id="yki_monthly",
        )



def test_wrong_entitlement_never_authorizes_access():
    with pytest.raises(RevenueCatVerificationError, match="missing its mapped entitlement"):
        verify(subscriber(entitlement="professional_access"))


def test_wrong_product_never_authorizes_access():
    payload = subscriber()
    payload["subscriber"]["entitlements"]["yki_access"]["product_identifier"] = "floently_combo_monthly"
    with pytest.raises(RevenueCatVerificationError, match="mismatch"):
        verify(payload)


def test_wrong_store_never_authorizes_access():
    with pytest.raises(RevenueCatVerificationError, match="unexpected store"):
        verify(subscriber(store="play_store"))


def test_missing_expiry_never_authorizes_access():
    payload = subscriber()
    payload["subscriber"]["subscriptions"]["floently_yki_monthly"]["expires_date"] = None
    with pytest.raises(RevenueCatVerificationError, match="expiration"):
        verify(payload)


def test_wrong_expected_plan_rejected():
    with pytest.raises(RevenueCatVerificationError, match="Expected subscription"):
        verify(subscriber(), expected="combined_yearly")


def test_nonexistent_user_id_rejected():
    with pytest.raises(RevenueCatVerificationError, match="identity"):
        verify_apple_subscriber(app_user_id="", payload=subscriber())


def test_unrecognized_product_is_not_an_access_grant():
    payload = subscriber(product="unknown_product")
    assert verify(payload, expected=None) is None


def test_fetch_uses_authenticated_user_not_email_or_client_payload():
    observed = {}

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            return False

        def read(self):
            return json.dumps(subscriber()).encode()

    def opener(request, *, timeout):
        observed["url"] = request.full_url
        observed["authorization"] = request.get_header("Authorization")
        observed["timeout"] = timeout
        return Response()

    result = fetch_revenuecat_v1_subscriber(
        app_user_id="usr_auth/a+b",
        secret_api_key="server_secret_only",
        opener=opener,
    )
    assert isinstance(result.get("subscriber"), dict)
    assert observed["url"].endswith("/subscribers/usr_auth%2Fa%2Bb")
    assert observed["authorization"] == "Bearer server_secret_only"
    assert observed["timeout"] == 6.0


def test_missing_server_secret_fails_closed():
    with pytest.raises(RevenueCatVerificationError, match="server API key"):
        fetch_revenuecat_v1_subscriber(app_user_id="usr_a", secret_api_key="")
