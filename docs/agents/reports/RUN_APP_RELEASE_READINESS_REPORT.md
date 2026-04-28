# Release Readiness Report

**Date:** 2026-04-11  
**Assessed by:** RUN_APP_AGENT  
**Based on:** Live boot run on physical Android device + codebase inspection

---

## Top-line verdicts

| Question | Verdict |
|---|---|
| Can this app be displayed on mobile right now? | **YES, WITH LIMITED CONDITIONS** |
| Can it enter Google Play internal testing right now? | **NO** |
| Can it enter TestFlight internal testing right now? | **NO** |
| Is it ready for Google Play production release? | **NO** |
| Is it ready for Apple App Store production release? | **NO** |

---

## Can this app be displayed on mobile right now?

**YES, WITH LIMITED CONDITIONS**

**Evidence:** App booted to `currentScreen: 'home'` on a physical Android device via Expo Go with zero fatal crashes.

**Conditions:**
1. Expo Go must be installed on the device.
2. The host machine must run `uvicorn main:app` in `apps/backend/`.
3. Metro must be running via `npx expo start --android` in `apps/client/`.
4. For device-to-backend API calls: `EXPO_PUBLIC_API_BASE_URL` must be set to the host machine's LAN IP (e.g., `http://192.168.100.41:8000`).
5. Several product screens render placeholder/stub UIs (Learn, Cards, YKI Practice, YKI Exam, Speaking, Professional Finnish). Home and Auth screens render.

---

## Can it enter Google Play internal testing right now?

**NO**

| Blocking issue | Severity | Fix path |
|---|---|---|
| No `android.package` identifier in `app.json` | Critical | Add `"package": "com.floently.finnish"` (or chosen identifier) to `app.json` `android` block |
| App name and slug are `"client"` (placeholder) | Critical | Update `name`, `slug` in `app.json` to the real product name |
| No EAS project ID / owner configured | Critical | Run `eas init` to link to an EAS account and project; add `owner` + `extra.eas.projectId` to `app.json` |
| App icon appears to be default Expo assets | High | Replace `assets/images/icon.png`, `splash-icon.png`, adaptive icon images with branded Floently Finnish assets |
| No production backend URL configured | High | `EXPO_PUBLIC_API_BASE_URL` must be set to a deployed backend in `eas.json` environment config |
| Route stubs not implemented (OI-03) | High | Learning, Cards, YKI Practice, YKI Exam, Speaking, Professional Finnish screens render placeholder UIs |
| Backend API router not mounted (OI-01) | High | Auth, YKI, audio, cards, voice, roleplay, subscription routes are not mounted in `main.py` |
| No production backend deployed | High | Backend must be deployed (Render, Railway, etc.) and accessible before a real build can connect to it |
| `expo-av` version mismatch | Medium | `npm install expo-av@~16.0.8` in `apps/client/` |
| No privacy policy / data safety declaration | Medium | Required for Google Play data safety form |
| No account deletion flow (if auth is used) | Medium | Google Play requires account deletion capability if the app has user accounts |

---

## Can it enter TestFlight internal testing right now?

**NO**

| Blocking issue | Severity | Fix path |
|---|---|---|
| No `ios.bundleIdentifier` in `app.json` | Critical | Add `"bundleIdentifier": "com.floently.finnish"` to `app.json` `ios` block |
| No EAS project ID / owner | Critical | Run `eas init` |
| App name is `"client"` (placeholder) | Critical | Update `app.json` name and slug |
| No Apple Developer account linked to EAS | Critical | Enroll in Apple Developer Program and link to EAS |
| App icon not branded | High | Replace with Floently Finnish branded assets |
| No production backend URL | High | Set in `eas.json` environment |
| Route stubs not implemented | High | See OI-03 |
| Backend API routes not mounted | High | See OI-01 |
| No privacy policy URL | Medium | Required in App Store Connect |
| `expo-av` version mismatch | Low | `npm install expo-av@~16.0.8` |

---

## Is it ready for Google Play production release?

**NO**

All Google Play internal testing blockers apply, plus:

| Blocking issue | Severity | Fix path |
|---|---|---|
| App content is stub / incomplete (multiple product screens) | Critical | Implement all Route components per OI-03 and OI-08 |
| No crash-free first-run without local backend | Critical | Backend must be deployed and production-grade |
| No backend auth production environment | Critical | DB, auth service, secrets must be production-configured |
| No subscription/billing integration | High | Stripe keys are blank in `.env.example`; billing routes not mounted |
| Engine authority not enforced (OI-04) | Medium | `apps/backend/yki/orchestrator.py` competes with root `engine/` |
| WCAG/accessibility review not done (OI-13) | Medium | Required for Play Store compliance |
| No store screenshots / feature graphic | Medium | Required for Play Store listing |
| Age rating not declared | Medium | Declare in Play Console |
| `(tabs)/` Expo starter residue (OI-10) | Low | Remove default Expo starter files |

---

## Is it ready for Apple App Store production release?

**NO**

All TestFlight blockers apply, plus:

| Blocking issue | Severity | Fix path |
|---|---|---|
| App content is stub / incomplete | Critical | Implement all Route components |
| No production backend | Critical | Must be deployed |
| No backend auth production environment | Critical | Required |
| No App Store screenshots (6.7", 5.5") | High | Required for App Store listing |
| No App Store description / keywords | High | Required |
| No privacy policy URL in App Store Connect | High | Required |
| WCAG review deferred (OI-13) | Medium | Apple reviews for accessibility compliance |
| Subscription/in-app purchase disclosure | Medium | If IAP/subscriptions exist, must be declared |

---

## What IS working now

- **Backend boots cleanly** from `apps/backend/` with venv
- **TypeScript passes with 0 errors**
- **Metro bundler runs successfully**
- **App opens in Expo Go on a physical Android device**
- **Home screen renders** — no fatal crash, no red screen
- **AppShell orchestration** — auth hydration, navigation state machine, error screen, session persistence all load
- **Backend learning endpoints** respond correctly at `/api/v1/learning/*`, `/api/v1/yki-exam/*`, `/api/v1/yki-practice/overview`, `/api/v1/professional/overview`, `/api/v1/speaking-lab/overview`
- **CORS, mock-login gate, secret guard** all configured correctly
