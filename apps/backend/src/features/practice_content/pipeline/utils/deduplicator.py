import re
import unicodedata

_WHITESPACE = re.compile(r"\s+")

def normalize_sentence(sentence: str) -> str:
    normalized = unicodedata.normalize("NFKC", sentence).strip().lower()
    normalized = _WHITESPACE.sub(" ", normalized)
    return normalized

class SentenceDeduplicator:
    def __init__(self):
        self.seen = set()

    def is_new(self, sentence: str) -> bool:
        normalized = normalize_sentence(sentence)
        if normalized in self.seen:
            return False
        self.seen.add(normalized)
        return True
