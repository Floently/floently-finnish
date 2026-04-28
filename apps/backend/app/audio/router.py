from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.audio.audio_service import CardAudioService
from app.audio.repository import AudioAssetRepository, AudioAssetRepositoryError
from app.cards.observability import increment_metric, log_card_event
from app.cards.runtime.repositories.card_repository import CardRepository, CardRepositoryError

router = APIRouter(prefix="/cards/audio", tags=["card-audio"])


@router.get("/{asset_id}")
async def get_card_audio(asset_id: str):
    repository = AudioAssetRepository()
    card_repository = CardRepository()
    runtime_audio = CardAudioService()
    try:
        asset = await repository.get_by_asset_id(asset_id)
    except AudioAssetRepositoryError as exc:
        increment_metric("cards.audio.lookup_failed")
        raise HTTPException(status_code=500, detail={"code": "audio_lookup_failed", "message": str(exc)}) from exc
    if asset is None or not asset.file_path.exists():
        try:
            card = await card_repository.get_card_by_audio_asset_id(asset_id)
        except CardRepositoryError as exc:
            increment_metric("cards.audio.lookup_failed")
            raise HTTPException(status_code=500, detail={"code": "audio_lookup_failed", "message": str(exc)}) from exc
        if card is not None:
            try:
                generated = await runtime_audio.ensure_runtime_audio(card)
                asset = await repository.get_by_asset_id(asset_id)
                if (asset is None or not asset.file_path.exists()) and generated.asset_ids:
                    asset = await repository.get_by_asset_id(generated.asset_ids[0])
            except Exception:
                asset = await repository.get_by_asset_id(asset_id)
    if asset is None or not asset.file_path.exists():
        increment_metric("cards.audio.missing")
        log_card_event("cards.audio.missing", asset_id=asset_id)
        raise HTTPException(status_code=404, detail={"code": "audio_missing", "message": "Audio asset not found"})
    return FileResponse(
        path=asset.file_path,
        media_type=asset.media_type,
        filename=asset.file_path.name,
    )
