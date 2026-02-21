import { useCallback, useRef, useState } from "react";
import { uploadFiles } from "../files";
import type { AiParalegalClient } from "../client";
import type { FilesResponse, SessionContext, UseFilesReturn } from "../types";

/**
 * React hook for uploading files to the host, scoped to the SDK session.
 *
 * ```tsx
 * const { upload, data, loading, uploaded } = useFiles(client, session);
 * await upload([file1, file2]);
 * // data.data.files => [{ id, filename, mime_type, size }]
 * ```
 */
export function useFiles(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseFilesReturn {
  const [data, setData] = useState<FilesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const upload = useCallback(
    async (files: File[]) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);
      setUploaded(false);

      try {
        const response = await uploadFiles(
          client,
          session.sessionToken,
          files,
        );
        setData(response);
        setUploaded(true);
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
    setLoading(false);
    setError(null);
    setUploaded(false);
  }, []);

  return { upload, data, loading, error, uploaded, reset };
}
