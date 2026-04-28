import json
import re
from collections import defaultdict

from ..paths import CLEAN_SENTENCES_JSON, GRAMMAR_PATTERNS_JSON, MORPHOLOGY_CACHE_JSON, PATTERN_SENTENCE_MAP_JSON, ensure_standard_dirs
from .utils.deduplicator import SentenceDeduplicator

MAX_SENTENCES_PER_PATTERN = 25

def main() -> None:
    ensure_standard_dirs()
    data = json.loads(CLEAN_SENTENCES_JSON.read_text(encoding="utf-8"))
    morphology = json.loads(MORPHOLOGY_CACHE_JSON.read_text(encoding="utf-8"))
    patterns = json.loads(GRAMMAR_PATTERNS_JSON.read_text(encoding="utf-8"))

    pattern_set = {pattern for pattern, _count in patterns}
    pattern_map = defaultdict(list)
    dedupe_by_pattern = defaultdict(SentenceDeduplicator)

    for row in data:
        sentence = str(row["fi"])
        words = re.findall(r"\w+", sentence.lower())

        for index in range(len(words) - 1):
            first = morphology.get(words[index])
            second = morphology.get(words[index + 1])

            if not first or not second:
                continue
            if "V" not in first.get("tags", []):
                continue

            for case in second.get("tags", []):
                key = f"{first['lemma']} + {case}"
                if key not in pattern_set:
                    continue
                if len(pattern_map[key]) >= MAX_SENTENCES_PER_PATTERN:
                    continue
                if dedupe_by_pattern[key].is_new(sentence):
                    pattern_map[key].append(sentence)

    PATTERN_SENTENCE_MAP_JSON.write_text(
        json.dumps(pattern_map, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"pattern to sentence mapping created: {PATTERN_SENTENCE_MAP_JSON}")
    print(f"patterns mapped: {len(pattern_map)}")

if __name__ == "__main__":
    main()
