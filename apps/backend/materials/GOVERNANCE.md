# Materials Governance

Canonical runtime materials live inside `apps/backend/materials/`.

Status classes:
- `source_truth`: internalized source-of-record datasets that runtime or rebuild steps depend on directly.
- `published_runtime`: datasets that runtime repositories are allowed to serve.
- `validated_donor`: imported donor datasets that passed schema mapping and may be published after review.
- `offline_generation`: export artifacts produced by local generation pipelines and queued for later ingestion.
- `quarantine`: rejected or partially mapped records that must not reach runtime.
- `archive`: deprecated historical snapshots retained for forensics only.

Operational rules:
- Runtime code must read from internalized material roots, never directly from external donor repositories.
- New donor imports must land in `imports/`, produce validated outputs in `validated/`, and record rejected items in `quarantine/`.
- `material_inventory.json` is not a card publication target and must not be reused as a mixed-schema sink.
