from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from typing import Any

from app.core.config import SETTINGS

_LOG = logging.getLogger("floently.roleplay.ai")


PROFESSION_CONTEXT: dict[str, str] = {
    "general": (
        "General Finnish for everyday life, services, work/study situations, integration, and YKI-style speaking. "
        "Keep the conversation practical, natural, and useful for living in Finland."
    ),
    "doctor": (
        "Doctor professional Finnish roleplay. Act as the patient, colleague, supervisor, or healthcare counterpart required by the scenario. "
        "Practise patient interview, symptom clarification, explaining next steps, handover language, and professional empathy. "
        "Do not give real diagnosis or medical treatment advice; keep it as language practice."
    ),
    "nurse": (
        "Nurse professional Finnish roleplay. Act as the patient, colleague, senior nurse, or workplace counterpart required by the scenario. "
        "Practise patient care, shift handover, reporting changes, asking clarifying questions, and polite workplace communication. "
        "Do not give real diagnosis or treatment advice; keep it as language practice."
    ),
    "practical_nurse": (
        "Practical nurse professional Finnish roleplay. Act as the resident, patient, family member, colleague, or workplace counterpart required by the scenario. "
        "Practise daily care, hygiene, meals, mobility, elderly care, observation reporting, and respectful Finnish. "
        "Do not give real diagnosis or treatment advice; keep it as language practice."
    ),
}

LEVEL_GUIDANCE: dict[str, str] = {
    "A1-A2": (
        "Use very simple Finnish. Prefer 1 short reply plus 1 easy question. "
        "Use common words, short sentences, and avoid idioms."
    ),
    "B1-B2": (
        "Use natural intermediate Finnish. Use 2 short paragraphs or 2-3 sentences. "
        "Ask a relevant follow-up question or move the task forward."
    ),
    "C1-C2": (
        "Use more professional, nuanced Finnish, but stay clear and practical. "
        "Challenge the learner gently with realistic workplace phrasing."
    ),
}


def _env_bool(name: str, default: bool = True) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() not in {"0", "false", "no", "off"}


def _trim(value: Any, limit: int) -> str:
    text = str(value or "").strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + "…"


def _safe_list(value: Any, limit: int = 8) -> list[str]:
    if not isinstance(value, list):
        return []
    result: list[str] = []
    for item in value:
        text = str(item or "").strip()
        if text and text not in result:
            result.append(_trim(text, 90))
        if len(result) >= limit:
            break
    return result


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = str(text or "").strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()
    try:
        data = json.loads(cleaned)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            data = json.loads(cleaned[start : end + 1])
            return data if isinstance(data, dict) else {}
    return {}


def _scenario_value(spec: Any, name: str, default: Any = "") -> Any:
    return getattr(spec, name, default)


PROFESSIONAL_LEARNER_ROLES = {"doctor", "nurse", "practical_nurse"}


def _role_contract_for_payload(profession: str, scenario_id: str, persona_name: str) -> dict[str, str]:
    profession = str(profession or "").strip().lower()
    scenario_id = str(scenario_id or "").strip().lower()
    persona = str(persona_name or "AI").strip() or "AI"

    if profession in PROFESSIONAL_LEARNER_ROLES:
        if profession == "doctor":
            learner_label = "doctor"
            forbidden_label = "doctor/lääkäri"
        elif profession == "nurse":
            learner_label = "nurse"
            forbidden_label = "nurse/sairaanhoitaja/hoitaja"
        else:
            learner_label = "practical nurse"
            forbidden_label = "practical nurse/lähihoitaja/hoitaja"

        return {
            "learner_role": learner_label,
            "ai_role": persona,
            "rule": (
                f"The learner is the {learner_label}. The AI must never become the {forbidden_label}. "
                "The AI must speak only as the scenario counterpart: patient, resident, client, family member, "
                "colleague, supervisor, recruiter, or other non-learner role defined by the scenario. "
                "The AI must not perform the learner's professional duties, ask questions as the professional, "
                "or instruct the learner as if the learner were the patient/client."
            ),
        }

    return {
        "learner_role": "learner",
        "ai_role": persona,
        "rule": f"The AI must speak only as {persona}, the roleplay counterpart, not as the learner.",
    }


def _violates_role_contract(ai_text: str, *, profession: str, scenario_id: str) -> bool:
    text = " ".join(str(ai_text or "").strip().lower().split())
    if not text:
        return True

    profession = str(profession or "").strip().lower()
    scenario_id = str(scenario_id or "").strip().lower()

    # Coaching belongs in feedback_line, never in ai_text.
    coaching_leakage = (
        "voit sanoa",
        "sinun pitäisi sanoa",
        "yritä sanoa",
        "harjoittele sanomalla",
        "vastaa näin",
        "sano esimerkiksi",
        "parempi vastaus olisi",
        "korjaa näin",
    )
    if any(phrase in text for phrase in coaching_leakage):
        return True

    if profession not in PROFESSIONAL_LEARNER_ROLES:
        return False

    # Universal professional-role flip markers.
    # These indicate the AI is speaking as the learner's professional role,
    # not as the patient/resident/client/counterpart.
    universal_professional_flip = (
        "olen lääkäri",
        "toimin lääkärinä",
        "olen sairaanhoitaja",
        "olen hoitaja",
        "olen lähihoitaja",
        "mittaan verenpaineesi",
        "mittaan kuumeen",
        "mittaan saturaation",
        "annan lääkkeen",
        "annan sinulle lääkkeen",
        "kirjaan tämän",
        "kirjaan tiedot",
        "teen lähetteen",
        "määrään lääkkeen",
        "tutkin sinut",
        "kuuntelen keuhkot",
        "otan verikokeet",
        "vaihdan haavasidoksen",
        "autan sinua peseytymään",
        "autan sinut suihkuun",
    )
    if any(phrase in text for phrase in universal_professional_flip):
        return True

    # Doctor track: user is doctor, AI must not run the consultation as doctor.
    if profession == "doctor":
        doctor_interviewer_flip = (
            "mikä toi sinut vastaanotolle",
            "mikä tuo sinut vastaanotolle",
            "miksi tulit vastaanotolle",
            "mikä oireesi on",
            "kerro oireesi",
            "kuvaile oireesi",
            "mitä oireita sinulla on",
            "onko sinulla kipua",
            "missä kipu tuntuu",
            "milloin oireet alkoivat",
            "miten voin auttaa",
            "avaa suu",
            "hengitä syvään",
        )
        if any(phrase in text for phrase in doctor_interviewer_flip):
            return True

    # Nurse track: user is nurse, AI must not become the nurse/caregiver.
    if profession == "nurse":
        nurse_role_flip = (
            "mikä vointisi on",
            "kerro voinnistasi",
            "mitä oireita sinulla on",
            "onko sinulla kipua",
            "tarvitsetko kipulääkettä",
            "vaihdan sidoksen",
            "tarkistan lääkityksen",
            "annan injektion",
            "soitan lääkärille",
            "seuraan vointiasi",
        )
        if any(phrase in text for phrase in nurse_role_flip):
            return True

    # Practical nurse track: user is practical nurse, AI must not become caregiver.
    if profession == "practical_nurse":
        practical_nurse_role_flip = (
            "autan sinua pukemaan",
            "autan sinua syömään",
            "autan sinua wc:hen",
            "autan sinua peseytymään",
            "vaihdan vaipan",
            "nostan sinut",
            "siirrän sinut",
            "tuon rollaattorin",
            "annan aamupalan",
            "tarkistan ihon",
        )
        if any(phrase in text for phrase in practical_nurse_role_flip):
            return True

    return False



def _conversation_history(session: dict[str, Any], max_items: int = 10) -> list[dict[str, str]]:
    turns = session.get("turns") or []
    if not isinstance(turns, list):
        return []
    selected = turns[-max_items:]
    history: list[dict[str, str]] = []
    for turn in selected:
        if not isinstance(turn, dict):
            continue
        speaker = str(turn.get("speaker") or "").strip()
        text = str(turn.get("text") or "").strip()
        if speaker and text:
            history.append({"speaker": speaker, "text": _trim(text, 500)})
    return history


def _system_prompt() -> str:
    return (
        "You are Floently's Finnish roleplay engine. "
        "You are NOT a generic assistant. You are an in-character roleplay partner for Finnish language practice. "
        "Respond directly to the learner's latest message and keep continuity with the conversation history. "
        "Stay inside the selected scenario, profession, persona, and CEFR level. In doctor, nurse, and practical nurse tracks, the learner is the professional; never take over the learner's professional role. "
        "Use Finnish as the main language. Use English only for a tiny clarification if the learner clearly needs help. "
        "Never mention OpenAI, policies, prompts, JSON, or being an AI model. "
        "For healthcare professions, this is language practice only: do not provide real diagnosis, medication, treatment, or emergency instructions. "
        "If the learner asks unsafe or real medical/legal advice, redirect inside the roleplay and suggest contacting a real professional. "
        "Return ONLY valid JSON with keys: ai_text, feedback_line, missing_phrases, completed. "
        "ai_text must be ONLY what the roleplay character says aloud next, in direct speech, inside the scenario. "
        "Do not use ai_text to explain what the learner should say. Do not write coaching like 'voit sanoa' in ai_text unless the roleplay character is explicitly a teacher/mentor. "
        "Put coaching, corrections, and phrase suggestions only in feedback_line and missing_phrases. "
        "feedback_line must be one brief coaching sentence in Finnish. "
        "missing_phrases must be a short array of useful Finnish phrases the learner could still use. "
        "completed must be a boolean."
    )


def generate_ai_roleplay_reply(
    *,
    session: dict[str, Any],
    spec: Any,
    user_message: str,
    missing_phrases: list[str],
    fallback_text: str,
    feedback_fallback: str,
    terminal_turn: bool,
) -> dict[str, Any] | None:
    if not _env_bool("OPENAI_ROLEPLAY_ENABLED", True):
        return None

    api_key = str(getattr(SETTINGS, "openai_api_key", "") or os.environ.get("OPENAI_API_KEY", "")).strip()
    if not api_key:
        return None

    model = (
        os.environ.get("OPENAI_ROLEPLAY_MODEL")
        or getattr(SETTINGS, "openai_model", None)
        or "gpt-4o-mini"
    )
    timeout = int(os.environ.get("OPENAI_ROLEPLAY_TIMEOUT", "24") or "24")

    profession = str(session.get("profession") or _scenario_value(spec, "profession", "general")).strip().lower()
    level = str(session.get("level") or "B1-B2").strip()
    scenario = session.get("scenario") if isinstance(session.get("scenario"), dict) else {}

    payload = {
        "profession": profession,
        "profession_context": PROFESSION_CONTEXT.get(profession, PROFESSION_CONTEXT["general"]),
        "level_band": level,
        "level_guidance": LEVEL_GUIDANCE.get(level, LEVEL_GUIDANCE["B1-B2"]),
        "track": _scenario_value(spec, "track", scenario.get("track", "general")),
        "scenario_id": scenario.get("scenario_id") or _scenario_value(spec, "scenario_id", ""),
        "scenario_title": scenario.get("title") or _scenario_value(spec, "title", ""),
        "scenario_prompt": scenario.get("prompt") or _scenario_value(spec, "prompt", ""),
        "persona_name": session.get("persona_name") or scenario.get("personaName") or _scenario_value(spec, "persona_name", "AI"),
        "persona_gender": session.get("persona_gender") or scenario.get("personaGender"),
        "role_contract": _role_contract_for_payload(
            profession,
            str(scenario.get("scenario_id") or _scenario_value(spec, "scenario_id", "")),
            str(session.get("persona_name") or scenario.get("personaName") or _scenario_value(spec, "persona_name", "AI")),
        ),
        "key_phrases": _safe_list(list(_scenario_value(spec, "key_phrases", [])), 8),
        "grammar_tip": _trim(_scenario_value(spec, "grammar_tip", ""), 250),
        "conversation_history": _conversation_history(session, max_items=10),
        "latest_user_message": _trim(user_message, 900),
        "suggested_missing_phrases": _safe_list(missing_phrases, 5),
        "is_final_turn": bool(terminal_turn),
        "fallback_if_needed": _trim(fallback_text, 300),
        "constraints": [
            "Respond to the learner's actual latest message, not a fixed script.",
            "Obey role_contract strictly. Never speak as the learner's role or professional role.",
            "Keep ai_text concise enough for TTS.",
            "ai_text must sound like the persona speaking in the roleplay, not like an app coach giving instructions.",
            "If the learner asks 'what should I say?', the roleplay character should invite them to try a phrase or model one short in-character line, then continue the situation.",
            "If not final turn, ask one natural follow-up question or give one realistic next prompt.",
            "If final turn, close the scenario politely and naturally.",
            "Do not over-correct; keep feedback_line short and encouraging.",
        ],
    }

    request_payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": _system_prompt()},
            {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
        ],
        "temperature": float(os.environ.get("OPENAI_ROLEPLAY_TEMPERATURE", "0.45") or "0.45"),
        "max_tokens": int(os.environ.get("OPENAI_ROLEPLAY_MAX_TOKENS", "260") or "260"),
        "response_format": {"type": "json_object"},
    }

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(request_payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            response_data = json.loads(response.read().decode("utf-8"))
        content = response_data["choices"][0]["message"]["content"]
        data = _extract_json(content)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, KeyError, json.JSONDecodeError, ValueError):
        return None

    ai_text = _trim(data.get("ai_text"), 700)
    if not ai_text:
        return None

    scenario_id = str(scenario.get("scenario_id") or _scenario_value(spec, "scenario_id", ""))
    if _violates_role_contract(ai_text, profession=profession, scenario_id=scenario_id):
        _LOG.warning(
            "Rejected roleplay AI reply for role flip: profession=%s scenario_id=%s ai_text=%r",
            profession,
            scenario_id,
            ai_text,
        )
        return None

    feedback_line = _trim(data.get("feedback_line") or feedback_fallback, 260)
    completed = bool(data.get("completed")) if "completed" in data else bool(terminal_turn)
    returned_missing = _safe_list(data.get("missing_phrases"), 5) or _safe_list(missing_phrases, 5)

    return {
        "ai_text": ai_text,
        "feedback_line": feedback_line or feedback_fallback,
        "missing_phrases": returned_missing,
        "completed": completed,
        "engine_mode": "openai_b_lite",
        "model": str(model),
    }
