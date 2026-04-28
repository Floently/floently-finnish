export function validateExamRuntimeParams(input: Record<string, unknown>) {
  return typeof input.sessionId === 'string' && input.sessionId.length > 2;
}
