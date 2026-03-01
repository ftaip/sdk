import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteCollectionDocument,
  getCollection,
  reprocessCollectionDocument,
  uploadCollectionDocuments,
} from "../collections";
import type { AiParalegalClient } from "../client";
import type {
  CollectionDocument,
  CollectionMeta,
  SessionContext,
  UseCollectionReturn,
} from "../types";

const POLL_INTERVAL_MS = 3_000;

function hasNonTerminalDocuments(
  docs: CollectionDocument[] | undefined,
): boolean {
  if (!docs?.length) return false;
  return docs.some(
    (d) => d.status === "pending" || d.status === "processing",
  );
}

/**
 * React hook for a single collection — view details, upload documents,
 * remove documents, and trigger reprocessing.
 *
 * Automatically polls every 3 s while any document is `pending` or
 * `processing`, and stops when all reach a terminal state.
 *
 * ```tsx
 * const { collection, refresh, uploadDocuments } = useCollection(client, session, collectionId);
 *
 * await refresh();
 * await uploadDocuments([file1, file2]);
 * ```
 */
export function useCollection(
  client: AiParalegalClient | null,
  session: SessionContext | null,
  collectionId: string,
): UseCollectionReturn {
  const [collection, setCollection] = useState<
    (CollectionMeta & { documents: CollectionDocument[] }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requireSession = useCallback(() => {
    if (!client || !session) {
      throw new Error("Client and session are required");
    }
    return { client, session };
  }, [client, session]);

  const refresh = useCallback(async () => {
    const { client: c, session: s } = requireSession();
    setLoading(true);
    setError(null);
    try {
      const response = await getCollection(c, s.sessionToken, collectionId);
      setCollection(response.data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [requireSession, collectionId]);

  const uploadDocuments = useCallback(
    async (files: File[]): Promise<CollectionDocument[] | undefined> => {
      const { client: c, session: s } = requireSession();
      setLoading(true);
      setError(null);
      try {
        const response = await uploadCollectionDocuments(
          c,
          s.sessionToken,
          collectionId,
          files,
        );
        const uploaded = response.data;
        setCollection((prev) =>
          prev
            ? { ...prev, documents: [...prev.documents, ...uploaded] }
            : prev,
        );
        return uploaded;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [requireSession, collectionId],
  );

  const removeDocument = useCallback(
    async (documentId: string) => {
      const { client: c, session: s } = requireSession();
      setLoading(true);
      setError(null);
      try {
        await deleteCollectionDocument(
          c,
          s.sessionToken,
          collectionId,
          documentId,
        );
        setCollection((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.filter((d) => d.id !== documentId),
              }
            : prev,
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [requireSession, collectionId],
  );

  const reprocessDocument = useCallback(
    async (documentId: string) => {
      const { client: c, session: s } = requireSession();
      setLoading(true);
      setError(null);
      try {
        await reprocessCollectionDocument(
          c,
          s.sessionToken,
          collectionId,
          documentId,
        );
        setCollection((prev) =>
          prev
            ? {
                ...prev,
                documents: prev.documents.map((d) =>
                  d.id === documentId
                    ? { ...d, status: "pending" as const, error: null }
                    : d,
                ),
              }
            : prev,
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [requireSession, collectionId],
  );

  useEffect(() => {
    if (!client || !session) return;
    if (!hasNonTerminalDocuments(collection?.documents)) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const response = await getCollection(
          client,
          session.sessionToken,
          collectionId,
        );
        setCollection(response.data);
      } catch {
        /* polling failures are silent */
      }
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [client, session, collectionId, collection?.documents]);

  return {
    collection,
    loading,
    error,
    refresh,
    uploadDocuments,
    removeDocument,
    reprocessDocument,
  };
}
