"""Store sync authority tests: no actual RevenueCat calls, database or secrets."""
from __future__ import annotations

from datetime import timedelta

import pytest

from app.core.errors import AppError
from app.core.utils import utc_now
from app.services import subscription_service as billing


def when(days: int) -> str:
    return (utc_now() + timedelta(days=days)).replace(microsecond=0).isoformat()


def customer(
    *,
    product: str = "floently_yki_monthly",
    entitlement: str = "yki_access",
    period: str = "trial",
    days: int = 2,
    store: str = "app_store",
) -> dict:
    exp = when(days)
    return {
        "subscriber": {
            "subscriptions": {
                product: {
                    "store": store,
                    "period_type": period,
                    "purchase_date": when(-1),
                    "expires_date": exp,
                    "is_sandbox": True,
                    "unsubscribe_detected_at": None,
                    "billing_issues_detected_at": None,
                    "refunded_at": None,
                    "grace_period_expires_date": None,
                }
            },
            "entitlements": {entitlement: {"product_identifier": product, "expires_date": exp}},
        }
    }


@pytest.fixture
def harness(monkeypatch):
    current = {
        "user_id": "logged-in-01",
        "email": "customer@example.com",
        "subscription_tier": "free",
        "subscription_status": "free",
        "subscription_provider": "manual",
        "selected_professions": [],
        "access_choice": "free",
    }
    captured = {"calls": 0, "secret": None, "user": None, "updates": [], "logs": []}
    state = {"subscriber": customer()}

    monkeypatch.setattr(billing.SETTINGS, "revenuecat_secret_api_key", "server-only-key")
    monkeypatch.setattr(billing, "_fresh_user_record", lambda user: user)

    def fetch(*, app_user_id, secret_api_key):
        captured["calls"] += 1
        captured["user"] = app_user_id
        captured["secret"] = secret_api_key
        return state["subscriber"]

    def update_details(*, user, details, **kwargs):
        captured["updates"].append((details, kwargs))
        return {**user, **kwargs, "subscription_tier": details["plan_id"], "subscription_provider": kwargs["subscription_provider"], "selected_professions": details["professions"], "subscription_status": kwargs["subscription_status"]}

    def update_user(user_id, **kwargs):
        captured["updates"].append(({}, kwargs))
        return {**current, **kwargs}, True

    monkeypatch.setattr(billing, "fetch_revenuecat_v1_subscriber", fetch)
    monkeypatch.setattr(billing, "_update_user_subscription_from_details", update_details)
    monkeypatch.setattr(billing.auth_repository.AUTH_USERS, "update_user", update_user)
    monkeypatch.setattr(billing.STORE, "write_snapshot", lambda: None)
    monkeypatch.setattr(billing, "_log_subscription_event", lambda kind, **kwargs: captured["logs"].append(kind))
    monkeypatch.setattr(billing, "subscription_status", lambda *, user: dict(user))
    return current, state, captured


def test_forged_client_entitlements_cannot_grant_an_unpurchased_plan(harness):
    user, state, seen = harness
    state["subscriber"] = {"subscriber": {"subscriptions": {}, "entitlements": {}}}
    forged = {
        "platform": "ios",
        "active_entitlements": ["combined_access", "yki_access"],
        "customerInfo": {"appUserID": "attacker", "entitlements": {"active": {"combined_access": {}}}},
        "trial_days": 365,
    }
    with pytest.raises(AppError) as exc:
        billing.apply_store_subscription_sync(user=user, payload=forged)
    assert exc.value.code == "NO_ACTIVE_STORE_ENTITLEMENT"
    assert seen["updates"] == []
    assert seen["user"] == "logged-in-01"


def test_client_cannot_switch_to_somebody_elses_revenuecat_customer(harness):
    user, _, seen = harness
    result = billing.apply_store_subscription_sync(user=user, payload={
        "platform": "ios",
        "app_user_id": "another-person",
        "customerInfo": {"appUserID": "another-person"},
        "active_entitlements": ["combined_access"],
    })
    assert seen["user"] == user["user_id"]
    assert seen["secret"] == "server-only-key"
    assert result["active_entitlements"] == ["yki_access"]
    assert result["plan_id"] == "yki_monthly"


def test_real_apple_trial_is_store_trial_with_authoritative_dates(harness):
    user, state, seen = harness
    state["subscriber"] = customer(period="trial")
    result = billing.apply_store_subscription_sync(user=user, payload={
        "platform": "ios", "plan": "yki_monthly",
        "active_entitlements": ["combined_access"], "trial_days": 999,
    })
    details, args = seen["updates"][0]
    assert result["period_type"] == "trial"
    assert args["subscription_status"] == "trialing"
    assert args["access_choice"] == "trial"
    assert args["subscription_expires_at"] == when(2)
    assert args["trial_ends_at"] == when(2)
    assert details["plan_id"] == "yki_monthly"
    assert result["active_entitlements"] == ["yki_access"]


@pytest.mark.parametrize(
    "product, entitlement, plan, store, platform",
    [
        ("floently_yki_monthly", "yki_access", "yki_monthly", "app_store", "ios"),
        ("floently_prof_yearly", "professional_access", "professional_yearly", "app_store", "ios"),
        ("floently_combo_3months", "combined_access", "combined_3_months", "app_store", "ios"),
        ("floently_combo:three-months", "combined_access", "combined_3_months", "play_store", "android"),
    ],
)
def test_only_verified_product_sets_real_pathway(harness, product, entitlement, plan, store, platform):
    user, state, seen = harness
    state["subscriber"] = customer(product=product, entitlement=entitlement, period="normal", store=store)
    payload = {
        "platform": platform, "selected_professions": ["doctor", "nurse", "practical_nurse"],
        "active_entitlements": ["combined_access", "professional_access", "yki_access"],
    }
    result = billing.apply_store_subscription_sync(user=user, payload=payload)
    details, args = seen["updates"][0]
    assert result["plan_id"] == plan
    assert details["plan_id"] == plan
    assert details["profession_count"] <= 1
    assert args["subscription_status"] == "active"
    assert args["access_choice"] == "paid"
    assert result["active_entitlements"] == [entitlement]


def test_real_cancellation_does_not_revoke_until_verified_expiration(harness):
    user, state, seen = harness
    state["subscriber"] = customer()
    state["subscriber"]["subscriber"]["subscriptions"]["floently_yki_monthly"]["unsubscribe_detected_at"] = when(-1)
    result = billing.apply_store_subscription_sync(user=user, payload={"platform": "ios"})
    assert result["subscription"]["cancel_at_period_end"] is True
    assert result["subscription"]["subscription_status"] == "trialing"


def test_expired_store_purchase_reconciles_to_free(harness):
    user, state, seen = harness
    user["subscription_provider"] = "apple"
    user["subscription_tier"] = "yki_monthly"
    state["subscriber"] = customer(days=-1)
    result = billing.apply_store_subscription_sync(user=user, payload={"platform": "ios"})
    assert result["active_entitlements"] == []
    assert result["subscription"]["subscription_tier"] == "free"
    assert result["subscription"]["subscription_status"] == "expired"


def test_no_server_secret_fails_closed_without_external_fetch(harness, monkeypatch):
    user, _, seen = harness
    monkeypatch.setattr(billing.SETTINGS, "revenuecat_secret_api_key", None)
    with pytest.raises(AppError) as exc:
        billing.apply_store_subscription_sync(user=user, payload={
            "platform": "ios", "active_entitlements": ["combined_access"],
        })
    assert exc.value.code == "STORE_VERIFICATION_UNAVAILABLE"
    assert seen["calls"] == 0


def test_wrong_requested_product_cannot_grant_existing_other_plan(harness):
    user, _, seen = harness
    with pytest.raises(AppError) as exc:
        billing.apply_store_subscription_sync(user=user, payload={
            "platform": "ios", "plan": "combined_yearly", "active_entitlements": ["combined_access"],
        })
    assert exc.value.code == "STORE_VERIFICATION_UNAVAILABLE"
    assert seen["updates"] == []


def test_store_api_failure_must_not_replace_existing_entitlements(harness, monkeypatch):
    user, _, seen = harness
    from app.services.revenuecat_server_verification import RevenueCatVerificationError
    def broken(**kwargs):
        raise RevenueCatVerificationError("private failure")
    monkeypatch.setattr(billing, "fetch_revenuecat_v1_subscriber", broken)
    with pytest.raises(AppError) as exc:
        billing.apply_store_subscription_sync(user=user, payload={"platform": "ios"})
    assert exc.value.code == "STORE_VERIFICATION_UNAVAILABLE"
    assert seen["updates"] == []
