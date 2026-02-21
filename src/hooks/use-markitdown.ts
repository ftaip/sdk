import { useCallback, useRef, useState } from "react";
import { convertToMarkdown } from "../markitdown";
import type { AiParalegalClient } from "../client";
import type {
  MarkItDownResponse,
  SessionContext,
  UseMarkItDownReturn,
} from "../types";

/**
 * React hook for converting files to Markdown via the host's MarkItDown service.
 *
 * Supports PDF, Word, Excel, PowerPoint, images, HTML, CSV, JSON, XML, and more.
 *
 * ```tsx
 * const { convert, data, loading } = useMarkItDown(client, session);
 * await convert([pdfFile, docxFile]);
 * // data.data.conversions => [{ filename, markdown, mime_type }]
 * ```
 *
 * @see https://github.com/microsoft/markitdown
 */
export function useMarkItDown(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseMarkItDownReturn {
  const [data, setData] = useState<MarkItDownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const convert = useCallback(
    async (files: File[]) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const response = await convertToMarkdown(
          client,
          session.sessionToken,
          files,
        );
        setData(response);
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
  }, []);

  return { convert, data, loading, error, reset };
}
