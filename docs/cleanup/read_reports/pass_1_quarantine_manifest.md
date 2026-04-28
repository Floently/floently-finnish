# Pass 1 Quarantine Manifest

Quarantine root: `/home/vitus/floently-finnish-duplication-quarantine/`

## Moved root mobile duplicates

- `App.tsx`
- `index.js`
- `app.json`
- `babel.config.js`
- `metro.config.js`

## Moved native/build trees

- `android/`
- `ios/`
- `apps/client/android/`
- `android_backup_before_prebuild/`

## Moved build/runtime contamination

- `.pytest_cache/`
- `logs/`
- `uploads/`
- `exam_sessions/`
- `apps/backend/cache/`
- `apps/backend/logs/`
- `apps/backend/uploads/`
- `apps/backend/runtime/`
- `apps/backend/exam_sessions/`
- `apps/backend/.tts_runtime/`
- `engine/.runtime_audio_cache/`
- `apps/client/.expo/`

## Post-move status

All listed paths were confirmed absent from `/home/vitus/floently-finnish/` after the move.
