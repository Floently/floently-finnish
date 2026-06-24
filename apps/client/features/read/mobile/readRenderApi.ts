import { getAuthToken } from '@core/api/apiClient';

const DEFAULT_READ_API_BASE_URL = 'https://flowreader-api.onrender.com';

export type ReadRenderDocument = {
  id: string;
  title?: string | null;
  text?: string | null;
  content?: string | null;
  rawText?: string | null;
  raw_text?: string | null;
  language?: string | null;
  sourceType?: string | null;
  source_type?: string | null;
  sourceUrl?: string | null;
  source_url?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  lastOpenedAt?: string | null;
  last_opened_at?: string | null;
  wordCount?: number | null;
  word_count?: number | null;
  progress?: unknown;
  progressPercent?: number | null;
  progress_percent?: number | null;
  playbackSpeed?: number | null;
  playback_speed?: number | null;
};

export type CreateReadDocumentInput = {
  title?: string;
  text: string;
  language?: string | null;
  sourceType?: string | null;
};

export type CreateReadUrlInput = {
  title?: string;
  url: string;
};

export type UpdateReadProgressInput = {
  progress: number;
  playbackSpeed?: number;
};

export type SyncReadRevenueCatInput = {
  readAccess?: boolean;
  creatorAccess?: boolean;
  activeEntitlements?: string[];
  packageId?: string | null;
  productId?: string | null;
  planId?: string | null;
  platform?: string | null;
  status?: string | null;
};

export type SyncReadRevenueCatResult = {
  changed?: boolean | null;
  ignoredReason?: string | null;
  readPlan?: string | null;
  readAccess?: boolean | null;
  creatorAccess?: boolean | null;
};

function getReadApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_READ_API_BASE_URL?.trim();
  return fromEnv || DEFAULT_READ_API_BASE_URL;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function unwrapData(value: unknown): unknown {
  const record = asRecord(value);
  if ('data' in record) return record.data;
  return value;
}

function unwrapProject(value: unknown): ReadRenderDocument {
  const data = unwrapData(value);
  const record = asRecord(data);
  const project = asRecord(record.project);
  const document = asRecord(record.document);
  if (Object.keys(project).length) return project as ReadRenderDocument;
  if (Object.keys(document).length) return document as ReadRenderDocument;
  return record as ReadRenderDocument;
}

function unwrapProjectList(value: unknown): ReadRenderDocument[] {
  const data = unwrapData(value);
  const record = asRecord(data);

  if (Array.isArray(data)) return data.map((item) => asRecord(item) as ReadRenderDocument);
  if (Array.isArray(record.projects)) return record.projects.map((item) => asRecord(item) as ReadRenderDocument);
  if (Array.isArray(record.documents)) return record.documents.map((item) => asRecord(item) as ReadRenderDocument);
  if (Array.isArray(record.items)) return record.items.map((item) => asRecord(item) as ReadRenderDocument);

  return [];
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function requestReadApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);

  headers.set('Accept', 'application/json');

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${getReadApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  const payload = await readJson(response);

  if (!response.ok) {
    const record = asRecord(payload);
    const errorRecord = asRecord(record.error);
    const message =
      typeof errorRecord.message === 'string'
        ? errorRecord.message
        : typeof record.detail === 'string'
          ? record.detail
          : typeof record.message === 'string'
            ? record.message
            : `Read request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

function progressValue(input: ReadRenderDocument): number {
  const progressRecord = asRecord(input.progress);
  const raw =
    progressRecord.progressPercent ??
    progressRecord.progress_percent ??
    input.progressPercent ??
    input.progress_percent ??
    (typeof input.progress === 'number' ? input.progress : 0);

  const value = Number(raw ?? 0);
  if (!Number.isFinite(value)) return 0;
  return value;
}

function playbackRateValue(input: ReadRenderDocument): number {
  const progressRecord = asRecord(input.progress);
  const raw =
    progressRecord.playbackRate ??
    progressRecord.playback_rate ??
    input.playbackSpeed ??
    input.playback_speed ??
    1;

  const value = Number(raw ?? 1);
  if (!Number.isFinite(value) || value <= 0) return 1;
  return value;
}

function normalizeDocument(input: ReadRenderDocument): ReadRenderDocument {
  const rawText = input.rawText ?? input.raw_text ?? input.text ?? input.content ?? '';

  return {
    ...input,
    id: String(input.id || ''),
    title: input.title || 'Untitled reading',
    text: rawText,
    content: rawText,
    rawText,
    sourceType: input.sourceType ?? input.source_type ?? null,
    sourceUrl: input.sourceUrl ?? input.source_url ?? null,
    createdAt: input.createdAt ?? input.created_at ?? input.updatedAt ?? input.updated_at ?? new Date().toISOString(),
    progress: progressValue(input),
    progressPercent: progressValue(input),
    playbackSpeed: playbackRateValue(input),
  };
}

export const readRenderApi = {
  baseUrl: getReadApiBaseUrl,

  async listDocuments(): Promise<ReadRenderDocument[]> {
    const payload = await requestReadApi<unknown>('/api/v1/documents');
    return unwrapProjectList(payload).map(normalizeDocument).filter((item) => item.id);
  },

  async getDocument(id: string): Promise<ReadRenderDocument> {
    const payload = await requestReadApi<unknown>(`/api/v1/documents/${encodeURIComponent(id)}`);
    return normalizeDocument(unwrapProject(payload));
  },

  async createFromText(input: CreateReadDocumentInput): Promise<ReadRenderDocument> {
    const payload = await requestReadApi<unknown>('/api/v1/documents/from-text', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        text: input.text,
        content: input.text,
        language: input.language ?? 'auto',
        sourceType: input.sourceType ?? 'text',
        source_type: input.sourceType ?? 'text',
      }),
    });

    return normalizeDocument(unwrapProject(payload));
  },

  async createFromUrl(input: CreateReadUrlInput): Promise<ReadRenderDocument> {
    const payload = await requestReadApi<unknown>('/api/v1/documents/from-url', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        url: input.url,
      }),
    });

    return normalizeDocument(unwrapProject(payload));
  },

  async deleteDocument(id: string): Promise<void> {
    await requestReadApi<unknown>(`/api/v1/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async syncRevenueCatEntitlements(input: SyncReadRevenueCatInput): Promise<SyncReadRevenueCatResult> {
    const activeEntitlements = Array.isArray(input.activeEntitlements) ? input.activeEntitlements : [];
    const payload = await requestReadApi<unknown>('/api/v1/billing/revenuecat/sync', {
      method: 'POST',
      body: JSON.stringify({
        readAccess: Boolean(input.readAccess || input.creatorAccess),
        read_access: Boolean(input.readAccess || input.creatorAccess),
        creatorAccess: Boolean(input.creatorAccess),
        creator_access: Boolean(input.creatorAccess),
        activeEntitlements,
        active_entitlements: activeEntitlements,
        entitlements: activeEntitlements,
        packageId: input.packageId ?? input.planId ?? null,
        package_id: input.packageId ?? input.planId ?? null,
        productId: input.productId ?? null,
        product_id: input.productId ?? null,
        plan: input.planId ?? input.packageId ?? null,
        platform: input.platform ?? null,
        status: input.status ?? null,
      }),
    });

    const record = asRecord(unwrapData(payload));
    return {
      changed: typeof record.changed === 'boolean' ? record.changed : null,
      ignoredReason: typeof record.ignoredReason === 'string' ? record.ignoredReason : null,
      readPlan: typeof record.readPlan === 'string' ? record.readPlan : null,
      readAccess: typeof record.readAccess === 'boolean' ? record.readAccess : null,
      creatorAccess: typeof record.creatorAccess === 'boolean' ? record.creatorAccess : null,
    };
  },

  async updateProgress(id: string, input: UpdateReadProgressInput): Promise<void> {
    const progressPercent = Math.max(0, Math.min(100, input.progress <= 1 ? input.progress * 100 : input.progress));
    await requestReadApi<unknown>(`/api/v1/documents/${encodeURIComponent(id)}/progress`, {
      method: 'PUT',
      body: JSON.stringify({
        progressPercent,
        progress_percent: progressPercent,
        playback_rate: input.playbackSpeed,
        playbackRate: input.playbackSpeed,
        playback_speed: input.playbackSpeed,
        playbackSpeed: input.playbackSpeed,
      }),
    });
  },
};

export default readRenderApi;
