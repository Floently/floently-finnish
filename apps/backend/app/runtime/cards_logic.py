from __future__ import annotations

from pathlib import Path

from datetime import datetime, timezone
from typing import Any
import random

from app.core.errors import AppError
from app.core.state_store import STORE
from app.core.utils import new_id
from app.runtime.cards_material_bank import load_authority_cards, load_runtime_bank, CardRecord
from app.runtime.card_i18n_overlay_runtime import apply_runtime_card_overlay

CARD_CONTENT_TYPES = {'vocabulary_card', 'sentence_card', 'grammar_card'}
LEVEL_EXPANSION = {
    'A1_A2': ['A1_A2'],
    'B1_B2': ['B1_B2', 'A1_A2'],
    'C1_C2': ['C1_C2', 'B1_B2'],
}

_HISTORY: dict[str, list[dict[str, Any]]] = {}
_SESSIONS: dict[str, dict[str, Any]] = {}


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()





def _normalized_text(value: Any) -> str:
    return ' '.join(str(value or '').strip().split()).lower()


def _shuffled_options(options: list[dict[str, str]], *, seed: str | None) -> list[dict[str, str]]:
    shuffled = list(options)
    if len(shuffled) < 2:
        return shuffled
    rng = random.Random(seed) if seed is not None else random.Random()
    rng.shuffle(shuffled)
    return shuffled


def _option_text_by_id(options: list[dict[str, str]], option_id: str | None) -> str | None:
    if not option_id:
        return None
    normalized_id = str(option_id).strip()
    for option in options:
        if option.get('option_id') == normalized_id:
            return option.get('text')
    return None


def _option_id_by_text(options: list[dict[str, str]], answer_text: str | None) -> str | None:
    normalized_answer = _normalized_text(answer_text)
    if not normalized_answer:
        return None
    for option in options:
        if _normalized_text(option.get('text')) == normalized_answer:
            return option.get('option_id')
    return None


def _selection_seed(*, user_id: str, domain: str, content_type: str | None, profession: str | None, level_band: str, history_size: int) -> str:
    return f'{user_id}|{domain}|{content_type or "*"}|{profession or "*"}|{level_band}|{history_size}'


def _normalized_level(level: str | None) -> str:
    raw = str(level or 'B1_B2').strip().upper().replace('-', '_')
    if raw in {'A1', 'A2'}:
        return 'A1_A2'
    if raw in {'B1', 'B2'}:
        return 'B1_B2'
    if raw in {'C1', 'C2'}:
        return 'C1_C2'
    return raw if raw in LEVEL_EXPANSION else 'B1_B2'


def get_card_session(mode: str, limit: int = 10) -> list[CardRecord]:
    return [card for card in load_runtime_bank() if card.mode == mode][: max(1, limit)]


def evaluate_card_answer(card: CardRecord, answer: str) -> tuple[bool, str | None, int]:
    correct = _normalized_text(answer) in {_normalized_text(value) for value in card.accepted_answers}
    explanation = card.explanation if not correct else None
    return correct, explanation, 7 if correct else 1


def _history_records(user_id: str) -> list[dict[str, Any]]:
    return _HISTORY.setdefault(user_id, [])


def _served_history_index(user_id: str) -> tuple[set[str], dict[str, str]]:
    seen_ids: set[str] = set()
    last_seen: dict[str, str] = {}
    for item in _history_records(user_id):
        content_id = str(item.get('content_id') or '')
        timestamp = str(item.get('timestamp') or '')
        if content_id:
            seen_ids.add(content_id)
        if content_id and timestamp:
            last_seen[content_id] = timestamp
    return seen_ids, last_seen


def _filtered_cards(*, domain: str, content_type: str | None, profession: str | None, source: str | None = None) -> list[dict]:
    cards = load_authority_cards()
    requested_profession = str(profession or '').strip().lower() or None
    selected = []
    for card in cards:
        if content_type and card['content_type'] != content_type:
            continue
        if domain == 'general' and card['path'] != 'general':
            continue
        if domain == 'professional' and card['path'] != 'professional':
            continue
        if requested_profession and requested_profession != 'none' and card['profession'] != requested_profession:
            continue
        selected.append(card)
    return selected


def _record_served_cards(*, user_id: str, cards: list[dict]) -> None:
    if not cards:
        return
    now = iso_now()
    history = _history_records(user_id)
    for card in cards:
        history.append({'user_id': user_id, 'content_id': card['id'], 'content_type': card['content_type'], 'timestamp': now})


def _make_served_follow_up(card: dict, *, option_shuffle_seed: str | None = None) -> dict:
    follow_up = card.get('follow_up') if isinstance(card.get('follow_up'), dict) else None
    if follow_up:
        options = []
        for option in follow_up.get('options') or []:
            if not isinstance(option, dict):
                continue
            option_id = str(option.get('option_id') or '').strip()
            text = str(option.get('text') or '').strip()
            if option_id and text:
                options.append({'option_id': option_id, 'text': text})
        canonical_answer_key = str(follow_up.get('answer_key') or '').strip() or None
        canonical_answer_text = (
            str(follow_up.get('answer_text') or '').strip()
            or _option_text_by_id(options, canonical_answer_key)
            or str(card.get('answer_value') or '').strip()
            or None
        )
        served_options = _shuffled_options(options, seed=option_shuffle_seed)
        served_answer_key = (
            canonical_answer_key if canonical_answer_key and _option_text_by_id(served_options, canonical_answer_key) else None
        ) or _option_id_by_text(served_options, canonical_answer_text)
        return {
            'variant_type': follow_up.get('variant_type') or card.get('variant_type') or 'typed_recall',
            'prompt': follow_up.get('prompt') or card.get('follow_up_prompt') or card.get('prompt') or '',
            'options': served_options,
            'blank_template': follow_up.get('blank_template'),
            'context_text': follow_up.get('context_text'),
            'stimulus_text': follow_up.get('stimulus_text'),
            'answer_key': served_answer_key,
            'answer_text': canonical_answer_text,
            'accepted_variants': list(follow_up.get('accepted_variants') or card.get('accepted_answers') or []),
            'evaluation_mode': follow_up.get('evaluation_mode') or ('option_id' if served_options else 'normalized_text'),
        }
    choices = card.get('choices') or []
    options = [{'option_id': f'opt_{i}', 'text': str(ch)} for i, ch in enumerate(choices)]
    answer_text = str(card.get('answer_value') or (card.get('accepted_answers') or [''])[0]).strip()
    served_options = _shuffled_options(options, seed=option_shuffle_seed)
    answer_key = None
    for option in served_options:
        if _normalized_text(option.get('text')) == _normalized_text(answer_text):
            answer_key = option.get('option_id')
            break
    return {
        'variant_type': card.get('variant_type') or ('recognition' if served_options else 'typed_recall'),
        'prompt': card.get('follow_up_prompt') or card.get('prompt') or '',
        'options': served_options,
        'blank_template': card.get('blank_template'),
        'context_text': None,
        'stimulus_text': None,
        'answer_key': answer_key,
        'answer_text': answer_text,
        'accepted_variants': list(card.get('accepted_answers') or []),
        'evaluation_mode': 'option_id' if served_options else 'normalized_text',
    }


def _materialized_card(card: dict, *, order_index: int, option_shuffle_seed: str | None = None, ui_language: str | None = None) -> dict:
    materialized = dict(card)
    materialized['state'] = 'new'
    materialized['seen_count'] = 0
    materialized['correct_rate'] = 0.0
    materialized['order_index'] = order_index
    materialized['front_text'] = card.get('front') or ''
    materialized['back_prompt'] = card.get('back_prompt') or (card.get('accepted_answers') or [''])[0]
    materialized['served_follow_up'] = _make_served_follow_up(card, option_shuffle_seed=option_shuffle_seed)
    materialized['_accepted_variants'] = list(card.get('accepted_answers') or [])
    materialized['_answer_value'] = card.get('answer_value') or (card.get('accepted_answers') or [''])[0]
    # Preserve canonical text for release gates before any UI-language overlay mutates display fields.
    canonical_follow_up = card.get('follow_up') if isinstance(card.get('follow_up'), dict) else {}
    materialized['_canonical_release_gate_prompt'] = str(
        card.get('prompt')
        or card.get('back_prompt')
        or canonical_follow_up.get('prompt')
        or ''
    )
    # ── Hint quality (#7.2) ────────────────────────────────────────────────
    # Surface a structured Finnish hint to the client. Authored hints (from
    # the card's `hint` field) take priority; for cards without authored
    # hints we synthesize a structurally correct fallback that points at
    # the type of answer expected, not a generic platitude.
    materialized['hint'] = _resolve_card_hint(card)
    return apply_runtime_card_overlay(materialized, ui_language=ui_language)



def _is_runtime_card_visible(card: dict, ui_language: str | None = None) -> bool:
    """Release safety gate.

    We prefer failing loudly / hiding unsafe cards over showing a false-success card.
    """
    prompt = str(
        card.get("_canonical_release_gate_prompt")
        or card.get("prompt")
        or card.get("back_prompt")
        or (card.get("served_follow_up") or {}).get("prompt")
        or ""
    ).lower()

    # Current validated bank contains broken antonym cards where the prompt asks
    # for an opposite word but answer_key still points to the base meaning.
    # Quarantine all antonym/opposite cards until the source bank is repaired.
    bad_semantic_prompt_markers = (
        "opposite meaning",
        "opposite word",
        "vastakohtaa",
        "vastakohta",
        "معاكس",
        "ka soo horjeeda",
    )
    if any(marker in prompt for marker in bad_semantic_prompt_markers):
        card["release_blocked"] = True
        card["release_block_reason"] = "semantic_pair_opposite_cards_quarantined"
        return False

    # Canonical release safety and overlay completeness are intentionally separate.
    #
    # If the canonical card is unsafe, block it for every language above.
    # If a localized overlay is partial, do not hide the whole card here.
    # The overlay runtime applies safe translated fields and falls back to the
    # canonical field for missing/stale/incomplete overlay rows.
    return True


def _resolve_card_hint(card: dict) -> str:
    """Return a hint shaped like a real hint — points at the answer's
    structure without revealing it. Order of preference:
      1. card['hint'] if authored (preferred — see card_hint_authoring.csv)
      2. content_type-specific synthesized fallback in Finnish
    Never returns a generic "try again" / "think carefully" string. Those
    were the bug — a hint must hint at SOMETHING."""
    authored = card.get('hint')
    if isinstance(authored, str) and authored.strip():
        return authored.strip()
    # Fallback by content type. These are deliberately structurally
    # informative without being answer-revealing.
    ctype = str(card.get('content_type') or '').strip().lower()
    level = str(card.get('level_band') or '').strip().lower()
    if ctype == 'vocabulary_card':
        # Point at the semantic field, not the word
        topic = card.get('topic') or card.get('semantic_field') or 'tähän aiheeseen'
        return f'Tämä sana kuuluu aihepiiriin: {topic}.'
    if ctype == 'sentence_card':
        # Point at the grammatical structure being practised
        focus = card.get('grammar_focus') or card.get('grammar_point')
        if focus:
            return f'Tarkista: kyseessä on {focus}. Mikä taivutusmuoto sopii?'
        return 'Tarkista verbi ja sen taivutusmuoto sekä sijapääte.'
    if ctype == 'grammar_card':
        rule = card.get('grammar_rule') or card.get('grammar_focus')
        if rule:
            return f'Sääntö: {rule}. Mieti, milloin sitä käytetään.'
        if 'a1' in level or 'a2' in level:
            return 'Mieti perussääntöä: subjekti, verbi, objekti — mikä taivutusmuoto?'
        return 'Tunnista lauseen rakenne ja tarvittava taivutusmuoto.'
    return 'Lue kortti ääneen ja mieti, mikä rakenne tähän sopii.'


def _rank_cards(cards: list[dict], *, user_id: str, domain: str, content_type: str | None, profession: str | None, level_band: str) -> list[dict]:
    seen_ids, last_seen = _served_history_index(user_id)
    prioritized: list[dict] = []
    for allowed_band in LEVEL_EXPANSION[level_band]:
        band_cards = [card for card in cards if card['level_band'] == allowed_band]
        unseen = [card for card in band_cards if card['id'] not in seen_ids]
        if unseen:
            rng = random.Random(_selection_seed(user_id=user_id, domain=domain, content_type=content_type, profession=profession, level_band=allowed_band, history_size=len(seen_ids)))
            rng.shuffle(unseen)
            prioritized.extend(unseen)
    if prioritized:
        return prioritized
    recycled = list(cards)
    rng = random.Random(_selection_seed(user_id=user_id, domain=domain, content_type=content_type, profession=profession, level_band=level_band, history_size=len(seen_ids) + 1))
    recycled.sort(key=lambda card: (last_seen.get(card['id'], ''), card['level_band'], card['id']))
    rng.shuffle(recycled)
    return recycled


def _public_card(card: dict | None) -> dict | None:
    if card is None:
        return None
    return {key: value for key, value in card.items() if not key.startswith('_')}


def _session_state(session: dict) -> dict:
    return {'session_id': session['session_id'], 'status': session['status'].lower(), 'current_card_index': session['current_card_index'], 'total_cards': len(session['cards']), 'answered_count': session['answered_count'], 'created_at': session['created_at'], 'updated_at': session['updated_at'], 'ui_language': session.get('ui_language')}


def start_cards_session(*, user_id: str, domain: str, content_type: str | None, profession: str | None, level: str | None, adaptive: bool = False, limit: int = 10, ui_language: str | None = None) -> dict:
    authority_cards = _filtered_cards(domain=domain, content_type=content_type, profession=profession)
    level_band = _normalized_level(level)
    ranked = _rank_cards(authority_cards, user_id=user_id, domain=domain, content_type=content_type, profession=profession, level_band=level_band)
    option_seed_base = f'{user_id}|{domain}|{content_type or "*"}|{profession or "*"}|{level_band}|{iso_now()}|{len(_SESSIONS) + 1}'
    selected = [
        _materialized_card(
            card,
            order_index=index,
            option_shuffle_seed=f'{option_seed_base}|{card.get("id")}|{index}',
            ui_language=ui_language,
        )
        for index, card in enumerate(ranked[: max(1, limit)])
    ]
    _record_served_cards(user_id=user_id, cards=selected)
    selected = [card for card in selected if _is_runtime_card_visible(card, ui_language)]
    if not selected:
        raise RuntimeError("No release-safe localized cards available for this request.")

    session_id = f'cards_{user_id}_{len(_SESSIONS) + 1}'
    session = {'session_id': session_id, 'user_id': user_id, 'status': 'active', 'current_card_index': 0, 'answered_count': 0, 'cards': selected, 'created_at': iso_now(), 'updated_at': iso_now(), 'ui_language': ui_language}
    _SESSIONS[session_id] = session
    return {'session': _session_state(session), 'first_card': _public_card(selected[0])}


def next_card(*, user_id: str, session_id: str) -> dict:
    session = _SESSIONS[session_id]
    session['current_card_index'] += 1
    session['updated_at'] = iso_now()
    completed = session['current_card_index'] >= len(session['cards'])
    if completed:
        session['status'] = 'completed'
        return {'card': None, 'completed': True}
    return {'card': _public_card(session['cards'][session['current_card_index']]), 'completed': False}


def answer_card(*, user_id: str, session_id: str, user_answer: str) -> dict:
    session = _SESSIONS[session_id]
    card = session['cards'][session['current_card_index']]
    follow_up = card['served_follow_up']
    options = follow_up.get('options') or []
    normalized_user = _normalized_text(user_answer)
    accepted = {_normalized_text(value) for value in (card.get('_accepted_variants') or []) if str(value).strip()}
    correct = normalized_user in accepted
    if options and follow_up.get('evaluation_mode') == 'option_id':
        correct = str(user_answer).strip() == str(follow_up.get('answer_key') or '') or normalized_user == _normalized_text(str(follow_up.get('answer_text') or ''))
    session['answered_count'] += 1
    if correct:
        card['state'] = 'mastered' if card['seen_count'] >= 2 else 'learning'
    else:
        card['state'] = 'difficult'
    card['seen_count'] += 1
    session['updated_at'] = iso_now()
    next_info = next_card(user_id=user_id, session_id=session_id)
    explanation = card.get('explanation') if not correct else None
    return {
        'correct': correct,
        'explanation': explanation,
        'correct_answer': {'value': card.get('_answer_value') or ''},
        'accepted_variants': list(card.get('_accepted_variants') or []),
        'next_card': next_info['card'],
        'session_completed': next_info['completed'],
    }


def list_cards(*, user_id: str, domain: str, content_type: str | None, profession: str | None, level: str | None, source: str | None = None, ui_language: str | None = None) -> dict:
    cards = _filtered_cards(domain=domain, content_type=content_type, profession=profession, source=source)
    level_band = _normalized_level(level)
    filtered = [card for card in cards if card['level_band'] in LEVEL_EXPANSION[level_band]]
    materialized = []
    for i, card in enumerate(filtered):
        runtime_card = _materialized_card(card, order_index=i, ui_language=ui_language)
        if not _is_runtime_card_visible(runtime_card, ui_language):
            continue
        materialized.append(_public_card(runtime_card))
    return {'cards': materialized}


def get_card_hint_context(*, card_id: str, ui_language: str | None = None) -> dict[str, Any] | None:
    """Return backend-authoritative hint context for one card.

    The client may send display text for UX, but hints must be grounded in the
    runtime/card bank source of truth so the client cannot accidentally or
    maliciously provide a wrong correct_answer/options pair.
    """
    normalized_card_id = str(card_id or '').strip()
    if not normalized_card_id:
        return None

    source_card = None
    for candidate in load_authority_cards():
        if str(candidate.get('id') or '').strip() == normalized_card_id:
            source_card = candidate
            break

    if source_card is None:
        return None

    materialized = _materialized_card(
        source_card,
        order_index=0,
        option_shuffle_seed=f'hint|{normalized_card_id}',
        ui_language=ui_language,
    )

    if not _is_runtime_card_visible(materialized, ui_language):
        return None

    follow_up = materialized.get('served_follow_up') if isinstance(materialized.get('served_follow_up'), dict) else {}
    raw_options = follow_up.get('options') if isinstance(follow_up.get('options'), list) else []
    options: list[str] = []
    for option in raw_options:
        if isinstance(option, dict):
            text = str(option.get('text') or '').strip()
        else:
            text = str(option or '').strip()
        if text:
            options.append(text)

    prompt = str(
        follow_up.get('prompt')
        or materialized.get('prompt')
        or materialized.get('back_prompt')
        or ''
    ).strip()

    correct_answer = str(
        follow_up.get('answer_text')
        or materialized.get('_answer_value')
        or ''
    ).strip()

    return {
        'card_id': normalized_card_id,
        'front_text': str(materialized.get('front_text') or materialized.get('front') or '').strip(),
        'prompt': prompt,
        'content_type': str(materialized.get('content_type') or '').strip() or None,
        'correct_answer': correct_answer,
        'options': options,
    }


def report_card_issue(*, user_id: str, card_id: str, reason: str, note: str | None = None, session_id: str | None = None) -> dict[str, Any]:
    normalized_card_id = str(card_id or '').strip()
    normalized_reason = str(reason or '').strip()
    normalized_note = str(note or '').strip() or None
    normalized_session_id = str(session_id or '').strip() or None

    if not normalized_card_id:
        raise AppError(400, 'VALIDATION_ERROR', 'card_id is required.', False, {'classification': 'non_retryable'})
    if not normalized_reason:
        raise AppError(400, 'VALIDATION_ERROR', 'reason is required.', False, {'classification': 'non_retryable'})
    if normalized_session_id and normalized_session_id not in _SESSIONS:
        raise AppError(404, 'CARDS_INVALID_SESSION', 'Card session was not found.', False, {'classification': 'terminal'})

    issue_id = new_id('card_issue')
    issue_payload = {
        'issue_id': issue_id,
        'user_id': user_id,
        'card_id': normalized_card_id,
        'reason': normalized_reason,
        'note': normalized_note,
        'session_id': normalized_session_id,
        'created_at': iso_now(),
        'status': 'open',
    }

    with STORE.locked(('cards_issues', issue_id)):
        STORE.set('cards_issues', issue_id, issue_payload)

    return {
        'ok': True,
        'issue_id': issue_id,
        'card_id': normalized_card_id,
        'reason': normalized_reason,
        'note': normalized_note,
        'session_id': normalized_session_id,
        'status': 'open',
    }
