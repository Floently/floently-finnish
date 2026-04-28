import re
from typing import Dict

SPOKEN_PATTERNS: Dict[str, str] = {
    "mä": "minä",
    "sä": "sinä",
    "se": "hän",
    "ne": "he",
    "mee": "mene",
    "tuu": "tule",
    "oot": "olet",
    "oon": "olen",
    "voitsä": "voitko sinä",
    "tehään": "tehdään",
}

_COMPILED = {
    spoken: re.compile(rf"\b{re.escape(spoken)}\b", flags=re.IGNORECASE)
    for spoken in SPOKEN_PATTERNS
}

def detect_spoken(sentence: str) -> bool:
    text = sentence.lower()
    return any(pattern.search(text) for pattern in _COMPILED.values())

def normalize_spoken(sentence: str) -> str:
    normalized = sentence
    for spoken, standard in SPOKEN_PATTERNS.items():
        normalized = _COMPILED[spoken].sub(standard, normalized)
    return normalized
