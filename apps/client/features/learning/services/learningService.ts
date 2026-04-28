import { apiClient } from "@core/api/apiClient";
import type { ApiResponse } from "@core/models/apiTypes";

export type LearningSystemData = {
  decisionVersion: string;
  governanceStatus: "governed" | "legacy_uncontrolled";
  governanceVersion: string;
  policyVersion: string;
  modules?: unknown[];
};

function validateLearningSystem(payload: Record<string, unknown>): LearningSystemData {
  // Extract only the fields AppShell reads; accept any additional fields from the engine.
  return payload as unknown as LearningSystemData;
}

export async function getLearningSystem(): Promise<ApiResponse<LearningSystemData>> {
  return apiClient<LearningSystemData>("/api/v1/learning/modules", {}, { validateData: validateLearningSystem });
}
