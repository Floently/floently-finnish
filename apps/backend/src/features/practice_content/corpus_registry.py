from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
import json

from .config import SOURCE_CORPORA, PROFESSIONAL

@dataclass
class CorpusDescriptor:
    id: str
    kind: str
    path: str
    enabled: bool


def load_registry() -> list[CorpusDescriptor]:
    manifests = [
        SOURCE_CORPORA / 'corpus_registry.json',
        PROFESSIONAL / 'domain_registry.json',
    ]
    descriptors: list[CorpusDescriptor] = []
    for manifest in manifests:
        if not manifest.exists():
            continue
        payload = json.loads(manifest.read_text(encoding='utf-8'))
        for row in payload.get('items', []):
            descriptors.append(CorpusDescriptor(**row))
    return descriptors
