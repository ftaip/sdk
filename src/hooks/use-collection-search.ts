import { useCallback, useState } from "react";
import { searchCollection } from "../collections";
import type { AiParalegalClient } from "../client";
import type {
  CollectionSearchResult,
  SessionContext,
  UseCollectionSearchReturn,
} from "../types";

/**
 * React hook for keyword searching across a collection's documents.
 *
 * ```tsx
 * const { search, results, total, loading } = useCollectionSearch(client, session, collectionId);
 *
 * await search('termination clause', { status: 'processed' });
 * // results => [{ document_id, filename, score, excerpt, extraction }]
 * ```
 */
export function useCollectionSearch(
  client: AiParalegalClient | null,
  session: SessionContext | null,
  collectionId: string,
): UseCollectionSearchReturn {
  const [results, setResults] = useState<CollectionSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(
    async (query: string, filters?: Record<string, string>) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await searchCollection(
          client,
          session.sessionToken,
          collectionId,
          query,
          filters,
        );
        setResults(response.data.results);
        setTotal(response.data.total);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, session, collectionId],
  );

  return { search, results, total, loading, error };
}
