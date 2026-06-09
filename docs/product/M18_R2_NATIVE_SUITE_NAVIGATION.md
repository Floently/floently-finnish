# M18-R2 Native Floently Suite Navigation

This patch connects native Read/Create routes into the existing Expo app shell.

## Backend split

- Learn backend stays on the Hetzner Learn server.
- Read/Create backend stays on Render.
- Read backend is not moved into the Learn server.

## Mobile app split

- Learn route: `/learn`
- Read route: `/read`
- Create route: `/create`

## Access model

The app shell is now prepared for product-specific visibility:

- `learnAccess`
- `readAccess`
- `createAccess`
- `isInternalAllAccess`

Create remains behind a safe native coming-soon screen until it is ready.
