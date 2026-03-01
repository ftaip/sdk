import { useCallback, useRef, useState } from "react";
import { queryCollection } from "../collections";
import { streamCollectionQuery } from "../collection-stream";
import type { AiParalegalClient } from "../client";
import type {
  CollectionQueryCitation,
  SessionContext,
  UseCollectionQueryReturn,
} from "../types";

/**
 * React hook for natural language queries across a collection.
 *
 * Supports both non-streaming and streaming modes. In streaming mode,
 * `answer` updates in real time as tokens arrive.
 *
 * ```tsx
 * const { query, answer, citations, loading, streaming } = useCollectionQuery(client, session, collectionId);
 *
 * // Non-streaming
 * await query('What are the common termination clauses?');
 *
 * // Streaming
 * await query('Summarize all contracts', { stream: true });
 * ```
 */
export function useCollectionQuery(
  client: AiParalegalClient | null,
  session: SessionContext | null,
  collectionId: string,
): UseCollectionQueryReturn {
  const [answer, setAnswer] = useState("");
  const [citations, setCitations] = useState<CollectionQueryCitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const query = useCallback(
    async (
      prompt: string,
      opts?: { maxDocuments?: number; stream?: boolean; instructions?: string },
    ) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setStreaming(false);
      setError(null);
      setAnswer("");
      setCitations([]);

      try {
        if (opts?.stream) {
          setStreaming(true);

          await streamCollectionQuery(
            client,
            session.sessionToken,
            collectionId,
            prompt,
            opts?.maxDocuments,
            {
              onChunk: (delta) => {
                setAnswer((prev) => prev + delta);
              },
              onComplete: (response) => {
                setAnswer(response.data.answer);
                setCitations(response.data.citations);
                setStreaming(false);
              },
              onError: (err) => {
                setError(err);
                setStreaming(false);
              },
            },
            abortRef.current.signal,
            opts?.instructions,
          );
        } else {
          const response = await queryCollection(
            client,
            session.sessionToken,
            collectionId,
            prompt,
            opts?.maxDocuments,
            opts?.instructions,
          );
          setAnswer(response.data.answer);
          setCitations(response.data.citations);
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
    [client, session, collectionId],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setAnswer("");
    setCitations([]);
    setLoading(false);
    setStreaming(false);
    setError(null);
  }, []);

  return { query, answer, citations, loading, streaming, error, reset };
}
