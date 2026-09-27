# Guided Speaking deterministic curriculum research — 2026-09-27

## Product decision

Guided Speaking is an audio-first, retrieval-led curriculum owned by KieliValmis. We do not copy or present another provider's proprietary lessons, wording, sequencing, recordings, or branding.

## Requirements derived from the product direction

1. Curriculum identity is deterministic: a stage ID is permanent and versioned.
2. Learner history is separate from curriculum definitions.
3. Highest unlocked progression is monotonic. Reviewing an earlier stage never rolls progress backward.
4. Every unlocked earlier stage is directly repeatable.
5. Recommendations may adapt from history, but cannot redefine stage identity or order.
6. Learner-visible levels must be explicit and understandable.
7. UI should expose one primary instruction/action at a time and keep text concise.
8. Later stages deliberately retrieve earlier material rather than relying on arbitrary random review.
9. Speech/TTS/AI are support/evaluation mechanisms; they are not curriculum authorities.
10. Content expansion must be authored/reviewed as KieliValmis material and regression-tested for stable IDs.

## Implementation consequence

The existing seven generic guided-speaking kinds are retained only as phase concepts during migration. Permanent curriculum IDs and version fields are introduced first, followed by persisted per-stage attempt history, explicit level mapping, stage-browser/revisit UI, deterministic retrieval references, and invariant tests.

## Safety

No backend migration, billing/auth change, native dependency, production deployment, or App Store binary mutation is required for this source-development phase.
