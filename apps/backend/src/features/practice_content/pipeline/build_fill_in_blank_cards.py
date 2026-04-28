import json
import re

from ..paths import MORPHOLOGY_CACHE_JSON, PATTERN_SENTENCE_MAP_JSON, SENTENCE_CARD_SET_DIR, ensure_standard_dirs

def normalize(text: str) -> str:
    return re.sub(r"[^\wäöåÄÖÅ]", "", text.lower())

def mask_sentence(sentence: str, morphology: dict):
    words = sentence.split()

    for index, word in enumerate(words):
        entry = morphology.get(word.lower())
        if entry and "V" in entry.get("tags", []):
            answer = normalize(word)
            masked = words[:]
            masked[index] = "___"
            return " ".join(masked), answer

    return None, None

def main() -> None:
    ensure_standard_dirs()
    pattern_map = json.loads(PATTERN_SENTENCE_MAP_JSON.read_text(encoding="utf-8"))
    morphology = json.loads(MORPHOLOGY_CACHE_JSON.read_text(encoding="utf-8"))

    cards = []
    card_id = 1

    for pattern, sentences in pattern_map.items():
        for sentence in sentences:
            masked, answer = mask_sentence(sentence, morphology)
            if not masked or not answer:
                continue

            cards.append(
                {
                    "id": card_id,
                    "original_sentence": sentence,
                    "masked_sentence": masked,
                    "question": "Fill in the missing word",
                    "answer": answer,
                    "pattern": pattern,
                }
            )
            card_id += 1

    out = SENTENCE_CARD_SET_DIR / "fill_in_blank_cards.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"fill-in-the-blank cards generated: {out}")
    print(f"total cards: {len(cards)}")

if __name__ == "__main__":
    main()
