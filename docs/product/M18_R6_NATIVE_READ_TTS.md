# M18-R6 Native Read TTS

This patch connects the native Floently Read reader to the existing Render TTS endpoint.

## Backend rule

Read/Create remains on Render:

- `https://flowreader-api.onrender.com`

Learn remains on Hetzner:

- `https://learn-api.floently.com`

No Read backend is moved into the Learn server.

## TTS contract used

Native Read calls:

- `POST /api/tts/prerender`

with:

- `Authorization: Bearer <current Learn login token>`
- `text`
- `voiceId`

Render returns an `audioUrl`, cache metadata, duration, voice id, and timing metadata when available.

## Native behavior

The reader can now:

- request Render TTS for the active reading
- load the returned `audioUrl` into `expo-audio`
- play, pause, and replay audio
- show real current-time/duration labels when playback status is available
- update reading progress from audio playback position
- preserve safe UI if TTS fails

## Next

M18-R7 should connect Read payment/access rules so Read-only users and Learn-only users are handled cleanly before iOS build testing.
