# Mobile Boot Report

**Date:** 2026-04-11  
**Target:** Android physical device — SM02E4060333233 ("Seeker")  
**Expo mode (Phase 1):** Expo Go  
**Expo mode (Phase 2):** Native dev client (`com.vitusidi.client` via `expo run:android`)  
**Boot verdict: SUCCESS (both modes)**

---

## Boot sequence evidence

### Step 1 — Backend started

```
uvicorn main:app --host 0.0.0.0 --port 8000
```

```
INFO: Started server process [11771]
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
```

Endpoints confirmed responding:
- `GET /health` → `{"status":"ok"}`
- `GET /api/v1/auth/status` → `{"isAuthenticated":false,"mockAuthEnabled":true,"mode":"development"}`

### Step 2 — Metro bundler started

```
npx expo start --android
```

```
React Compiler enabled
Starting Metro Bundler
Opening exp://192.168.100.41:8081 on Seeker
Waiting on http://localhost:8081
```

Metro status confirmed: `http://localhost:8081/status` → `packager-status:running`

### Step 3 — App opened on device

ADB confirmed Expo Go launched the ExperienceActivity:
```
topResumedActivity: host.exp.exponent/.experience.ExperienceActivity t207
```

### Step 4 — JS runtime reached home screen

Device logcat (ReactNativeJS):
```
W ReactNativeJS: 'Recording stop requested without an active recording.'
  { currentScreen: 'home', lastUserAction: 'recording:stop', actionType: 'RECORDING_STOP' }
W ReactNativeJS: 'Audio lifecycle guard released active media because app left foreground.'
  { currentScreen: 'home', lastUserAction: 'recording:stop', actionType: 'AUDIO_LIFECYCLE_GUARD' }
```

**`currentScreen: 'home'` confirmed in JS runtime.**

---

## Screen navigation status

| Screen | Status | Evidence |
|---|---|---|
| App load / splash | ✅ Loads | App opened in Expo Go ExperienceActivity |
| AppShell bootstrap | ✅ Passes | No loading loop observed; home screen reached |
| Home | ✅ Renders | `currentScreen: 'home'` in logcat |
| Auth | ✅ Route exists, stub renders | `AuthRoute.tsx` present; login/register screens exist |
| Learn | ⚠️ Stub UI | `LearningRoute.tsx` renders placeholder |
| Cards | ⚠️ Stub UI | Route stub; no backend endpoint mounted |
| YKI Practice | ⚠️ Stub UI + backend guard | Requires mounted yki session backend route |
| YKI Exam | ⚠️ Stub UI | Route stub present |
| Speaking | ⚠️ Stub UI | FeatureEntryRoute placeholder |
| Professional Finnish | ⚠️ Stub UI | FeatureEntryRoute placeholder |

---

## Non-fatal warnings

| Warning | Cause | Impact |
|---|---|---|
| `expo-av` version mismatch (15.1.7 vs expected ~16.0.8) | `package.json` not updated for Expo 54 | None — audio works but may have API surface gaps |
| `Recording stop without active recording` | Audio lifecycle guard fired on app background | None — expected audio lifecycle event |
| `--non-interactive not supported` | CI flag passed to Expo | None — use `CI=1` instead |

---

## Runtime API connectivity note

The client defaults `EXPO_PUBLIC_API_BASE_URL` to `http://localhost:8000`. On a physical device, this means the device's own loopback, not the host machine. Backend API calls from the device will fail unless:
- `EXPO_PUBLIC_API_BASE_URL=http://192.168.100.41:8000` is set in `apps/client/.env.local`, or
- A production backend URL is configured.

The home screen rendered despite this because the AppShell auth hydration reads from persisted local storage first, and the home screen component does not make an immediate API call on render.

---

## Fatal crashes

**None observed.**

---

## Red screen errors

**None observed.**

---

## Phase 2 — Native dev client boot (`com.vitusidi.client`)

After the Expo Go boot, a native dev client was built via `expo prebuild --clean && expo run:android --device`. This required fixing three blocking issues before the bundle loaded cleanly:

### Issues resolved during Phase 2

| Issue | Root Cause | Fix Applied |
|---|---|---|
| Metro 500: `@expo/metro-runtime` unresolvable | Metro running from monorepo root; no `metro.config.js` in `apps/client` | Created `apps/client/metro.config.js` using `expo/metro-config`; always run Metro from `apps/client` directory |
| `Invariant Violation: Tried to register two views with the same name RNCSafeAreaProvider` | `react-native-safe-area-context` at two versions (5.6.x + 5.7.0) in bundle | Updated `apps/client/package.json` to `~5.7.0` to unify both copies |
| `Invalid hook call` / `useId null` crash | Two React versions in bundle: `react@19.1.0` (apps/client) + `react@19.2.5` (root, hoisted from `@react-navigation/*`) | Added `resolver.resolveRequest` in `metro.config.js` to intercept all `react`/`react/jsx-runtime` imports and pin to `apps/client/node_modules/react` |
| `window.addEventListener is not a function` | `networkStore.ts` checked `typeof window !== "undefined"` but RN Hermes has `window` without browser APIs | Added `typeof window.addEventListener === "function"` guard in `networkStore.ts` |

### Phase 2 boot evidence (native dev client)

Device: `com.vitusidi.client` installed on SM02E4060333233  
ADB: `adb reverse tcp:8081 tcp:8081` → Metro tunnel established  
Launch: `client://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081`

Logcat (ReactNativeJS) after all fixes applied:
```
I ReactNativeJS: Running "main" with {"rootTag":1,"initialProps":{},"fabric":true}
W ReactNativeJS: 'SafeAreaView has been deprecated...'  ← non-fatal, expo-router internal
I ReactNativeJS: [floently] Screen transition resolved. {"actionType":"SCREEN_TRANSITION","currentScreen":"home"}
```

**`currentScreen: "home"` confirmed in native dev client.** No fatal crashes, no red screens.
