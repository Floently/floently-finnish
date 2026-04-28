import json
import uuid

from ..paths import FREQUENCY_DICTIONARY_JSON, VOCABULARY_CARD_SET_DIR, ensure_standard_dirs

CARDS_PER_FILE = 200
MAX_WORDS = 20000

def make_uuid() -> str:
    return str(uuid.uuid4())

def main() -> None:
    ensure_standard_dirs()
    words = json.loads(FREQUENCY_DICTIONARY_JSON.read_text(encoding="utf-8"))

    out_dir = VOCABULARY_CARD_SET_DIR / "A1_A2"
    out_dir.mkdir(parents=True, exist_ok=True)

    buffer = []
    file_index = 1

    for entry in words[:MAX_WORDS]:
        buffer.append(
            {
                "id": make_uuid(),
                "version": "3.2.0",
                "task_type": "vocabulary_card_set",
                "level_band": "A1_A2",
                "skill": "vocabulary",
                "language": "fi",
                "content": {
                    "card_front": entry["word"],
                    "card_back_prompt": "Kirjoita merkitys tai käytä sanaa lauseessa.",
                },
            }
        )

        if len(buffer) >= CARDS_PER_FILE:
            path = out_dir / f"vocab_cards_{file_index:04d}.json"
            path.write_text(json.dumps(buffer, ensure_ascii=False, indent=2), encoding="utf-8")
            buffer = []
            file_index += 1

    if buffer:
        path = out_dir / f"vocab_cards_{file_index:04d}.json"
        path.write_text(json.dumps(buffer, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"vocabulary cards generated in: {out_dir}")

if __name__ == "__main__":
    main()
