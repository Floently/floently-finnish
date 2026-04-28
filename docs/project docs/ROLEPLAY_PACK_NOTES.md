Apply these files over the current repo at `/home/vitus/floently-finnish/`.

What this pack assumes:
- `expo-av` is available on the client.
- The UI sounds are at `apps/client/components/public/sounds/ui/` with these files:
  - `tap_soft.wav`
  - `mic_on.wav`
  - `mic_off.wav`
  - `error.wav`
  - `success_chime.wav`
- If `/voice/tts/generate` and `/voice/stt` are already present in the backend, the new roleplay screens will use them immediately.
- If those shared voice routes are not mounted yet, the roleplay still renders, but AI audio playback or speech transcription will fall back to visible text/error until the voice router is mounted.

What this pack changes:
- Adds a production-oriented profession roleplay runtime with bounded 5-turn sessions.
- Adds new speaking/professional routes and reusable speaking screens.
- Adds recorder + TTS client helpers.
- Exports the new roleplay API client.
- Adds roleplay endpoints to `apps/backend/main.py` and mounts optional shared voice routers when present.

What this pack does not do:
- It does not normalize the large card banks.
- It does not change YKI exam routing or add the A1-A2 / B1-B2 / C1-C2 selector yet.
- It does not replace your existing shared voice router implementation; it only consumes it when available.
