from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from threading import RLock
from typing import Protocol

from .errors import IdempotencyConflict, PersistenceError
from .models import LearnerEvent


class LearnerEventRepository(Protocol):
    def append(self, event: LearnerEvent) -> tuple[LearnerEvent, bool]: ...

    def get(self, learner_id: str, event_id: str) -> LearnerEvent | None: ...

    def list_for_learner(self, learner_id: str) -> list[LearnerEvent]: ...


class InMemoryLearnerEventRepository:
    """Process-local repository for tests and deterministic pure-service use."""

    def __init__(self) -> None:
        self._events: dict[str, dict[str, LearnerEvent]] = {}
        self._lock = RLock()

    def append(self, event: LearnerEvent) -> tuple[LearnerEvent, bool]:
        with self._lock:
            learner_events = self._events.setdefault(event.learner_id, {})
            existing = learner_events.get(event.event_id)
            if existing is not None:
                if existing != event:
                    raise IdempotencyConflict(
                        f"Event {event.event_id!r} already exists with different content"
                    )
                return existing, False
            learner_events[event.event_id] = event
            return event, True

    def get(self, learner_id: str, event_id: str) -> LearnerEvent | None:
        with self._lock:
            return self._events.get(learner_id, {}).get(event_id)

    def list_for_learner(self, learner_id: str) -> list[LearnerEvent]:
        with self._lock:
            values = list(self._events.get(learner_id, {}).values())
        return sorted(values, key=lambda item: (item.occurred_at, item.event_id))


class JsonFileLearnerEventRepository:
    """Small non-production JSON repository used for durability/restart tests.

    The entire canonical event snapshot is atomically replaced on writes. This
    adapter is intentionally not wired into application startup or production
    configuration; a production relational repository requires Agent-A review
    and a separate migration decision.
    """

    FORMAT_VERSION = 1

    def __init__(self, path: str | Path) -> None:
        self.path = Path(path)
        self._lock = RLock()
        self._events = self._load()

    def append(self, event: LearnerEvent) -> tuple[LearnerEvent, bool]:
        with self._lock:
            learner_events = self._events.setdefault(event.learner_id, {})
            existing = learner_events.get(event.event_id)
            if existing is not None:
                if existing != event:
                    raise IdempotencyConflict(
                        f"Event {event.event_id!r} already exists with different content"
                    )
                return existing, False
            learner_events[event.event_id] = event
            try:
                self._persist()
            except Exception:
                learner_events.pop(event.event_id, None)
                if not learner_events:
                    self._events.pop(event.learner_id, None)
                raise
            return event, True

    def get(self, learner_id: str, event_id: str) -> LearnerEvent | None:
        with self._lock:
            return self._events.get(learner_id, {}).get(event_id)

    def list_for_learner(self, learner_id: str) -> list[LearnerEvent]:
        with self._lock:
            values = list(self._events.get(learner_id, {}).values())
        return sorted(values, key=lambda item: (item.occurred_at, item.event_id))

    def _load(self) -> dict[str, dict[str, LearnerEvent]]:
        if not self.path.exists():
            return {}
        try:
            raw = json.loads(self.path.read_text(encoding="utf-8"))
            if raw.get("formatVersion") != self.FORMAT_VERSION:
                raise PersistenceError("Unsupported learner-event file format")
            events = raw.get("events")
            if not isinstance(events, list):
                raise PersistenceError("Learner-event file must contain an events list")
            result: dict[str, dict[str, LearnerEvent]] = {}
            for item in events:
                if not isinstance(item, dict):
                    raise PersistenceError("Learner-event file contains malformed event")
                event = LearnerEvent.from_mapping(item)
                learner_events = result.setdefault(event.learner_id, {})
                existing = learner_events.get(event.event_id)
                if existing is not None and existing != event:
                    raise PersistenceError("Learner-event file contains conflicting duplicate ids")
                learner_events[event.event_id] = event
            return result
        except PersistenceError:
            raise
        except (OSError, ValueError, TypeError, json.JSONDecodeError) as exc:
            raise PersistenceError(f"Unable to read learner-event file: {exc}") from exc

    def _persist(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "formatVersion": self.FORMAT_VERSION,
            "events": [
                event.to_mapping()
                for learner_id in sorted(self._events)
                for event in sorted(
                    self._events[learner_id].values(),
                    key=lambda item: (item.occurred_at, item.event_id),
                )
            ],
        }
        try:
            fd, temporary = tempfile.mkstemp(
                prefix=f".{self.path.name}.", suffix=".tmp", dir=str(self.path.parent)
            )
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as handle:
                    json.dump(payload, handle, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
                    handle.flush()
                    os.fsync(handle.fileno())
                os.replace(temporary, self.path)
            except Exception:
                try:
                    os.unlink(temporary)
                except FileNotFoundError:
                    pass
                raise
        except OSError as exc:
            raise PersistenceError(f"Unable to write learner-event file: {exc}") from exc
