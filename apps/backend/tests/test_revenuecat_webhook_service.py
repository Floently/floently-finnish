"""Webhook reconciliation: server fetch only, alias safety, retry and dedup."""
from __future__ import annotations

import pytest

from app.core.errors import AppError
from app.core.state_store import InMemoryStateStore
from app.services import revenuecat_webhook_service as handler


def event(*, event_id="evt_01", event_type="RENEWAL", store="APP_STORE", aliases=None):
    return {
        "api_version": "1.0",
        "event": {
            "id": event_id,
            "type": event_type,
            "store": store,
            "app_user_id": "account_01",
            "original_app_user_id": None,
            "aliases": aliases if aliases is not None else [],
            "entitlement_ids": ["combined_access"],
            "product_id": "floently_combo_yearly",
        },
    }


@pytest.fixture
def harness(monkeypatch, tmp_path):
    state = {"users": {"account_01": {"user_id": "account_01", "email": "one@example.com"}}, "calls": [], "fail": False}
    monkeypatch.setattr(handler, "STORE", InMemoryStateStore(tmp_path / "webhook-state.json"))
    monkeypatch.setattr(handler.auth_repository.AUTH_USERS, "get_user_by_id", lambda uid: state["users"].get(uid))

    def reconcile(*, user, payload):
        state["calls"].append((user["user_id"], dict(payload)))
        if state["fail"]:
            raise AppError(503, "STORE_VERIFICATION_UNAVAILABLE", "retry", True)
        return {"synced": True}

    monkeypatch.setattr(handler, "apply_store_subscription_sync", reconcile)
    return state


def test_webhook_reconciles_known_user_without_trusting_event_entitlements(harness):
    result = handler.reconcile_revenuecat_webhook_event(event())
    assert result == {"received": True, "reconciled": True}
    assert harness["calls"] == [("account_01", {"platform": "ios"})]


def test_webhook_duplicate_is_idempotent(harness):
    handler.reconcile_revenuecat_webhook_event(event())
    result = handler.reconcile_revenuecat_webhook_event(event())
    assert result == {"received": True, "reconciled": True, "duplicate": True}
    assert len(harness["calls"]) == 1


def test_retryable_revenuecat_failure_does_not_acknowledge_or_mark_processed(harness):
    harness["fail"] = True
    with pytest.raises(AppError) as exc:
        handler.reconcile_revenuecat_webhook_event(event())
    assert exc.value.retryable is True
    harness["fail"] = False
    assert handler.reconcile_revenuecat_webhook_event(event())["reconciled"] is True
    assert len(harness["calls"]) == 2


def test_nonretryable_reconciliation_error_becomes_retryable(harness, monkeypatch):
    def terminal(**kwargs):
        raise AppError(409, "NO_ACTIVE_STORE_ENTITLEMENT", "no", False)
    monkeypatch.setattr(handler, "apply_store_subscription_sync", terminal)
    with pytest.raises(AppError) as exc:
        handler.reconcile_revenuecat_webhook_event(event())
    assert exc.value.status_code == 503
    assert exc.value.retryable is True


def test_unknown_user_not_created_and_no_entitlement_granted(harness):
    result = handler.reconcile_revenuecat_webhook_event(event(aliases=["unmapped-01"]))
    assert result["reconciled"] is True  # app_user_id is a known account
    result = handler.reconcile_revenuecat_webhook_event({
        **event(event_id="unknown_01"),
        "event": {**event(event_id="unknown_01")["event"], "app_user_id": "unknown", "aliases": []},
    })
    assert result == {"received": True, "reconciled": False}
    assert len(harness["calls"]) == 1


def test_matching_alias_may_resolve_anonymous_webhook_to_known_account(harness):
    payload = event(event_id="alias_01")
    payload["event"]["app_user_id"] = "$RCAnonymousID:opaque"
    payload["event"]["aliases"] = ["account_01"]
    assert handler.reconcile_revenuecat_webhook_event(payload)["reconciled"] is True
    assert harness["calls"] == [("account_01", {"platform": "ios"})]


def test_ambiguous_multiple_local_user_aliases_do_not_grant_access(harness):
    harness["users"]["account_02"] = {"user_id": "account_02", "email": "two@example.com"}
    with pytest.raises(AppError) as exc:
        handler.reconcile_revenuecat_webhook_event(event(aliases=["account_02"]))
    assert exc.value.code == "REVENUECAT_IDENTITY_CONFLICT"
    assert harness["calls"] == []


def test_non_store_webhook_ignored(harness):
    assert handler.reconcile_revenuecat_webhook_event(event(store="STRIPE")) == {
        "received": True, "reconciled": False
    }
    assert harness["calls"] == []


def test_dashboard_test_webhook_acknowledged_without_a_purchase(harness):
    assert handler.reconcile_revenuecat_webhook_event(event(event_type="TEST")) == {
        "received": True, "reconciled": False
    }
    assert harness["calls"] == []


def test_android_webhook_fetches_only_google_store(harness):
    assert handler.reconcile_revenuecat_webhook_event(event(store="PLAY_STORE"))["reconciled"]
    assert harness["calls"] == [("account_01", {"platform": "android"})]
