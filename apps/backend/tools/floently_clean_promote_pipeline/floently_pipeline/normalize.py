from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .utils import normalize_space, normalize_profession_alias, normalize_content_path, slugify, stable_hash


def _profession_from_context_text(text: str | None) -> str | None:
    probe = normalize_space(str(text or "")).lower()
    if not probe:
        return None
    probe = probe.replace("ä", "a").replace("ö", "o")
    alias_groups = [
        ("practical_nurse", ["lähihoitaja", "lahihoitaja", "practical_nurse", "practical nurse"]),
        ("nurse", ["sairaanhoitaja", "nurse", "nursing_"]),
        ("doctor", ["lääkäri", "laakari", "doctor"]),
        ("general", ["yki_exam", "yki"]),
    ]
    for slug, aliases in alias_groups:
        for token in aliases:
            tok = token.replace("ä", "a").replace("ö", "o")
            if tok in probe:
                return normalize_profession_alias(slug)
    return None


@dataclass
class NormalizedItem:
    item_type: str
    fields: dict[str, Any]
    normalized_key: str
    dedupe_signature: str
    score_seed: float
    notes: list[str]
    raw_fragment: Any
    needs_review: bool
    metadata: dict[str, Any]


def normalize_items(extracted_items: list[Any], manifest: dict[str, Any]) -> list[NormalizedItem]:
    normalized: list[NormalizedItem] = []
    for item in extracted_items:
        fields = {k: normalize_space(str(v)) for k, v in item.core_fields.items()}
        meta = _metadata_from_item(item, manifest)
        norm_key = _normalized_key(item.item_type, fields)
        sig = stable_hash(item.item_type, meta.get("profession") or "none", meta.get("domain") or "general", norm_key, length=14)
        score_seed = _score_seed(item)
        needs_review = bool(item.needs_ai_help or item.confidence < 0.7)
        normalized.append(
            NormalizedItem(
                item_type=item.item_type,
                fields=fields,
                normalized_key=norm_key,
                dedupe_signature=sig,
                score_seed=score_seed,
                notes=item.notes,
                raw_fragment=item.raw_fragment,
                needs_review=needs_review,
                metadata=meta,
            )
        )
    return normalized


def _metadata_from_item(item: Any, manifest: dict[str, Any]) -> dict[str, Any]:
    raw = item.raw_fragment if isinstance(item.raw_fragment, dict) else {}
    raw_profession = None
    raw_prof = raw.get("profession")
    if isinstance(raw_prof, dict):
        raw_profession = raw_prof.get("slug")
    elif isinstance(raw_prof, str):
        raw_profession = raw_prof
    manifest_profession = normalize_profession_alias(manifest.get("profession") or "none") or "none"
    profession = normalize_profession_alias(raw_profession or manifest_profession or "none") or "none"
    raw_path_hint = normalize_space(str(raw.get("path") or ""))
    source_hint = _profession_from_context_text(' '.join([str(raw.get('_source_path') or ''), str(manifest.get('source_path') or ''), str(raw.get('source_id') or ''), str(manifest.get('source_id') or ''), str(raw.get('path') or ''), str(manifest.get('path') or '')]))
    source_id_text = normalize_space(str(raw.get("_source_id") or raw.get("source_id") or manifest.get("source_id") or "")).lower()
    if manifest_profession == 'practical_nurse' and profession in {'nurse', 'none', 'general'}:
        profession = 'practical_nurse'
    elif profession in {'nurse', 'doctor'} and source_hint and source_hint not in {'general', profession}:
        profession = source_hint
    elif profession in {'none', 'general'} and manifest_profession not in {'none', 'general'}:
        profession = manifest_profession
    elif profession in {'none', 'general'} and 'professional' in raw_path_hint.lower() and source_hint and source_hint != 'general' and '.general.' not in source_id_text:
        profession = source_hint
    if profession == 'general':
        profession_out = 'none'
    else:
        profession_out = profession
    domain = normalize_space(str(raw.get("domain") or manifest.get("domain") or "general_finnish"))
    level_band = normalize_space(str(raw.get("level_band") or manifest.get("level_band") or "B1_B2")).upper()
    source_id = normalize_space(str(raw.get("_source_id") or raw.get("source_id") or manifest.get("source_id") or ""))
    authoring_note = normalize_space(str(raw.get("authoring_note") or manifest.get("authoring_note") or ""))
    language = normalize_space(str(raw.get("language") or manifest.get("language") or "fi"))
    path = normalize_content_path(raw.get("path") or manifest.get("path"), content_type=item.item_type, profession=profession_out)
    if not path:
        if profession_out not in {'none', 'general'}:
            bucket = 'vocabulary' if item.item_type in {'vocabulary_card','slang_card','word_opposite_card','word_similar_in_meaning_card'} else ('grammar' if item.item_type == 'grammar_card' else 'sentences')
            path = f'professional/{profession_out}/{bucket}'
        else:
            bucket = 'vocabulary' if item.item_type in {'vocabulary_card','slang_card','word_opposite_card','word_similar_in_meaning_card'} else ('grammar' if item.item_type == 'grammar_card' else 'sentences')
            path = f'general/{bucket}'
    return {
        'profession': profession_out,
        'domain': domain,
        'level_band': level_band,
        'source_id': source_id or manifest.get('source_id'),
        'authoring_note': authoring_note or manifest.get('authoring_note'),
        'language': language,
        'path': path,
    }


def _score_seed(item: Any) -> float:
    base = float(item.confidence)
    raw = item.raw_fragment if isinstance(item.raw_fragment, dict) else {}
    raw_quality = raw.get("_quality_score")
    if raw_quality is None:
        return base
    try:
        q = float(raw_quality)
        if q > 1.0:
            q = q / 100.0
        return round(max(base, min(q, 1.0)), 3)
    except Exception:
        return base


def _normalized_key(item_type: str, fields: dict[str, str]) -> str:
    if item_type in {"vocabulary_card", "slang_card", "word_opposite_card", "word_similar_in_meaning_card"}:
        return slugify(f"{fields.get('term', 'unknown')}::{fields.get('meaning', '')}", max_len=140)
    if item_type in {"phrase_card", "sentence_card", "idiom_card"}:
        return slugify(f"{fields.get('sentence', 'unknown')}::{fields.get('meaning', '')}", max_len=180)
    if item_type == "grammar_card":
        return slugify(f"{fields.get('pattern', 'unknown')}::{fields.get('example_fi', '')}::{fields.get('meaning', '')}", max_len=180)
    return slugify("unknown")
