# YKI Surgical Fix Open Issues

## Confirmed Fixed
- `AppShell.tsx` no longer imports the missing practice service path.
- In-process exam fallback now works when the external engine host is unreachable.

## Remaining Caution Areas
- I verified exam fallback for start, resume, one objective answer, final submit, and certificate fetch.
- I did not fully exercise writing/audio/speaking submission with real media files in this pass.
- The new in-process engine support modules are minimal runtime restorations intended to unblock governed fallback, not a full engine-package reconstruction.
- Metro may still need a clean restart if it cached the old failed module graph.

## Generated Runtime Artifacts
- Validation created untracked runtime artifacts such as:
  - `engine/.runtime_audio_cache/`
  - `exam_sessions/`
  - `logs/`
- These are runtime/test artifacts, not canonical source.
