import type { AiParalegalClient } from "./client";
import type { TokenExchangeResponse } from "./types";

/**
 * Exchange a short-lived exchange token for a session token.
 *
 * The exchange token is typically received as a URL query parameter
 * when the app is loaded inside the AI Paralegal admin preview iframe.
 */
export async function exchangeToken(
  client: AiParalegalClient,
  token: string,
): Promise<TokenExchangeResponse> {
  const response = await fetch(client.url("/api/sdk/v1/token/exchange"), {
    method: "POST",
    headers: client.headers(),
    body: JSON.stringify({ exchange_token: token }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Token exchange failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<TokenExchangeResponse>;
}
