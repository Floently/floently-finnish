from __future__ import annotations
import json
from pathlib import Path

from ..config import EXPORT
from ..service import build_phrase_inventory

OUT = EXPORT / 'phrase_cards.json'


def main() -> None:
    inventory = build_phrase_inventory()
    cards = []
    for row in inventory:
        cards.append({
            'id': row['id'],
            'mode': 'phrases',
            'front': row['phrase'],
            'prompt': 'Käytä fraasia lauseessa tai selitä merkitys.',
            'accepted_answers': [row['phrase']],
            'explanation': 'Fraasit kannattaa palauttaa käyttöön tuottamalla niitä, ei vain tunnistamalla.',
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'items': cards}, ensure_ascii=False, indent=2), encoding='utf-8')

if __name__ == '__main__':
    main()
