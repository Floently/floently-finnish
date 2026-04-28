import { apiClient } from "@core/api/apiClient";

export function getHealth() {
  return apiClient<{ status: string; service: string }>(
    "/api/v1/health/"
  );
}
