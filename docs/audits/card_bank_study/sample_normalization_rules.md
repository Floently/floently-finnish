Scope: normalization rules for transforming external compiled materials into the current canonical card schema.

1. Reject non-Finnish source rows early: if source sentence or token is clearly English, discard or quarantine.
2. Normalize profession labels: lääkäri -> doctor, sairaanhoitaja -> nurse, lähihoitaja/lahioitaja -> practical_nurse.
3. Normalize level bands to A1_A2, B1_B2, C1_C2.
4. Preserve one teachable target per card. Split multi-target rows before import.
5. Deduplicate on normalized tuple: content_type + profession + normalized_front + normalized_answer.
6. Preserve high-value formulaic workplace phrases as sentence cards, not as raw vocabulary.
7. Quarantine cards containing citation debris, OCR noise, English filler, or historical trivia outside the product promise.
8. Grammar cards must map to canonical front.rule_label/pattern/example and back.rule_summary/target_form.
9. Add source.origin_path and manifest/version tags on every imported card.
10. Require human review on all cards tagged by automation as empathy, consent/privacy, medication, or emergency language.
