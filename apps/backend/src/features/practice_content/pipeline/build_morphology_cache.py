import json

from ..linguistics.finnish_morphology import analyze_word
from ..paths import CLEAN_SENTENCES_JSON, MORPHOLOGY_CACHE_JSON, ensure_standard_dirs

def main() -> None:
    ensure_standard_dirs()
    sentences = json.loads(CLEAN_SENTENCES_JSON.read_text(encoding="utf-8"))
    cache = {}
    count = 0

    for row in sentences:
        for word in str(row["fi"]).split():
            token = word.lower()
            if token in cache:
                continue
            analysis = analyze_word(token)
            if analysis:
                cache[token] = analysis

        count += 1
        if count % 1000 == 0:
            print(f"processed {count}")

    MORPHOLOGY_CACHE_JSON.write_text(
        json.dumps(cache, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"morphology cache saved: {MORPHOLOGY_CACHE_JSON}")
    print(f"unique analyzed tokens: {len(cache)}")

if __name__ == "__main__":
    main()
