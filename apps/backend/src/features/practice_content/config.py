from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / 'data'
SOURCE_CORPORA = DATA / 'source_corpora'
PROFESSIONAL = DATA / 'professional_finnish'
BUILD = ROOT / 'build'
EXPORT = ROOT / 'export'
MATERIALS_ROOT = Path(__file__).resolve().parents[3] / 'materials'
OFFLINE_EXPORTS = MATERIALS_ROOT / 'datasets' / 'offline_exports'
IMPORT_QUEUE = MATERIALS_ROOT / 'cards' / 'imports' / 'practice_content'
RUNTIME_TARGET = IMPORT_QUEUE / 'practice_content_cards.json'
