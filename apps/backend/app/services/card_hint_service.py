from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.core.config import SETTINGS


LANGUAGE_NAMES = {
    "en": "English",
    "fi": "Finnish",
    "sv": "Swedish",
    "ar": "Arabic",
    "bn": "Bengali",
    "es": "Spanish",
    "et": "Estonian",
    "fa": "Persian",
    "fil": "Tagalog",
    "tl": "Tagalog",
    "ku": "Kurdish",
    "ne": "Nepali",
    "ru": "Russian",
    "so": "Somali",
    "sq": "Albanian",
    "th": "Thai",
    "tr": "Turkish",
    "uk": "Ukrainian",
    "ur": "Urdu",
    "vi": "Vietnamese",
    "zh": "Simplified Chinese",
    "zh-Hans": "Simplified Chinese",
}


def _normalize_language(value: str | None) -> str:
    raw = str(value or "en").strip()
    if not raw:
        return "en"
    short = raw.replace("_", "-").split("-")[0].lower()
    if short == "tl":
        return "fil"
    if short == "zh":
        return "zh-Hans"
    return short


def _clean_text(value: Any) -> str:
    return " ".join(str(value or "").strip().split())


def _clean_hint(text: str) -> str:
    cleaned = _clean_text(text)
    cleaned = re.sub(r"^(hint|vihje|tips|tلميح)\s*:\s*", "", cleaned, flags=re.I).strip()
    if len(cleaned) > 360:
        cleaned = cleaned[:357].rstrip() + "..."
    return cleaned


def _wordish(value: str) -> set[str]:
    return {
        token.lower()
        for token in re.findall(r"[\wåäöÅÄÖ'-]+", str(value or ""), flags=re.UNICODE)
        if len(token) >= 3
    }


def _looks_broken(*, front_text: str, prompt: str, options: list[str], correct_answer: str | None) -> tuple[bool, str | None]:
    front = _clean_text(front_text)
    question = _clean_text(prompt)
    opts = [_clean_text(o) for o in options if _clean_text(o)]

    if not front or not question:
        return True, "missing_prompt_or_front"

    if len(opts) >= 2:
        lowered = [o.lower() for o in opts]
        if len(set(lowered)) != len(lowered):
            return True, "duplicate_options"

    answer = _clean_text(correct_answer)
    if answer and opts and answer.lower() not in {o.lower() for o in opts}:
        # This is a warning, not necessarily a blocker, because typed recall
        # may not use MCQ options.
        return False, "answer_not_in_options"

    return False, None


def _local_hint(
    *,
    front_text: str,
    prompt: str,
    content_type: str | None,
    ui_language: str,
    quality_warning: str | None = None,
) -> str:
    front = _clean_text(front_text)
    ctype = str(content_type or "").lower()

    if quality_warning in {"missing_prompt_or_front", "duplicate_options"}:
        if ui_language == "fi":
            return "Tämä kortti saattaa vaatia tarkistusta. Yritä päätellä vastaus asiayhteydestä ja ilmoita kortista, jos vaihtoehdot eivät sovi kysymykseen."
        return "This card may need review. Try to reason from the context, and report it if the options do not match the question."

    if "grammar" in ctype:
        if ui_language == "fi":
            return f"Katso muotoa “{front}”. Mieti sijamuotoa, verbimuotoa tai sanajärjestystä ennen kuin valitset vastauksen."
        if ui_language == "sv":
            return f"Titta på formen “{front}”. Fundera på kasus, verbform eller ordföljd innan du svarar."
        return f"Look at the form “{front}”. Focus on case, verb form, or word order before choosing."

    if "sentence" in ctype or "phrase" in ctype:
        if ui_language == "fi":
            return f"Lue koko ilmaus “{front}”. Mieti tilannetta ja lauseen rakennetta, ei vain yksittäistä sanaa."
        if ui_language == "sv":
            return f"Läs hela uttrycket “{front}”. Tänk på situationen och satsens struktur, inte bara ett ord."
        return f"Read the whole expression “{front}”. Think about the situation and sentence structure, not only one word."

    if ui_language == "fi":
        return f"Katso sanaa “{front}”. Mieti sanaluokkaa, käyttötilannetta ja lähellä olevia merkityksiä."
    if ui_language == "sv":
        return f"Titta på ordet “{front}”. Fundera på ordklass, användningssituation och närliggande betydelser."
    if ui_language == "ar":
        return f"انظر إلى الكلمة “{front}”. فكّر في نوع الكلمة والسياق الذي تُستخدم فيه دون اختيار الترجمة مباشرة."
    return f"Look at “{front}”. Think about its part of speech, usage context, and nearby meanings."


def _leaks_answer(hint: str, correct_answer: str | None, options: list[str]) -> bool:
    hint_words = _wordish(hint)
    answer = _clean_text(correct_answer)
    if answer and _wordish(answer) and _wordish(answer).issubset(hint_words):
        return True

    # If the full text of an option appears in the hint, it can leak the answer.
    for option in options:
        opt = _clean_text(option)
        if len(opt) >= 4 and opt.lower() in hint.lower():
            return True

    return False


def _looks_wrong_ui_language(hint: str, ui_language: str) -> bool:
    """Best-effort guard for obvious wrong-language OpenAI hints.

    This is intentionally conservative. Finnish card content may appear inside
    an English UI hint, so we do not reject based on ä/ö alone. We only reject
    when the instructional wording itself appears to be in the wrong language.
    """
    text = _clean_text(hint).lower()
    if not text:
        return False

    if ui_language == "en":
        finnish_instruction_markers = {
            "tarkastele",
            "mieti",
            "katso",
            "lue",
            "suomeksi",
            "vastausta",
            "vastaus",
            "ennen",
            "miten",
            "liittyy",
            "annettuihin",
            "esimerkkeihin",
            "muotoa",
            "sijamuotoa",
            "verbimuotoa",
            "sanajärjestystä",
            "tilannetta",
            "lauseen",
            "rakennetta",
            "sanaa",
            "sanaluokkaa",
            "käyttötilannetta",
            "merkityksiä",
        }
        words = _wordish(text)
        return len(words.intersection(finnish_instruction_markers)) >= 2

    if ui_language == "fi":
        english_instruction_markers = {
            "look",
            "think",
            "focus",
            "choose",
            "answer",
            "word",
            "sentence",
            "context",
            "meaning",
            "form",
            "structure",
            "before",
        }
        words = _wordish(text)
        return len(words.intersection(english_instruction_markers)) >= 3

    return False


def generate_card_coach_hint(
    *,
    user_id: str,
    card_id: str,
    front_text: str,
    prompt: str,
    content_type: str | None = None,
    ui_language: str | None = None,
    existing_hint: str | None = None,
    correct_answer: str | None = None,
    options: list[str] | None = None,
) -> dict[str, Any]:
    language = _normalize_language(ui_language)
    language_name = LANGUAGE_NAMES.get(language, "English")
    option_list = [_clean_text(o) for o in (options or []) if _clean_text(o)]

    broken, warning = _looks_broken(
        front_text=front_text,
        prompt=prompt,
        options=option_list,
        correct_answer=correct_answer,
    )

    fallback = existing_hint or _local_hint(
        front_text=front_text,
        prompt=prompt,
        content_type=content_type,
        ui_language=language,
        quality_warning=warning,
    )

    # Do not spend OpenAI calls on obviously broken cards.
    if broken:
        return {
            "hint": _clean_hint(fallback),
            "provider": "local",
            "quality_warning": warning,
            "card_id": card_id,
        }

    api_key = str(getattr(SETTINGS, "openai_api_key", "") or "").strip()
    if not api_key:
        return {
            "hint": _clean_hint(fallback),
            "provider": "local",
            "reason": "openai_not_configured",
            "quality_warning": warning,
            "card_id": card_id,
        }

    model = str(getattr(SETTINGS, "openai_model", "") or "gpt-4o-mini").strip() or "gpt-4o-mini"

    system_prompt = (
        "You are Floently's Finnish learning coach. "
        "Write one practical hint for a Finnish-learning card. "
        "The hint must guide thinking without revealing the answer. "
        "Do not include the correct answer text. "
        "Do not copy any option text. "
        "Do not mention OpenAI, JSON, policies, or being an AI. "
        "Do not use markdown. "
        "Return only the hint text in the requested UI language."
    )

    user_payload = {
        "target_ui_language": language_name,
        "card_id": card_id,
        "front_text": _clean_text(front_text),
        "prompt": _clean_text(prompt),
        "content_type": content_type,
        "correct_answer_do_not_reveal": _clean_text(correct_answer),
        "options_do_not_copy": option_list,
        "local_safe_hint": _clean_text(fallback),
        "quality_warning": warning,
        "requirements": [
            "Maximum 2 short sentences.",
            "Do not reveal the correct answer.",
            "Do not copy answer option text.",
            "Be specific to the Finnish word, sentence, or grammar point.",
            "For vocabulary: mention usage area, word class, or context.",
            "For grammar: mention what form or structure to inspect.",
            "For sentence/phrase: mention situation and meaning direction.",
        ],
    }

    try:
        with httpx.Client(timeout=12.0) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "temperature": 0.2,
                    "max_tokens": 100,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
                    ],
                },
            )
            response.raise_for_status()
            data = response.json()
            hint = _clean_hint(data["choices"][0]["message"]["content"])

            if not hint:
                raise ValueError("empty_hint")

            if _leaks_answer(hint, correct_answer, option_list):
                return {
                    "hint": _clean_hint(fallback),
                    "provider": "local",
                    "reason": "openai_answer_leak_guard",
                    "model": model,
                    "quality_warning": warning,
                    "card_id": card_id,
                }

            if _looks_wrong_ui_language(hint, language):
                return {
                    "hint": _clean_hint(fallback),
                    "provider": "local",
                    "reason": "openai_wrong_language_guard",
                    "model": model,
                    "quality_warning": warning,
                    "card_id": card_id,
                }

            return {
                "hint": hint,
                "provider": "openai",
                "model": model,
                "quality_warning": warning,
                "card_id": card_id,
            }

    except Exception as exc:
        return {
            "hint": _clean_hint(fallback),
            "provider": "local",
            "reason": f"openai_failed:{type(exc).__name__}",
            "quality_warning": warning,
            "card_id": card_id,
        }
