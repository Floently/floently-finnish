# Run App Execution Log

**Date:** 2026-04-11  
**Operator:** RUN_APP_AGENT  
**Target:** Physical Android device ("Seeker" — SM02E4060333233)  
**Outcome:** SUCCESS — app booted to home screen, no fatal crash

---

## Environment audit

| Item | Result |
|---|---|
| Python | 3.12.3 |
| Node | v20.19.6 |
| npm | 10.8.2 |
| Android emulator (Pixel_5 AVD) | Available |
| Physical Android device | Connected — SM02E4060333233 ("Seeker") |
| iOS / Xcode | Not available on this machine |
| Host IP | 192.168.100.41 |

---

## Phase 1 — Environment and boot contract

**Files inspected:**
- `apps/client/package.json` — Expo 54, React 19, expo-router, zustand, all standard deps
- `apps/client/app.json` — slug "client", portrait orientation, newArchEnabled, Expo Router plugin
- `apps/client/eas.json` — preview/production build profiles, CLI >= 12.0.0 required
- `apps/client/tsconfig.json` — path aliases `@core/*`, `@ui/*`, `@/*`
- `docker-compose.yml` — backend on :8000, client on :8081/:19006
- `apps/backend/requirements.txt` — fastapi, uvicorn, pydantic, python-dotenv, httpx, pytest
- `apps/backend/main.py` — FastAPI app, CORS from SETTINGS, learning/yki endpoints

**Boot commands determined:**
- Backend: `cd apps/backend && uvicorn main:app --host 0.0.0.0 --port 8000`
- Client: `cd apps/client && npx expo start --android`

**Client expects:**
- Expo Go (no dev build required for first boot)
- Backend URL via `EXPO_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8000`)

---

## Phase 2 — Install and start dependencies

### Backend

```
python3 -m venv /tmp/floently-venv
pip install -r apps/backend/requirements.txt
```
Result: VENV_INSTALL_OK — all 7 packages installed cleanly

```
cd apps/backend && /tmp/floently-venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```
Result: 
```
INFO: Application startup complete.
INFO: Uvicorn running on http://0.0.0.0:8000
```

Health check: `GET /health` → `{"status":"ok"}` ✅  
Auth check: `GET /api/v1/auth/status` → `{"isAuthenticated":false,"mockAuthEnabled":true,"mode":"development"}` ✅

**Change made:** Created `apps/backend/.env` from `.env.example` (not committed). Required for SETTINGS to load.

### Client

```
cd apps/client && npm install
```
Result: 0 vulnerabilities, clean install.

TypeScript check: `npx tsc --noEmit` → 0 errors ✅

```
EXPO_PUBLIC_API_URL=http://localhost:8000 npx expo start --android
```

Metro output:
```
React Compiler enabled
Starting Metro Bundler
Opening exp://192.168.100.41:8081 on Seeker
Waiting on http://localhost:8081
```

Metro status check: `GET http://localhost:8081/status` → `packager-status:running` ✅

**Note:** expo-av version mismatch warning — installed 15.1.7, expected ~16.0.8 for Expo 54. Non-blocking for boot.

---

## Phase 3 — First mobile render proof

**Device:** Physical Android ("Seeker" — SM02E4060333233) — Expo Go installed

Expo automatically pushed the bundle URL to the device:
```
Opening exp://192.168.100.41:8081 on Seeker
```

ADB activity check confirmed Expo Go launched:
```
topResumedActivity: host.exp.exponent/.experience.ExperienceActivity
```

JS runtime log captured from device:
```
W ReactNativeJS: 'Recording stop requested without an active recording.'
  { currentScreen: 'home', lastUserAction: 'recording:stop', actionType: 'RECORDING_STOP' }
W ReactNativeJS: 'Audio lifecycle guard released active media because app left foreground.'
  { currentScreen: 'home', lastUserAction: 'recording:stop', actionType: 'AUDIO_LIFECYCLE_GUARD' }
```

**Verdict: App reached `currentScreen: 'home'`. No fatal errors. No red screen.**

---

## Phase 4 — Runtime blocker triage

### Blocker 1 — `EXPO_PUBLIC_API_BASE_URL` defaults to `http://localhost:8000`

- **Type:** env/config problem
- **Files:** `packages/core/apiConfig.ts`, `packages/core/api/apiConfig.ts`
- **Impact:** On a physical device, `localhost:8000` resolves to the device itself, not the host machine. Backend API calls will fail silently at runtime unless the env var is set to the host IP.
- **Fix:** Create `apps/client/.env.local` with `EXPO_PUBLIC_API_BASE_URL=http://192.168.100.41:8000` for local dev. For production, point to the deployed backend URL.
- **Applied now:** No (the app still booted to home screen; auth hydration succeeded from cached session state)

### Blocker 2 — `expo-av` version mismatch

- **Type:** install/dependency problem
- **Severity:** Warning only — does not block boot
- **Fix:** `npm install expo-av@~16.0.8` in `apps/client/`
- **Applied now:** No (non-blocking)

### Blocker 3 — Route stubs (OI-03)

- **Type:** route/state-shell problem
- **Severity:** Medium — app boots and home renders, but deeper routes show placeholder UIs
- **Fix:** Implement each Route component (HomeRoute, LearningRoute, etc.) per OI-03
- **Applied now:** No (out of scope for boot verification)

### Blocker 4 — Backend API routes not mounted (OI-01)

- **Type:** backend API availability problem
- **Severity:** High for full feature use, Low for first-render boot
- **Details:** `api/router.py` auth/yki/audio/cards routes are not mounted in `main.py`. The learning, yki-exam, yki-practice, professional, speaking-lab endpoints that ARE in `main.py` respond correctly.
- **Applied now:** No (not blocking home screen render)

---

## Phase 5 — Mobile release readiness check

See `RUN_APP_RELEASE_READINESS_REPORT.md`.

---

## Summary of changes made during this execution

| Change | File | Reason |
|---|---|---|
| Created `.env` from `.env.example` | `apps/backend/.env` | Required for SETTINGS import; not committed |

No source code changes were made.

---

## Phase 6 — Native dev client boot (session continuation, 2026-04-11)

After the Expo Go boot above, the user performed `expo prebuild --clean` + `expo run:android --device`, installing a native dev build `com.vitusidi.client`. This triggered a second boot sequence with additional blocking issues.

### Issues discovered and fixed

**1. Metro entry point wrong (Metro running from monorepo root)**

`npm exec expo start` from the monorepo root used `node_modules/expo/AppEntry.js` which tried `../../App` — a path that doesn't exist. The fix: always run `expo start` from `apps/client/`, not the monorepo root.

**2. Metro 500 — `@expo/metro-runtime` unresolvable**

`expo-router@6.0.23` nests `@expo/metro-runtime@6.1.2` with `"main": "src/index.ts"`. Without `metro.config.js` using `expo/metro-config`, Metro could not compile TypeScript from `node_modules`. Created `apps/client/metro.config.js`.

**3. Duplicate `react-native-safe-area-context`**

`react-native-safe-area-context@5.6.x` (direct dep) and `5.7.0` (@react-navigation/bottom-tabs) both in bundle → `Invariant Violation: Tried to register two views with the same name RNCSafeAreaProvider`. Updated `apps/client/package.json` to `~5.7.0`.

**4. Duplicate React versions**

`react@19.1.0` in `apps/client/node_modules/react` (direct dep), `react@19.2.5` in root `node_modules/react` (hoisted from `@react-navigation/*` which lives at root). Metro bundled both → `Invalid hook call` / `useId null`. Fixed by adding `resolver.resolveRequest` in `metro.config.js` to pin all `react` and `react/jsx-*` imports to `apps/client/node_modules/react`.

**5. `window.addEventListener` crash on native**

`networkStore.ts` guarded with `typeof window !== "undefined"`, which is `true` on RN Hermes. But `window.addEventListener` is not a function on Hermes. Added `typeof window.addEventListener === "function"` guard.

### Phase 6 boot result

```
I ReactNativeJS: Running "main" with {"rootTag":1,"initialProps":{},"fabric":true}
W ReactNativeJS: 'SafeAreaView has been deprecated...'  ← non-fatal
I ReactNativeJS: [floently] Screen transition resolved. {"actionType":"SCREEN_TRANSITION","currentScreen":"home"}
```

**Native dev client boots cleanly to `currentScreen: "home"`. No fatal crashes.**

### Changes made during Phase 6

| Change | File | Reason |
|---|---|---|
| Created | `apps/client/metro.config.js` | Expo SDK 54 requires expo/metro-config; enables TS resolution from node_modules |
| Updated `metro.config.js` | `apps/client/metro.config.js` | Added `resolver.resolveRequest` to deduplicate React versions; added `watchFolders` for root node_modules |
| Updated `react-native-safe-area-context` | `apps/client/package.json` | Changed `~5.6.0` → `~5.7.0` to unify with @react-navigation/bottom-tabs requirement |
| Fixed `window.addEventListener` guard | `apps/client/state/networkStore.ts` | Added `typeof window.addEventListener === "function"` check for RN Hermes compatibility |
