# Cards Domain Foundation

This package contains the shared card-domain contract layer for KieliTaika card learning inside `puhis`.

Architecture boundaries:

- The shared card engine lives in `puhis`, not in the YKI engine.
- YKI remains exam-specific.
- Professional role-play remains protected and separate.
- General Finnish and Professional Finnish cards share one canonical card model.
- Cards are learning units, not exam tasks.
- Card runtime contracts are separate from YKI runtime contracts.
- Follow-up variants are explicit structured objects, not frontend guesses.

This package currently contains:

- canonical card schemas
- deck/module/publication schemas
- session/progress schemas
- validation helpers
- fixtures used to prove the schema can represent both General and Professional cards

This package intentionally does not yet contain:

- import pipeline logic
- delivery APIs
- frontend rendering contracts
- spaced-repetition scheduling implementation
