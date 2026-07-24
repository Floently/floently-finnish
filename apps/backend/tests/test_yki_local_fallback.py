import asyncio

from app.adapters.yki_engine_adapter import EngineResponse
from app.core.state_store import STORE
from app.services import yki_service


def test_start_yki_session_uses_local_fallback_when_engine_unavailable(monkeypatch):
    async def fake_engine_request(*, method, path, payload=None):
        return EngineResponse(status_code=503, payload={"detail": {"message": "engine down"}})

    monkeypatch.setattr(yki_service, "require_feature", lambda *, user, feature: None)
    monkeypatch.setattr(yki_service, "engine_request", fake_engine_request)

    result = asyncio.run(
        yki_service.start_yki_session(
            user={"user_id": "fallback-user", "subscription_tier": "internal_all_access"},
            payload={"level_band": "B1_B2"},
        )
    )

    runtime = result["runtime"]
    assert runtime["session_id"].startswith("local_yki_")
    assert runtime["level_band"] == "B1_B2"
    assert runtime["exam"]["reading"]
    assert runtime["exam"]["listening"]
    assert runtime["exam"]["writing"]
    assert runtime["exam"]["speaking"]
    assert "engine_session_token" not in runtime

    session_id = runtime["session_id"]
    fetched = asyncio.run(yki_service.get_yki_session(user_id="fallback-user", session_id=session_id))
    assert fetched["runtime"]["session_id"] == session_id

    submitted = asyncio.run(yki_service.submit_yki_exam(user_id="fallback-user", session_id=session_id, confirm_incomplete=True))
    assert submitted["status"] == "submitted"
    assert submitted["local_fallback"] is True

    with STORE.locked(("yki_sessions", session_id)):
        STORE.delete("yki_sessions", session_id)
