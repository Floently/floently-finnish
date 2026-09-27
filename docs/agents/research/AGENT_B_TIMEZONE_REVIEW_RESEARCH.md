# Agent B Review Research — Timezone-Aware Learner Event Timestamps

Date: 2026-08-17
Agent: B
Branch: `agent/b-learning-platform-events-20260816`
Base: `69813b433838130d5afe4b052360dbfd12df3f40`
Review trigger: Agent A `CHANGES_REQUIRED` on Agent B learner-event timestamp handling.

## Questions investigated

1. What makes a Python `datetime` timezone-aware rather than naive?
2. Does `datetime.fromisoformat()` itself guarantee timezone awareness?
3. How should learner events with different UTC offsets be ordered and filtered deterministically?
4. How should malformed or naive persisted timestamps fail during deserialization?

## Existing repository evidence

- `LearnerEvent.__post_init__` currently checks only that `occurredAt` is a non-empty string; malformed and timezone-naive values can therefore enter the event store.
- `LearnerEventService._parse_iso_datetime()` parses ISO text for `since` filtering but does not reject naive values.
- Both learner-event repositories sort by the raw `occurred_at` string, and `list_evidence()` sorts by raw `observed_at`. Lexical ordering is not chronological when valid timestamps use different UTC offsets.
- `JsonFileLearnerEventRepository._load()` converts persisted dictionaries through `LearnerEvent.from_mapping()`, so model-level timestamp validation can make deserialization fail closed without adding a separate persistence-specific parser.

## Sources and access date

Accessed 2026-08-17.

### Python 3.12 `datetime` documentation

Source: Python Software Foundation, `datetime — Basic date and time types`.
https://docs.python.org/3.12/library/datetime.html

Finding: Python defines a `datetime` as aware only when `tzinfo` is not `None` and `tzinfo.utcoffset(d)` does not return `None`. `datetime.fromisoformat()` accepts both offset-bearing timestamps and timezone-naive timestamps, so successful parsing alone does not establish an unambiguous instant.

Decision caused: add one shared parser/validator that requires a valid ISO datetime and rejects any parsed value lacking an effective UTC offset. Validate `LearnerEvent.occurredAt` in `__post_init__`, which covers direct construction and `from_mapping()` deserialization.

Finding: aware datetimes with different timezone offsets represent comparable absolute instants.

Decision caused: repository ordering, evidence ordering, and `since` filtering will compare parsed aware `datetime` values rather than raw timestamp strings.

## Alternatives rejected and why

- **Accept naive timestamps as local time:** rejected because server/process local timezone is not learner-event provenance and would make the same stored value mean different instants in different environments.
- **Silently append `Z` to naive timestamps:** rejected because it fabricates UTC provenance that the caller did not supply.
- **Normalize and rewrite every accepted timestamp to UTC:** rejected for this narrow review fix because the event contract stores source provenance text; validation and instant comparison are sufficient without mutating the submitted representation.
- **Keep lexical sorting after validation:** rejected because two valid aware timestamps with different offsets can sort differently as strings than as actual instants.

## Uncertainties

- The frozen shared contract does not prescribe one canonical textual offset form (`Z` versus `+00:00`). This fix therefore accepts any `datetime.fromisoformat()` form that resolves to an aware datetime and preserves the original text.
- A future shared-contract revision may choose canonical UTC serialization. Agent B will not alter the frozen contract.

## How uncertainties will be tested

Regression tests will cover:

- malformed `occurredAt` rejected;
- timezone-naive `occurredAt` rejected on event creation;
- timezone-naive persisted `occurredAt` rejected during repository deserialization;
- valid timestamps with different offsets accepted and ordered by actual instant rather than lexical representation;
- `since` filters use absolute time across mixed offsets;
- derived evidence preserves event timestamp provenance while returning deterministic chronological order.

RESEARCH_GATE=PASS
