from __future__ import annotations

import json
import mimetypes
import tempfile
import time
import uuid
import wave
from collections import Counter
from pathlib import Path
from typing import Any
from urllib import error, parse, request


API_BASE = "http://127.0.0.1:8000"
EXPIRED_EMAIL = "expired_live_phase52@example.com"
PASSWORD = "Password123"


def api_request(
    *,
    method: str,
    path: str,
    token: str | None = None,
    json_body: dict[str, Any] | None = None,
    form_fields: dict[str, str] | None = None,
    file_field: tuple[str, Path, str] | None = None,
) -> tuple[int, dict[str, Any]]:
    url = f"{API_BASE}{path}"
    headers = {"Accept": "application/json"}
    body: bytes | None = None

    if token:
        headers["Authorization"] = f"Bearer {token}"

    if json_body is not None:
        body = json.dumps(json_body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif form_fields is not None or file_field is not None:
        boundary = f"----phase52{uuid.uuid4().hex}"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        chunks: list[bytes] = []
        for key, value in (form_fields or {}).items():
            chunks.extend(
                [
                    f"--{boundary}\r\n".encode(),
                    f'Content-Disposition: form-data; name="{key}"\r\n\r\n'.encode(),
                    str(value).encode("utf-8"),
                    b"\r\n",
                ]
            )
        if file_field is not None:
            field_name, path_obj, filename = file_field
            mime_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
            chunks.extend(
                [
                    f"--{boundary}\r\n".encode(),
                    f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode(),
                    f"Content-Type: {mime_type}\r\n\r\n".encode(),
                    path_obj.read_bytes(),
                    b"\r\n",
                ]
            )
        chunks.append(f"--{boundary}--\r\n".encode())
        body = b"".join(chunks)

    req = request.Request(url, data=body, method=method.upper(), headers=headers)
    try:
        with request.urlopen(req, timeout=60) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode("utf-8"))


def api_request_with_retry(**kwargs: Any) -> tuple[int, dict[str, Any]]:
    for attempt in range(4):
        status, payload = api_request(**kwargs)
        retryable_code = ((payload.get("error") or {}).get("code") if isinstance(payload, dict) else None)
        if status not in {429, 503} and retryable_code != "YKI_ENGINE_RETRYABLE":
            return status, payload
        if attempt == 3:
            return status, payload
        time.sleep(1.0 + attempt * 0.5)
    return status, payload


def assert_ok(status: int, payload: dict[str, Any]) -> dict[str, Any]:
    if status >= 400 or not payload.get("ok"):
        raise RuntimeError(f"Expected success, got {status}: {payload}")
    return payload["data"]


def assert_error(status: int, payload: dict[str, Any]) -> dict[str, Any]:
    if status < 400 or payload.get("ok") is not False:
        raise RuntimeError(f"Expected error, got {status}: {payload}")
    return payload["error"]


def current_screen(runtime: dict[str, Any]) -> dict[str, Any] | None:
    metadata = runtime.get("metadata") or {}
    answers = metadata.get("answers") or {}
    writing_answers = metadata.get("writing_answers") or {}
    audio_answers = metadata.get("audio_answers") or {}
    speaking_runtime = metadata.get("speaking_runtime") or {}
    for screen in runtime.get("screens") or []:
        payload = screen.get("payload") or {}
        if payload.get("questions"):
            if not all(question.get("answer_id") in answers for question in payload["questions"]):
                return screen
            continue
        if screen.get("screen_type") == "writing_response":
            if not writing_answers.get(payload.get("task_id")):
                return screen
            continue
        if screen.get("screen_type") == "speaking_task":
            task_id = payload.get("task_id")
            if payload.get("speaking_mode") == "conversation":
                state = speaking_runtime.get(task_id) or {}
                if not (state.get("completed") or state.get("responses")):
                    return screen
            elif not audio_answers.get(task_id):
                return screen
            continue
    return None


def contains_internal_fields(value: Any) -> bool:
    forbidden = {"engine_session_token", "debug", "canonical_structure", "canonical_task", "internal_state", "raw_runtime"}
    if isinstance(value, dict):
        for key, item in value.items():
            if key in forbidden:
                return True
            if contains_internal_fields(item):
                return True
    if isinstance(value, list):
        return any(contains_internal_fields(item) for item in value)
    return False


def collect_task_ids(runtime: dict[str, Any]) -> list[str]:
    task_ids: list[str] = []
    for screen in runtime.get("screens") or []:
        payload = screen.get("payload") or {}
        task_id = payload.get("task_id")
        if isinstance(task_id, str) and task_id:
            task_ids.append(task_id)
    return task_ids


def register_user(email: str) -> dict[str, Any]:
    status, payload = api_request(
        method="POST",
        path="/api/v1/auth/register/password",
        json_body={"email": email, "password": PASSWORD, "name": "Phase 5.2"},
    )
    if status == 400 and payload.get("error", {}).get("code") == "AUTH_EMAIL_EXISTS":
        status, payload = api_request(
            method="POST",
            path="/api/v1/auth/login/password",
            json_body={"email": email, "password": PASSWORD},
        )
    return assert_ok(status, payload)


def write_sample_wav() -> Path:
    handle = tempfile.NamedTemporaryFile(prefix="phase52-voice-", suffix=".wav", delete=False)
    temp_path = Path(handle.name)
    handle.close()
    with wave.open(str(temp_path), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(16000)
        wav_file.writeframes(b"\x00\x00" * 16000)
    return temp_path


def main() -> int:
    results: dict[str, Any] = {}

    auth_email = f"phase52_auth_{uuid.uuid4().hex[:10]}@example.com"
    auth_data = register_user(auth_email)
    access_token = auth_data["tokens"]["access_token"]
    refresh_token = auth_data["tokens"]["refresh_token"]
    results["auth"] = {}

    status, payload = api_request(method="GET", path="/api/v1/auth/session", token=access_token)
    results["auth"]["session"] = {"status": status, "auth_session_id": assert_ok(status, payload)["auth_session_id"]}

    status, payload = api_request(
        method="POST",
        path="/api/v1/auth/token/refresh",
        json_body={"refresh_token": refresh_token},
    )
    refreshed = assert_ok(status, payload)
    results["auth"]["refresh"] = {"status": status, "auth_session_id": refreshed["tokens"]["auth_session_id"]}

    status, payload = api_request(
        method="POST",
        path="/api/v1/auth/logout",
        token=access_token,
        json_body={"refresh_token": refresh_token},
    )
    results["auth"]["logout"] = {"status": status, "data": assert_ok(status, payload)}

    status, payload = api_request(method="GET", path="/api/v1/auth/session", token=access_token)
    results["auth"]["post_logout_session"] = {"status": status, "error": assert_error(status, payload)["code"]}

    status, payload = api_request(
        method="POST",
        path="/api/v1/auth/token/refresh",
        json_body={"refresh_token": refresh_token},
    )
    results["auth"]["post_logout_refresh"] = {"status": status, "error": assert_error(status, payload)["code"]}

    expired_login_status, expired_login_payload = api_request(
        method="POST",
        path="/api/v1/auth/login/password",
        json_body={"email": EXPIRED_EMAIL, "password": PASSWORD},
    )
    expired_login = assert_ok(expired_login_status, expired_login_payload)
    expired_token = expired_login["tokens"]["access_token"]

    status, payload = api_request(method="GET", path="/api/v1/subscription/check-feature?feature=yki", token=expired_token)
    results["payment"] = {"check_feature": {"status": status, "data": assert_ok(status, payload)}}

    status, payload = api_request_with_retry(method="POST", path="/api/v1/yki/sessions", token=expired_token, json_body={"level_band": "B1_B2"})
    results["payment"]["expired_yki_start"] = {"status": status, "error": assert_error(status, payload)["code"]}

    cards_email = f"phase52_cards_{uuid.uuid4().hex[:10]}@example.com"
    cards_login = register_user(cards_email)
    cards_token = cards_login["tokens"]["access_token"]
    card_first_ids: list[str] = []
    levels: list[str] = []
    for _ in range(3):
        status, payload = api_request(
            method="POST",
            path="/api/v1/cards/session/start",
            token=cards_token,
            json_body={"domain": "general", "content_type": "vocabulary_card", "profession": "none", "level": "A1_A2"},
        )
        data = assert_ok(status, payload)
        card_first_ids.append(data["first_card"]["id"])
        levels.append(data["first_card"]["level_band"])
    results["cards"] = {
        "first_ids": card_first_ids,
        "unique_first_ids": len(set(card_first_ids)),
        "levels": levels,
    }

    status, roleplay = api_request(
        method="POST",
        path="/api/v1/roleplay/session/start",
        json_body={"profession": "general", "level_band": "B1-B2", "scenario_id": "general_supervisor_instruction"},
    )
    if status >= 400:
        raise RuntimeError(f"Expected roleplay start success, got {status}: {roleplay}")
    session_id = roleplay["sessionId"]
    turn_count = 0
    for message in ["Hei, haluaisin tarkentaa tämän päivän työtehtävän.", "Teen ensin tärkeimmän vaiheen ja ilmoitan heti, jos aikataulu muuttuu."]:
        status, payload = api_request(
            method="POST",
            path=f"/api/v1/roleplay/session/{session_id}/turn",
            json_body={"transcript": message},
        )
        if status >= 400:
            raise RuntimeError(f"Expected roleplay turn success, got {status}: {payload}")
        turn_count = payload["currentUserTurn"]
    status, session_payload = api_request(method="POST", path=f"/api/v1/roleplay/session/{session_id}/finish", json_body={})
    if status >= 400:
        raise RuntimeError(f"Expected roleplay finish response, got {status}: {session_payload}")
    results["roleplay"] = {
        "session_status": session_payload["status"],
        "scenario_id": roleplay["scenarioId"],
        "turn_count": turn_count,
    }

    voice_email = f"phase52_voice_{uuid.uuid4().hex[:10]}@example.com"
    voice_login = register_user(voice_email)
    voice_token = voice_login["tokens"]["access_token"]
    sample_audio = write_sample_wav()
    try:
        status, payload = api_request(
            method="POST",
            path="/api/v1/voice/stt/transcriptions",
            token=voice_token,
            form_fields={
                "mime_type": "audio/wav",
                "duration_ms": "1000",
                "session_id": "phase52_voice",
                "speaking_session_id": "phase52_voice",
                "mode": "conversation",
                "locale": "fi-FI",
            },
            file_field=("file", sample_audio, "recording.wav"),
        )
    finally:
        sample_audio.unlink(missing_ok=True)
    results["voice"] = {"stt_upload": {"status": status, "error": assert_error(status, payload)["code"], "details": payload["error"]["details"]}}

    yki_email = f"phase52_yki_{uuid.uuid4().hex[:10]}@example.com"
    yki_login = register_user(yki_email)
    yki_token = yki_login["tokens"]["access_token"]
    status, payload = api_request_with_retry(method="POST", path="/api/v1/yki/sessions", token=yki_token, json_body={"level_band": "B1_B2"})
    runtime = assert_ok(status, payload)["runtime"]
    session_id = runtime["session_id"]
    task_ids = collect_task_ids(runtime)
    task_id_counts = Counter(task_ids)
    yki_results: dict[str, Any] = {
        "start_status": status,
        "screen_task_references": len(task_ids),
        "unique_task_count": len(task_id_counts),
        "unexpected_duplicate_task_ids": sorted(task_id for task_id, count in task_id_counts.items() if count > 2),
        "contains_internal_fields": contains_internal_fields(runtime),
        "submit_incomplete_without_confirmation": None,
    }

    status, payload = api_request_with_retry(
        method="POST",
        path=f"/api/v1/yki/sessions/{session_id}/submit",
        token=yki_token,
        json_body={"confirm_incomplete": False},
    )
    yki_results["submit_incomplete_without_confirmation"] = {"status": status, "data": assert_ok(status, payload)}

    progressed = 0
    speaking_block = None
    progression_gate = None
    while True:
        screen = current_screen(runtime)
        if screen is None:
            break
        payload_obj = screen.get("payload") or {}
        if payload_obj.get("questions"):
            for question in payload_obj["questions"]:
                option = question["options"][0]
                status, payload = api_request_with_retry(
                    method="POST",
                    path=f"/api/v1/yki/sessions/{session_id}/answers",
                    token=yki_token,
                    json_body={"answer_id": question["answer_id"], "answer": option},
                )
                if status >= 400 or not payload.get("ok"):
                    progression_gate = {"status": status, "error": payload.get("error")}
                    break
                assert_ok(status, payload)
            if progression_gate is not None:
                break
            status, payload = api_request_with_retry(method="GET", path=f"/api/v1/yki/sessions/{session_id}", token=yki_token)
            runtime = assert_ok(status, payload)["runtime"]
            progressed += 1
            continue
        if screen.get("screen_type") == "writing_response":
            status, payload = api_request_with_retry(
                method="POST",
                path=f"/api/v1/yki/sessions/{session_id}/writing",
                token=yki_token,
                json_body={"task_id": payload_obj["task_id"], "text": "Kirjoitan tähän testivastauksen vaihetta 5.2 varten."},
            )
            if status >= 400 or not payload.get("ok"):
                progression_gate = {"status": status, "error": payload.get("error")}
                break
            assert_ok(status, payload)
            status, payload = api_request_with_retry(method="GET", path=f"/api/v1/yki/sessions/{session_id}", token=yki_token)
            runtime = assert_ok(status, payload)["runtime"]
            progressed += 1
            continue
        if screen.get("screen_type") == "speaking_task":
            speaking_block = {"screen_type": screen["screen_type"], "speaking_mode": payload_obj.get("speaking_mode"), "task_id": payload_obj.get("task_id")}
            break
        break

    if speaking_block is not None:
        status, payload = api_request_with_retry(
            method="POST",
            path="/api/v1/voice/stt/transcriptions",
            token=yki_token,
            form_fields={
                "mime_type": "audio/wav",
                "duration_ms": "1000",
                "session_id": session_id,
                "mode": "yki_exam",
                "task_id": speaking_block["task_id"],
                "locale": "fi-FI",
            },
            file_field=("file", sample_audio, "yki.wav"),
        )
        speaking_block["voice_error"] = {"status": status, "error": assert_error(status, payload)["code"]}

    yki_results["progressed_screens_before_block"] = progressed
    yki_results["speaking_block"] = speaking_block
    yki_results["progression_gate"] = progression_gate
    results["yki"] = yki_results

    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
