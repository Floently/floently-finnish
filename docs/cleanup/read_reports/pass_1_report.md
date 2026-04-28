# Pass 1 Report

## Outcome

Pass 1 completed the mobile-root deduplication and quarantine sweep.

- `apps/client/*` is now the only active client app root left in the repo
- root mobile entry duplicates were removed from the repo
- root and generated native build trees were removed from the repo
- targeted backup/build/runtime contamination for this pass was removed from the repo
- client verification still passes after the move

## Canonical decisions applied

- `apps/client/app.json` is the surviving Expo app config
- `apps/client/babel.config.js` is the surviving Babel config
- `apps/client/metro.config.js` is the surviving Metro config
- `apps/client/package.json` remains the Expo entry authority via `"main": "expo-router/entry"`

## Merge summary

- merged root Babel aliasing into `apps/client/babel.config.js`
- merged Android backup policy and required platform permissions into `apps/client/app.json`
- merged iOS Info.plist values needed after native tree removal into `apps/client/app.json`
- rewrote root lint and Docker client startup references to target `apps/client`

## Verification summary

- `npx tsc --noEmit`: pass
- `npx expo lint`: pass
- post-move sweep confirmed all Pass 1 quarantine targets are gone from the repo

## Quarantine destination

All Pass 1 moved material now lives under:

`/home/vitus/floently-finnish-duplication-quarantine/`
