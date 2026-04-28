# Backend authority decision

Use **`/home/vitus/floently-finnish/apps/backend/`** as the only active application backend.

## Why
- The mounted app entrypoint already lives in `apps/backend/main.py`.
- The current client routes and APIs are wired against the `apps/backend` surface.
- Keeping both `backend/` and `apps/backend/` active creates duplicate-entrypoint drift and inconsistent fixes.

## Required rule
- Treat `/home/vitus/floently-finnish/backend/` as **legacy / donor / reference only** unless a specific file is still missing from `apps/backend`.
- Do not run two backends in parallel for the production app.

## Practical next step
- If root `backend/` still contains unique code, migrate the missing pieces into `apps/backend/`.
- After that, archive or clearly mark the root `backend/` tree as non-runtime.
