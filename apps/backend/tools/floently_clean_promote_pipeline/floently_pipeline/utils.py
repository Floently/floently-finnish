from __future__ import annotations

import hashlib
import json
import os
import re
import unicodedata
from pathlib import Path
from typing import Any, Iterable


FINNISH_CHAR_MAP = str.maketrans({
    'ä': 'a', 'Ä': 'A',
    'ö': 'o', 'Ö': 'O',
    'å': 'a', 'Å': 'A',
    'š': 's', 'Š': 'S',
    'ž': 'z', 'Ž': 'Z',
})


def transliterate_text(value: str) -> str:
    value = value.translate(FINNISH_CHAR_MAP)
    value = unicodedata.normalize('NFKD', value)
    return ''.join(ch for ch in value if not unicodedata.combining(ch))


def slugify(value: str, max_len: int = 64) -> str:
    value = transliterate_text(value.strip().lower())
    value = re.sub(r"\s+", "-", value)
    value = re.sub(r"[^a-z0-9\-._]+", "-", value)
    value = re.sub(r"-+", "-", value).strip("-._")
    return value[:max_len] or "item"


def stable_hash(*parts: str, length: int = 10) -> str:
    joined = "||".join(parts)
    return hashlib.sha1(joined.encode("utf-8")).hexdigest()[:length]


PROFESSION_ALIAS_MAP = {
    "doctor": "doctor",
    "laakari": "doctor",
    "lääkäri": "doctor",
    "nurse": "nurse",
    "sairaanhoitaja": "nurse",
    "practical_nurse": "practical_nurse",
    "practical nurse": "practical_nurse",
    "lahihoitaja": "practical_nurse",
    "lähihoitaja": "practical_nurse",
    "occupational therapy": "occupational_therapy",
    "occupational therapist": "occupational_therapy",
    "occupational_therapy": "occupational_therapy",
    "yki": "general",
    "yki_exam": "general",
    "yki-exam": "general",
    "general": "general",
    "none": "none",
}

def normalize_profession_alias(value: Any) -> str | None:
    if value is None:
        return None
    text = normalize_space(str(value)).lower().replace("/", "_")
    text = text.replace("-", "_")
    text_ascii = transliterate_text(text)
    text_ascii = re.sub(r"\s+", "_", text_ascii)
    text_ascii = re.sub(r"_+", "_", text_ascii).strip("_")
    return PROFESSION_ALIAS_MAP.get(text, PROFESSION_ALIAS_MAP.get(text_ascii, text_ascii or None))

def normalize_content_path(path: str | None, *, content_type: str | None = None, profession: str | None = None) -> str | None:
    if not path:
        return None
    p = normalize_space(str(path)).lower().replace('\\', '/').replace('profession/', 'professional/')
    p = re.sub(r'/+', '/', p).strip('/')
    prof = normalize_profession_alias(profession) if profession else None
    bucket = None
    ctype = (content_type or '').strip()
    if ctype in {'vocabulary_card', 'slang_card', 'word_opposite_card', 'word_similar_in_meaning_card'}:
        bucket = 'vocabulary'
    elif ctype == 'grammar_card':
        bucket = 'grammar'
    elif ctype in {'phrase_card', 'sentence_card', 'idiom_card'}:
        bucket = 'sentences'
    if p.startswith('general'):
        if bucket:
            return f'general/{bucket}'
        return 'general'
    if prof and prof not in {'general', 'none'}:
        if bucket:
            return f'professional/{prof}/{bucket}'
        return f'professional/{prof}'
    return p



def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def file_fast_fingerprint(path: Path) -> dict[str, Any]:
    st = path.stat()
    return {
        "path": str(path.resolve()),
        "size": int(st.st_size),
        "mtime_ns": int(st.st_mtime_ns),
    }


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_json_if_exists(path: Path, default: Any = None) -> Any:
    if path.exists():
        return load_json_file(path)
    return default

def load_json_file(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            rows.append(json.loads(line))
    return rows


def list_input_files(root: Path) -> list[Path]:
    if not root.exists():
        raise FileNotFoundError(f"Input path not found: {root}")
    if root.is_file():
        return [root]
    files: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        suffix = path.suffix.lower()
        if suffix not in {".json", ".jsonl", ".txt"}:
            continue
        files.append(path)
    return sorted(files)


def first_non_null(*values: Any) -> Any:
    for value in values:
        if value is not None:
            return value
    return None


def normalize_space(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def looks_like_sentence(text: str) -> bool:
    text = normalize_space(text)
    return (" " in text) or text.endswith(("?", ".", "!"))


def deep_get(obj: Any, *keys: str) -> Any:
    current = obj
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return None
        current = current[key]
    return current
