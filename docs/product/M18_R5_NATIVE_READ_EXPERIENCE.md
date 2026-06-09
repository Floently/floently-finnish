# M18-R5 Native Read Experience

This patch improves the native Floently Read app experience without moving any backend code.

## What changed

- Adds visible sync/loading/offline states for Render Read API connection.
- Improves Read home with library metrics, continue-reading card, and product boundary messaging.
- Improves import flow with three modes: paste text, book file, and web link.
- Keeps file and URL import safely disabled until native picker/extraction wiring is ready.
- Keeps paste-text import functional and auto-opens the reader when Read Automatically is enabled.
- Adds library refresh controls.
- Improves reader controls with compact time/speed label, circular progress, safe continue/pause UI, and M18-R6 TTS handoff note.
- Keeps Read separate from Learn billing/access unless a bundle is explicitly created later.

## Backend rule

- Read backend stays on Render: `https://flowreader-api.onrender.com`.
- Learn backend stays on Hetzner: `https://learn-api.floently.com`.
- Native Read continues to send the current Learn bearer token to Render Read.

## Next milestone

M18-R6 should connect real TTS/listening to Render and turn the safe player UI into real audio playback.
