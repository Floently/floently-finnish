# Floently Progress Tracker

## M20-E Read/Create web-parity native patch - 20260624T214230Z
- Branch expected: preview/enable-all-languages.
- Purpose: make mobile Read/Create follow the web product flow without using a WebView or website wrapper.
- Read flow: Floently Home -> Read landing -> Read auth -> login with returnTo -> native Read app.
- Create flow: Floently Home -> Create auth -> login with returnTo -> native Create Studio coming-soon screen.
- Changed areas: product gateway, Read landing, Read auth, protected Read app routes, native Read app UI, Create auth, Create coming soon, auth returnTo.
- Build status: not built by this patch. Inspect and verify before building.
