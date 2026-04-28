import asyncio

from app.adapters.yki_engine_adapter import EngineResponse
from app.core.state_store import STORE
from app.services import yki_service


def _clear_session(session_id: str) -> None:
    with STORE.locked(("yki_sessions", session_id)):
        STORE.delete("yki_sessions", session_id)


def test_start_yki_session_stores_sanitized_runtime(monkeypatch):
    async def fake_engine_request(*, method, path, payload=None):
        assert method == "POST"
        assert path == "/exam/start"
        assert payload == {"exam_id": "demo"}
        return EngineResponse(
            status_code=200,
            payload={
                "session_id": "session-1",
                "engine_session_token": "secret-token",
                "runtime_schema_version": "2026-04-19",
                "section": "reading",
                "debug": {"drop": True},
            },
        )

    monkeypatch.setattr(yki_service, "require_feature", lambda *, user, feature: None)
    monkeypatch.setattr(yki_service, "engine_request", fake_engine_request)

    _clear_session("session-1")
    result = asyncio.run(
        yki_service.start_yki_session(
            user={"user_id": "alice", "subscription_tier": "professional_premium"},
            payload={"exam_id": "demo"},
        )
    )

    assert result == {
        "runtime": {
            "session_id": "session-1",
            "runtime_schema_version": "2026-04-19",
            "section": "reading",
        }
    }

    with STORE.locked(("yki_sessions", "session-1")):
        stored = STORE.get_ref("yki_sessions", "session-1")
        assert stored["user_id"] == "alice"
        assert stored["engine_session_token"] == "secret-token"
        assert stored["runtime_schema_version"] == "2026-04-19"
        STORE.delete("yki_sessions", "session-1")


def test_submit_yki_exam_uses_stored_engine_token(monkeypatch):
    captured = {}

    async def fake_engine_request(*, method, path, payload=None):
        captured["method"] = method
        captured["path"] = path
        captured["payload"] = payload
        return EngineResponse(
            status_code=200,
            payload={"status": "submitted"},
        )

    monkeypatch.setattr(yki_service, "engine_request", fake_engine_request)

    with STORE.locked(("yki_sessions", "session-2")):
        STORE.set(
            "yki_sessions",
            "session-2",
            {
                "user_id": "alice",
                "engine_session_token": "stored-token",
                "runtime_schema_version": "2026-04-19",
                "updated_at": "2026-04-19T00:00:00Z",
            },
        )

    result = asyncio.run(
        yki_service.submit_yki_exam(
            user_id="alice",
            session_id="session-2",
            confirm_incomplete=True,
        )
    )

    assert result == {"status": "submitted"}
    assert captured == {
        "method": "POST",
        "path": "/exam/session-2/submit",
        "payload": {
            "confirm_incomplete": True,
            "session_token": "stored-token",
        },
    }

    _clear_session("session-2")
