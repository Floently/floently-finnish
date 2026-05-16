# Floently Card Bank Cleaning Rules

Status: mandatory rule for all AI and human workers.

## Core principle

Floently must prefer a smaller clean bank over a large corrupted bank.

A bank with 2,000 clean cards is better than a bank with 10,000 cards containing mixed English, broken Finnish, broken Swedish, duplicated options, wrong options, or cross-language contamination.

## Absolute rule

No mixed-language customer-facing card text is acceptable.

If a card option, prompt, sentence, grammar explanation, overlay, or translation cache row contains mixed target language + English, it must not be served as localized content.

Examples of unacceptable contamination:

- Finnish + English mixed
- Swedish + English mixed
- Somali + English mixed
- Any target language + English mixed
- Finnish canonical text polluted by English
- Swedish option text polluted by English
- Target-language overlay polluted by English
- Duplicated or repeated distractors across a card
- Options that do not match the correct answer
- Bad Finnish idioms translated from English
- Non-native Finnish phrase cards
- Cards where the prompt and options belong to different contexts
- Cards where localized text is a literal machine-translated hybrid

## Fallback rule

If localized text is contaminated, do not serve it.

Runtime must choose:

1. Clean localized text, only if it passes the contamination gate.
2. Otherwise, full English source_text fallback.

Never serve mixed-language text.

Full English fallback is temporarily allowed because it is honest and understandable.
Mixed-language fallback is forbidden.

## No loan-word excuse

For cleanup purposes, do not excuse suspicious English words as loan words.

If a word looks like English and appears inside non-English localized content, it must be quarantined or manually reviewed.

Only highly controlled technical abbreviations may pass after explicit allowlisting, for example:

ECG, EKG, MRI, CT, HIV, INR, MRSA, ESBL, SSRI, CVC, CPAP, COPD, ADHD.

All other English-looking words must be treated as contamination until proven clean.

## Graduation rule

A bank, overlay, language cache, or card group may graduate back to the live server only when:

- canonical Finnish is clean
- English source/gloss is clean
- target-language overlay is clean
- option cache is clean
- no cross-language contamination remains
- no repeated/duplicate options remain
- correct answer and distractors match the card context
- strict audit produces zero blocker rows
- manifest records what was accepted, rejected, and quarantined

## Quarantine rule

Contaminated rows/cards must not be deleted blindly unless they are known-bad generated junk.

They must be moved into a quarantine manifest or cleanup work queue:

- contaminated_option_cache_rows.tsv
- contaminated_canonical_cards.tsv
- contaminated_overlay_rows.tsv
- duplicate_option_cards.tsv
- bad_idiom_cards.tsv
- manual_review_required.tsv

Quarantined content may be repaired later and re-promoted only after passing the full audit.

## Promotion workflow

Do not bulk replace the whole bank.

Use batch promotion:

1. Audit current server and local copies.
2. Select clean rows/cards/language files.
3. Build a clean candidate bank.
4. Validate candidate bank with strict gates.
5. Promote only the clean batch to server.
6. Preserve quarantine manifests.
7. Commit only the promoted clean files.
8. Restart backend.
9. Re-audit production.
10. Continue with the next batch.

## Source of truth

Canonical Finnish remains the source of truth for Finnish learning content.

Overlays must follow canonical source hashes.

If canonical Finnish cards are removed or rewritten, equivalent overlays and option-cache rows must be deleted, quarantined, or regenerated.

Never keep stale overlays for deleted or rewritten canonical cards.

## Worker instruction

Any AI or human worker continuing this project must obey this file before editing card banks, option caches, overlays, or translation memories.

If a proposed action conflicts with this rule, stop and ask for explicit approval.
