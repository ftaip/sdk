import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCollection,
  deleteCollection,
  listCollections,
} from "../collections";
import type { AiParalegalClient } from "../client";
import type {
  CollectionMeta,
  SessionContext,
  UseCollectionsReturn,
} from "../types";

/**
 * React hook for managing document collections — list, create, and delete.
 * Auto-fetches the collection list on mount when client and session are available.
 *
 * ```tsx
 * const { collections, refresh, create, remove, loading } = useCollections(client, session);
 *
 * const col = await create('Due Diligence Q3', 'Q3 review');
 * await remove(col.id);
 * ```
 */
export function useCollections(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseCollectionsReturn {
  const [collections, setCollections] = useState<CollectionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const didFetch = useRef(false);

  const refresh = useCallback(async () => {
    if (!client || !session) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listCollections(client, session.sessionToken);
      setCollections(response.data.collections);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client, session]);

  useEffect(() => {
    if (!client || !session) {
      setLoading(false);
      return;
    }
    if (didFetch.current) return;
    didFetch.current = true;
    refresh();
  }, [client, session, refresh]);

  const create = useCallback(
    async (
      name: string,
      description?: string,
    ): Promise<CollectionMeta | undefined> => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return undefined;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await createCollection(
          client,
          session.sessionToken,
          name,
          description,
        );
        const created = response.data as CollectionMeta;
        setCollections((prev) => [...prev, created]);
        return created;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const remove = useCallback(
    async (collectionId: string) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await deleteCollection(client, session.sessionToken, collectionId);
        setCollections((prev) => prev.filter((c) => c.id !== collectionId));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const updateOne = useCallback(
    (id: string, patch: Partial<CollectionMeta>) => {
      setCollections((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  return { collections, loading, error, refresh, create, remove, updateOne };
}
