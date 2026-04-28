SUBORDINATE_MARKERS = {
    "koska", "jotta", "vaikka", "mikäli", "kunnes", "ennenkuin", "sillä", "joten",
}

ADVANCED_MARKERS = {
    "nimittäin", "toisaalta", "edellyttäen", "huolimatta", "jokseenkin",
}

def estimate_level(sentence: str) -> str:
    words = [word for word in sentence.split() if word]
    lowered = [word.lower() for word in words]
    count = len(words)

    if count <= 5 and not any(marker in lowered for marker in SUBORDINATE_MARKERS):
        return "A1_A2"

    if count >= 12 or any(marker in lowered for marker in ADVANCED_MARKERS):
        return "C1_C2"

    if any(marker in lowered for marker in SUBORDINATE_MARKERS) or count >= 7:
        return "B1_B2"

    return "A1_A2"
