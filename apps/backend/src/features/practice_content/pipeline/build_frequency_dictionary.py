import json
import re
from collections import Counter

from ..paths import CLEAN_SENTENCES_JSON, FREQUENCY_DICTIONARY_JSON, ensure_standard_dirs

TOKEN_PATTERN = re.compile(r"[a-zA-ZåäöÅÄÖ]+")

def main() -> None:
    ensure_standard_dirs()
    data = json.loads(CLEAN_SENTENCES_JSON.read_text(encoding="utf-8"))
    word_counter = Counter()

    for row in data:
        tokens = TOKEN_PATTERN.findall(str(row["fi"]).lower())
        for token in tokens:
            if len(token) > 2:
                word_counter[token] += 1

    top_words = word_counter.most_common(50000)
    output = [{"word": word, "count": count} for word, count in top_words]

    FREQUENCY_DICTIONARY_JSON.write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"frequency dictionary saved: {FREQUENCY_DICTIONARY_JSON}")
    print(f"total entries: {len(output)}")

if __name__ == "__main__":
    main()
