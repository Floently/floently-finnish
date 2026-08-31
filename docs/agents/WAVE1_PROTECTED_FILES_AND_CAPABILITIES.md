# Wave 1 Protected Files and Capabilities

Status: MANDATORY
Date: 2026-08-16

This file supplements `docs/PRODUCTION_FORWARD_ONLY_INTEGRATION_POLICY.md`. It does not weaken or replace it.

## Protected production capabilities

No Wave-1 agent may weaken, bypass, delete or silently replace tests/behavior protecting:

- authentication and canonical learner identity;
- session/account isolation;
- subscription and entitlement checks;
- Cards session/deck/answer/audio behavior;
- Everyday Finnish route/path behavior;
- navigation, deep links and back behavior;
- public STT upload/proxy/backend/provider path;
- Roleplay microphone/STT behavior;
- Roleplay role/persona continuity;
- authenticated Roleplay session ownership and cross-account denial;
- exact Roleplay voice identity/gender contract;
- YKI four-skill runtime/evidence/submission semantics;
- YKI distinct multi-speaker dialogue audio;
- YKI formal exam/practice boundary;
- KieliValmis visible branding;
- current rollback/source-reconciliation evidence.

Every confirmed regression becomes a permanent test. Existing regression tests may only be replaced by equivalent or stronger coverage with documented Agent-A review.

## High-risk shared files/directories

Treat these as integration-owned unless an agent prompt explicitly permits a narrow edit:

- `apps/backend/main.py`
- `apps/backend/app/router.py`
- `apps/backend/app/auth/**`
- canonical auth/current-user helpers
- subscription/access/entitlement services and routers
- `apps/backend/app/routers/v1_roleplay.py`
- Roleplay ownership/session services
- `apps/backend/app/services/tts/**`
- `apps/backend/app/routers/v1_yki.py`
- formal YKI runtime/evaluation/submission services
- `apps/client/state/AppShell.tsx`
- `apps/client/state/navigationModel.ts`
- canonical API auth/token client
- Roleplay audio/STT transport
- YKI formal runtime screen/audio helper
- Cards practice/audio core
- `.github/workflows/roleplay-*`
- `.github/workflows/yki-*`
- production reconciliation/release policy documents
- Docker/production compose/deployment scripts
- App Store/Play Store/EAS production configuration
- secrets/environment templates used by production

A feature agent needing a modification here must prefer a new adapter or record an `INTEGRATION_REQUIREMENT` for Agent A.

## Forbidden operations

Wave-1 agents MUST NOT:

- SSH to the live server;
- invoke server-side Docker/Compose/Kubernetes/systemd operations;
- restart backend/frontend/proxy services;
- mutate production databases, files, state snapshots, queues or caches;
- run migrations against live data;
- publish an Expo OTA/update channel;
- create a mobile store release;
- alter production DNS, certificates, secrets or environment variables;
- retag, delete or overwrite the protected rollback image;
- change `main` or `integration/canonical-production-20260816`;
- force-push any shared/integration/production ref;
- merge its own draft PR;
- deploy a feature branch because its own tests pass.

## New native dependency rule

A Wave-1 feature agent may not add native dependencies or change native build configuration without explicit Agent-A/user approval. This includes animation/graphics SDKs, analytics SDKs and new device capabilities. Prefer currently installed Expo/React Native/Reanimated/SVG/Haptics facilities.

## Data truth rule

Do not present learner-specific weakness, overdue review, progress, confidence, mastery or adaptive recommendations unless the underlying durable learner-specific evidence is real and correctly keyed.

Evidence-poor experiences may use transparent curriculum balancing, but must not masquerade as personalization.

## YKI/content integrity rule

- Do not copy official exam items or proprietary textbooks/courses.
- Do not change official/licensed prerecorded audio into TTS unless explicitly intended and provenance permits it.
- Do not silently turn short Practice into a timed/full YKI exam.
- Do not weaken existing answer-protection or final-submit recovery behavior.

## Merge/conflict rule

A conflict touching a protected capability is resolved by behavior analysis and tests, never by `ours`, `theirs`, folder replacement, broad copy or whichever file has a later timestamp.
