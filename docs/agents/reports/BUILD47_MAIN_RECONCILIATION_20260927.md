# Build 47 → current main reconciliation ledger

Date: 2026-09-27
Purpose: forward-only integration of the tested Build 47 learner stack with current `main`.

## Required ancestors

- current main: `b3a7f66644fb16fb748cbaf18c02f490a03bc0bd`
- submitted iOS Build 47 source: `63073fd9cef57f0dc5e703386d346043b19fabc0`
- Build 47 subscription/OTA authority: `bed89967444919864baca9c892a9c8c8bfc3c4cf`
- tested Phase-10 learner head: `8ea051c4ece6d2000f90e1e8ab567d395360b349`

The final reconciliation commit must contain current main and the tested Phase-10 head as parents, making all four identities ancestors.

## Divergent main-line capability decisions

### apps/main-domain-static/** — KEEP current main

Decision: **KEEP**

Reason:
- current main contains the live Floently gateway and full Floently Read experience;
- the Build-47 snapshot contains unrelated later website experiments that mark Read as "Coming soon" and change legal routing;
- those website changes are not required by the Build-47 mobile learner release and must not overwrite the live public site.

Implementation:
- use the exact `apps/main-domain-static` subtree from current main;
- main subtree SHA: `af5e3a014828e8ea203172aa95f1e3e32489bb59`.

### May canonical card-bank publication — REPLACE with tested Build-47 authority

Decision: **REPLACE**

Reason:
- the Build-47 lineage contains later card/runtime integration and safety work on top of the older May changes;
- later candidate history includes production overlay support, overlay completeness fallback separation, localized prompt fallback, quarantined option-translation fallback gating, and the OTA-enabled iOS safety checkpoint;
- current Build-47 CI material-convergence/deployable-backend gates pass;
- card-level and navigation invariants pass on the tested Phase-10 head.

Do not restore older May card files over the newer tested card authority.

### card_i18n option/overlay runtime — REPLACE with newer tested Build-47 versions

Decision: **REPLACE**

Candidate runtime files are later and larger implementations than the divergent main copies:
- `card_i18n_option_cache_runtime.py`
- `card_i18n_overlay_runtime.py`
- `cards_logic.py`
- related option-translation assets.

Protected source and runtime checks passed on the Phase-10 head.

### obsolete floently_clean_promote_pipeline/** — KEEP deletion

Decision: **DELETE / KEEP DELETED**

The current main cleanup removed the obsolete tool tree. The Build-47 release must not resurrect it.

## Build-47 learner capabilities brought forward

The tested learner stack includes:
- progressive navigation/disclosure;
- deterministic 300-stage Guided Speaking;
- explicit Cards CEFR level gate;
- one-obvious-next Practice session;
- server-owned Roleplay pool rotation/isolation;
- Professional mission chain;
- deterministic Reading/Writing A1–C2;
- restrained motion/accessibility feedback;
- Professional Listening;
- minimal voice-first Roleplay UI;
- orb tap once to start recording, tap again to stop/transcribe/submit;
- swipe-up reserved for typing/secondary controls;
- text-only mode without orb.

## Exact-head qualification before reconciliation

On `8ea051c4ece6d2000f90e1e8ab567d395360b349`:
- CI #410: PASS
- Wave 1 governance #279: PASS
- YKI evaluation #202: PASS
- Roleplay audio invariants #127: PASS
- Roleplay scenario rotation #138: PASS
- TypeScript: PASS
- iOS OTA export: PASS
- navigation / voice UI invariants: PASS

The visual-smoke workflow's red status is limited to stale textual expectations:
- collapsed drawer expected literal `Professional`;
- old voice hint expected `Swipe up to speak or type`.
The rendered Phase-10 surfaces themselves had no page errors or console errors and showed the intended updated copy.

## Release rule

No OTA or main promotion is allowed until the reconciled commit itself passes the protected invariant suite and artifact identity checks.

Required final markers:
- `PRODUCTION_ANCESTRY_GATE=PASS`
- `PROTECTED_INVARIANT_GATES=PASS`
- `CANDIDATE_ARTIFACT_IDENTITY=PASS`
- `POST_DEPLOY_CANARY=PASS`
