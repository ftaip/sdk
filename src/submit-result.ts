import type { AiParalegalClient } from "./client";
import type { SubmitResultResponse } from "./types";

export async function submitResult(
  client: AiParalegalClient,
  sessionToken: string,
  result: Record<string, unknown> | string,
): Promise<SubmitResultResponse> {
  const response = await fetch(client.url("/api/sdk/v1/result"), {
    method: "POST",
    headers: client.sessionHeaders(sessionToken),
    body: JSON.stringify({ result }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Failed to submit result (${response.status})`,
    );
  }

  const data: SubmitResultResponse = await response.json();

  if (window.parent !== window) {
    const targetOrigin = new URL(client.baseUrl).origin;
    window.parent.postMessage(
      { type: "sdk_app_result", result: data.result ?? result },
      targetOrigin,
    );
  }

  return data;
}
