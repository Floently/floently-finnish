import json

from ..paths import GENERATED_CARDS_ROOT, MANIFESTS_ROOT, ensure_standard_dirs

def count_json_files(path):
    if not path.exists():
        return 0
    return len(list(path.glob("*.json")))

def count_recursive_json_files(path):
    if not path.exists():
        return 0
    return len(list(path.rglob("*.json")))

def main() -> None:
    ensure_standard_dirs()
    manifest = {}

    for level in ["A1_A2", "B1_B2", "C1_C2"]:
        folder = GENERATED_CARDS_ROOT / "sentence_card_set" / level
        manifest[f"sentence_card_set/{level}"] = count_json_files(folder)

    for level in ["A1_A2"]:
        folder = GENERATED_CARDS_ROOT / "vocabulary_card_set" / level
        manifest[f"vocabulary_card_set/{level}"] = count_json_files(folder)

    manifest["grammar_card_set"] = count_json_files(GENERATED_CARDS_ROOT / "grammar_card_set")
    manifest["spoken_transformations"] = count_json_files(GENERATED_CARDS_ROOT / "spoken_transformations")
    manifest["generated_cards_total"] = count_recursive_json_files(GENERATED_CARDS_ROOT)

    MANIFESTS_ROOT.mkdir(parents=True, exist_ok=True)
    out = MANIFESTS_ROOT / "content_manifest.json"
    out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"manifest generated: {out}")

if __name__ == "__main__":
    main()
