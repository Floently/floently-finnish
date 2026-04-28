import { apiClient } from "./client";

export async function checkHealth(): Promise<{ status: string }> {
  const res = await apiClient.get<{ status: string }>("/health");
  return res.data ?? { status: "unknown" };
}
