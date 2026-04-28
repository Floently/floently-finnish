Scope: safe, scoped prompts for another agent to remediate the card bank.

1. Bank deduplication
- Inspect only `apps/backend/materials/cards/published`, `apps/backend/practice/data/cards`, and `apps/backend/app/runtime/cards_material_bank.py`.
- Remove exact and near-duplicate rows using normalized signature (`content_type + profession + normalized_front + normalized_answer`).
- Do not change API envelopes.
- Verify by regenerating `duplicate_report.csv` and proving duplicate rows fall sharply.

2. Malformed vocabulary cleanup
- Inspect `malformed_terms_report.csv` plus the source files listed there.
- Remove or quarantine English noise tokens, citation artifacts, token-identity drills, and broken multiword vocabulary rows.
- Preserve genuinely high-value short tokens such as `EKG` only if they are domain-valid.
- Verify with a fresh malformed-term report and a 100-card manual sample.

3. Profession augmentation
- Focus on missing domains: handover, consent/privacy, documentation, emergency/escalation, relatives, home care, and empathy language.
- Prefer curated external fraasit/sanasto/kielioppi packs over legacy donor banks.
- Verify with refreshed profession coverage CSVs.

4. Compiled-bank transformation
- Ingest only curated and structured external packs first. Treat `combined/*.json` as donor-only.
- Map to canonical schemas under `apps/backend/app/cards/schemas`.
- Verify with schema validation and manifest output.

5. Runtime bank authority hardening
- Repoint the main `/cards` router away from `app/runtime/cards_material_bank.py` to one canonical authority.
- Preserve current response envelopes or add a compatibility adapter.
- Verify by tracing `/cards/deck` and proving one source of truth.
