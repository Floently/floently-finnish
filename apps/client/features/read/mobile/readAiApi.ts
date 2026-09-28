import { getAuthToken } from '@core/api/apiClient';

const DEFAULT_READ_API_BASE_URL = 'https://flowreader-api.onrender.com';

export type ReadAiAction =
  | 'summary'
  | 'key_points'
  | 'explain'
  | 'flashcards'
  | 'quiz'
  | 'exam'
  | 'glossary'
  | 'assistant';

export type ReadAiRequest = {
  action: ReadAiAction;
  text: string;
  title?: string | null;
  language?: string | null;
  question?: string | null;
};

const PROMPTS: Partial<Record<ReadAiAction, string>> = {
  flashcards:
    'Create 10 high-yield exam flashcards from this source. Use exactly this repeated format: Q: <question> on one line, A: <concise answer> on the next line, then a blank line. Focus on facts, concepts, definitions, mechanisms and distinctions that are likely to be tested. Do not invent information.',
  quiz:
    'Act as an examiner. Create 8 exam questions from this source with concise model answers. Mix recall, application and comparison questions. Use exactly: Q: <question> then A: <answer>, blank line between questions. Keep every answer grounded only in the source.',
  exam:
    'Turn this reading into an exam-preparation sheet. Include: 1) what I must know, 2) common traps/confusions, 3) 5 likely exam questions with model answers, 4) one short memory aid, and 5) a 10-minute revision plan. Be precise and grounded in the source.',
  glossary:
    'Extract the 12 most important terms or concepts from this source. For each, give a one-sentence plain-language definition and, when useful, one distinguishing detail. Format as Term — definition. Do not invent terms not present or clearly implied in the source.',
  explain:
    'Explain this source as if tutoring a serious student who must understand it for an exam. Start simple, then explain the underlying logic/mechanism, then give one concrete example, then state what is most testable.',
};

function getReadApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_READ_API_BASE_URL?.trim() || DEFAULT_READ_API_BASE_URL;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

async function parseResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  let payload: unknown = null;
  if (text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { text };
    }
  }

  const record = asRecord(payload);
  if (!response.ok) {
    const error = asRecord(record.error);
    const message =
      (typeof error.message === 'string' && error.message) ||
      (typeof record.detail === 'string' && record.detail) ||
      (typeof record.message === 'string' && record.message) ||
      'Read AI is temporarily unavailable.';
    throw new Error(message);
  }

  return record;
}

export const readAiApi = {
  async generate(input: ReadAiRequest): Promise<string> {
    const text = input.text.trim().slice(0, 12000);
    if (!text) throw new Error('No readable text is available for this tool.');

    const token = getAuthToken();
    const headers = new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const backendAction =
      input.action === 'summary'
        ? 'summarize'
        : input.action === 'key_points'
          ? 'key_points'
          : 'assistant';
    const question =
      input.action === 'assistant'
        ? String(input.question || '').trim().slice(0, 1200)
        : PROMPTS[input.action] || '';

    if (input.action === 'assistant' && !question) {
      throw new Error('Ask a question about this reading first.');
    }

    const response = await fetch(`${getReadApiBaseUrl()}/api/ai/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: backendAction,
        text,
        title: input.title || 'Reading',
        language: input.language || 'auto',
        question,
      }),
    });

    const payload = await parseResponse(response);
    const result = [payload.text, payload.summary, payload.result]
      .find((value) => typeof value === 'string' && value.trim());

    if (typeof result !== 'string' || !result.trim()) {
      throw new Error('Read AI returned no usable result.');
    }
    return result.trim();
  },
};

export default readAiApi;
