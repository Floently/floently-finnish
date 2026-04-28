import hashlib
import json
import random

from ..paths import GRAMMAR_CARD_SET_DIR, PATTERN_SENTENCE_MAP_JSON, ensure_standard_dirs

VERB_CASES = {
    "mennä": ["ILL", "ADE"],
    "asua": ["INE", "ADE"],
    "syödä": ["PAR", "ACC"],
    "puhua": ["PAR"],
}

EXPLANATIONS = {
    "ILL": "movement into something (mihin?)",
    "INE": "location inside something (missä?)",
    "PAR": "partial object or ongoing action",
    "ADE": "location on / at something",
    "ACC": "completed object or bounded action",
}

def deterministic_random(seed_text: str) -> random.Random:
    seed = int(hashlib.md5(seed_text.encode("utf-8")).hexdigest(), 16)
    return random.Random(seed)

def explain_pattern(pattern: str) -> str:
    verb, case_name = pattern.split(" + ")
    return f"{verb} uses {case_name} case → {EXPLANATIONS.get(case_name, '')}".strip()

def generate_options(pattern: str, sentence: str):
    verb, correct_case = pattern.split(" + ")
    rng = deterministic_random(sentence)
    valid_cases = list(VERB_CASES.get(verb, []))
    if correct_case not in valid_cases:
        valid_cases.append(correct_case)
    wrong_cases = [case_name for case_name in valid_cases if case_name != correct_case]
    sampled = wrong_cases[:3]
    options = [correct_case] + sampled
    rng.shuffle(options)
    return [f"{verb} + {case_name}" for case_name in options]

def main() -> None:
    ensure_standard_dirs()
    pattern_map = json.loads(PATTERN_SENTENCE_MAP_JSON.read_text(encoding="utf-8"))

    cards = []
    card_id = 1
    for pattern, sentences in pattern_map.items():
        for sentence in sentences:
            cards.append(
                {
                    "id": card_id,
                    "sentence": sentence,
                    "question": "Which grammar pattern does this sentence use?",
                    "options": generate_options(pattern, sentence),
                    "answer": pattern,
                    "explanation": explain_pattern(pattern),
                }
            )
            card_id += 1

    out = GRAMMAR_CARD_SET_DIR / "grammar_cards.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(cards, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"grammar cards generated: {out}")
    print(f"total cards: {len(cards)}")

if __name__ == "__main__":
    main()
