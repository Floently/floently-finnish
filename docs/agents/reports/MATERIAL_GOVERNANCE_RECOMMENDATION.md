# Material Governance Recommendation

## Core rule

Adopt a strict two-canonical-family model:

1. YKI tasks
2. Cards

Everything else must be explicitly marked as one of:

- `source_truth`
- `published_runtime`
- `validated_donor`
- `offline_generation`
- `quarantine`
- `archive`

## Governance model

### 1. One canonical schema per runtime domain

- YKI runtime may use only the v3.2 certified task family.
- Card runtime may use only the canonical card envelope/publication/runtime family.

### 2. No raw corpus at runtime

- corpora under `practice_content/data/source_corpora`
- `yki_material_pipeline/*`
- `puhis/backend/practice/data/*`

must remain offline-only.

### 3. No multi-truth mirrors without status labels

If a bank is copied into `floently-finnish`, it must declare:

- origin repo
- schema family
- certification/validation status
- runtime/offline status
- last rebuild method

### 4. Every bank needs validator binding

No bank is deployable unless its validator is named and executable.

### 5. Separate inventory from payload

- inventory ledgers such as `material_inventory.json` must describe datasets
- published runtime card payloads must live elsewhere

These file roles must never be mixed.

### 6. Require publication stages

Suggested stages:

- `raw`
- `normalized`
- `validated`
- `published`
- `archived`
- `quarantined`

### 7. Require donor-entry manifests

Every donor import should include:

- source repo
- source path
- source schema family
- item count
- conversion script/version
- validation result summary

## Repository-specific policy

### `floently-finnish`

- becomes the deployment target and final published runtime owner
- should not be the place where uncontrolled raw generation happens

### `kielitaikka-yki-engine`

- remains authoritative YKI donor until the certified bank is internalized

### `puhis`

- remains authoritative card-schema donor until the full card system is internalized

### `kielitaika`

- remains authoritative professional-card donor for content, not for final card schema governance

### `yki_material_pipeline`

- stays forensic/offline only

## Required controls

### Pre-merge controls

- schema validation
- manifest consistency check
- duplicate-ID check
- runtime/offline placement check
- inventory contract check

### Release controls

- YKI certified bank hash/version recorded
- card dataset version recorded
- donor provenance recorded
- quarantine counts recorded

## Anti-drift rules

1. No new runtime JSON format without a schema file and validator.
2. No runtime publication straight from generators.
3. No checked-in material file may be called “authority” unless it has a declared validator and publication status.
4. No donor repo may silently remain a live dependency after internalization.
5. Runtime code may not read from raw donor banks directly.

## Recommendation

Use `floently-finnish` as the final governed runtime bank, but only after:

- importing the winning YKI certified bank family
- importing the winning card schema family
- converting `kielitaika` normalized cards into that card family

Anything else preserves multi-truth chaos.
