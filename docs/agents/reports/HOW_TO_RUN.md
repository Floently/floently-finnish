# HOW_TO_RUN

## Local setup

- Python: `3.12.3`
- Node: `v20.19.6`
- npm: `10.8.2`
- Android device testing was verified on a physical device via Expo Go.
- iOS simulator steps are included for completeness, but Xcode was not available on this machine.

### Install commands

Backend:

```bash
cd /home/vitus/floently-finnish/apps/backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Client:

```bash
cd /home/vitus/floently-finnish/apps/client
npm install
```

### Env files

Backend:

- Required file: `apps/backend/.env`
- Start from:

```bash
cd /home/vitus/floently-finnish/apps/backend
cp .env.example .env
```

Client:

- Recommended local file: `apps/client/.env.local`
- For local simulator or browser:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_MOCK_AUTH=true
```

- For Android physical device on the same LAN, replace with your host IP:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.X.Y:8000
EXPO_PUBLIC_MOCK_AUTH=true
```

### API base URL rules

- Web and emulator can usually use `127.0.0.1`.
- Physical devices must never use `localhost`.
- If `EXPO_PUBLIC_API_BASE_URL` is missing in Expo dev, the client now attempts to derive the host LAN IP from Expo dev metadata.
- Production builds must set `EXPO_PUBLIC_API_BASE_URL` to the deployed backend URL.

## Backend run steps

### Start backend

```bash
cd /home/vitus/floently-finnish/apps/backend
.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
```

### Required env vars

Minimum for local development:

- `FLOENTLY_ENV=development` or omit it
- `SIGNED_SESSION_SECRET` may stay at the dev default in development only

Optional but supported:

- `CORS_ORIGINS`
- `CORS_ALLOW_ORIGIN_REGEX`
- `ACCESS_TOKEN_MINUTES`
- `REFRESH_TOKEN_DAYS`
- `AUTH_PROVIDER_IDS`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_TIMEOUT_SECONDS`
- `YKI_ENGINE_BASE_URL`

### Verify health

```bash
curl -sS http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok","service":"floently-finnish"}
```

### Verify mounted routes

Public route:

```bash
curl -sS http://127.0.0.1:8000/api/v1/auth/methods
```

Expected:

- HTTP `200`
- JSON envelope with `ok: true`

Protected route without auth:

```bash
curl -i -sS http://127.0.0.1:8000/api/v1/subscription/status
```

Expected:

- HTTP `401`
- JSON envelope with `error.code = "AUTH_REQUIRED"`

Cards route:

```bash
curl -sS 'http://127.0.0.1:8000/cards/session?mode=vocabulary&limit=2'
```

Expected:

- JSON with `mode` and `items`

Mock auth:

```bash
curl -sS -X POST 'http://127.0.0.1:8000/api/v1/auth/mock-login?email=learner%40floently.local'
```

Expected:

- JSON with `token`
- JSON with `user.id`

## Client run steps

### Expo dev server

```bash
cd /home/vitus/floently-finnish/apps/client
npm run start
```

### Android physical device

Requirements:

- Expo Go installed on device
- phone and host on same LAN
- `EXPO_PUBLIC_API_BASE_URL` set to `http://<HOST_LAN_IP>:8000`

Run:

```bash
cd /home/vitus/floently-finnish/apps/client
npm run android
```

### Android emulator

Use either:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
```

or route through Expo dev config if available.

Run:

```bash
cd /home/vitus/floently-finnish/apps/client
npm run android
```

### iOS simulator

If on a Mac with Xcode:

```bash
cd /home/vitus/floently-finnish/apps/client
npm run ios
```

Suggested local API base:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

### Web

```bash
cd /home/vitus/floently-finnish/apps/client
npm run web
```

## Manual test path

1. Start backend and confirm `/health`.
2. Start Expo client.
3. Open the app.
4. Confirm Home renders.
5. Use mock auth or sign in/register.
6. Open each major area:
   - Home
   - Learn
   - YKI Practice
   - YKI Exam
   - Speak
   - Work
   - Progress
   - Settings
   - Billing
   - Help
7. Trigger at least one real action in each area:
   - mock login
   - fetch learning system
   - fetch YKI practice overview
   - fetch YKI mock cycle
   - fetch speaking lab overview
   - fetch professional overview
   - fetch cards session
   - fetch billing status
8. Restart the app and verify auth/session persistence still works.
9. Confirm there is no fatal crash or blank screen during the route path.

## Failure guide

### Metro not starting

Check:

- `npm install` completed in `apps/client`
- no stale Expo process is occupying port `8081`
- Node version is `v20.19.6`

Report:

- full Metro error output
- whether this is device, emulator, or web

### Backend health failing

Check:

- `.venv` exists in `apps/backend`
- `.venv/bin/pip install -r requirements.txt` completed
- `.env` exists
- `uvicorn main:app --host 0.0.0.0 --port 8000` was started from `apps/backend`

Report:

- startup traceback
- output of `curl -i http://127.0.0.1:8000/health`

### Device cannot reach backend

Check:

- physical device is using `http://<HOST_LAN_IP>:8000`, not `localhost`
- host and device are on the same LAN
- firewall is not blocking port `8000`

Report:

- exact `EXPO_PUBLIC_API_BASE_URL`
- device type
- whether browser access to the backend works from the device

### Auth failing

Check:

- `POST /api/v1/auth/mock-login` returns a token
- `EXPO_PUBLIC_MOCK_AUTH=true` if you are expecting mock auth
- protected routes return `401` without auth and `200` with a valid bearer token

Report:

- login/register action taken
- backend response body
- whether this was mock auth or password auth

### Route blank screen

Check:

- Metro logs
- JS error overlay
- backend console for the matching API call

Report:

- exact route path
- previous route
- whether refresh fixes it

### Audio failure

Check:

- `expo-av` dependencies were reinstalled after package update
- microphone permissions are granted
- backend voice route returns a controlled error instead of a crash

Report:

- device platform
- action taken
- any OS permission prompt behavior

### Billing failure

Check:

- mock login created a real bearer token
- `GET /api/v1/subscription/status` succeeds with the token
- `POST /api/v1/subscription/checkout` and `/portal` return URLs

Report:

- bearer-authenticated response body
- whether failure happened before URL launch or after it
