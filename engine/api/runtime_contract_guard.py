from __future__ import annotations

from engine.schema.runtime_contract_v1 import ExamRuntimeContract, RuntimeAudioObject


def validate_runtime_contract(payload: dict) -> dict:
    contract = ExamRuntimeContract.model_validate(payload)

    if contract.runtime_schema_version != "1.0":
        raise RuntimeError("Unsupported runtime schema")
    if contract.contract_type != "exam_runtime":
        raise RuntimeError("Invalid contract type")
    if not contract.screens:
        raise RuntimeError("Runtime payload missing screens")

    for screen in contract.screens:
        screen_type = screen.screen_type
        body = screen.payload
        audio_payload = body.get("audio")
        if screen_type == "listening_prompt":
            if not isinstance(audio_payload, dict):
                raise RuntimeError("Listening prompt missing audio object")
            RuntimeAudioObject.model_validate(audio_payload)
        if screen_type == "speaking_prompt":
            if not isinstance(audio_payload, dict):
                raise RuntimeError("Speaking prompt missing audio object")
            RuntimeAudioObject.model_validate(audio_payload)
            if not str(body.get("instruction") or "").strip():
                raise RuntimeError("Speaking prompt missing instructions")
        if screen_type == "speaking_task":
            mode = str(body.get("mode") or "").strip()
            speaking_mode = str(body.get("speaking_mode") or "").strip()
            if mode not in {"recording_response", "conversation"}:
                raise RuntimeError("Speaking task missing mode")
            if speaking_mode not in {"recording", "conversation"}:
                raise RuntimeError("Speaking task missing speaking_mode")
            if str(body.get("ui_type") or "").strip() != "speaking_task":
                raise RuntimeError("Speaking task missing ui_type")
            if not str(body.get("instruction") or "").strip():
                raise RuntimeError("Speaking task missing instructions")
            if mode == "recording_response" and isinstance(audio_payload, dict):
                RuntimeAudioObject.model_validate(audio_payload)
            if mode == "conversation" and not isinstance(body.get("conversation"), dict):
                raise RuntimeError("Conversation speaking task missing conversation payload")
        if screen_type == "writing_prompt" and not str(body.get("instruction") or "").strip():
            raise RuntimeError("Writing prompt missing instructions")

    return contract.model_dump()
