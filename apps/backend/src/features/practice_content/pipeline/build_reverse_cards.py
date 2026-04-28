import json

from ..paths import PATTERN_SENTENCE_MAP_JSON, SENTENCE_CARD_SET_DIR, ensure_standard_dirs

def main() -> None:
    ensure_standard_dirs()
    pattern_map = json.loads(PATTERN_SENTENCE_MAP_JSON.read_text(encoding="utf-8"))

    cards = []
    card_id = 1
    for pattern, sentences in pattern_map.items():
        cards.append(
            {
                "id": card_id,
                "pattern": pattern,
                "question": "Write a sentence using this grammar pattern",
                "examples": sentences,
            }
        )
        card_id += 1

    out = SENTENCE_CARD_SET_DIR / "reverse_cards.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"reverse cards generated: {out}")
    print(f"total cards: {len(cards)}")

if __name__ == "__main__":
    main()
