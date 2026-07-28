import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function requireText(source, value, label) {
  if (!source.includes(value)) {
    throw new Error(
      `Missing ${label}: ${value}`,
    );
  }
}

const fallback = read(
  'apps/backend/app/runtime/yki_local_fallback.py',
);

const service = read(
  'apps/backend/app/services/yki_service.py',
);

const evaluator = read(
  'apps/backend/app/services/yki_evaluation_service.py',
);

const model = read(
  'apps/backend/app/models/api_models.py',
);

const api = read(
  'packages/core/api/ykiExam.ts',
);

const screen = read(
  'apps/client/features/exam/screens/ExamRuntimeScreen.tsx',
);

requireText(
  fallback,
  '"section_type": section',
  'canonical fallback sections',
);

requireText(
  fallback,
  '"items": _canonical_section_items(',
  'canonical fallback items',
);

requireText(
  fallback,
  'local_objective_scores(',
  'exact fallback objective scoring',
);

requireText(
  service,
  'normalize_local_runtime_for_client(',
  'persisted fallback normalization',
);

requireText(
  service,
  'category="objective"',
  'objective evidence persistence',
);

requireText(
  service,
  '"transcript_text": (',
  'speaking transcript evidence',
);

requireText(
  evaluator,
  'speaking = evidence.get(',
  'speaking evidence extraction',
);

requireText(
  model,
  'transcript_text: str | None',
  'backend speaking transcript field',
);

requireText(
  api,
  'transcript_text:',
  'client speaking transcript payload',
);

requireText(
  screen,
  'transcriptText: upload.transcript',
  'runtime transcript submission',
);

console.log(
  'YKI_LOCAL_FALLBACK_CROSS_LAYER_CONTRACT=PASS',
);
