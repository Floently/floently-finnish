from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
import json
from typing import Any, Iterable

try:
    from app.core.paths import CARD_BANK_CANONICAL_DIR
except Exception:  # pragma: no cover - fallback for older path modules
    CARD_BANK_CANONICAL_DIR = Path(__file__).resolve().parents[2] / "card_bank" / "canonical_bank"

PUBLISHED_DIR = CARD_BANK_CANONICAL_DIR / "published"
ACCEPTED_ITEMS_PATH = CARD_BANK_CANONICAL_DIR / "reports" / "accepted_items.jsonl"

SUPPORTED_CONTENT_TYPES = {"vocabulary_card", "sentence_card", "phrase_card", "grammar_card"}
LEVEL_BAND_MAP = {
    "A1": "A1_A2",
    "A2": "A1_A2",
    "A1_A2": "A1_A2",
    "B1": "B1_B2",
    "B2": "B1_B2",
    "B1_B2": "B1_B2",
    "C1": "C1_C2",
    "C2": "C1_C2",
    "C1_C2": "C1_C2",
}

_PROFESSION_ALIASES: dict[str, str] = {
    "lahioitaja": "practical_nurse",
    "lähihoitaja": "practical_nurse",
    "practical-nurse": "practical_nurse",
}


@dataclass(frozen=True)
class CardRecord:
    id: str
    mode: str
    front: str
    prompt: str
    accepted_answers: list[str]
    choices: list[str] | None = None
    explanation: str | None = None
    hint: str | None = None
    cefr: str | None = None
    domain: str | None = None
    profession: str | None = None
    content_type: str | None = None


def _normalize_level_band(value: Any) -> str:
    return LEVEL_BAND_MAP.get(str(value or "").strip().upper().replace("-", "_"), "B1_B2")


def _normalized_text(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _normalized_path_value(value: Any) -> str:
    candidate = str(value or "").strip().lower().replace("\\", "/")
    if candidate == "professional" or candidate.startswith("professional/"):
        return "professional"
    return "general"


def _normalized_profession(value: Any, *, path_value: str, raw_path: Any = None) -> str:
    if path_value != "professional":
        return "none"

    if isinstance(value, dict):
        raw = value.get("slug") or value.get("track") or value.get("label")
    else:
        raw = value

    profession = str(raw or "").strip().lower().replace(" ", "_").replace("-", "_")

    if not profession or profession in {"none", "professional"}:
        parts = str(raw_path or "").strip().lower().replace("\\", "/").split("/")
        if len(parts) >= 2 and parts[0] == "professional":
            profession = parts[1].replace("-", "_")

    profession = profession or "none"
    return _PROFESSION_ALIASES.get(profession, profession)


def _content_type_from_path(parts: tuple[str, ...]) -> str:
    bucket = parts[-2] if len(parts) >= 2 else ""
    if bucket == "grammar":
        return "grammar_card"
    if bucket in {"phrases", "sentences"}:
        return "sentence_card"
    if bucket in {"words", "vocabulary"}:
        return "vocabulary_card"
    return "vocabulary_card"


def _mode_for_content_type(content_type: Any) -> str:
    normalized = str(content_type or "").strip().lower()
    if normalized == "grammar_card":
        return "grammar"
    if normalized in {"sentence_card", "phrase_card"}:
        return "phrases"
    return "vocabulary"


def _level_band_from_path(parts: tuple[str, ...]) -> str:
    stem = Path(parts[-1]).stem if parts else ""
    return _normalize_level_band(stem)


def _payload_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict) and isinstance(payload.get("cards"), list):
        return [item for item in payload["cards"] if isinstance(item, dict)]
    if isinstance(payload, dict):
        return [payload]
    return []


def _iter_jsonl(path: Path) -> Iterable[tuple[dict[str, Any], Path, int, tuple[str, ...]]]:
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as handle:
        for index, line in enumerate(handle):
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except Exception:
                continue
            for item in _payload_items(payload):
                yield item, path, index, ("reports", path.name)


def _iter_published_json() -> Iterable[tuple[dict[str, Any], Path, int, tuple[str, ...]]]:
    if not PUBLISHED_DIR.exists():
        return
    for json_file in sorted(PUBLISHED_DIR.rglob("*.json")):
        try:
            payload = json.loads(json_file.read_text(encoding="utf-8"))
        except Exception:
            continue
        relative_parts = json_file.relative_to(PUBLISHED_DIR).parts
        for index, item in enumerate(_payload_items(payload)):
            yield item, json_file, index, relative_parts


def _iter_canonical_items() -> Iterable[tuple[dict[str, Any], Path, int, tuple[str, ...]]]:
    yield from _iter_published_json() or []
    yield from _iter_jsonl(ACCEPTED_ITEMS_PATH) or []


def _canonical_options(primary: dict[str, Any]) -> tuple[list[dict[str, str]], str | None, str | None]:
    raw_options = primary.get("options") or []
    if not isinstance(raw_options, list):
        return [], None, None
    options: list[dict[str, str]] = []
    answer_key = str(primary.get("answer_key") or "").strip() or None
    answer_text: str | None = None
    for raw in raw_options:
        if not isinstance(raw, dict):
            continue
        option_id = str(raw.get("option_id") or raw.get("id") or "").strip()
        text = _normalized_text(raw.get("text") or raw.get("label") or raw.get("value"))
        if not option_id or not text:
            continue
        options.append({"option_id": option_id, "text": text})
        if answer_key and option_id == answer_key:
            answer_text = text
    return options, answer_key, answer_text


def _published_follow_up(primary: dict[str, Any]) -> dict[str, Any]:
    options, answer_key, answer_text = _canonical_options(primary)
    accepted_variants = [str(item) for item in (primary.get("accepted_variants") or []) if str(item).strip()]
    return {
        "variant_type": str(primary.get("variant_type") or "typed_recall"),
        "prompt": _normalized_text(primary.get("prompt")),
        "options": options,
        "blank_template": _normalized_text(primary.get("blank_template")),
        "context_text": _normalized_text(primary.get("context_text")),
        "stimulus_text": _normalized_text(primary.get("stimulus_text")),
        "answer_key": answer_key,
        "answer_text": answer_text,
        "accepted_variants": accepted_variants,
        "evaluation_mode": str(primary.get("evaluation_mode") or ("option_id" if options else "normalized_text")),
    }


def _looks_like_meaning_prompt(value: Any) -> bool:
    prompt = _normalized_text(value).lower()
    return any(token in prompt for token in (
        "mitä tämä sana tarkoittaa",
        "mika tama sana tarkoittaa",
        "what does this word mean",
        "meaning in context",
    ))


def _is_bad_identical_answer(front: str, answer: str, prompt: str) -> bool:
    if not front or not answer:
        return False
    if _normalized_text(front).lower() != _normalized_text(answer).lower():
        return False
    return _looks_like_meaning_prompt(prompt)


def _runtime_from_aps(item: dict[str, Any], source_file: Path, index: int, parts: tuple[str, ...]) -> dict[str, Any] | None:
    content = item.get("content") or {}
    if not isinstance(content, dict):
        return None
    raw_path = item.get("path") or (parts[0] if parts else "general")
    path_value = _normalized_path_value(raw_path)
    profession = _normalized_profession(item.get("profession"), path_value=path_value, raw_path=raw_path)
    level_band = _normalize_level_band(item.get("level_band") or _level_band_from_path(parts))
    raw_content_type = str(item.get("content_type") or "").strip()
    content_type = raw_content_type if raw_content_type in SUPPORTED_CONTENT_TYPES else _content_type_from_path(parts)

    front_info = content.get("front") or {}
    back_info = content.get("back") or {}
    if not isinstance(front_info, dict):
        front_info = {"text": front_info}
    if not isinstance(back_info, dict):
        back_info = {"text": back_info}
    follow_ups = content.get("follow_ups") or []
    primary = follow_ups[0] if follow_ups and isinstance(follow_ups[0], dict) else {}
    follow_up = _published_follow_up(primary)

    if content_type == "vocabulary_card":
        front = _normalized_text(front_info.get("term") or front_info.get("word") or front_info.get("text"))
        back = _normalized_text(back_info.get("gloss") or back_info.get("translation") or back_info.get("text"))
        if not follow_up["prompt"]:
            follow_up["prompt"] = _normalized_text(back_info.get("recall_prompt") or f"What does '{front}' mean?")
        if _is_bad_identical_answer(front, back, follow_up["prompt"]):
            return None
        choices = [opt["text"] for opt in follow_up["options"]] or None
        accepted_answers = [back] if back else []
        answer_value = follow_up["answer_text"] or back
        hint = _normalized_text(back_info.get("usage_note") or back_info.get("example") or "")
        explanation = _normalized_text(back_info.get("explanation") or back_info.get("translation") or back)
    elif content_type in {"sentence_card", "phrase_card"}:
        front = _normalized_text(back_info.get("expected_sentence") or front_info.get("sentence") or front_info.get("text"))
        if not front:
            return None
        back = _normalized_text(back_info.get("translation_hint") or back_info.get("gloss") or back_info.get("translation") or back_info.get("text") or "")
        if not follow_up["prompt"]:
            follow_up["prompt"] = back or "Kirjoita tai valitse oikea suomenkielinen lause."
        choices = [opt["text"] for opt in follow_up["options"]] or None
        accepted_answers = [front]
        answer_value = follow_up["answer_text"] or _normalized_text(primary.get("answer_key") or front)
        hint = _normalized_text(back_info.get("usage_note") or back_info.get("translation_hint") or "")
        explanation = _normalized_text(back_info.get("translation") or back_info.get("gloss") or "")
        content_type = "sentence_card"
    else:
        front = _normalized_text(front_info.get("example") or front_info.get("pattern") or front_info.get("term") or front_info.get("text"))
        if not front:
            return None
        back = _normalized_text(back_info.get("rule_summary") or back_info.get("target_form") or back_info.get("gloss") or back_info.get("text"))
        if not follow_up["prompt"]:
            follow_up["prompt"] = _normalized_text(back_info.get("recall_prompt") or "Valitse tai kirjoita oikea vastaus.")
        choices = [opt["text"] for opt in follow_up["options"]] or None
        accepted_answers = [back] if back else []
        answer_value = follow_up["answer_text"] or _normalized_text(primary.get("answer_key") or back)
        hint = _normalized_text(back_info.get("usage_note") or back_info.get("example") or "")
        explanation = _normalized_text(back_info.get("explanation") or back_info.get("rule_summary") or back)

    if follow_up["answer_text"] and follow_up["answer_text"] not in accepted_answers:
        accepted_answers.append(follow_up["answer_text"])
    for value in follow_up["accepted_variants"]:
        if value not in accepted_answers:
            accepted_answers.append(value)
    if not front or not follow_up["prompt"] or not accepted_answers:
        return None

    return {
        "id": str(item.get("id") or f"canonical::{source_file.stem}::{index}"),
        "mode": _mode_for_content_type(content_type),
        "front": front,
        "prompt": follow_up["prompt"],
        "accepted_answers": accepted_answers,
        "choices": choices,
        "explanation": explanation,
        "hint": hint,
        "cefr": level_band.replace("_", "-"),
        "domain": path_value,
        "profession": profession,
        "content_type": content_type,
        "follow_up": follow_up,
        "follow_up_prompt": follow_up["prompt"],
        "answer_value": answer_value,
        "blank_template": follow_up.get("blank_template"),
        "variant_type": follow_up.get("variant_type") or "typed_recall",
        "path": path_value,
        "level_band": level_band,
        "_source_path": str(source_file),
    }


def _runtime_from_compiled_card(item: dict[str, Any], source_file: Path, index: int) -> dict[str, Any] | None:
    raw_path = item.get("path") or item.get("domain") or "general"
    raw_content_type = str(item.get("content_type") or "").strip()
    content_type = raw_content_type if raw_content_type in SUPPORTED_CONTENT_TYPES else "vocabulary_card"
    path_value = _normalized_path_value(item.get("path") or item.get("domain") or "general")
    profession = _normalized_profession(item.get("profession"), path_value=path_value, raw_path=raw_path)
    level_band = _normalize_level_band(item.get("level_band") or item.get("cefr") or "B1_B2")
    front = _normalized_text(item.get("word") or item.get("front_text") or item.get("front") or item.get("term"))
    answer = _normalized_text(item.get("_answer_value") or item.get("answer") or item.get("meaning") or item.get("back"))
    prompt = _normalized_text(item.get("back_prompt") or item.get("prompt") or f"What does '{front}' mean?")
    if not front or not answer or _is_bad_identical_answer(front, answer, prompt):
        return None
    raw_options = item.get("served_follow_up", {}).get("options") if isinstance(item.get("served_follow_up"), dict) else item.get("options")
    choices = []
    if isinstance(raw_options, list):
        for option in raw_options:
            if isinstance(option, dict):
                text = _normalized_text(option.get("text") or option.get("label") or option.get("value"))
            else:
                text = _normalized_text(option)
            if text:
                choices.append(text)
    return {
        "id": str(item.get("id") or f"canonical::{source_file.stem}::{index}"),
        "mode": _mode_for_content_type(content_type),
        "front": front,
        "prompt": prompt,
        "accepted_answers": [answer, *[str(v) for v in item.get("_accepted_variants", []) if str(v).strip() and str(v) != answer]],
        "choices": choices or None,
        "explanation": _normalized_text(item.get("explanation") or answer),
        "hint": _normalized_text(item.get("hint") or item.get("example") or ""),
        "cefr": level_band.replace("_", "-"),
        "domain": path_value,
        "profession": profession,
        "content_type": content_type,
        "follow_up": item.get("served_follow_up") if isinstance(item.get("served_follow_up"), dict) else {"variant_type": "recognition" if choices else "typed_recall", "prompt": prompt, "options": [], "accepted_variants": [answer], "evaluation_mode": "normalized_text"},
        "follow_up_prompt": prompt,
        "answer_value": answer,
        "blank_template": None,
        "variant_type": "recognition" if choices else "typed_recall",
        "path": path_value,
        "level_band": level_band,
        "_source_path": str(source_file),
    }


@lru_cache(maxsize=1)
def load_authority_cards() -> list[dict[str, Any]]:
    cards_by_id: dict[str, dict[str, Any]] = {}
    for item, source_file, index, relative_parts in _iter_canonical_items():
        runtime_card = _runtime_from_aps(item, source_file, index, relative_parts)
        if runtime_card is None:
            runtime_card = _runtime_from_compiled_card(item, source_file, index)
        if runtime_card is not None:
            cards_by_id[runtime_card["id"]] = runtime_card
    return sorted(cards_by_id.values(), key=lambda card: card["id"])


@lru_cache(maxsize=1)
def load_runtime_bank() -> list[CardRecord]:
    return [
        CardRecord(
            id=card["id"],
            mode=card["mode"],
            front=card["front"],
            prompt=card["prompt"],
            accepted_answers=list(card.get("accepted_answers") or []),
            choices=card.get("choices"),
            explanation=card.get("explanation"),
            hint=card.get("hint"),
            cefr=card.get("cefr"),
            domain=card.get("domain"),
            profession=card.get("profession"),
            content_type=card.get("content_type"),
        )
        for card in load_authority_cards()
    ]
