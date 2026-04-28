# Task Bank Certification Report

## Summary

- Total certified tasks: 9706
- Schema validation failures: 0
- Skill consistency mismatches: 0
- Level-band heuristic mismatches: 50

## Tasks Per Skill

- listening: 618
- reading: 2111
- speaking: 1510
- writing: 5467

## Tasks Per Level Band

- A1_A2: 2092
- B1_B2: 3882
- C1_C2: 3732

## Topic Distribution

- technology: 5222
- work: 1151
- daily_life: 956
- education: 464
- culture: 405
- transport: 332
- health: 325
- housing: 287
- services: 186
- environment: 153
- shopping: 114
- social_relations: 111

## Difficulty Distribution

- A1_A2: min=0.244 mean=0.323 max=0.373
- B1_B2: min=0.432 mean=0.529 max=0.648
- C1_C2: min=0.633 mean=0.721 max=0.817

## Blueprint Coverage Matrix

- A1_A2:
  - reading / reading_mcq_set: 282 tasks, estimated exam capacity 70
  - listening / listening_mcq_set: 175 tasks, estimated exam capacity 43
  - writing / writing_prompt: 1282 tasks, estimated exam capacity 641
  - speaking / speaking_roleplay: 353 tasks, estimated exam capacity 176
- B1_B2:
  - reading / reading_mcq_set: 965 tasks, estimated exam capacity 241
  - listening / listening_mcq_set: 227 tasks, estimated exam capacity 56
  - writing / writing_prompt: 2046 tasks, estimated exam capacity 1023
  - speaking / speaking_roleplay: 644 tasks, estimated exam capacity 322
- C1_C2:
  - reading / reading_mcq_set: 864 tasks, estimated exam capacity 216
  - listening / listening_mcq_set: 216 tasks, estimated exam capacity 54
  - writing / writing_prompt: 2139 tasks, estimated exam capacity 1069
  - speaking / speaking_roleplay: 513 tasks, estimated exam capacity 256

## Weak Pools

- A1_A2 reading_mcq_set: 282 tasks, capacity 70
- A1_A2 listening_mcq_set: 175 tasks, capacity 43
- B1_B2 listening_mcq_set: 227 tasks, capacity 56
- C1_C2 listening_mcq_set: 216 tasks, capacity 54

## Notes

- Canonical task JSON remains schema-valid and keeps the 10-key runtime envelope.
- Topic and subtopic are emitted in sidecar certification metadata keyed by task_id because the task schema forbids extra root fields.
