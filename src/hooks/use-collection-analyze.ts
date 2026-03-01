import { useCallback, useRef, useState } from "react";
import { analyzeCollection } from "../collections";
import { streamCollectionAnalysis } from "../collection-stream";
import type { AiParalegalClient } from "../client";
import type { SessionContext, UseCollectionAnalyzeReturn } from "../types";

/**
 * React hook for cross-document analysis and pattern detection.
 *
 * Supports both non-streaming and streaming modes. In streaming mode,
 * `analysis` updates in real time as tokens arrive.
 *
 * ```tsx
 * const { analyze, analysis, statistics, loading } = useCollectionAnalyze(client, session, collectionId);
 *
 * await analyze('What are the most common risk flags?');
 * // analysis => narrative string
 * // statistics => { documents_analyzed, document_types, common_risk_flags, ... }
 * ```
 */
export function useCollectionAnalyze(
  client: AiParalegalClient | null,
  session: SessionContext | null,
  collectionId: string,
): UseCollectionAnalyzeReturn {
  const [analysis, setAnalysis] = useState("");
  const [statistics, setStatistics] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(
    async (
      prompt: string,
      opts?: { stream?: boolean; instructions?: string },
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
      setAnalysis("");
      setStatistics(null);

      try {
        if (opts?.stream) {
          setStreaming(true);

          await streamCollectionAnalysis(
            client,
            session.sessionToken,
            collectionId,
            prompt,
            {
              onChunk: (delta) => {
                setAnalysis((prev) => prev + delta);
              },
              onComplete: (response) => {
                setAnalysis(response.data.analysis);
                setStatistics(response.data.statistics);
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
          const response = await analyzeCollection(
            client,
            session.sessionToken,
            collectionId,
            prompt,
            opts?.instructions,
          );
          setAnalysis(response.data.analysis);
          setStatistics(response.data.statistics);
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
    setAnalysis("");
    setStatistics(null);
    setLoading(false);
    setStreaming(false);
    setError(null);
  }, []);

  return { analyze, analysis, statistics, loading, streaming, error, reset };
}
