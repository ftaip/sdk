import type { AiParalegalClient } from "./client";
import type { AskAiRequest, AskAiResponse, SessionAskAiRequest } from "./types";

/**
 * Send a prompt to the AI Paralegal API using API-key authentication.
 */
export async function askAi(
  client: AiParalegalClient,
  request: AskAiRequest,
): Promise<AskAiResponse> {
  const response = await fetch(client.url("/api/sdk/v1/ai/ask"), {
    method: "POST",
    headers: client.headers(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<AskAiResponse>;
}

/**
 * Send a prompt to the AI Paralegal API using session-token authentication.
 *
 * The session token already encodes the firm and matter context,
 * so only the prompt and optional flags are needed.
 */
export async function askAiWithSession(
  client: AiParalegalClient,
  sessionToken: string,
  request: SessionAskAiRequest,
): Promise<AskAiResponse> {
  const response = await fetch(client.url("/api/sdk/v1/ai/ask"), {
    method: "POST",
    headers: client.sessionHeaders(sessionToken),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<AskAiResponse>;
}
