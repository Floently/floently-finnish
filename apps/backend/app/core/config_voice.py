from __future__ import annotations

import os
from pydantic import BaseModel


class VoiceConfig(BaseModel):
    # STT provider per final microphone plan
    STT_PROVIDER: str = os.getenv('STT_PROVIDER', 'faster-whisper')
    WHISPER_MODEL: str = os.getenv('WHISPER_MODEL', 'small')
    OPENAI_API_KEY: str | None = os.getenv('OPENAI_API_KEY')

    FFMPEG_BIN: str = os.getenv('FFMPEG_BIN', 'ffmpeg')
    MAX_UPLOAD_BYTES: int = int(os.getenv('VOICE_MAX_UPLOAD_BYTES', '20000000'))  # 20MB

    VOICE_UPLOAD_DIR: str = os.getenv('VOICE_UPLOAD_DIR', 'storage/voice/original')
    VOICE_NORM_DIR: str = os.getenv('VOICE_NORM_DIR', 'storage/voice/normalized')


voice_config = VoiceConfig()
