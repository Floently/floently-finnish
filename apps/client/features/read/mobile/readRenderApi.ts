import { getAuthToken } from '@core/api/apiClient';

const DEFAULT_READ_API_BASE_URL = 'https://flowreader-api.onrender.com';

export type ReadRenderDocument = {
  id: string;
  title?: string | null;
  text?: string | null;
  content?: string | null;
  language?: string | null;
  sourceType?: string | null;
  source_type?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  progress?: number | null;
  progressPercent?: number | null;
  progress_percent?: number | null;
  playbackSpeed?: number | null;
  playback_speed?: number | null;
};

export type CreateReadDocumentInput = {
  title: string;
  text: string;
  language?: string | null;
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

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function requestReadApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
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
        : typeof record.message === 'string'
          ? record.message
          : `Read API request failed with ${response.status}`;
    throw new Error(message);
  }

  return unwrapData(payload) as T;
}

function normalizeDocument(input: ReadRenderDocument): ReadRenderDocument {
  return {
    ...input,
    title: input.title || 'Untitled reading',
    text: input.text ?? input.content ?? '',
    createdAt: input.createdAt ?? input.created_at ?? new Date().toISOString(),
    progress: input.progress ?? input.progressPercent ?? input.progress_percent ?? 0,
    playbackSpeed: input.playbackSpeed ?? input.playback_speed ?? 1,
  };
}

export const readRenderApi = {
  baseUrl: getReadApiBaseUrl,

  async listDocuments(): Promise<ReadRenderDocument[]> {
    const data = await requestReadApi<unknown>('/api/v1/documents');
    const documents: unknown[] =
      Array.isArray(data)
        ? data
        : Array.isArray(asRecord(data).documents)
          ? (asRecord(data).documents as unknown[])
          : [];
    return documents.map((item: unknown) => normalizeDocument(asRecord(item) as ReadRenderDocument));
  },

  async getDocument(id: string): Promise<ReadRenderDocument> {
    const data = await requestReadApi<unknown>(`/api/v1/documents/${encodeURIComponent(id)}`);
    return normalizeDocument(asRecord(data) as ReadRenderDocument);
  },

  async createFromText(input: CreateReadDocumentInput): Promise<ReadRenderDocument> {
    const data = await requestReadApi<unknown>('/api/v1/documents/from-text', {
      method: 'POST',
      body: JSON.stringify({
        title: input.title,
        text: input.text,
        language: input.language ?? 'auto',
      }),
    });
    return normalizeDocument(asRecord(data) as ReadRenderDocument);
  },


  async syncRevenueCatEntitlements(input: SyncReadRevenueCatInput): Promise<SyncReadRevenueCatResult> {
    const activeEntitlements = Array.isArray(input.activeEntitlements) ? input.activeEntitlements : [];
    const data = await requestReadApi<unknown>('/api/v1/billing/revenuecat/sync', {
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
    const record = asRecord(data);
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
        playback_speed: input.playbackSpeed,
        playbackSpeed: input.playbackSpeed,
      }),
    });
  },
};

export default readRenderApi;
