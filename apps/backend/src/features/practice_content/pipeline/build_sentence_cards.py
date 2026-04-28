import hashlib
import json

from ..linguistics.level_estimator import estimate_level
from ..linguistics.spoken_vs_standard import detect_spoken
from ..paths import CLEAN_SENTENCES_JSON, SENTENCE_CARD_SET_DIR, ensure_standard_dirs

CARDS_PER_FILE = 200

def make_id(sentence: str) -> str:
    return hashlib.sha1(sentence.encode("utf-8")).hexdigest()[:16]

def flush(level: str, cards, file_index: int) -> None:
    out_dir = SENTENCE_CARD_SET_DIR / level
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"sentence_cards_{file_index:04d}.json"
    path.write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding="utf-8")

def main() -> None:
    ensure_standard_dirs()
    data = json.loads(CLEAN_SENTENCES_JSON.read_text(encoding="utf-8"))

    buffers = {"A1_A2": [], "B1_B2": [], "C1_C2": []}
    file_indexes = {"A1_A2": 1, "B1_B2": 1, "C1_C2": 1}

    for row in data:
        sentence = str(row["fi"]).strip()
        level = estimate_level(sentence)

        card = {
            "id": make_id(sentence),
            "version": "3.2.0",
            "task_type": "sentence_card_set",
            "language": "fi",
            "level_band": level,
            "sentence": sentence,
            "translation_en": str(row.get("en", "")).strip(),
            "spoken": detect_spoken(sentence),
        }

        buffers[level].append(card)
        if len(buffers[level]) >= CARDS_PER_FILE:
            flush(level, buffers[level], file_indexes[level])
            buffers[level] = []
            file_indexes[level] += 1

    for level, cards in buffers.items():
        if cards:
            flush(level, cards, file_indexes[level])

    print(f"sentence cards generated in: {SENTENCE_CARD_SET_DIR}")

if __name__ == "__main__":
    main()
