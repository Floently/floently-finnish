import csv
import json
from pathlib import Path
from typing import Dict, List

from ..paths import PARALLEL_CORPUS_JSON, PARALLEL_ROOT, ensure_standard_dirs

CANDIDATE_FILES = [
    PARALLEL_ROOT / "all_parallel_clean.tsv",
    PARALLEL_ROOT / "parallel_corpus.tsv",
    PARALLEL_ROOT / "parallel_corpus.json",
    PARALLEL_ROOT / "sentences.json",
]

def load_from_json(path: Path) -> List[Dict[str, str]]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    rows: List[Dict[str, str]] = []
    for row in raw:
        fi = row.get("fi") or row.get("finnish")
        en = row.get("en") or row.get("english")
        if fi and en:
            rows.append({"fi": str(fi), "en": str(en)})
    return rows

def load_from_tsv(path: Path) -> List[Dict[str, str]]:
    rows: List[Dict[str, str]] = []
    with path.open("r", encoding="utf-8") as handle:
        reader = csv.reader(handle, delimiter="\t")
        for parts in reader:
            if len(parts) < 2:
                continue
            fi, en = parts[0].strip(), parts[1].strip()
            if fi and en:
                rows.append({"fi": fi, "en": en})
    return rows

def main() -> None:
    ensure_standard_dirs()
    rows: List[Dict[str, str]] = []

    for candidate in CANDIDATE_FILES:
        if not candidate.exists():
            continue
        rows = load_from_json(candidate) if candidate.suffix.lower() == ".json" else load_from_tsv(candidate)
        if rows:
            print(f"Loaded parallel corpus from {candidate}")
            break

    if not rows:
        raise SystemExit(
            "No usable parallel source file was found under data/parallel. "
            "Provide all_parallel_clean.tsv, parallel_corpus.tsv, or a JSON file with fi/en pairs."
        )

    PARALLEL_CORPUS_JSON.write_text(
        json.dumps(rows, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"parallel corpus saved: {PARALLEL_CORPUS_JSON}")
    print(f"total rows: {len(rows)}")

if __name__ == "__main__":
    main()
