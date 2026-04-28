import json
import re
from collections import Counter

from ..paths import CLEAN_SENTENCES_JSON, GRAMMAR_PATTERNS_JSON, MORPHOLOGY_CACHE_JSON, ensure_standard_dirs

_ALLOWED_CASES = {
    "INE", "ELA", "ILL", "ALL", "ABL", "ADE",
    "ESS", "TRA", "PAR", "GEN", "NOM",
}

def normalize_case_tag(tag: str):
    if not tag:
        return None
    normalized = tag.strip().upper()
    return normalized if normalized in _ALLOWED_CASES else None

def extract_case(tags):
    for tag in tags or []:
        case_tag = normalize_case_tag(tag)
        if case_tag:
            return case_tag
    return None

def main() -> None:
    ensure_standard_dirs()
    morphology = json.loads(MORPHOLOGY_CACHE_JSON.read_text(encoding="utf-8"))
    data = json.loads(CLEAN_SENTENCES_JSON.read_text(encoding="utf-8"))

    patterns = Counter()

    for row in data:
        fi = str(row.get("fi", "")).strip()
        if not fi:
            continue

        words = re.findall(r"\w+", fi.lower())
        for index in range(len(words) - 1):
            first = morphology.get(words[index])
            second = morphology.get(words[index + 1])

            if not first or not second:
                continue
            if "V" not in first.get("tags", []):
                continue

            case = extract_case(second.get("tags", []))
            if case:
                key = f"{first['lemma']} + {case}"
                patterns[key] += 1

    top = patterns.most_common(200)
    GRAMMAR_PATTERNS_JSON.write_text(
        json.dumps(top, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"grammar patterns extracted: {GRAMMAR_PATTERNS_JSON}")
    print(f"total patterns: {len(top)}")

if __name__ == "__main__":
    main()
