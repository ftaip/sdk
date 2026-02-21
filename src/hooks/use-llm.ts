import { useCallback, useRef, useState } from "react";
import { askLlm } from "../llm";
import { streamLlm } from "../llm-stream";
import type { AiParalegalClient } from "../client";
import type {
  LlmRequestOptions,
  LlmResponse,
  SessionContext,
  UseLlmReturn,
} from "../types";

/**
 * React hook for LLM text generation via the host.
 *
 * Supports provider/model selection, system instructions, temperature,
 * and multimodal file attachments. Pass `stream: true` in options for
 * real-time token streaming via SSE — the `text` state updates as
 * tokens arrive.
 *
 * ```tsx
 * const { generate, data, text, loading } = useLLM(client, session);
 *
 * // Non-streaming
 * await generate('Summarise this', { provider: 'openai' });
 *
 * // Streaming — text updates in real time
 * await generate('Summarise this', { stream: true });
 * ```
 */
export function useLLM(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseLlmReturn {
  const [data, setData] = useState<LlmResponse | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (
      prompt: string,
      options?: LlmRequestOptions,
      attachments?: File[],
    ) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);
      setText("");
      setData(null);

      try {
        if (options?.stream) {
          await streamLlm(
            client,
            session.sessionToken,
            prompt,
            options,
            attachments,
            {
              onChunk: (delta) => {
                setText((prev) => prev + delta);
              },
              onComplete: (response) => {
                setData(response);
              },
              onError: (err) => {
                setError(err);
              },
            },
            abortRef.current.signal,
          );
        } else {
          const response = await askLlm(
            client,
            session.sessionToken,
            prompt,
            options,
            attachments,
          );
          setData(response);
          setText(response.data.text);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setData(null);
    setText("");
    setLoading(false);
    setError(null);
  }, []);

  return { generate, data, text, loading, error, reset };
}
