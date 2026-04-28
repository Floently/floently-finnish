VERB_ENDINGS = {
    "1sg": ["n"],
    "2sg": ["t"],
    "3sg": ["a", "ä"],
    "1pl": ["mme"],
    "2pl": ["tte"],
    "3pl": ["vat", "vät"],
    "past": ["i"],
    "conditional": ["isi"],
    "imperative": ["kaa", "kää"],
}

def detect_verb_form(word: str):
    for form, endings in VERB_ENDINGS.items():
        for ending in endings:
            if word.endswith(ending):
                return form
    return None
