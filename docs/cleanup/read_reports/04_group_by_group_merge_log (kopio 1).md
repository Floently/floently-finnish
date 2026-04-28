# Group By Group Merge Log

## Historical Cleanup

- Pass 1 removed the initial mobile/build/cache/runtime contamination group
- Pass 2 consolidated client duplicate source trees
- Pass 3 consolidated backend structural duplicate trees
- Pass 4 consolidated deep cards/audio/YKI authorities and quarantined the duplicate backend namespace roots
- Pass 5 resolved the remaining YKI material-path authority ambiguity and normalized cleanup-record structure

## Pass 6 Residue Cleanup

- removed residual runtime state and upload artifacts that still remained in the live tree
- removed generated audio asset caches under `app/audio/storage/assets/`
- removed remaining build/cache residue: backend pytest cache, repo-local Python bytecode caches, Expo cache, and `dist/`
- removed dead root migration-control artifacts and ad hoc TTS probe outputs
- repaired `apps/backend/tools/phase_5_2_live_verification.py` so it no longer depends on a checked-in runtime upload artifact
