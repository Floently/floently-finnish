# Pass 4 Authority Map

## Surviving Canonical Authorities

### Cards

- canonical package root: `apps/backend/app/cards/`
- canonical runtime entrypoints:
  - `apps/backend/app/cards/runtime/api/router.py`
  - `apps/backend/app/cards/runtime/services/card_runtime_service.py`
  - `apps/backend/app/cards/runtime/repositories/card_repository.py`
- canonical publication entrypoints:
  - `apps/backend/app/cards/publication/deck_publication_service.py`
  - `apps/backend/app/cards/publication/repository.py`
  - `apps/backend/app/cards/publication/validated_source_repository.py`
- canonical shared model/schema layer:
  - `apps/backend/app/cards/schemas/**`
  - `apps/backend/app/cards/adaptive/**`
  - `apps/backend/app/cards/ingestion/**`

### Audio

- canonical package root: `apps/backend/app/audio/`
- canonical runtime/publication audio entrypoints:
  - `apps/backend/app/audio/audio_service.py`
  - `apps/backend/app/audio/card_audio_preparation.py`
  - `apps/backend/app/audio/dialogue_builder.py`
  - `apps/backend/app/audio/tts_service.py`
  - `apps/backend/app/audio/router.py`
- supporting canonical callers:
  - `apps/backend/app/services/voice_service.py`
  - `apps/backend/app/runtime/voice.py`

### YKI

- canonical adapter/runtime/service chain:
  - `apps/backend/app/adapters/yki_engine_adapter.py`
  - `apps/backend/app/runtime/yki.py`
  - `apps/backend/app/services/yki_service.py`
  - `apps/backend/app/services/yki_exam_runtime_guard.py`
  - `apps/backend/app/services/yki_runtime_integrity.py`
- canonical router chain:
  - `apps/backend/app/routers/v1_yki.py`
  - `apps/backend/app/routers/yki_exam.py`
  - `apps/backend/app/routers/yki_practice.py`

## Removed Legacy Authorities

- removed from repo: `apps/backend/cards/`
- removed from repo: `apps/backend/audio/`
- removed from repo: `apps/backend/yki/`

## Import Authority Result

After Pass 4:

- no live backend code imports `cards.*`
- no live backend code imports `audio.*`
- no live backend code imports `yki.*`
- canonical references resolve only through `app.*`
