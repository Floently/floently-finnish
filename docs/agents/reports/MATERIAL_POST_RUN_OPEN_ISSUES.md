# Material Post-Run Open Issues

## Open issues

### OI-01
- Title: Card runtime API router still blocked by backend auth dependency environment
- Severity: high
- Evidence: importing `app.cards.runtime.api.router` reaches `app.routers.auth` and fails with `ModuleNotFoundError: No module named 'bcrypt'`
- Impact: canonical card runtime modules are present, but the full FastAPI router import is not verified in this local environment
- Recommended fix: align backend dependency installation/runtime env and rerun router import plus backend tests

### OI-02
- Title: Long-form donor sentence cards exceed canonical field lengths
- Severity: medium
- Evidence: `apps/backend/materials/cards/quarantine/kielitaika_normalized_quarantine.json`
- Impact: `7` donor cards remain outside runtime authority
- Recommended fix: decide whether to truncate/split long-form prompts into a different canonical content family or keep them permanently quarantined

### OI-03
- Title: Full audio execution still depends on optional provider/runtime packages at use time
- Severity: medium
- Evidence: `app.audio.tts_service` and `app.services.tts.*` require provider/runtime dependencies such as `httpx` when instantiated
- Impact: publication import is restored, but end-to-end audio generation was not executed in this run
- Recommended fix: install/verify backend runtime dependencies in the target environment and run publication/runtime audio tests

### OI-04
- Title: Phase 5 donor YKI importers were not implemented
- Severity: low
- Evidence: no `apps/backend/materials/yki/importers/import_puhis_v1_yki.py` added in this run
- Impact: useful donor YKI families remain future work
- Recommended fix: implement donor-only YKI importers in a separate follow-up without changing current runtime authority
