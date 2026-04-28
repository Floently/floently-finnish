from fastapi import HTTPException

from app.services.yki_exam_runtime_guard import ensure_runtime_flow_transition, ensure_submit_ready


def test_yki_submit_transition_accepts_forward_progress():
    ensure_runtime_flow_transition("WRITING", "SUBMIT")


def test_yki_submit_transition_rejects_incomplete_exam():
    manifest = {
        "exam": {
            "reading": [{"task_id": "read-1", "skill": "reading", "content": {"questions": [{"id": "q1"}]}}],
            "listening": [{"task_id": "listen-1", "skill": "listening", "content": {"questions": [{"id": "q2"}]}}],
        }
    }
    responses_by_task = {
        "read-1": {"answers_by_id": {"q1": "A"}},
    }

    try:
        ensure_submit_ready(manifest, responses_by_task)
    except HTTPException as exc:
        assert exc.status_code == 409
        assert exc.detail == "Invalid exam transition: LISTENING -> SUBMIT"
    else:  # pragma: no cover - defensive assertion
        raise AssertionError("Expected ensure_submit_ready() to reject an incomplete exam")
