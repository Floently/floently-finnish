export type ApiError = {
  code: string;
  message: string;
  retryable: boolean;
  trace_id: string;
  event_id: string | null;
};

export type ApiMeta = {
  version: string;
  contract_version: string;
  timestamp: string;
  trace_id: string;
  event_id: string | null;
};

export type ApiResponse<T> = {
  ok: boolean;
  data: T | null;
  error?: ApiError | null;
  meta?: ApiMeta;
};
