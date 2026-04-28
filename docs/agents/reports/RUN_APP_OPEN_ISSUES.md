# Run App Open Issues

**Date:** 2026-04-11  
**Source:** Live boot execution on Android physical device

These are the open issues discovered or confirmed during the run app execution. They supplement the prior `POST_FIX_OPEN_ISSUES.md`.

---

## Confirmed from prior audit (still open)

### RA-01 ← OI-01: `api/router.py` not mounted in `main.py`

Auth, YKI, audio, cards, voice, roleplay, subscription routes exist in `api/router.py` but are not mounted in the active `main.py`. The learning, yki-exam, yki-practice, professional, and speaking-lab endpoints in `main.py` work.

**Impact on run:** Backend API calls to auth/registration/yki-session routes will 404 at runtime.  
**Fix:** Mount `api_router` from `api/router.py` into `main.py`.

---

### RA-02 ← OI-03: Route stubs not implemented

`HomeRoute`, `AuthRoute`, `LearningRoute`, `YkiPracticeRoute`, `YkiExamRoute`, `FeatureEntryRoute` render placeholder UIs. App boots to home screen but navigation deeper shows stub content.

**Impact on run:** Home renders; all product feature screens are placeholders.  
**Fix:** Implement each Route component.

---

### RA-03 ← OI-07: `sessionPersistence.ts` uses `localStorage`, not AsyncStorage

Stub uses `window.localStorage`. This silently does nothing on native Android (no `window` object in Hermes). `@react-native-async-storage/async-storage` is installed but not wired.

**Impact on run:** Session persistence does not work on native. Auth sessions and navigation state are not persisted across app restarts.  
**Fix:** Replace all `localStorage` calls with `AsyncStorage` in `sessionPersistence.ts`.

---

## New issues found during this run

### RA-04: `EXPO_PUBLIC_API_BASE_URL` defaults to `localhost:8000` — resolves incorrectly on physical device

**File:** `packages/core/apiConfig.ts`, `packages/core/api/apiConfig.ts`  
**Impact:** On a physical device, API calls to `http://localhost:8000` hit the device's own loopback, not the host machine. Backend calls fail silently.  
**Fix:** Add `apps/client/.env.local` with `EXPO_PUBLIC_API_BASE_URL=http://<HOST_IP>:8000` for local dev. For production, add backend URL to `eas.json` `env` block.  
**Severity:** P1 for any feature that requires API calls. Home screen renders because it uses cached/mock state.

---

### ~~RA-05~~: `expo-av` version mismatch — **RESOLVED**

`expo-av` updated to `~16.0.8` in `apps/client/package.json`. Confirmed by `expo install --check`: "Dependencies are up to date."

---

### RA-06: App identity is placeholder — `name: "client"`, `slug: "client"`, no bundle identifiers

**File:** `apps/client/app.json`  
**Impact:** Cannot submit to any store until the app identity is established.  
**Fix:**
```json
{
  "expo": {
    "name": "Floently Finnish",
    "slug": "floently-finnish",
    "ios": { "bundleIdentifier": "com.floently.finnish" },
    "android": { "package": "com.floently.finnish" }
  }
}
```
**Severity:** P1 for store submission.

---

### RA-07: No EAS project linked — no `owner`, no `projectId` in `app.json`

**Impact:** EAS Build and Submit cannot run without a linked EAS project.  
**Fix:** Run `eas init` with an Expo account and copy `projectId` into `app.json` `extra.eas.projectId`.  
**Severity:** P1 for EAS-based builds and store submission.

---

### RA-08: App icon assets appear to be Expo defaults

**Files:** `apps/client/assets/images/icon.png`, `splash-icon.png`, `react-logo*.png`  
**Impact:** Default Expo/React assets will be rejected or create a poor first impression in store listings.  
**Fix:** Replace all images with Floently Finnish branded assets. Note: adaptive icon filenames in `app.json` reference `android-icon-*.png` which may be custom — verify visually.  
**Severity:** P1 for store submission.

---

### RA-09: No production backend — all API calls require local `uvicorn` running

**Impact:** The app has no deployed backend URL to connect to. Real users cannot use any API-dependent features.  
**Fix:** Deploy backend to Render, Railway, or equivalent. Set `EXPO_PUBLIC_API_BASE_URL` to the production URL in `eas.json` production environment config.  
**Severity:** P1 for any real release.

---

## New issues found during native dev client boot (Phase 2)

### RA-10: `networkStore.ts` — `window.addEventListener` crash on native — **RESOLVED**

**File:** `apps/client/state/networkStore.ts`  
`typeof window !== "undefined"` was true on RN Hermes, but `window.addEventListener` is `undefined`. Added `typeof window.addEventListener === "function"` guard.  
**Severity:** Was P1 blocker for native boot. Now resolved.

---

## Priority summary

| Issue | Priority | Description |
|---|---|---|
| RA-01 | P1 | API router not mounted |
| RA-02 | P1 | Route stubs not implemented |
| RA-03 | P1 | sessionPersistence uses localStorage not AsyncStorage |
| RA-04 | P1 | API base URL resolves to device loopback on physical device |
| ~~RA-05~~ | ~~P2~~ | ~~expo-av version mismatch~~ — RESOLVED |
| RA-06 | P1 (store) | App identity placeholder |
| RA-07 | P1 (store) | EAS project not linked |
| RA-08 | P1 (store) | App icon likely Expo default |
| RA-09 | P1 (store) | No production backend deployed |
| ~~RA-10~~ | ~~P1~~ | ~~networkStore window.addEventListener crash on native~~ — RESOLVED |
