import json
import uuid

from ..linguistics.sentence_filters import valid_sentence
from ..linguistics.spoken_vs_standard import detect_spoken, normalize_spoken
from ..paths import CLEAN_SENTENCES_JSON, SPOKEN_TRANSFORM_DIR, ensure_standard_dirs

CARDS_PER_FILE = 200

def make_uuid() -> str:
    return str(uuid.uuid4())

def main() -> None:
    ensure_standard_dirs()
    data = json.loads(CLEAN_SENTENCES_JSON.read_text(encoding="utf-8"))
    SPOKEN_TRANSFORM_DIR.mkdir(parents=True, exist_ok=True)

    buffer = []
    file_index = 1
    processed = 0

    for row in data:
        sentence = str(row["fi"]).strip()

        if not valid_sentence(sentence):
            continue
        if not detect_spoken(sentence):
            continue

        buffer.append(
            {
                "id": make_uuid(),
                "version": "3.2.0",
                "task_type": "spoken_transformation",
                "language": "fi",
                "content": {
                    "spoken": sentence,
                    "standard": normalize_spoken(sentence),
                },
            }
        )

        if len(buffer) >= CARDS_PER_FILE:
            path = SPOKEN_TRANSFORM_DIR / f"spoken_cards_{file_index:04d}.json"
            path.write_text(json.dumps(buffer, ensure_ascii=False, indent=2), encoding="utf-8")
            buffer = []
            file_index += 1

        processed += 1
        if processed % 5000 == 0:
            print(f"processed {processed}")

    if buffer:
        path = SPOKEN_TRANSFORM_DIR / f"spoken_cards_{file_index:04d}.json"
        path.write_text(json.dumps(buffer, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"spoken transformation cards generated in: {SPOKEN_TRANSFORM_DIR}")

if __name__ == "__main__":
    main()
