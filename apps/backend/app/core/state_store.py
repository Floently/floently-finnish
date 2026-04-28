from __future__ import annotations

import copy
import json
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator


StateBucket = str
StateKey = tuple[StateBucket, str]


def _resolve_state_path(override: Path | None = None) -> Path:
    """Return the path to state.json, honouring the STATE_STORE_PATH env var.

    Priority: explicit override > STATE_STORE_PATH env var > default runtime dir.
    Set STATE_STORE_PATH on Railway to a mounted-volume path (e.g. /data/state.json)
    so that state survives re-deploys.
    """
    if override is not None:
        return override
    import os
    env_path = os.environ.get("STATE_STORE_PATH", "").strip()
    if env_path:
        return Path(env_path)
    from app.core.paths import RUNTIME_DIR
    return RUNTIME_DIR / "state.json"


class InMemoryStateStore:
    def __init__(self, path: Path | None = None) -> None:
        self.path = _resolve_state_path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._data = self._load_initial_state()
        self._registry_lock = threading.RLock()
        self._locks: dict[StateBucket, dict[str, threading.RLock]] = {
            bucket: {} for bucket in self._data
        }

    def _default_state(self) -> dict[str, dict[str, Any]]:
        return {
            "users": {},
            "email_index": {},
            "provider_index": {},
            "auth_sessions": {},
            "access_tokens": {},
            "refresh_tokens": {},
            "password_reset_tokens": {},
            "password_reset_rate_limits": {},
            "register_rate_limits": {},
            "email_verification_tokens": {},
            "oauth_states": {},
            "oauth_results": {},
            "cards_sessions": {},
            "cards_issues": {},
            "user_content_history": {},
            "roleplay_sessions": {},
            "voice_refs": {},
            "yki_sessions": {},
        }

    def _load_initial_state(self) -> dict[str, dict[str, Any]]:
        if not self.path.exists():
            return self._default_state()
        try:
            payload = json.loads(self.path.read_text(encoding="utf-8"))
        except Exception:
            return self._default_state()
        if not isinstance(payload, dict):
            return self._default_state()
        state = self._default_state()
        for bucket in state:
            bucket_payload = payload.get(bucket)
            if isinstance(bucket_payload, dict):
                state[bucket] = bucket_payload
        return state

    def _normalize(self, bucket: StateBucket, key: str) -> StateKey:
        if bucket not in self._data:
            raise KeyError(f"Unknown state bucket: {bucket}")
        return bucket, str(key)

    def _lock_for(self, bucket: StateBucket, key: str) -> threading.RLock:
        with self._registry_lock:
            bucket_locks = self._locks[bucket]
            lock = bucket_locks.get(key)
            if lock is None:
                lock = threading.RLock()
                bucket_locks[key] = lock
            return lock

    @contextmanager
    def locked(self, *items: StateKey) -> Iterator[None]:
        normalized = sorted(
            {self._normalize(bucket, key) for bucket, key in items},
            key=lambda item: (item[0], item[1]),
        )
        locks = [self._lock_for(bucket, key) for bucket, key in normalized]
        for lock in locks:
            lock.acquire()
        try:
            yield
        finally:
            for lock in reversed(locks):
                lock.release()

    def get(self, bucket: StateBucket, key: str, *, default: Any = None) -> Any:
        _, normalized_key = self._normalize(bucket, key)
        value = self._data[bucket].get(normalized_key, default)
        return copy.deepcopy(value)

    def get_ref(self, bucket: StateBucket, key: str) -> Any:
        _, normalized_key = self._normalize(bucket, key)
        return self._data[bucket].get(normalized_key)

    def set(self, bucket: StateBucket, key: str, value: Any) -> None:
        _, normalized_key = self._normalize(bucket, key)
        self._data[bucket][normalized_key] = value

    def delete(self, bucket: StateBucket, key: str) -> Any:
        _, normalized_key = self._normalize(bucket, key)
        return self._data[bucket].pop(normalized_key, None)

    def has(self, bucket: StateBucket, key: str) -> bool:
        _, normalized_key = self._normalize(bucket, key)
        return normalized_key in self._data[bucket]

    def snapshot(self) -> dict[str, dict[str, Any]]:
        with self.locked(*[(bucket, "__bucket_snapshot__") for bucket in self._data]):
            return copy.deepcopy(self._data)

    def write_snapshot(self) -> None:
        payload = self.snapshot()
        self.path.write_text(json.dumps(payload, ensure_ascii=True, indent=2, sort_keys=True), encoding="utf-8")


STORE = InMemoryStateStore()
