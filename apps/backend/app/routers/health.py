from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.services.password_reset_email_service import get_password_reset_delivery_status

router = APIRouter(tags=['health'])


@router.get('/health')
async def health() -> dict[str, str]:
    return {'status': 'ok', 'service': 'floently-backend'}


@router.get('/api/v1/health/')
async def health_v1() -> dict[str, str]:
    return {'status': 'ok', 'service': 'floently-backend'}


@router.get('/api/v1/health/password-reset-delivery')
async def password_reset_delivery_readiness() -> JSONResponse:
    delivery = get_password_reset_delivery_status()
    return JSONResponse(
        status_code=200 if delivery.ready else 503,
        content={
            'status': 'ready' if delivery.ready else 'unavailable',
            'service': 'password-reset-delivery',
            'verification': 'configuration',
            **delivery.as_dict(),
        },
    )
