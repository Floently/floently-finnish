# Missing Frontend Feature Pack

This pack adds the user-facing surfaces that were still missing from the current Floently Finnish repo:

- Mock Exam Cycle
- Personal Phrase Bank
- Confidence Tracker
- Revision Vault
- YKI Planner
- Work Finnish Path
- Workplace Incident Lab

## Design intent

These files are additive and conflict-free:
- no existing files are overwritten
- new Expo routes are placed under existing route groups
- new feature folders follow the current `apps/client/features/*` structure
- UI is built with clear labels, large tap targets, and minimal ambiguity

## Placement

Copy the `apps/client/...` paths directly into the repo.

## Notes

- The screens are designed to work even before backend route wiring is finished by using service fallbacks.
- Once backend routes are ready, the same services will use live API responses.
