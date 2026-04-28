from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/exam", tags=["engine-exam"])


@router.get("/health")
def health():
    return {"ok": True, "detail": "engine scaffold only"}
