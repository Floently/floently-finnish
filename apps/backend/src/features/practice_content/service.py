from __future__ import annotations
from collections import Counter
from pathlib import Path
import json
import re

from .config import EXPORT
from .corpus_registry import load_registry

WORD_RE = re.compile(r"[A-Za-zÅÄÖåäö-]{2,}")


def _read_text(path: Path) -> str:
    try:
        return path.read_text(encoding='utf-8')
    except FileNotFoundError:
        return ''


def build_phrase_inventory(limit: int = 300) -> list[dict]:
    phrases: Counter[str] = Counter()
    for desc in load_registry():
        if not desc.enabled:
            continue
        text = _read_text(Path(desc.path))
        words = WORD_RE.findall(text)
        for i in range(len(words) - 1):
            phrases[' '.join(words[i:i+2]).lower()] += 1
    items = [ {'id': f'phrase-{idx}', 'phrase': phrase, 'frequency': count} for idx, (phrase, count) in enumerate(phrases.most_common(limit), start=1) ]
    EXPORT.mkdir(parents=True, exist_ok=True)
    (EXPORT / 'phrase_inventory.json').write_text(json.dumps({'items': items}, ensure_ascii=False, indent=2), encoding='utf-8')
    return items
