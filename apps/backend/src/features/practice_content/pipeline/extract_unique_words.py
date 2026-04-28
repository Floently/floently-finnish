import json
import re

from ..paths import CLEAN_SENTENCES_JSON, UNIQUE_WORDS_JSON, ensure_standard_dirs

TOKEN_PATTERN = re.compile(r"[a-zA-ZåäöÅÄÖ]+")

def main() -> None:
    ensure_standard_dirs()
    data = json.loads(CLEAN_SENTENCES_JSON.read_text(encoding="utf-8"))
    unique = set()

    for row in data:
        tokens = TOKEN_PATTERN.findall(str(row["fi"]).lower())
        for token in tokens:
            if len(token) > 2:
                unique.add(token)

    UNIQUE_WORDS_JSON.write_text(
        json.dumps(sorted(unique), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"unique words saved: {UNIQUE_WORDS_JSON}")
    print(f"unique count: {len(unique)}")

if __name__ == "__main__":
    main()
