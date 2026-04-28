from __future__ import annotations
import json
from pathlib import Path

from ..config import EXPORT

OUTPUT = EXPORT / 'card_index.json'


def main() -> None:
    items = []
    for candidate in EXPORT.glob('*_cards.json'):
        payload = json.loads(candidate.read_text(encoding='utf-8'))
        count = len(payload.get('items', payload if isinstance(payload, list) else []))
        items.append({'name': candidate.name, 'count': count})
    OUTPUT.write_text(json.dumps({'items': items}, ensure_ascii=False, indent=2), encoding='utf-8')

if __name__ == '__main__':
    main()
