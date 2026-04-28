import hashlib
import json

from ..paths import GRAMMAR_CARD_SET_DIR, SENTENCE_CARD_SET_DIR, UNIFIED_CARDS_JSON, ensure_standard_dirs

def load_json(path):
    return json.loads(path.read_text(encoding="utf-8"))

def generate_id(*parts: str) -> int:
    raw = "|".join(parts)
    return int(hashlib.md5(raw.encode("utf-8")).hexdigest(), 16) % (10**8)

def main() -> None:
    ensure_standard_dirs()
    grammar_cards = load_json(GRAMMAR_CARD_SET_DIR / "grammar_cards.json")
    fill_cards = load_json(SENTENCE_CARD_SET_DIR / "fill_in_blank_cards.json")
    reverse_cards = load_json(SENTENCE_CARD_SET_DIR / "reverse_cards.json")

    unified = []

    for card in grammar_cards:
        card_id = generate_id("mcq", card["sentence"], card["answer"])
        unified.append(
            {
                "id": card_id,
                "type": "mcq",
                "input_type": "choice",
                "front": card["sentence"],
                "back": [card["answer"]],
                "question": card["question"],
                "options": card["options"],
                "pattern": card["answer"],
                "evaluation": "mcq",
                "explanation": card.get("explanation", ""),
            }
        )

    for card in fill_cards:
        card_id = generate_id("fill", card["masked_sentence"], card["answer"])
        unified.append(
            {
                "id": card_id,
                "type": "fill",
                "input_type": "text",
                "front": card["masked_sentence"],
                "back": [card["answer"]],
                "question": card["question"],
                "pattern": card["pattern"],
                "evaluation": "exact_match",
            }
        )

    for card in reverse_cards:
        card_id = generate_id("reverse", card["pattern"])
        unified.append(
            {
                "id": card_id,
                "type": "reverse",
                "input_type": "text",
                "front": card["pattern"],
                "back": card["examples"],
                "question": card["question"],
                "pattern": card["pattern"],
                "evaluation": "reverse_validator",
            }
        )

    UNIFIED_CARDS_JSON.write_text(
        json.dumps(unified, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"unified cards saved: {UNIFIED_CARDS_JSON}")
    print(f"total cards: {len(unified)}")

if __name__ == "__main__":
    main()
