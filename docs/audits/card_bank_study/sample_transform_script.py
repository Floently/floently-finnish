from __future__ import annotations

import json
from pathlib import Path


def normalize_profession(value: str) -> str:
    mapping = {
        'lääkäri': 'doctor',
        'doctor': 'doctor',
        'sairaanhoitaja': 'nurse',
        'nurse': 'nurse',
        'lähihoitaja': 'practical_nurse',
        'lahioitaja': 'practical_nurse',
        'practical_nurse': 'practical_nurse',
    }
    return mapping.get(str(value).strip().lower(), 'other')


def normalized_signature(card: dict) -> tuple[str, str, str, str]:
    return (
        str(card.get('content_type') or '').strip(),
        normalize_profession(card.get('profession') or ''),
        ' '.join(str(card.get('front_text') or '').lower().split()),
        ' '.join(str(card.get('_answer_value') or '').lower().split()),
    )


def load_cards(path: Path) -> list[dict]:
    payload = json.loads(path.read_text(encoding='utf-8'))
    return payload.get('cards', payload if isinstance(payload, list) else [])


def main() -> None:
    source = Path('/path/to/compiled/cards.json')
    cards = load_cards(source)
    deduped: dict[tuple[str, str, str, str], dict] = {}
    for card in cards:
        if not isinstance(card, dict):
            continue
        sig = normalized_signature(card)
        deduped.setdefault(sig, card)
    print(json.dumps({'input': len(cards), 'deduped': len(deduped)}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
