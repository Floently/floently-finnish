# Pass 1 Merge Log

## Canonical merges applied before quarantine

1. Updated `apps/client/babel.config.js`
   - merged `module-resolver` aliases from the root Babel config
   - preserved `react-native-reanimated/plugin`
   - rewrote alias targets to be correct from `apps/client`

2. Updated `apps/client/app.json`
   - kept `scheme: "floently"`
   - preserved Android package identifier and iOS bundle identifier
   - added Android permissions required by the surviving mobile config family:
     - `RECORD_AUDIO`
     - `READ_EXTERNAL_STORAGE`
     - `WRITE_EXTERNAL_STORAGE`
     - `VIBRATE`
   - added `android.allowBackup: false` to carry forward the secure backup policy seen in the root native tree
   - added `ios.infoPlist` values that would otherwise have been lost with the native tree move:
     - ATS local networking
     - camera usage description
     - microphone usage description
     - photo library usage description
     - Face ID usage description
     - `UIViewControllerBasedStatusBarAppearance: false`

3. Updated root `package.json`
   - rewrote `"lint"` to `npm --workspace client run lint`
   - removes reliance on a root mobile app config

4. Updated `docker-compose.yml`
   - preserved monorepo install behavior
   - launches Expo from `apps/client` instead of relying on repo-root mobile authority

## No-op comparisons

- Root `App.tsx` contained no useful startup behavior
- Root `index.js` duplicated the Expo Router entry already declared by `apps/client/package.json`
- Root `metro.config.js` was weaker than the existing `apps/client/metro.config.js`; no merge was required
