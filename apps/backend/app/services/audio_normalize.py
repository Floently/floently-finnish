from __future__ import annotations

import os
import subprocess
import uuid

from app.core.config_voice import voice_config


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def normalize_to_wav16k_mono(input_path: str, output_dir: str) -> str:
    """Convert input audio to 16kHz mono WAV using ffmpeg."""
    ensure_dir(output_dir)
    out_name = f"{uuid.uuid4().hex}.wav"
    out_path = os.path.join(output_dir, out_name)

    cmd = [
        voice_config.FFMPEG_BIN,
        '-y',
        '-i',
        input_path,
        '-ac',
        '1',
        '-ar',
        '16000',
        '-f',
        'wav',
        out_path,
    ]

    try:
        p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    except FileNotFoundError:
        return input_path
    if p.returncode != 0:
        raise RuntimeError(f"ffmpeg failed: {p.stderr[:2000]}")
    return out_path
