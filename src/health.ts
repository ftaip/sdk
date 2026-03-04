import type { AiParalegalClient } from "./client";
import { throwApiError } from "./errors";

export interface HealthCheckResponse {
  status: string;
  app: {
    id: string;
    name: string;
    active: boolean;
  };
  capabilities: Record<string, string>;
  server_time: string;
}

export async function checkHealth(
  client: AiParalegalClient,
  sessionToken?: string,
): Promise<HealthCheckResponse> {
  const headers = sessionToken
    ? client.sessionHeaders(sessionToken)
    : client.headers();

  const response = await fetch(client.url("/api/sdk/v1/health"), {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    await throwApiError(response, "Health check failed");
  }

  return response.json() as Promise<HealthCheckResponse>;
}
