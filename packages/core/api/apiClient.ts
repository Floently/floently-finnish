import type { ApiResponse } from "../models/apiTypes";
import { getApiBaseUrl } from "./apiConfig";
import { getClientDeviceHeaders } from "./deviceIdentity";
import {
  ControlledUiValidationError,
  REQUIRED_BACKEND_VERSION,
  REQUIRED_CONTRACT_VERSION,
  validateApiEnvelope,
} from "./governedResponseValidation";
import { logger } from "../logging/logger";

type ContractValidator<T> = (payload: Record<string, unknown>) => T;

type ApiClientContractOptions<T> = {
  allowNullData?: boolean;
  sessionId?: string | null;
  validateData?: ContractValidator<T>;
};

type ContractViolationCode = "CONTRACT_VIOLATION" | "GOVERNANCE_MISSING";

type AuditTrailEntry = {
  actionType: string;
  eventId: string | null;
  path: string;
  requestPayloadHash: string;
  responsePayloadHash: string;
  sessionId: string | null;
  timestamp: string;
  traceId: string;
};

let authToken: string | null = null;
let expectedDecisionVersion: string | null = null;
let expectedYkiExamSessionId: string | null = null;
let expectedYkiPracticeSessionId: string | null = null;
let traceCounter = 0;

const contractViolations: Array<{
  code: ContractViolationCode;
  details: string;
  message: string;
  path: string;
  recordedAt: string;
}> = [];

const contractAuditTrail: AuditTrailEntry[] = [];

export class ContractViolationError extends Error {
  code: ContractViolationCode;
  path: string;

  constructor(path: string, code: ContractViolationCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ContractViolationError";
    this.path = path;
  }
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((result, key) => {
      result[key] = stableValue((value as Record<string, unknown>)[key]);
      return result;
    }, {});
}

async function hashValue(value: unknown) {
  const serialized = JSON.stringify(stableValue(value));

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoded = new TextEncoder().encode(serialized);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest))
      .map((part) => part.toString(16).padStart(2, "0"))
      .join("");
  }

  let hash = 0;
  for (let index = 0; index < serialized.length; index += 1) {
    hash = (hash * 31 + serialized.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

function inferActionType(path: string, method: string) {
  if (path === "/api/v1/yki-practice/start" && method === "POST") {
    return "YKI_SESSION_START";
  }

  if (/^\/api\/v1\/yki-practice\/[^/]+$/.test(path) && method === "GET") {
    return "YKI_SESSION_RESUME";
  }

  if (/^\/api\/v1\/yki-practice\/[^/]+\/submit$/.test(path) && method === "POST") {
    return "YKI_SESSION_SUBMIT";
  }

  if (path === "/api/v1/yki/sessions/start" && method === "POST") {
    return "YKI_EXAM_SESSION_START";
  }

  if (path === "/api/v1/daily-practice/start" && method === "POST") {
    return "DAILY_PRACTICE_SESSION_START";
  }

  if (path === "/api/v1/speaking/start" && method === "POST") {
    return "SPEAKING_SESSION_START";
  }

  if (/^\/api\/v1\/speaking\/[^/]+$/.test(path) && method === "GET") {
    return "SPEAKING_SESSION_LOAD";
  }

  if (/^\/api\/v1\/speaking\/[^/]+\/submit$/.test(path) && method === "POST") {
    return "SPEAKING_RESPONSE_SUBMIT";
  }

  if (/^\/api\/v1\/speaking\/[^/]+\/next$/.test(path) && method === "POST") {
    return "SPEAKING_SESSION_ADVANCE";
  }

  if (path === "/api/v1/learning/modules" && method === "GET") {
    return "LEARNING_SYSTEM_LOAD";
  }

  if (/^\/api\/v1\/learning\/modules\/[^/]+\/lessons\/[^/]+\/answer$/.test(path) && method === "POST") {
    return "LEARNING_LESSON_ANSWER";
  }

  if (/^\/api\/v1\/learning\/modules\/[^/]+\/lessons\/[^/]+\/complete$/.test(path) && method === "POST") {
    return "LEARNING_LESSON_COMPLETE";
  }

  if (/^\/api\/v1\/daily-practice\/[^/]+$/.test(path) && method === "GET") {
    return "DAILY_PRACTICE_SESSION_LOAD";
  }

  if (/^\/api\/v1\/daily-practice\/[^/]+\/submit$/.test(path) && method === "POST") {
    return "DAILY_PRACTICE_ANSWER_SUBMIT";
  }

  if (/^\/api\/v1\/daily-practice\/[^/]+\/next$/.test(path) && method === "POST") {
    return "DAILY_PRACTICE_SESSION_ADVANCE";
  }

  if (/^\/api\/v1\/yki\/sessions\/[^/]+$/.test(path) && method === "GET") {
    return "YKI_EXAM_SESSION_LOAD";
  }

  if (/^\/api\/v1\/yki\/sessions\/[^/]+\/next$/.test(path) && method === "POST") {
    return "YKI_EXAM_SESSION_ADVANCE";
  }

  if (/^\/api\/v1\/yki\/sessions\/[^/]+\/answer$/.test(path) && method === "POST") {
    return "YKI_EXAM_SESSION_ANSWER";
  }

  if (/^\/api\/v1\/yki\/sessions\/[^/]+\/audio$/.test(path) && method === "POST") {
    return "YKI_EXAM_SESSION_AUDIO";
  }

  if (/^\/api\/v1\/yki\/sessions\/[^/]+\/play$/.test(path) && method === "POST") {
    return "YKI_EXAM_SESSION_PLAY";
  }

  return null;
}

async function recordContractAuditEntry(
  path: string,
  options: RequestInit,
  responsePayload: Record<string, unknown>,
  sessionId: string | null,
  traceId: string,
) {
  const actionType = inferActionType(path, options.method ?? "GET");

  if (!actionType) {
    return;
  }

  contractAuditTrail.push({
    actionType,
    eventId:
      typeof responsePayload.meta === "object" &&
      responsePayload.meta &&
      "event_id" in responsePayload.meta &&
      (responsePayload.meta as { event_id?: unknown }).event_id &&
      typeof (responsePayload.meta as { event_id?: unknown }).event_id === "string"
        ? ((responsePayload.meta as { event_id: string }).event_id ?? null)
        : null,
    path,
    requestPayloadHash: await hashValue(options.body ?? null),
    responsePayloadHash: await hashValue(responsePayload),
    sessionId,
    timestamp: new Date().toISOString(),
    traceId,
  });

  if (contractAuditTrail.length > 30) {
    contractAuditTrail.splice(0, contractAuditTrail.length - 30);
  }
}

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function resetRuntimeContractState() {
  expectedDecisionVersion = null;
  expectedYkiExamSessionId = null;
  expectedYkiPracticeSessionId = null;
}

export function getApiContractViolations() {
  return [...contractViolations];
}

export function getContractAuditTrail() {
  return [...contractAuditTrail];
}

export function recordApiContractIssue(
  path: string,
  code: ContractViolationCode,
  message: string,
) {
  contractViolations.push({
    code,
    details: message,
    message: code,
    path,
    recordedAt: new Date().toISOString(),
  });

  if (contractViolations.length > 20) {
    contractViolations.splice(0, contractViolations.length - 20);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function extractDecisionVersion(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractDecisionVersion(item);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.decisionVersion === "string") {
    return value.decisionVersion;
  }

  if (isRecord(value.sessionTrace) && typeof value.sessionTrace.decision_version === "string") {
    return value.sessionTrace.decision_version;
  }

  if (
    isRecord(value.whyThisWasSelected) &&
    typeof value.whyThisWasSelected.decision_version === "string"
  ) {
    return value.whyThisWasSelected.decision_version;
  }

  for (const nestedValue of Object.values(value)) {
    const nested = extractDecisionVersion(nestedValue);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function extractSessionId(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return typeof value.session_id === "string" ? value.session_id : null;
}

function extractYkiPracticeSessionIdFromPath(path: string) {
  const match = path.match(/^\/api\/v1\/yki-practice\/([^/]+)/);
  const candidate = match?.[1] ?? null;

  if (!candidate || candidate === "start") {
    return null;
  }

  return candidate;
}

function extractYkiExamSessionIdFromPath(path: string) {
  const match = path.match(/^\/api\/v1\/yki\/sessions\/([^/]+)/);
  const candidate = match?.[1] ?? null;

  if (!candidate || candidate === "start") {
    return null;
  }

  return candidate;
}

function validateResponseContract(path: string, data: unknown, sessionId?: string | null) {
  const responseDecisionVersion = extractDecisionVersion(data);
  if (responseDecisionVersion) {
    if (expectedDecisionVersion && expectedDecisionVersion !== responseDecisionVersion) {
      throw new ContractViolationError(
        path,
        "CONTRACT_VIOLATION",
        `Decision version drift: expected ${expectedDecisionVersion}, received ${responseDecisionVersion}.`,
      );
    }

    expectedDecisionVersion = responseDecisionVersion;
  }

  const pathSessionId = extractYkiPracticeSessionIdFromPath(path);
  const examPathSessionId = extractYkiExamSessionIdFromPath(path);
  const responseSessionId = extractSessionId(data);
  const expectedSessionId = sessionId ?? expectedYkiPracticeSessionId;

  if (pathSessionId && responseSessionId && pathSessionId !== responseSessionId) {
    throw new ContractViolationError(
      path,
      "CONTRACT_VIOLATION",
      `Session mismatch: path requested ${pathSessionId}, response returned ${responseSessionId}.`,
    );
  }

  if (path.startsWith("/api/v1/yki-practice/start") && responseSessionId) {
    expectedYkiPracticeSessionId = responseSessionId;
  } else if (responseSessionId && path.startsWith("/api/v1/yki-practice/")) {
    if (expectedSessionId && expectedSessionId !== responseSessionId) {
      throw new ContractViolationError(
        path,
        "CONTRACT_VIOLATION",
        `Session continuity drift: expected ${expectedSessionId}, received ${responseSessionId}.`,
      );
    }

    expectedYkiPracticeSessionId = responseSessionId;
  }

  const expectedExamSessionId = sessionId ?? expectedYkiExamSessionId;

  if (examPathSessionId && responseSessionId && examPathSessionId !== responseSessionId) {
    throw new ContractViolationError(
      path,
      "CONTRACT_VIOLATION",
      `Exam session mismatch: path requested ${examPathSessionId}, response returned ${responseSessionId}.`,
    );
  }

  if (path.startsWith("/api/v1/yki/sessions/start") && responseSessionId) {
    expectedYkiExamSessionId = responseSessionId;
  } else if (responseSessionId && path.startsWith("/api/v1/yki/sessions/")) {
    if (expectedExamSessionId && expectedExamSessionId !== responseSessionId) {
      throw new ContractViolationError(
        path,
        "CONTRACT_VIOLATION",
        `Exam session continuity drift: expected ${expectedExamSessionId}, received ${responseSessionId}.`,
      );
    }

    expectedYkiExamSessionId = responseSessionId;
  }
}

function normalizeContractError(error: unknown, path: string): ContractViolationError {
  if (error instanceof ContractViolationError) {
    return error;
  }

  if (error instanceof ControlledUiValidationError) {
    return new ContractViolationError(path, error.code, error.message);
  }

  return new ContractViolationError(path, "CONTRACT_VIOLATION", "CONTRACT_VIOLATION");
}

function nextTraceId(path: string, method: string) {
  traceCounter += 1;
  const sanitizedPath = path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${method.toLowerCase()}-${sanitizedPath || "root"}-${traceCounter.toString().padStart(6, "0")}`;
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {},
  contract: ApiClientContractOptions<T> = {},
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers ?? {});
  const method = options.method ?? "GET";
  const traceId = headers.get("x-trace-id") ?? nextTraceId(path, method);

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("x-trace-id", traceId);

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const deviceHeaders = await getClientDeviceHeaders();
  for (const [key, value] of Object.entries(deviceHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  const actionType = inferActionType(path, method);
  logger.info("API request started.", {
    actionType,
    endpoint: path,
    statusCode: null,
  });

  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, {
      ...options,
      headers,
    });
    const rawPayload = await res.json();
    const payload = validateApiEnvelope(rawPayload, path, {
      allowNullData: contract.allowNullData,
      validateData: contract.validateData,
    });

    if (payload.meta.version !== REQUIRED_BACKEND_VERSION) {
      throw new ContractViolationError(
        path,
        "CONTRACT_VIOLATION",
        `Backend version drift: expected ${REQUIRED_BACKEND_VERSION}, received ${payload.meta.version}.`,
      );
    }

    if (payload.meta.contract_version !== REQUIRED_CONTRACT_VERSION) {
      throw new ContractViolationError(
        path,
        "CONTRACT_VIOLATION",
        `Contract version drift: expected ${REQUIRED_CONTRACT_VERSION}, received ${payload.meta.contract_version}.`,
      );
    }

    if (payload.ok) {
      validateResponseContract(path, payload.data, contract.sessionId);
      await recordContractAuditEntry(
        path,
        { ...options, method, headers },
        payload as unknown as Record<string, unknown>,
        contract.sessionId ?? null,
        traceId,
      );
    }

    logger.info("API request completed.", {
      actionType,
      endpoint: path,
      retryable: payload.error?.retryable ?? null,
      statusCode: res.status,
    });

    return payload as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ContractViolationError || error instanceof ControlledUiValidationError) {
      const contractError = normalizeContractError(error, path);
      recordApiContractIssue(contractError.path, contractError.code, contractError.message);
      logger.error("API request failed with a contract violation.", {
        actionType,
        endpoint: path,
        retryable: false,
        statusCode: null,
      });
      throw contractError;
    }

    logger.error("API request failed with a transport error.", {
      actionType,
      endpoint: path,
      retryable: true,
      statusCode: null,
    });

    return {
      ok: false,
      data: null,
      error: {
        code: "TRANSPORT_ERROR",
        message: "TRANSPORT_ERROR",
        retryable: true,
        trace_id: traceId,
        event_id: null,
      },
      meta: {
        version: REQUIRED_BACKEND_VERSION,
        contract_version: REQUIRED_CONTRACT_VERSION,
        timestamp: new Date().toISOString(),
        trace_id: traceId,
        event_id: null,
      },
    };
  }
}
