"""
Optional semantic domain classifier donor.

This is adapted from the old `domain_filter.py`, but it is not loaded by the
runtime. It is a content-pipeline helper only.
"""
from ..paths import PROFESSIONAL_FINNISH_ROOT, ensure_standard_dirs

INPUT_FILE = PROFESSIONAL_FINNISH_ROOT / "doctor" / "domain_doctor_clean_fi.txt"
OUTPUT_FILES = {
    "doctor": PROFESSIONAL_FINNISH_ROOT / "generated" / "domain_doctor.txt",
    "nurse": PROFESSIONAL_FINNISH_ROOT / "generated" / "domain_nurse.txt",
    "lahioitaja": PROFESSIONAL_FINNISH_ROOT / "generated" / "domain_lahioitaja.txt",
}

THRESHOLD = 0.35
BATCH_SIZE = 64

DOMAIN_TEXTS = {
    "doctor": "lääkäri diagnoosi tutkimus potilas sairaus hoito lääkitys erikoislääkäri leikkaus",
    "nurse": "sairaanhoitaja potilaan hoito lääkitys vuodeosasto seuranta hoitotyö injektio",
    "lahioitaja": "lähihoitaja hoivatyö vanhustenhoito perushoito kotihoito avustaminen hygienia",
}

def _load_model():
    try:
        from sentence_transformers import SentenceTransformer, util
    except Exception as exc:
        raise SystemExit(
            "sentence-transformers is required for domain_classifier.py but is not installed."
        ) from exc

    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    domain_embeddings = {
        key: model.encode(text, convert_to_tensor=True)
        for key, text in DOMAIN_TEXTS.items()
    }
    return model, util, domain_embeddings

def load_sentences():
    return [
        line.strip()
        for line in INPUT_FILE.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]

def classify(sentences):
    model, util, domain_embeddings = _load_model()
    results = {key: [] for key in OUTPUT_FILES}

    total = len(sentences)
    for start in range(0, total, BATCH_SIZE):
        batch = sentences[start : start + BATCH_SIZE]
        embeddings = model.encode(batch, convert_to_tensor=True)

        for domain, embedding in domain_embeddings.items():
            scores = util.cos_sim(embeddings, embedding)
            for sentence, score in zip(batch, scores):
                if score.item() > THRESHOLD:
                    results[domain].append(sentence)

        print(f"Processed {start + len(batch)}/{total}", end="\r")

    print()
    return results

def save(results):
    for domain, sentences in results.items():
        path = OUTPUT_FILES[domain]
        path.parent.mkdir(parents=True, exist_ok=True)
        unique = sorted(set(sentences))
        path.write_text("\n".join(unique) + ("\n" if unique else ""), encoding="utf-8")
        print(f"{domain}: {len(unique)} sentences → {path}")

def main():
    ensure_standard_dirs()
    data = load_sentences()
    results = classify(data)
    save(results)

if __name__ == "__main__":
    main()
