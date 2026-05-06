from __future__ import annotations

from fastapi import APIRouter

from app.audio.router import router as card_audio_router
from app.routers.health import router as health_router
from app.routers.learning import router as learning_router
from app.routers.professional import router as professional_router
from app.routers.speaking_lab import router as speaking_lab_router
from app.routers.yki_exam import router as yki_exam_router
from app.routers.yki_practice import router as yki_practice_router
from app.routers.v1_auth import build_auth_router
from app.routers.v1_payment import build_payment_router
from app.routers.v1_subscription import build_subscription_router
from app.routers.v1_voice import build_voice_router
from app.routers.v1_roleplay import build_roleplay_router
from app.routers.v1_yki import build_yki_router
from app.routers.v1_cards import router as cards_router
from app.routers.v1_devices import router as devices_router

router = APIRouter()

router.include_router(health_router)
router.include_router(learning_router)
router.include_router(yki_practice_router)
router.include_router(yki_exam_router)
router.include_router(professional_router)
router.include_router(speaking_lab_router)
router.include_router(build_auth_router())
router.include_router(build_yki_router())
router.include_router(build_voice_router())
router.include_router(build_roleplay_router())
router.include_router(build_subscription_router())
router.include_router(build_payment_router())
router.include_router(cards_router)
router.include_router(card_audio_router)
router.include_router(devices_router)
