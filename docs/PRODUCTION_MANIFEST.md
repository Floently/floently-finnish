# Floently Finnish Production Manifest

This batch turns Floently Finnish into a single governed learning system with five product modes:

1. Learn
2. YKI Practice
3. YKI Exam
4. Professional Finnish
5. Speaking Lab

The core learning loop used across modes is:

Diagnose -> Learn -> Retrieve -> Produce -> Correct -> Schedule -> Review

## Architecture

- `apps/backend/` is the control layer and public API.
- `engine/` remains the authoritative YKI truth boundary and must be imported from the real engine repo.
- `apps/client/` owns routes and app shell.
- `packages/core/` owns shared API clients, schemas, analytics, and mode metadata.
- `packages/ui/` owns reusable UI primitives and app-level screens.

## Non-negotiable rules

- YKI exam truth remains outside this package and must come from the real engine repo.
- Practice mode and exam mode never share mutable runtime state.
- Feedback must teach, not only score.
- Learning scheduling is retrieval-first and review-aware.
- Professional Finnish must be task-based, not only vocabulary-based.

## What this batch contains

- Refactored backend control layer
- Evidence-based learning services and scheduler
- App shell and mode routes
- Premium UI components and mode screens
- Shared API and analytics layer
- Complete target tree document
