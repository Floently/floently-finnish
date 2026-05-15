from __future__ import annotations

from functools import lru_cache
from pathlib import Path
import json
from typing import Any

try:
    from app.core.paths import CARD_BANK_CANONICAL_DIR
except Exception:
    CARD_BANK_CANONICAL_DIR = Path(__file__).resolve().parents[2] / "card_bank" / "canonical_bank"

OVERLAY_ROOT = CARD_BANK_CANONICAL_DIR.parent / "overlays"

LANGUAGE_FILE_ALIASES = {
    "zh": "zh-Hans",
    "zh_hans": "zh-Hans",
    "zh-hans": "zh-Hans",
    "tl": "fil",
    "tagalog": "fil",
    "fil": "fil",
}

CONTENT_TYPE_BUCKET = {
    "vocabulary_card": "vocabulary",
    "sentence_card": "sentences",
    "phrase_card": "sentences",
    "grammar_card": "grammar",
}


def normalize_ui_language(value: Any) -> str | None:
    raw = str(value or "").strip()
    if not raw:
        return None

    normalized = raw.replace("_", "-")
    short = normalized.split("-")[0].lower()

    if short in {"", "none", "null", "undefined"}:
        return None

    return LANGUAGE_FILE_ALIASES.get(short) or LANGUAGE_FILE_ALIASES.get(normalized.lower()) or short


def _level_file(value: Any) -> str:
    raw = str(value or "B1_B2").strip().lower().replace("-", "_")
    if raw in {"a1", "a2", "a1_a2"}:
        return "a1_a2"
    if raw in {"b1", "b2", "b1_b2"}:
        return "b1_b2"
    if raw in {"c1", "c2", "c1_c2"}:
        return "c1_c2"
    return raw or "b1_b2"


def _profession_slug(card: dict[str, Any]) -> str:
    raw = card.get("profession")
    if isinstance(raw, dict):
        raw = raw.get("slug") or raw.get("label") or raw.get("track")
    slug = str(raw or "").strip().lower().replace(" ", "_").replace("-", "_")
    if slug in {"", "none", "general"}:
        return "none"
    if slug in {"lahioitaja", "lähihoitaja", "practical-nurse"}:
        return "practical_nurse"
    return slug


def _track(card: dict[str, Any]) -> str:
    path = str(card.get("path") or "").strip().lower().replace("\\", "/")
    if path == "professional" or path.startswith("professional/"):
        return "professional"
    profession = _profession_slug(card)
    if profession not in {"", "none", "general"}:
        return "professional"
    return "general"


def _bucket(card: dict[str, Any]) -> str:
    content_type = str(card.get("content_type") or "").strip().lower()
    if content_type in CONTENT_TYPE_BUCKET:
        return CONTENT_TYPE_BUCKET[content_type]

    mode = str(card.get("mode") or "").strip().lower()
    if mode == "grammar":
        return "grammar"
    if mode in {"phrases", "sentences"}:
        return "sentences"
    return "vocabulary"


def _overlay_file_for(card: dict[str, Any], language: str) -> Path:
    track = _track(card)
    bucket = _bucket(card)
    level = _level_file(card.get("level_band") or card.get("cefr"))

    if track == "professional":
        profession = _profession_slug(card)
        if profession in {"", "none", "general"}:
            profession = "nurse"
        return OVERLAY_ROOT / "professional" / profession / bucket / level / f"{language}.json"

    return OVERLAY_ROOT / "general" / bucket / level / f"{language}.json"


def _iter_overlay_rows(value: Any, inherited_card_id: str | None = None):
    """Yield overlay row dictionaries from list-root or object-root overlay JSON.

    Supports:
    - [row, row, ...]
    - {"items": [row, ...]} / {"rows": [row, ...]} / {"translations": [row, ...]}
    - {"card.id": [row, ...]}
    - nested object roots used by generated overlay artifacts
    """
    if isinstance(value, list):
        for item in value:
            yield from _iter_overlay_rows(item, inherited_card_id)
        return

    if not isinstance(value, dict):
        return

    card_id = str(value.get("card_id") or value.get("id") or inherited_card_id or "").strip()

    # This is already a row-like overlay record.
    if (
        ("field_path" in value or "field_role" in value)
        and ("localized_text" in value or "source_text" in value or "source_hash" in value)
    ):
        row = dict(value)
        if card_id and not row.get("card_id"):
            row["card_id"] = card_id
        yield row
        return

    # Common wrapper keys.
    for key in ("items", "rows", "entries", "translations", "overlays", "data", "records"):
        child = value.get(key)
        if isinstance(child, (list, dict)):
            yield from _iter_overlay_rows(child, card_id or inherited_card_id)

    # Card-id keyed dicts and other nested structures.
    skip_keys = {
        "language",
        "target_language",
        "catalog_rel",
        "source_file",
        "created_at_utc",
        "stage",
        "summary",
        "counts",
        "metadata",
    }
    for key, child in value.items():
        if key in skip_keys:
            continue
        next_card_id = card_id or inherited_card_id
        if isinstance(key, str) and key.startswith("card."):
            next_card_id = key
        if isinstance(child, (list, dict)):
            yield from _iter_overlay_rows(child, next_card_id)


@lru_cache(maxsize=512)
def _load_overlay_by_file(path_str: str) -> dict[str, list[dict[str, Any]]]:
    path = Path(path_str)
    if not path.exists():
        return {}

    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}

    grouped: dict[str, list[dict[str, Any]]] = {}

    for item in _iter_overlay_rows(raw):
        if not isinstance(item, dict):
            continue

        card_id = str(item.get("card_id") or item.get("id") or "").strip()
        localized_text = str(item.get("localized_text") or "").strip()

        if not card_id or not localized_text:
            continue

        grouped.setdefault(card_id, []).append(item)

    return grouped



def _set_follow_up_prompt(card: dict[str, Any], text: str) -> None:
    card["prompt"] = text
    card["follow_up_prompt"] = text
    served = card.get("served_follow_up")
    if isinstance(served, dict):
        served["prompt"] = text
    follow_up = card.get("follow_up")
    if isinstance(follow_up, dict):
        follow_up["prompt"] = text


def _set_option_text(card: dict[str, Any], option_id: str | None, option_index: Any, text: str) -> bool:
    changed = False

    def patch_options(options: Any) -> bool:
        local_changed = False
        if not isinstance(options, list):
            return False

        wanted_index: int | None = None
        try:
            wanted_index = int(option_index) if option_index is not None else None
        except Exception:
            wanted_index = None

        for index, option in enumerate(options):
            if not isinstance(option, dict):
                continue
            current_id = str(option.get("option_id") or option.get("id") or "").strip()
            id_matches = bool(option_id and current_id == option_id)
            index_matches = bool(wanted_index is not None and index == wanted_index)
            if id_matches or index_matches:
                option["text"] = text
                local_changed = True
        return local_changed

    served = card.get("served_follow_up")
    if isinstance(served, dict):
        changed = patch_options(served.get("options")) or changed
        if option_id and str(served.get("answer_key") or "").strip() == option_id:
            served["answer_text"] = text

    follow_up = card.get("follow_up")
    if isinstance(follow_up, dict):
        changed = patch_options(follow_up.get("options")) or changed
        if option_id and str(follow_up.get("answer_key") or "").strip() == option_id:
            follow_up["answer_text"] = text

    if changed:
        served_options = served.get("options") if isinstance(served, dict) else None
        if isinstance(served_options, list):
            card["choices"] = [
                str(option.get("text") or "").strip()
                for option in served_options
                if isinstance(option, dict) and str(option.get("text") or "").strip()
            ]

    return changed



GRAMMAR_EXAMPLE_PROMPTS = {
    "ar": "ماذا يعبّر هذا المثال؟",
    "bn": "এই উদাহরণটি কী প্রকাশ করে?",
    "en": "What does this example express?",
    "es": "¿Qué expresa este ejemplo?",
    "et": "Mida see näide väljendab?",
    "fa": "این مثال چه چیزی را بیان می‌کند؟",
    "fi": "Mitä tämä esimerkki ilmaisee?",
    "fil": "Ano ang ipinapahayag ng halimbawang ito?",
    "ku": "Ev mînak çi diyar dike?",
    "ne": "यो उदाहरणले के जनाउँछ?",
    "ru": "Что выражает этот пример?",
    "so": "Muxuu tusaalahan muujinayaa?",
    "sq": "Çfarë shpreh ky shembull?",
    "sv": "Vad uttrycker det här exemplet?",
    "th": "ตัวอย่างนี้แสดงความหมายว่าอะไร?",
    "tr": "Bu örnek ne ifade ediyor?",
    "uk": "Що виражає цей приклад?",
    "ur": "یہ مثال کیا ظاہر کرتی ہے؟",
    "vi": "Ví dụ này thể hiện điều gì?",
    "zh-Hans": "这个例子表达什么意思？",
}

BEST_MEANING_PROMPTS = {
    "ar": "اختر أفضل معنى.",
    "bn": "সেরা অর্থটি বেছে নিন।",
    "en": "Choose the best meaning.",
    "es": "Elige el mejor significado.",
    "et": "Vali parim tähendus.",
    "fa": "بهترین معنی را انتخاب کنید.",
    "fi": "Valitse paras merkitys.",
    "fil": "Piliin ang pinakaangkop na kahulugan.",
    "ku": "Wateya herî baş hilbijêre.",
    "ne": "सबैभन्दा राम्रो अर्थ छान्नुहोस्।",
    "ru": "Выберите наиболее подходящее значение.",
    "so": "Dooro macnaha ugu habboon.",
    "sq": "Zgjidh kuptimin më të përshtatshëm.",
    "sv": "Välj den bästa betydelsen.",
    "th": "เลือกความหมายที่เหมาะสมที่สุด",
    "tr": "En uygun anlamı seç.",
    "uk": "Виберіть найкраще значення.",
    "ur": "سب سے مناسب معنی منتخب کریں۔",
    "vi": "Chọn nghĩa phù hợp nhất.",
    "zh-Hans": "选择最合适的意思。",
}

FINNISH_SENTENCE_PROMPTS = {
    "ar": "ماذا تعني هذه الجملة الفنلندية؟",
    "bn": "এই ফিনিশ বাক্যটির অর্থ কী?",
    "en": "What does this Finnish sentence mean?",
    "es": "¿Qué significa esta oración en finés?",
    "et": "Mida see soomekeelne lause tähendab?",
    "fa": "این جمله فنلاندی چه معنی دارد؟",
    "fi": "Mitä tämä suomenkielinen lause tarkoittaa?",
    "fil": "Ano ang ibig sabihin ng pangungusap na ito sa Finnish?",
    "ku": "Ev hevoka fînî çi tê wateyê?",
    "ne": "यो फिनिश वाक्यको अर्थ के हो?",
    "ru": "Что означает это финское предложение?",
    "so": "Waa maxay macnaha jumladdan Finnish-ka ah?",
    "sq": "Çfarë do të thotë kjo fjali në finlandisht?",
    "sv": "Vad betyder den här finska meningen?",
    "th": "ประโยคภาษาฟินแลนด์นี้หมายความว่าอะไร?",
    "tr": "Bu Fince cümle ne anlama geliyor?",
    "uk": "Що означає це фінське речення?",
    "ur": "اس فِنّش جملے کا کیا مطلب ہے؟",
    "vi": "Câu tiếng Phần Lan này có nghĩa là gì?",
    "zh-Hans": "这个芬兰语句子是什么意思？",
}


def _localize_generic_prompt_text(prompt: Any, language: str) -> str | None:
    text = str(prompt or "").strip()
    if not text or language == "en":
        return None

    grammar_prefix = "What does this example express?"
    if text == grammar_prefix:
        return GRAMMAR_EXAMPLE_PROMPTS.get(language)

    if text.startswith(grammar_prefix + " "):
        example = text[len(grammar_prefix):].strip()
        template = GRAMMAR_EXAMPLE_PROMPTS.get(language)
        if template:
            return f"{template} {example}".strip()

    best = "Choose the best meaning."
    if text == best:
        return BEST_MEANING_PROMPTS.get(language)

    sentence = "What does this Finnish sentence mean?"
    if text == sentence:
        return FINNISH_SENTENCE_PROMPTS.get(language)

    return None


def _apply_generic_prompt_fallback(card: dict[str, Any], language: str) -> bool:
    served = card.get("served_follow_up")
    current = ""

    if isinstance(served, dict):
        current = str(served.get("prompt") or "").strip()

    if not current:
        current = str(card.get("prompt") or "").strip()

    localized = _localize_generic_prompt_text(current, language)

    if not localized or localized == current:
        return False

    _set_follow_up_prompt(card, localized)
    card["generic_prompt_fallback_applied"] = True
    card["generic_prompt_fallback_language"] = language
    return True

def apply_runtime_card_overlay(card: dict[str, Any], *, ui_language: Any) -> dict[str, Any]:
    language = normalize_ui_language(ui_language)

    card["ui_language"] = language or None
    card["overlay_applied"] = False
    card["overlay_language"] = None
    card["overlay_item_count"] = 0

    if not language:
        return card

    overlay_path = _overlay_file_for(card, language)
    try:
        card["overlay_catalog_path"] = str(overlay_path.relative_to(CARD_BANK_CANONICAL_DIR.parent))
    except ValueError:
        card["overlay_catalog_path"] = str(overlay_path)

    entries = _load_overlay_by_file(str(overlay_path)).get(str(card.get("id") or "").strip(), [])
    if not entries:
        _apply_generic_prompt_fallback(card, language)
        return card

    applied = 0
    localized_option_count = 0
    served_for_count = card.get("served_follow_up")
    served_options_for_count = served_for_count.get("options") if isinstance(served_for_count, dict) else None
    option_count = len(served_options_for_count) if isinstance(served_options_for_count, list) else 0

    for entry in entries:
        text = str(entry.get("localized_text") or "").strip()
        if not text:
            continue

        field_path = str(entry.get("field_path") or "").strip()
        field_role = str(entry.get("field_role") or "").strip()
        option_id = str(entry.get("option_id") or "").strip() or None
        option_index = entry.get("option_index")

        is_option_field = bool(
            option_id
            or ".options." in field_path
            or ".options[" in field_path
            or "options[" in field_path
            or field_role == "mcq_option_text"
        )
        if is_option_field:
            if _set_option_text(card, option_id, option_index, text):
                applied += 1
                localized_option_count += 1
            continue

        if field_role in {"recall_prompt", "prompt", "follow_up_prompt"} or field_path.endswith(".prompt"):
            if "content.back.recall_prompt" in field_path:
                card["back_prompt"] = text
            _set_follow_up_prompt(card, text)
            applied += 1
            continue

        if field_path in {"content.explanation.summary", "content.back.explanation"} or field_role in {"explanation", "summary"}:
            card["explanation"] = text
            applied += 1
            continue

        if field_path in {"content.front.usage", "content.back.usage_note"} or field_role in {"usage", "usage_note", "hint"}:
            card["hint"] = text
            applied += 1
            continue

        if field_path == "content.front.pattern" and str(card.get("content_type") or "") == "grammar_card":
            card["front"] = text
            card["front_text"] = text
            applied += 1
            continue

        if field_path == "content.back.gloss":
            card["localized_answer_text"] = text
            applied += 1
            continue

    card["overlay_applied"] = applied > 0
    card["overlay_language"] = language if applied > 0 else None
    card["overlay_item_count"] = applied
    card["overlay_option_count"] = option_count
    card["overlay_localized_option_count"] = localized_option_count
    card["overlay_incomplete"] = bool(language and option_count > 0 and localized_option_count < option_count)
    # If an overlay file exists but does not localize a generic prompt wrapper,
    # still localize common built-in prompt templates.
    if not card.get("generic_prompt_fallback_applied"):
        _apply_generic_prompt_fallback(card, language)

    return card
