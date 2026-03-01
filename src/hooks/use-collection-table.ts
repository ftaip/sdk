import { useCallback, useState } from "react";
import { generateCollectionTable } from "../collections";
import type { AiParalegalClient } from "../client";
import type {
  CollectionTableResponse,
  SessionContext,
  UseCollectionTableReturn,
} from "../types";

/**
 * React hook for generating comparison tables across collection documents.
 *
 * ```tsx
 * const { generate, table, loading } = useCollectionTable(client, session, collectionId);
 *
 * await generate('Show parties, term length, and governing law');
 * // table => { columns, rows, csv, markdown, generated_at, document_count }
 * ```
 */
export function useCollectionTable(
  client: AiParalegalClient | null,
  session: SessionContext | null,
  collectionId: string,
): UseCollectionTableReturn {
  const [table, setTable] = useState<CollectionTableResponse["data"] | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generate = useCallback(
    async (
      prompt: string,
      opts?: {
        format?: "json" | "csv" | "markdown";
        documentIds?: string[];
        instructions?: string;
      },
    ) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }

      setLoading(true);
      setError(null);
      setTable(null);

      try {
        const response = await generateCollectionTable(
          client,
          session.sessionToken,
          collectionId,
          prompt,
          opts?.format,
          opts?.documentIds,
          opts?.instructions,
        );
        setTable(response.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, session, collectionId],
  );

  return { generate, table, loading, error };
}
