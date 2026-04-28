import json
import re

from ..paths import CLEAN_SENTENCES_JSON, PARALLEL_CORPUS_JSON, ensure_standard_dirs
from .utils.deduplicator import SentenceDeduplicator

ALLOWED_PATTERN = re.compile(r"[^\w\säöåÄÖÅ-]")

def clean_text(text: str) -> str:
    cleaned = text.strip().lower()
    cleaned = ALLOWED_PATTERN.sub("", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned

def main() -> None:
    ensure_standard_dirs()
    data = json.loads(PARALLEL_CORPUS_JSON.read_text(encoding="utf-8"))
    deduplicator = SentenceDeduplicator()
    clean_data = []

    for row in data:
        fi = clean_text(str(row.get("fi", "")))
        en = clean_text(str(row.get("en", "")))

        if not fi or not en:
            continue
        if len(fi.split()) < 2:
            continue
        if not deduplicator.is_new(fi):
            continue

        clean_data.append({"fi": fi, "en": en})

    CLEAN_SENTENCES_JSON.write_text(
        json.dumps(clean_data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"clean sentences saved: {CLEAN_SENTENCES_JSON}")
    print(f"total rows: {len(clean_data)}")

if __name__ == "__main__":
    main()
