import { useCallback, useState } from "react";
import type { AiParalegalClient } from "../client";
import type {
  SessionContext,
  StorageItem,
  StorageScope,
  UseStorageReturn,
} from "../types";
import {
  getStorageItem,
  putStorageItem,
  deleteStorageItem,
  listStorageItems,
} from "../storage";

/**
 * React hook for persisting key-value data via the host storage API.
 *
 * Supports optional scoping by `matterId` and `namespace` so SDK apps
 * can store per-matter settings, preferences, or intermediate state
 * that survives page reloads.
 *
 * ```tsx
 * const { get, put, remove, list, loading, error } = useStorage(client, session);
 *
 * // Store a value
 * await put('theme', { mode: 'dark' });
 *
 * // Retrieve it
 * const theme = await get('theme');
 *
 * // Scoped to the current matter
 * await put('notes', 'Draft text', { matterId: session.matterId });
 * ```
 */
export function useStorage(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseStorageReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const get = useCallback(
    async (key: string, scope?: StorageScope): Promise<unknown | null> => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const item = await getStorageItem(
          client,
          session.sessionToken,
          key,
          scope,
        );
        return item?.value ?? null;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const put = useCallback(
    async (
      key: string,
      value: unknown,
      scope?: StorageScope,
    ): Promise<void> => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await putStorageItem(client, session.sessionToken, key, value, scope);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const remove = useCallback(
    async (key: string, scope?: StorageScope): Promise<void> => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }
      setLoading(true);
      setError(null);
      try {
        await deleteStorageItem(
          client,
          session.sessionToken,
          key,
          scope,
        );
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const list = useCallback(
    async (scope?: StorageScope): Promise<StorageItem[]> => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return [];
      }
      setLoading(true);
      setError(null);
      try {
        return await listStorageItems(client, session.sessionToken, scope);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        return [];
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { get, put, remove, list, loading, error, reset };
}
