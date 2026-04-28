# Floently Learn Pipeline v4 Spec

## Core contract

- Input may be clean or messy
- Pipeline recovers or reads AID
- Pipeline extracts MGI
- Pipeline generates APS
- Runtime consumes APS only

## Stage summary

1. Intake
2. AID detection/recovery
3. Deterministic extraction
4. Optional AI recovery/verification
5. Normalization
6. Duplicate analysis
7. APS generation
8. Validation and sanitation
9. Release candidate packaging

## Sweet spot for AI

- Batch-level AID verification
- Uncertain item extraction/recovery
- Duplicate cluster adjudication
- Pre-human release screening

Deterministic logic remains authoritative for:

- schema
- IDs
- packaging
- hard validation
- certification state transitions
