from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.overview_service import (
    add_learning_phrase,
    get_learning_confidence,
    get_learning_modules,
    get_learning_phrase_bank,
    get_learning_planner,
    get_learning_revision_vault,
    get_learning_system,
    get_learning_work_tracks,
    get_learning_workplace_incident,
)

router = APIRouter(prefix='/api/v1/learning', tags=['learning'])


class PhraseBankAddRequest(BaseModel):
    finnish: str
    english: str
    context: str
    tags: list[str] = []


@router.get('/modules')
def modules() -> dict:
    return get_learning_modules()


@router.get('/system')
def system() -> dict:
    return get_learning_system()


@router.get('/planner')
def planner() -> dict:
    return get_learning_planner()


@router.get('/confidence')
def confidence() -> dict:
    return get_learning_confidence()


@router.get('/phrase-bank')
def phrase_bank() -> dict:
    return get_learning_phrase_bank()


@router.post('/phrase-bank')
def add_phrase(payload: PhraseBankAddRequest) -> dict:
    return add_learning_phrase(
        finnish=payload.finnish,
        english=payload.english,
        context=payload.context,
        tags=payload.tags,
    )


@router.get('/revision-vault')
def revision_vault() -> dict:
    return get_learning_revision_vault()


@router.get('/work-tracks')
def work_tracks() -> dict:
    return get_learning_work_tracks()


@router.get('/workplace-incident/{track}')
def workplace_incident(track: str) -> dict:
    return get_learning_workplace_incident(track)
