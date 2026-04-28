# Google Sign-In Setup Guide

This guide walks through the Google Cloud Console + Expo configuration steps you need to complete before Google Sign-In will work. The code in this shipment is complete; what follows is the configuration half that only you can do because it requires access to your Google Cloud project, your Apple bundle, your Android keystore, and your EAS/Render environments.

## Prerequisites

You'll need:
- A Google Cloud project (create one at https://console.cloud.google.com if you don't have one)
- Your Floently bundle identifiers (already set: `com.vitusidi.floently` for both iOS and Android)
- Your Android SHA-1 fingerprint (instructions below)
- Access to your EAS account and to your backend's environment variables (Render, Hetzner, etc.)

## Step 1 — Enable the Google Identity API

1. Go to https://console.cloud.google.com/apis/library
2. Search for "Google Identity Services"
3. Click "Enable"

If your project is fresh, also enable:
- "Google+ API" (legacy but still required for some flows)
- "Identity Toolkit API" (newer, preferred)

## Step 2 — Create three OAuth 2.0 Client IDs

Go to https://console.cloud.google.com/apis/credentials → "Create credentials" → "OAuth client ID".

You need to create **three separate client IDs** — one for each platform. Use the exact values below.

### 2a. Web client ID (also used by the backend)

- **Application type:** Web application
- **Name:** `Floently Web`
- **Authorized JavaScript origins:**
  - `http://localhost:8081` (Expo dev server)
  - `https://floently.com` (your production domain — adjust if different)
- **Authorized redirect URIs:**
  - `http://localhost:8081`
  - `https://floently.com`
  - Your backend URL + `/api/v1/auth/google/callback` (e.g. `https://api.floently.com/api/v1/auth/google/callback`)
- After creating: copy the **Client ID** AND the **Client Secret**. The web client ID is also what the backend uses for token verification.

### 2b. iOS client ID

- **Application type:** iOS
- **Name:** `Floently iOS`
- **Bundle ID:** `com.vitusidi.floently`
- After creating: copy the **Client ID**. It will look like `123456789-abcdef.apps.googleusercontent.com`.
- Also note the "iOS URL scheme" Google shows you — it's the **reversed** client ID, e.g. `com.googleusercontent.apps.123456789-abcdef`. You'll need this for `app.json`.

### 2c. Android client ID

- **Application type:** Android
- **Name:** `Floently Android`
- **Package name:** `com.vitusidi.floently`
- **SHA-1 certificate fingerprint:** see Step 3 below — you'll need to get this from your Android keystore.

## Step 3 — Get your Android SHA-1 fingerprint

There are two scenarios depending on how you build:

### If you build with EAS (recommended for prod)

```bash
cd apps/client
eas credentials --platform android

```

This opens an interactive menu. Pick "Production" → "Keystore: Manage everything needed to build your project" → "Show keystore credentials". The SHA-1 fingerprint is shown in the output.

If EAS doesn't have a keystore yet, it will offer to generate one — accept. After generation, run the same command to view the SHA-1.

You also need a SECOND SHA-1 for development builds — the Expo development debug keystore. Get it with:

```bash
eas credentials --platform android
# Select "development" profile when prompted
```

Both SHA-1 values must be added to the Android client ID in Google Cloud Console. Click "+ Add fingerprint" to add the second one.

### If you build locally

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Look for the line `SHA1: AB:CD:EF:...`.

For production keystores, replace the path and credentials with your release keystore's values.

## Step 4 — Configure Floently's `app.json`

I've prepared an updated `app.json` in this shipment. You need to fill in two placeholder values:

### 4a. The reversed iOS client ID

Open `apps/client/app.json`, find the `CFBundleURLTypes` block in `expo.ios.infoPlist`, and replace:

```json
"com.googleusercontent.apps.PLACEHOLDER_REVERSED_IOS_CLIENT_ID"
```

with the actual reversed iOS client ID from Step 2b. For example:

```json
"com.googleusercontent.apps.123456789-abcdef"
```

### 4b. (Recommended) Migrate `app.json` → `app.config.ts`

The app.json `extra.googleOAuth` block I added uses `${EXPO_PUBLIC_GOOGLE_*_CLIENT_ID}` placeholders, but Expo doesn't perform shell-style variable expansion in app.json. The cleaner way to inject env vars at build time is to convert app.json into app.config.ts.

If you'd prefer to keep app.json static, replace the `${...}` strings with your actual client IDs. **This is fine for development** but means your client IDs are committed to git. Google client IDs are not strictly secrets (they're discoverable from any installed app), but the web client SECRET is — and your backend uses it. Don't commit secrets.

If you want the env-var pattern, here's the conversion (replace `app.json` with this `app.config.ts`):

```typescript
// apps/client/app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Floently',
  slug: 'client',
  // ... (copy the rest of your existing app.json here as object literals)
  extra: {
    googleOAuth: {
      iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    },
  },
});
```

Delete `app.json` after creating `app.config.ts` — Expo prefers the latter when both exist, but having both is confusing.

## Step 5 — Set environment variables

### 5a. EAS (mobile builds)

Set these as EAS secrets so they're injected into your mobile builds:

```bash
cd apps/client
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "<your iOS client ID>"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "<your Android client ID>"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "<your Web client ID>"
```

Verify:
```bash
eas secret:list
```

### 5b. Backend (Render / Hetzner / wherever your backend lives)

Set these as backend environment variables:

```
GOOGLE_OAUTH_CLIENT_ID=<the Web client ID from Step 2a>
GOOGLE_OAUTH_WEB_CLIENT_ID=<the Web client ID from Step 2a>
GOOGLE_OAUTH_ANDROID_CLIENT_ID=<the Android client ID from Step 2c>
GOOGLE_OAUTH_ALLOWED_CLIENT_IDS=<Web client ID>,<iOS client ID>,<Android client ID>
GOOGLE_OAUTH_CLIENT_SECRET=<the Web client secret from Step 2a>
```

The `GOOGLE_OAUTH_ALLOWED_CLIENT_IDS` list is what the backend checks the JWT's `aud` claim against. All three IDs must be in the list because the iOS and Android apps will produce id_tokens audienced to their respective client IDs, while the web flow uses the web client ID.

The `GOOGLE_OAUTH_CLIENT_SECRET` is only needed for the web OAuth code-exchange flow. The mobile id_token flow doesn't use it. But we keep it set so the web flow works.

## Step 6 — Verify

After completing all steps:

### Mobile
1. `eas build --platform ios --profile preview` (or android)
2. Install the build on a device
3. Tap "Continue with Google"
4. Should see Google's account picker
5. Pick an account → should redirect back to Floently
6. Should land in the home screen, signed in

If you see "Google sign-in is not configured for ios": check that EAS injected the env var into the build. `eas build:list` and look at the build logs for `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.

If you see "Google did not return an id_token": your iOS or Android client ID isn't configured for `id_token` response type. This shouldn't happen with the Google Cloud Console UI defaults, but if it does, recreate the client ID.

If you see "Google authorization failed" with an error like `invalid_request`: the bundle ID or SHA-1 doesn't match what Google has on file. Re-check Step 2b/2c.

### Web
1. `npx expo start --web`
2. Tap "Continue with Google"
3. Google's account picker should open in a popup
4. Pick an account → popup closes → should be signed in

If the popup closes without signing in: the web client's authorized redirect URIs probably don't include your local dev URL. Add `http://localhost:8081` and any other ports you use.

## Common gotchas

- **"Google sign-in is locked for app and only works for web"** — this was your original error. It means the iOS or Android client IDs weren't configured, so the platform-specific check in `useGoogleSignIn` rejected the call. Fixed by completing Steps 2b, 2c, and 5a.

- **The OAuth consent screen blocks you** — go to https://console.cloud.google.com/apis/credentials/consent. While in "Testing" status, only listed users can sign in. Add yourself + a few testers, OR submit for verification (takes 1-3 weeks for Google to review). For pre-launch testing, "Testing" mode is fine.

- **"Tämä tili käyttää Google-kirjautumista"** error during password login — this is by design. If a user signed up with Google, they don't have a password. They must continue using Google to log in. (You can offer a "Set a password" option from Settings later.)

- **The reversed iOS client ID has hyphens or unusual characters** — use it exactly as Google shows it in the Cloud Console UI. Don't manually edit.

- **`maybeCompleteAuthSession` doesn't trigger** — make sure the redirect URI configured in Google Cloud matches what `expo-auth-session` produces. For local dev with the default Expo Go scheme, it's `https://auth.expo.io/@<expo-username>/<slug>`. For native standalone builds, it's `<scheme>://`, where scheme is `floently` per your `app.json`. You may need to add multiple redirect URIs to the web client in Google Cloud Console.

## What to test before you mark this done

- [ ] Email/password sign-in works (regression check — the form was broken before this shipment)
- [ ] Email/password account creation works
- [ ] Google sign-in works on iOS device build
- [ ] Google sign-in works on Android device build
- [ ] Google sign-in works on web (`npx expo start --web`)
- [ ] After Google sign-in, the user is redirected to home and sees their entitlements
- [ ] Cancelling the Google flow returns to AuthScreen with "Cancelled" state shown briefly
- [ ] Forgot password flow still works (regression check)

If any of these fail, capture the exact error string and share — most failures are configuration mismatches I can diagnose quickly given the error.
