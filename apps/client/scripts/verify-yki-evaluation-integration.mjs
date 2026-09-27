import fs from 'node:fs';

const files = {
  screen: fs.readFileSync(
    'apps/client/features/exam/screens/ExamRuntimeScreen.tsx',
    'utf8',
  ),
  persistence: fs.readFileSync(
    'apps/client/features/exam/state/examResultsPersistence.ts',
    'utf8',
  ),
  ykiApi: fs.readFileSync(
    'packages/core/api/ykiExam.ts',
    'utf8',
  ),
  voiceApi: fs.readFileSync(
    'packages/core/api/voice.ts',
    'utf8',
  ),
  backend: fs.readFileSync(
    'apps/backend/app/services/yki_service.py',
    'utf8',
  ),
};

const required = {
  screen: [
    'submitYkiExamAnswer',
    'submitYkiExamWriting',
    'submitYkiExamSpeaking',
    'submitYkiExamSession',
    'transcribeVoiceAudioDetailed',
    'taskId: item.item_id',
    'questionId: q.answer_id ?? q.id',
    'submitCurrentTaskEvidence',
    'upload.voiceRef',
    'evaluationReport',
    'Saving response for detailed evaluation',
  ],
  persistence: [
    'SubmitYkiExamResult',
    'YkiEvaluationReport',
    'taskId?: string | null',
    'speakingTranscript',
    'backendSubmitted',
    'evaluationReport',
  ],
  ykiApi: [
    'YkiEvaluationReport',
    'SubmitYkiExamResult',
    'submitYkiExamWriting',
    'submitYkiExamSpeaking',
  ],
  voiceApi: [
    'VoiceTranscriptionResult',
    'transcribeVoiceAudioDetailed',
    'voice_ref',
    "form.append('task_id'",
    'return result.transcript',
  ],
  backend: [
    '"item_id": task_id',
    '"question_id": question_id',
    'payload.get("answer")',
  ],
};

for (const [name, tokens] of Object.entries(required)) {
  for (const token of tokens) {
    if (!files[name].includes(token)) {
      throw new Error(
        `${name} is missing required token: ${token}`,
      );
    }
  }
}

console.log(
  'YKI_CLIENT_EVALUATION_INTEGRATION=PASS',
);
