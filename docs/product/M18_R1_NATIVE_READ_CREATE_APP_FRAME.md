# M18-R1 Native Read/Create App Frame

## Purpose

This patch starts the real native Read/Create app frame inside the existing Floently Expo app.

It is not a web bundle and not a WebView wrapper.

## Added native routes

- `/read`
- `/read/import`
- `/read/library`
- `/read/reader`
- `/read/settings`
- `/create`

## Added native Read app frame

- Read home
- Read automatically setting, default ON
- Text import frame with auto language detection
- Library frame
- Reader frame
- Compact one-line time label
- Compact speed label
- Circular glowing progress tracker

## Added native Create app frame

- Create route opens a Coming soon screen.
- It does not expose unfinished Create tools.
- It states that Create is inside the app but not ready for production use yet.

## Remaining work

The next pass should connect the frame to real product entitlements and payments:

- Read-only users should see Read only.
- Create-only users should see Create only.
- Combined users should see both.
- Learn, Read, and Create entitlements must remain separate.
- Mobile payment mapping must be finalized before store release.

The next Read pass should connect:

- Native file picker
- Backend book extraction
- Backend language detection where available
- Backend-generated reading/listening assets
- Real TTS playback
- Persistent library storage

## Important rule

Do not replace this with a WebView. This frame exists to keep the app native.
