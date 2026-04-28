"""
Learning/practice endpoints backed by the existing YKI task infrastructure.
"""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from engine.learning.daily_practice_engine import build_daily_practice_manifest


router = APIRouter(tags=["learning"])


class DailyPracticeRequest(BaseModel):
    level_band: str = "B1_B2"


@router.post("/learning/daily_practice")
def daily_practice(req: DailyPracticeRequest):
    return build_daily_practice_manifest(req.level_band)
