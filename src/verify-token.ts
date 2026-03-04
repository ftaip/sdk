import type { AiParalegalClient } from "./client";
import { throwApiError } from "./errors";
import type { TokenExchangeResponse } from "./types";

/**
 * Verify a dev/session token and return its session context.
 *
 * Used by the devToken flow so developers can authenticate
 * locally without the iframe exchange mechanism.
 */
export async function verifyToken(
  client: AiParalegalClient,
  sessionToken: string,
): Promise<TokenExchangeResponse> {
  const response = await fetch(client.url("/api/sdk/v1/token/verify"), {
    method: "GET",
    headers: client.sessionHeaders(sessionToken),
  });

  if (!response.ok) {
    await throwApiError(response, "Token verification failed");
  }

  return response.json() as Promise<TokenExchangeResponse>;
}
