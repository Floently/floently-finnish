from __future__ import annotations

from fastapi import APIRouter

from app.services.overview_service import get_professional_overview

router = APIRouter(prefix='/api/v1/professional', tags=['professional'])


@router.get('/overview')
def overview() -> dict:
    return get_professional_overview()
