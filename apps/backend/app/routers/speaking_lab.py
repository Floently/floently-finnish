from __future__ import annotations

from fastapi import APIRouter

from app.services.overview_service import get_speaking_lab_overview

router = APIRouter(prefix='/api/v1/speaking-lab', tags=['speaking-lab'])


@router.get('/overview')
def overview() -> dict:
    return get_speaking_lab_overview()
