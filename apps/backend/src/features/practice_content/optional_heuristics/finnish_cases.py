CASE_SUFFIXES = {
    "inessive": ["ssa", "ssä"],
    "elative": ["sta", "stä"],
    "illative": ["an", "en", "in", "on", "un"],
    "adessive": ["lla", "llä"],
    "ablative": ["lta", "ltä"],
    "allative": ["lle"],
    "essive": ["na", "nä"],
    "translative": ["ksi"],
}

def detect_case(word: str):
    for case_name, suffixes in CASE_SUFFIXES.items():
        for suffix in suffixes:
            if word.endswith(suffix):
                return case_name
    return None
