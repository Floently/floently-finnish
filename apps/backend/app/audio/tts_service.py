from __future__ import annotations

import hashlib
import shutil
import wave
from datetime import UTC, datetime
from pathlib import Path

from app.audio.models import AudioAsset
from app.audio.repository import AudioAssetRepository, AudioAssetRepositoryError
from app.cards.observability import increment_metric, log_card_event
from app.core.logger import logger
from app.services.audio_normalize import normalize_to_wav16k_mono
from app.services.tts.runtime import get_cached_audio_file, resolve_tts_audio
from app.services.tts.voice_registry import provider_voice_name


class CardTTSError(RuntimeError):
    """Raised when deterministic card audio generation fails."""


_VOICE_PROFILE_BY_SPEAKER_ID = {
    "a": "yki_standard_female",
    "speaker_a": "yki_standard_female",
    "b": "yki_standard_male",
    "speaker_b": "yki_standard_male",
    "c": "yki_standard_female",
    "speaker_c": "yki_standard_female",
    "d": "yki_standard_male",
    "speaker_d": "yki_standard_male",
    "narrator": "yki_standard_female",
}

_SPEED_BY_STYLE = {
    "vocabulary_prompt": 0.97,
    "sentence_prompt": 1.0,
    "grammar_prompt": 0.98,
    "dialogue_turn": 1.0,
}


class CardTTSService:
    def __init__(
        self,
        *,
        repository: AudioAssetRepository | None = None,
        storage_root: Path | None = None,
    ):
        self.repository = repository or AudioAssetRepository()
        self.storage_root = storage_root or (Path(__file__).resolve().parent / "storage" / "assets")
        self.storage_root.mkdir(parents=True, exist_ok=True)

    async def generate_audio(
        self,
        text: str,
        speaker_id: str,
        speaking_style: str,
        speed: float,
        context_type: str,
        *,
        speaker_label: str | None = None,
    ) -> AudioAsset:
        normalized_text = _normalize_text(text)
        if not normalized_text:
            raise CardTTSError("Audio text must be non-empty")

        resolved_speed = _normalize_speed(speed, speaking_style)
        resolved_speaker_id = str(speaker_id or "narrator").strip().lower() or "narrator"
        resolved_speaker_label = str(speaker_label or speaker_id or "Speaker").strip() or "Speaker"
        voice_profile = _voice_profile_for_speaker(resolved_speaker_id)
        text_hash = _build_text_hash(
            normalized_text,
            resolved_speaker_id,
            speaking_style,
            resolved_speed,
            context_type,
            voice_profile,
        )

        existing = await self.repository.get_by_text_hash(text_hash)
        if existing and existing.file_path.exists():
            increment_metric("cards.audio.cache_hit")
            log_card_event(
                "cards.audio.cache_hit",
                asset_id=existing.id,
                speaker_id=existing.speaker_id,
                voice_profile=existing.voice_profile,
            )
            return existing

        increment_metric("cards.audio.cache_miss")
        log_card_event(
            "cards.audio.generate_requested",
            speaker_id=resolved_speaker_id,
            voice_profile=voice_profile,
            context_type=context_type,
            speaking_style=speaking_style,
        )
        try:
            metadata = await resolve_tts_audio(
                text=normalized_text,
                voice=_voice_hint_for_profile(voice_profile),
                voice_profile=voice_profile,
                speed=resolved_speed,
                replayable=True,
            )
            source_path, source_metadata = get_cached_audio_file(metadata.cache_key)
            asset_id = f"audio_{text_hash[:24]}"
            target_path = self.storage_root / f"{asset_id}.wav"
            canonical_path = _materialize_canonical_audio(source_path, target_path)
            if canonical_path.suffix.lower() == ".wav":
                duration_seconds = _read_wav_duration(canonical_path)
                media_type = "audio/wav"
            else:
                duration_seconds = float(source_metadata.get("duration_seconds") or metadata.duration_seconds)
                media_type = str(source_metadata.get("media_type") or metadata.media_type or "audio/mpeg")
            provider = str(source_metadata.get("provider") or metadata.provider)
            voice_id = provider_voice_name(
                provider,
                voice_profile=voice_profile,
                voice_hint=_voice_hint_for_profile(voice_profile),
                persona_id=resolved_speaker_id,
            ) or voice_profile
            asset = AudioAsset(
                id=asset_id,
                text_hash=text_hash,
                source_text=normalized_text,
                speaker_id=resolved_speaker_id,
                speaker_label=resolved_speaker_label,
                voice_profile=voice_profile,
                voice_id=voice_id,
                provider=provider,
                speaking_style=speaking_style,
                speed=resolved_speed,
                context_type=context_type,
                file_path=canonical_path,
                duration_seconds=duration_seconds,
                media_type=media_type,
                created_at=datetime.now(UTC),
            )
            saved = await self.repository.save(asset)
            increment_metric("cards.audio.generated")
            log_card_event(
                "cards.audio.generated",
                asset_id=saved.id,
                provider=saved.provider,
                voice_profile=saved.voice_profile,
                duration_seconds=saved.duration_seconds,
            )
            return saved
        except (AudioAssetRepositoryError, Exception) as exc:
            logger.exception("Card audio generation failed")
            increment_metric("cards.audio.generation_failed")
            raise CardTTSError(str(exc)) from exc


def _normalize_text(text: str) -> str:
    compact = " ".join(str(text or "").replace("\u2026", "...").split())
    return compact.strip()


def _normalize_speed(speed: float, speaking_style: str) -> float:
    base = _SPEED_BY_STYLE.get(str(speaking_style or "").strip(), 1.0)
    requested = float(speed or base)
    return round(min(1.05, max(0.95, requested)), 2)


def _voice_profile_for_speaker(speaker_id: str) -> str:
    """Map a speaker_id to a voice_profile string used by the registry.

    Recognizes:
      - Generic dialogue ids: 'a', 'b', 'speaker_a', 'speaker_b', etc.
        (mapped via _VOICE_PROFILE_BY_SPEAKER_ID).
      - Finnish persona registry ids: 'fi-m-001' / 'fi-f-001' encode gender
        directly in the second segment.
      - Finnish first-name-based ids (e.g. 'matti_virtanen', 'anna_korhonen')
        — falls through to the hash-based gender guess only if neither of
        the above match. This is the path that previously misclassified male
        personas as female; now reached only as a last resort.

    The previous behavior of unconditional hash-based gender assignment for
    unrecognized ids was the root cause of "Matti Virtanen with woman's
    voice". Persona-registry-based ids are now the primary resolution path.
    """
    normalized = str(speaker_id or "").strip().lower()
    if normalized in _VOICE_PROFILE_BY_SPEAKER_ID:
        return _VOICE_PROFILE_BY_SPEAKER_ID[normalized]
    # Finnish persona registry id pattern: fi-m-NNN (male) or fi-f-NNN (female)
    if normalized.startswith("fi-m-"):
        return "yki_standard_male"
    if normalized.startswith("fi-f-"):
        return "yki_standard_female"
    # Last-resort hash fallback for completely unknown ids.
    digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return "yki_standard_female" if int(digest[:2], 16) % 2 == 0 else "yki_standard_male"


def _voice_hint_for_profile(voice_profile: str) -> str:
    return "male" if "male" in voice_profile else "female"


def _build_text_hash(
    text: str,
    speaker_id: str,
    speaking_style: str,
    speed: float,
    context_type: str,
    voice_profile: str,
) -> str:
    payload = "\n".join(
        [
            text.strip(),
            speaker_id.strip().lower(),
            str(speaking_style or "").strip().lower(),
            f"{speed:.2f}",
            str(context_type or "").strip().lower(),
            voice_profile.strip(),
        ]
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _materialize_canonical_audio(source_path: Path, target_path: Path) -> Path:
    target_path.parent.mkdir(parents=True, exist_ok=True)
    if target_path.exists():
        if target_path.suffix.lower() == ".wav":
            try:
                _read_wav_duration(target_path)
                return target_path
            except CardTTSError:
                logger.warning("Replacing invalid cached wav audio artifact at %s", target_path)
                target_path.unlink(missing_ok=True)
        else:
            return target_path
    if source_path.suffix.lower() == ".wav":
        shutil.copyfile(source_path, target_path)
        _read_wav_duration(target_path)
        return target_path

    try:
        normalized_path = Path(normalize_to_wav16k_mono(str(source_path), str(target_path.parent)))
    except FileNotFoundError:
        logger.warning("ffmpeg unavailable for card audio normalization; using raw synthesized file")
        passthrough_path = target_path.with_suffix(source_path.suffix.lower() or ".mp3")
        shutil.copyfile(source_path, passthrough_path)
        return passthrough_path

    if normalized_path == source_path:
        logger.warning("ffmpeg unavailable for card audio normalization; using raw synthesized file")
        passthrough_path = target_path.with_suffix(source_path.suffix.lower() or ".mp3")
        shutil.copyfile(source_path, passthrough_path)
        return passthrough_path

    shutil.move(str(normalized_path), target_path)
    _read_wav_duration(target_path)
    return target_path


def _read_wav_duration(path: Path) -> float:
    try:
        with wave.open(str(path), "rb") as wav_file:
            frame_rate = wav_file.getframerate()
            if frame_rate <= 0:
                raise CardTTSError(f"Invalid wav frame rate for {path}")
            frame_count = wav_file.getnframes()
            return round(frame_count / frame_rate, 3)
    except wave.Error as exc:
        raise CardTTSError(f"Corrupted wav audio file: {path}") from exc
