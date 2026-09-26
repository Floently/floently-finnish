from __future__ import annotations

from contextlib import contextmanager

import pytest

from app.core.errors import AppError
import app.services.revenuecat_webhook_service as webhook


class _FakeUsers:
    def __init__(self, users):
        self.users = users

    def get_user_by_id(self, user_id):
        return self.users.get(user_id)


class _FakeStore:
    def __init__(self):
        self.events = {}
        self.write_count = 0

    @contextmanager
    def locked(self, _key):
        yield

    def get(self, namespace, key):
        assert namespace == "revenuecat_webhook_events"
        return self.events.get(key)

    def set(self, namespace, key, value):
        assert namespace == "revenuecat_webhook_events"
        self.events[key] = value

    def write_snapshot(self):
        self.write_count += 1


def _transfer_event(event_id="evt-transfer"):
    return {
        "event": {
            "id": event_id,
            "type": "TRANSFER",
            "store": "APP_STORE",
            "transferred_from": ["usr_source"],
            "transferred_to": ["usr_destination"],
        }
    }


def test_transfer_reconciles_source_and_destination(monkeypatch):
    users = {
        "usr_source": {"user_id": "usr_source"},
        "usr_destination": {"user_id": "usr_destination"},
    }
    fake_store = _FakeStore()
    calls = []

    monkeypatch.setattr(webhook.auth_repository, "AUTH_USERS", _FakeUsers(users))
    monkeypatch.setattr(webhook, "STORE", fake_store)
    monkeypatch.setattr(
        webhook,
        "apply_store_subscription_sync",
        lambda *, user, payload: calls.append((user["user_id"], payload["platform"])),
    )

    result = webhook.reconcile_revenuecat_webhook_event(_transfer_event())

    assert result == {"received": True, "reconciled": True}
    assert calls == [("usr_source", "ios"), ("usr_destination", "ios")]
    assert fake_store.events["evt-transfer"]["type"] == "TRANSFER"
    assert fake_store.events["evt-transfer"]["account_count"] == 2
    assert fake_store.write_count == 1


def test_transfer_deduplicates_ids(monkeypatch):
    user = {"user_id": "usr_same"}
    event = _transfer_event()
    event["event"]["transferred_from"] = ["usr_same", "usr_same"]
    event["event"]["transferred_to"] = ["usr_same"]
    fake_store = _FakeStore()
    calls = []

    monkeypatch.setattr(webhook.auth_repository, "AUTH_USERS", _FakeUsers({"usr_same": user}))
    monkeypatch.setattr(webhook, "STORE", fake_store)
    monkeypatch.setattr(
        webhook,
        "apply_store_subscription_sync",
        lambda *, user, payload: calls.append(user["user_id"]),
    )

    result = webhook.reconcile_revenuecat_webhook_event(event)

    assert result["reconciled"] is True
    assert calls == ["usr_same"]
    assert fake_store.events["evt-transfer"]["account_count"] == 1


def test_transfer_with_no_local_accounts_is_benign(monkeypatch):
    fake_store = _FakeStore()
    calls = []

    monkeypatch.setattr(webhook.auth_repository, "AUTH_USERS", _FakeUsers({}))
    monkeypatch.setattr(webhook, "STORE", fake_store)
    monkeypatch.setattr(
        webhook,
        "apply_store_subscription_sync",
        lambda **kwargs: calls.append(kwargs),
    )

    result = webhook.reconcile_revenuecat_webhook_event(_transfer_event())

    assert result == {"received": True, "reconciled": False}
    assert calls == []
    assert fake_store.events == {}
    assert fake_store.write_count == 0


def test_retryable_transfer_failure_is_not_acknowledged(monkeypatch):
    fake_store = _FakeStore()

    monkeypatch.setattr(
        webhook.auth_repository,
        "AUTH_USERS",
        _FakeUsers({"usr_source": {"user_id": "usr_source"}}),
    )
    monkeypatch.setattr(webhook, "STORE", fake_store)

    def fail(*, user, payload):
        raise AppError(
            503,
            "STORE_VERIFICATION_UNAVAILABLE",
            "retry",
            True,
            {"classification": "retryable"},
        )

    monkeypatch.setattr(webhook, "apply_store_subscription_sync", fail)

    with pytest.raises(AppError) as exc:
        webhook.reconcile_revenuecat_webhook_event(_transfer_event())

    assert exc.value.code == "STORE_VERIFICATION_UNAVAILABLE"
    assert exc.value.retryable is True
    assert fake_store.events == {}
    assert fake_store.write_count == 0


def test_duplicate_transfer_is_idempotent(monkeypatch):
    fake_store = _FakeStore()
    fake_store.events["evt-transfer"] = {"processed_at": "earlier"}
    calls = []

    monkeypatch.setattr(
        webhook.auth_repository,
        "AUTH_USERS",
        _FakeUsers(
            {
                "usr_source": {"user_id": "usr_source"},
                "usr_destination": {"user_id": "usr_destination"},
            }
        ),
    )
    monkeypatch.setattr(webhook, "STORE", fake_store)
    monkeypatch.setattr(
        webhook,
        "apply_store_subscription_sync",
        lambda **kwargs: calls.append(kwargs),
    )

    result = webhook.reconcile_revenuecat_webhook_event(_transfer_event())

    assert result == {"received": True, "reconciled": True, "duplicate": True}
    assert calls == []
    assert fake_store.write_count == 0


def test_non_transfer_identity_conflict_still_fails_closed(monkeypatch):
    fake_store = _FakeStore()
    users = {
        "usr_a": {"user_id": "usr_a"},
        "usr_b": {"user_id": "usr_b"},
    }

    monkeypatch.setattr(webhook.auth_repository, "AUTH_USERS", _FakeUsers(users))
    monkeypatch.setattr(webhook, "STORE", fake_store)

    payload = {
        "event": {
            "id": "evt-renewal",
            "type": "RENEWAL",
            "store": "APP_STORE",
            "app_user_id": "usr_a",
            "original_app_user_id": "usr_a",
            "aliases": ["usr_a", "usr_b"],
        }
    }

    with pytest.raises(AppError) as exc:
        webhook.reconcile_revenuecat_webhook_event(payload)

    assert exc.value.code == "REVENUECAT_IDENTITY_CONFLICT"
    assert fake_store.events == {}


def test_transfer_without_store_uses_existing_apple_provider(monkeypatch):
    event = _transfer_event("evt-no-store-source")
    event["event"].pop("store")
    source = {
        "user_id": "usr_source",
        "subscription_provider": "apple",
    }
    fake_store = _FakeStore()
    calls = []

    monkeypatch.setattr(
        webhook.auth_repository,
        "AUTH_USERS",
        _FakeUsers({"usr_source": source}),
    )
    monkeypatch.setattr(webhook, "STORE", fake_store)
    monkeypatch.setattr(
        webhook,
        "apply_store_subscription_sync",
        lambda *, user, payload: calls.append(
            (user["user_id"], payload["platform"])
        ),
    )

    result = webhook.reconcile_revenuecat_webhook_event(event)

    assert result == {"received": True, "reconciled": True}
    assert calls == [("usr_source", "ios")]


def test_transfer_without_store_can_fallback_to_android_for_new_destination(monkeypatch):
    event = _transfer_event("evt-no-store-destination")
    event["event"].pop("store")
    event["event"]["transferred_from"] = []
    destination = {"user_id": "usr_destination"}
    fake_store = _FakeStore()
    calls = []

    monkeypatch.setattr(
        webhook.auth_repository,
        "AUTH_USERS",
        _FakeUsers({"usr_destination": destination}),
    )
    monkeypatch.setattr(webhook, "STORE", fake_store)

    def sync(*, user, payload):
        calls.append((user["user_id"], payload["platform"]))
        if payload["platform"] == "ios":
            raise AppError(
                409,
                "NO_ACTIVE_STORE_ENTITLEMENT",
                "No active subscription was found for this store account.",
                True,
                {"classification": "retryable"},
            )

    monkeypatch.setattr(webhook, "apply_store_subscription_sync", sync)

    result = webhook.reconcile_revenuecat_webhook_event(event)

    assert result == {"received": True, "reconciled": True}
    assert calls == [
        ("usr_destination", "ios"),
        ("usr_destination", "android"),
    ]
