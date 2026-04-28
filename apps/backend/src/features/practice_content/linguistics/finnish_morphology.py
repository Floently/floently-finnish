import os
import re
import subprocess
from pathlib import Path
from typing import Any, Dict, Optional

from ..paths import MODELS_ROOT

MODEL = Path(
    os.getenv(
        "FLOENTLY_FINNISH_OMORFI_MODEL",
        str(MODELS_ROOT / "omorfi" / "src" / "generated" / "omorfi.analyse.hfst"),
    )
)
LOOKUP_BIN = os.getenv("FLOENTLY_FINNISH_HFST_LOOKUP_BIN", "hfst-lookup")

_process = None

def get_process():
    global _process
    if _process is None:
        _process = subprocess.Popen(
            [LOOKUP_BIN, str(MODEL)],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
            bufsize=1,
        )
    return _process

def parse_tags(raw: str) -> Optional[Dict[str, Any]]:
    matches = re.findall(r"\[(.*?)\]", raw)
    data: Dict[str, str] = {}
    for match in matches:
        if "=" in match:
            key, value = match.split("=", 1)
            data[key] = value

    if not data:
        return None

    lemma = data.get("WORD_ID")
    upos = data.get("UPOS")
    case = data.get("CASE")

    tags = []
    if upos == "VERB":
        tags.append("V")
    elif upos == "NOUN":
        tags.append("N")
    elif upos == "PRON":
        tags.append("PRON")

    if case:
        tags.append(case)

    return {"lemma": lemma, "tags": tags, "raw": data}

def score_candidate(candidate: Dict[str, Any]) -> int:
    score = 0
    tags = candidate["tags"]
    raw = candidate["raw"]
    lemma = candidate["lemma"]

    if lemma and not lemma.startswith("["):
        score += 5
    if "PRON" in tags:
        score += 10
    if "ESS" in tags:
        score -= 3
    if "V" in tags:
        score += 6
    if "N" in tags:
        score += 6
    if raw.get("UPOS") == "INTJ":
        score -= 5
    return score

def analyze_word(word: str) -> Optional[Dict[str, Any]]:
    try:
        proc = get_process()
        assert proc.stdin is not None
        assert proc.stdout is not None

        proc.stdin.write(word + "\n")
        proc.stdin.flush()

        results = []
        while True:
            line = proc.stdout.readline().strip()
            if not line:
                break
            if "[" not in line:
                continue
            parsed = parse_tags(line)
            if parsed and parsed["lemma"]:
                results.append(parsed)

        if not results:
            return None

        results.sort(key=score_candidate, reverse=True)
        best = results[0]
        return {"lemma": best["lemma"], "tags": best["tags"]}
    except Exception:
        return None
