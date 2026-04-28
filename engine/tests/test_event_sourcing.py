"""
Event replay, state machine, and deterministic exam tests.
Run from repo root: python -m engine.tests.test_event_sourcing
"""

from __future__ import annotations

import tempfile
from pathlib import Path

# Event replay: rebuild(session_id) == expected state
def event_replay_test():
    from engine.events.exam_events import ExamEvent, SESSION_CREATED, INTRO_STARTED, ANSWER_SUBMITTED
    from engine.event_store.store import append_event, load_events, has_event_log
    from engine.session_rebuilder.rebuild_session import rebuild_session, initial_state, apply_event

    with tempfile.TemporaryDirectory() as tmp:
        # Use a temp dir for event store
        import engine.event_store.store as store_mod
        old_dir = store_mod.EVENTS_DIR
        store_mod.EVENTS_DIR = Path(tmp)
        try:
            session_id = "replay-test-session"
            append_event(ExamEvent(session_id=session_id, event_type=SESSION_CREATED, payload={
                "session_id": session_id, "level_band": "B1_B2", "start_time": 1000.0,
            }))
            append_event(ExamEvent(session_id=session_id, event_type=INTRO_STARTED, payload={}))
            append_event(ExamEvent(session_id=session_id, event_type=ANSWER_SUBMITTED, payload={
                "answer_id": "q1", "answer": 1,
            }))
            events = load_events(session_id)
            assert len(events) == 3
            state = rebuild_session(session_id, fallback_session={"exam": {"reading": []}})
            assert state["session_id"] == session_id
            assert state["level_band"] == "B1_B2"
            assert state["answers"].get("q1") == 1
            assert state["current_state"] == "INTRO"
            print("event_replay_test PASSED")
        finally:
            store_mod.EVENTS_DIR = old_dir


def state_machine_test():
    from engine.session_rebuilder.state_machine import (
        next_state_after_event,
        INIT, INTRO, REVIEW, SUBMITTED, RESULTS_READY,
    )
    assert next_state_after_event("", "SESSION_CREATED", {}) == INIT
    assert next_state_after_event(INIT, "INTRO_STARTED", {}) == INTRO
    assert next_state_after_event(REVIEW, "EXAM_SUBMITTED", {}) == SUBMITTED
    assert next_state_after_event(SUBMITTED, "RESULTS_GENERATED", {}) == RESULTS_READY
    print("state_machine_test PASSED")


def session_integrity_test():
    from engine.events.exam_events import ExamEvent
    ev = ExamEvent(session_id="s1", event_type="SESSION_CREATED", payload={})
    assert ev.session_id == "s1"
    assert ev.event_type == "SESSION_CREATED"
    assert ev.event_id
    assert ev.timestamp
    print("session_integrity_test PASSED")


def deterministic_exam_test():
    from engine.blueprints.loader import load_blueprint, validate_blueprint
    from engine.exam.blueprint_assembler import assemble_exam

    blueprint = load_blueprint("B1_B2_blueprint_v1")
    ok, _ = validate_blueprint(blueprint)
    assert ok
    exam1 = assemble_exam(blueprint, seed="123", level_band="B1_B2")
    exam2 = assemble_exam(blueprint, seed="123", level_band="B1_B2")
    assert exam1["level_band"] == exam2["level_band"]
    for skill in ("reading", "listening", "writing", "speaking"):
        assert len(exam1[skill]) == len(exam2[skill])
    for skill in ("reading", "listening", "writing", "speaking"):
        ids1 = [t.get("id") for t in exam1[skill] if t.get("id")]
        ids2 = [t.get("id") for t in exam2[skill] if t.get("id")]
        assert ids1 == ids2
    print("deterministic_exam_test PASSED")


def event_integrity_test():
    from engine.events.exam_events import ExamEvent, SESSION_CREATED, INTRO_STARTED
    from engine.event_store.store import append_event, load_events
    from engine.event_store.integrity import verify_event_chain, EventIntegrityError
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        import engine.event_store.store as store_mod
        old_dir = store_mod.EVENTS_DIR
        store_mod.EVENTS_DIR = Path(tmp)
        try:
            session_id = "integrity-test"
            append_event(ExamEvent(session_id=session_id, event_type=SESSION_CREATED, payload={"session_id": session_id}))
            append_event(ExamEvent(session_id=session_id, event_type=INTRO_STARTED, payload={}))
            verify_event_chain(session_id)
            print("event_integrity_test PASSED")
        finally:
            store_mod.EVENTS_DIR = old_dir


def snapshot_recovery_test():
    from engine.event_store.store import load_events, append_event, EVENTS_DIR
    from engine.event_store.snapshots import write_snapshot, load_snapshot
    from engine.events.exam_events import ExamEvent, SESSION_CREATED, INTRO_STARTED
    from engine.session_rebuilder.rebuild_session import rebuild_session
    import tempfile
    with tempfile.TemporaryDirectory() as tmp:
        import engine.event_store.store as store_mod
        import engine.event_store.snapshots as snap_mod
        old_ev = store_mod.EVENTS_DIR
        old_snap = snap_mod.SNAPSHOTS_DIR
        store_mod.EVENTS_DIR = Path(tmp) / "ev"
        snap_mod.SNAPSHOTS_DIR = Path(tmp) / "snap"
        store_mod.EVENTS_DIR.mkdir(parents=True, exist_ok=True)
        try:
            session_id = "snap-test"
            append_event(ExamEvent(session_id=session_id, event_type=SESSION_CREATED, payload={"session_id": session_id, "level_band": "B1_B2"}))
            append_event(ExamEvent(session_id=session_id, event_type=INTRO_STARTED, payload={}))
            events = load_events(session_id)
            state = rebuild_session(session_id, fallback_session={"exam": {}})
            write_snapshot(session_id, state, events[-1].event_id, len(events))
            loaded = load_snapshot(session_id)
            assert loaded is not None
            assert loaded["last_event_id"] == events[-1].event_id
            assert loaded["event_count"] == 2
            state2 = rebuild_session(session_id, fallback_session={"exam": {}})
            assert state2["session_id"] == session_id
            assert state2["current_state"] == "INTRO"
            print("snapshot_recovery_test PASSED")
        finally:
            store_mod.EVENTS_DIR = old_ev
            snap_mod.SNAPSHOTS_DIR = old_snap


def main():
    event_replay_test()
    state_machine_test()
    session_integrity_test()
    deterministic_exam_test()
    event_integrity_test()
    snapshot_recovery_test()
    print("All event-sourcing and blueprint tests passed.")


if __name__ == "__main__":
    main()
