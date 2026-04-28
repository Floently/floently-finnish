import re

MAX_WORDS = 20
MIN_WORDS = 2

URL_PATTERN = re.compile(r"http", flags=re.IGNORECASE)
NUMBER_PATTERN = re.compile(r"\d")

def valid_sentence(sentence: str) -> bool:
    words = sentence.split()

    if len(words) < MIN_WORDS:
        return False
    if len(words) > MAX_WORDS:
        return False
    if URL_PATTERN.search(sentence):
        return False
    if NUMBER_PATTERN.search(sentence):
        return False
    if sentence.count(",") > 3:
        return False

    return True
