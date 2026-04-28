from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent

DATA_ROOT = PACKAGE_ROOT / "data"
RAW_CORPORA_ROOT = DATA_ROOT / "source_corpora"
PROFESSIONAL_FINNISH_ROOT = DATA_ROOT / "professional_finnish"
PARALLEL_ROOT = DATA_ROOT / "parallel"

OUTPUT_ROOT = PACKAGE_ROOT / "output"
GENERATED_CARDS_ROOT = PACKAGE_ROOT / "generated_cards"
MANIFESTS_ROOT = PACKAGE_ROOT / "manifests"
MODELS_ROOT = PACKAGE_ROOT / "models"

PARALLEL_CORPUS_JSON = OUTPUT_ROOT / "parallel_corpus.json"
CLEAN_SENTENCES_JSON = OUTPUT_ROOT / "clean_sentences.json"
MORPHOLOGY_CACHE_JSON = OUTPUT_ROOT / "morphology_cache.json"
GRAMMAR_PATTERNS_JSON = OUTPUT_ROOT / "grammar_patterns.json"
PATTERN_SENTENCE_MAP_JSON = OUTPUT_ROOT / "pattern_sentence_map.json"
UNIQUE_WORDS_JSON = OUTPUT_ROOT / "unique_words.json"
FREQUENCY_DICTIONARY_JSON = OUTPUT_ROOT / "frequency_dictionary.json"
UNIFIED_CARDS_JSON = OUTPUT_ROOT / "unified_cards.json"

GRAMMAR_CARD_SET_DIR = GENERATED_CARDS_ROOT / "grammar_card_set"
SENTENCE_CARD_SET_DIR = GENERATED_CARDS_ROOT / "sentence_card_set"
VOCABULARY_CARD_SET_DIR = GENERATED_CARDS_ROOT / "vocabulary_card_set"
SPOKEN_TRANSFORM_DIR = GENERATED_CARDS_ROOT / "spoken_transformations"

def ensure_standard_dirs() -> None:
    for path in [
        DATA_ROOT,
        RAW_CORPORA_ROOT,
        PROFESSIONAL_FINNISH_ROOT,
        PARALLEL_ROOT,
        OUTPUT_ROOT,
        GENERATED_CARDS_ROOT,
        GRAMMAR_CARD_SET_DIR,
        SENTENCE_CARD_SET_DIR,
        VOCABULARY_CARD_SET_DIR,
        SPOKEN_TRANSFORM_DIR,
        MANIFESTS_ROOT,
    ]:
        path.mkdir(parents=True, exist_ok=True)
