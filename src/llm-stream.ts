import type { AiParalegalClient } from "./client";
import type { LlmRequestOptions, LlmStreamCallbacks } from "./types";
import { consumeSseStream } from "./sse";

/**
 * Stream an LLM prompt response via SSE from the host.
 *
 * Emits text_delta events as the AI generates tokens and a complete event
 * with the full text and usage when finished.
 */
export async function streamLlm(
  client: AiParalegalClient,
  sessionToken: string,
  prompt: string,
  options?: LlmRequestOptions,
  attachments?: File[],
  callbacks?: LlmStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
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

    response = await fetch(client.url("/api/sdk/v1/llm/stream"), {
      method: "POST",
      headers: {
        ...client.multipartSessionHeaders(sessionToken),
        Accept: "text/event-stream",
      },
      body: formData,
      signal,
    });
  } else {
    response = await fetch(client.url("/api/sdk/v1/llm/stream"), {
      method: "POST",
      headers: {
        ...client.sessionHeaders(sessionToken),
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        prompt,
        system_instructions: options?.systemInstructions,
        provider: options?.provider,
        model: options?.model,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      }),
      signal,
    });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `LLM stream failed with status ${response.status}`,
    );
  }

  await consumeSseStream(
    response,
    (event, data) => {
      const payload = data as Record<string, unknown>;

      if (event === "text_delta" && typeof payload.delta === "string") {
        callbacks?.onChunk?.(payload.delta);
      } else if (event === "complete") {
        callbacks?.onComplete?.({
          data: {
            text: (payload.text as string) ?? "",
            usage: payload.usage as
              | { prompt_tokens: number; completion_tokens: number }
              | undefined,
          },
        });
      } else if (event === "error") {
        callbacks?.onError?.(
          new Error((payload.message as string) ?? "Stream error"),
        );
      }
    },
    signal,
  );
}
