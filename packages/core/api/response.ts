export type ParsedResponseBody = {
  json: unknown;
  rawText: string;
  contentType: string;
};

export async function readResponseBody(response: Response): Promise<ParsedResponseBody> {
  const rawText = await response.text();
  const contentType = response.headers.get('content-type') ?? '';

  if (!rawText.trim()) {
    return { json: null, rawText, contentType };
  }

  try {
    return {
      json: JSON.parse(rawText),
      rawText,
      contentType,
    };
  } catch {
    return {
      json: null,
      rawText,
      contentType,
    };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function extractResponseErrorMessage(
  payload: unknown,
  fallback: string,
  rawText?: string,
): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload.trim();
  }

  if (isRecord(payload)) {
    const error = payload.error;
    if (typeof error === 'string' && error.trim()) {
      return error.trim();
    }
    if (isRecord(error) && typeof error.message === 'string' && error.message.trim()) {
      return error.message.trim();
    }

    const detail = payload.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail.trim();
    }
    if (isRecord(detail) && typeof detail.message === 'string' && detail.message.trim()) {
      return detail.message.trim();
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }
  }

  const text = rawText?.trim();
  if (text) {
    return text.length > 180 ? `${text.slice(0, 180)}…` : text;
  }

  return fallback;
}
