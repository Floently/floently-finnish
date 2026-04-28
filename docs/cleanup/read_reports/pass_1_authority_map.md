# Pass 1 Authority Map

## Canonical survivor

Pass 1 leaves `apps/client/*` as the only active client app root inside the repo.

Canonical client authority in this pass:

- `apps/client/app/*` for Expo Router entry and route ownership
- `apps/client/app.json` for Expo app config
- `apps/client/babel.config.js` for Babel aliasing and Reanimated plugin setup
- `apps/client/metro.config.js` for Metro aliasing, workspace watch folders, and monorepo resolution
- `apps/client/package.json` for client scripts and Expo entrypoint

## Root duplicate families reviewed

### M01: Root mobile entrypoint duplication

- Root duplicate: `App.tsx`
  - Status: duplicate placeholder only
  - Live behavior found: none beyond a static test view
  - Merge action: none required
- Root duplicate: `index.js`
  - Status: duplicate Expo entry shim
  - Live behavior found: `import 'expo-router/entry'`
  - Canonical authority: `apps/client/package.json` `"main": "expo-router/entry"`
  - Merge action: none required

### M02: Root mobile config duplication

- Root duplicate: `app.json`
  - Live behavior found:
    - `expo-secure-store` plugin
    - `newArchEnabled: false`
    - Android/iOS package identifiers
    - root-only Expo Router override pointing at `apps/client/app`
  - Canonical action:
    - preserved plugin and package identifiers in `apps/client/app.json`
    - root-only router override was intentionally not preserved because `apps/client` is now the only app root
- Root duplicate: `babel.config.js`
  - Live behavior found:
    - `module-resolver` aliases for `@`, `@core`, `@ui`
    - `react-native-reanimated/plugin`
  - Canonical action:
    - merged into `apps/client/babel.config.js` with paths rewritten relative to `apps/client`
- Root duplicate: `metro.config.js`
  - Live behavior found:
    - monorepo watch folders
    - root `node_modules` resolution
  - Canonical action:
    - no new merge required because `apps/client/metro.config.js` already carried the stronger monorepo-aware config

### M03-M06: Native tree duplication

- `android/`
  - useful config extracted into canonical config:
    - `android.allowBackup=false`
    - required Android permissions retained in `apps/client/app.json`
- `ios/`
  - useful config extracted into canonical config:
    - local-networking ATS allowance
    - camera, microphone, photo library, and Face ID usage strings
    - status bar appearance flag
- `apps/client/android/`
  - treated as generated native tree, not survivor authority
  - no unique config beyond what already existed in `apps/client/app.json`
- `android_backup_before_prebuild/`
  - treated as backup-only contamination
  - no surviving authority

## Reference rewrites completed

- Root `package.json` lint script now delegates to the canonical client workspace
- `docker-compose.yml` now installs from the monorepo root and then launches Expo from `apps/client`

## Out-of-scope observations for later passes

- Documentation still contains historical references to removed Pass 1 paths
- `apps/backend/app/routers/yki_exam.py` still contains fallback file path logic around `pool_index.json`; this is unrelated to Pass 1 mobile deduplication
