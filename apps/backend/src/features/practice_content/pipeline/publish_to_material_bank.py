from __future__ import annotations
import json
from pathlib import Path

from ..config import EXPORT, OFFLINE_EXPORTS, RUNTIME_TARGET


def _load_cards() -> list[dict]:
    items: list[dict] = []
    for candidate in EXPORT.glob('*_cards.json'):
        payload = json.loads(candidate.read_text(encoding='utf-8'))
        items.extend(payload.get('items', payload if isinstance(payload, list) else []))
    return items


def main() -> None:
    cards = _load_cards()
    OFFLINE_EXPORTS.mkdir(parents=True, exist_ok=True)
    RUNTIME_TARGET.parent.mkdir(parents=True, exist_ok=True)
    offline_export = OFFLINE_EXPORTS / 'practice_content_cards.json'
    offline_export.write_text(
        json.dumps({'items': cards}, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )
    RUNTIME_TARGET.write_text(json.dumps({'items': cards}, ensure_ascii=False, indent=2), encoding='utf-8')

if __name__ == '__main__':
    main()
