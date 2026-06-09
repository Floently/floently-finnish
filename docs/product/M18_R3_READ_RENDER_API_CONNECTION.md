# M18-R3 Read Render API Connection

This patch adds a small native mobile API client for Floently Read.

## Backend rule

Read backend remains on Render:

- `https://flowreader-api.onrender.com`

Learn backend remains on the Hetzner Learn server:

- `https://learn-api.floently.com`

The Read backend is not moved into the Learn server.

## Native app behavior

The native Read store now attempts to:

- load `/api/v1/documents`
- create text documents via `/api/v1/documents/from-text`
- update reading progress via `/api/v1/documents/{id}/progress`

If the Render API is unavailable or rejects the request, the app keeps the local fallback document so the Read frame remains usable during development.
