import type { AiParalegalClient } from "./client";
import type { LlmRequestOptions, LlmResponse } from "./types";

/**
 * Send a prompt to the host LLM endpoint with optional provider/model
 * selection and file attachments for multimodal input.
 */
export async function askLlm(
  client: AiParalegalClient,
  sessionToken: string,
  prompt: string,
  options?: LlmRequestOptions,
  attachments?: File[],
): Promise<LlmResponse> {
  const hasFiles = attachments && attachments.length > 0;

  let response: Response;

  if (hasFiles) {
    const formData = new FormData();
    formData.append("prompt", prompt);

    if (options?.systemInstructions) {
      formData.append("system_instructions", options.systemInstructions);
    }
    if (options?.provider) {
      formData.append("provider", options.provider);
    }
    if (options?.model) {
      formData.append("model", options.model);
    }
    if (options?.temperature !== undefined) {
      formData.append("temperature", String(options.temperature));
    }
    if (options?.maxTokens !== undefined) {
      formData.append("max_tokens", String(options.maxTokens));
    }

    for (const file of attachments) {
      formData.append("attachments[]", file);
    }

    response = await fetch(client.url("/api/sdk/v1/llm/ask"), {
      method: "POST",
      headers: client.multipartSessionHeaders(sessionToken),
      body: formData,
    });
  } else {
    response = await fetch(client.url("/api/sdk/v1/llm/ask"), {
      method: "POST",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify({
        prompt,
        system_instructions: options?.systemInstructions,
        provider: options?.provider,
        model: options?.model,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      }),
    });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `LLM request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<LlmResponse>;
}
