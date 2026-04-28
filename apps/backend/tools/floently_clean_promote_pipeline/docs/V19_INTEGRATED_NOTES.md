# Floently Pipeline v19

## What changed
- `run_pipeline` now runs preflight normalization automatically before the normal `run` stage.
- `promote_canonical` now runs the normal promotion stage and then automatically publishes `validated/` into `published/`.
- The package includes the repaired JSON inputs used to unblock:
  - general A1_A2 sentences
  - general C1_C2 grammar

## New runspec keys
### Run runspec
- `preflight_enabled`: default `true`
- `preflight_out`: where the normalized source copy will be written
- `preflight_report`: JSON report written by preflight
- `preflight_only_json`: default `true`

### Promote runspec
- `publish_enabled`: default `true`
- `publish_report`: JSON report written after publishing
- `publish_clear_existing`: default `true`

## Flow
### Run
raw input -> preflight normalize -> cleaned source copy -> pipeline run -> ready bank

### Promote
ready bank -> canonical validated -> canonical published
