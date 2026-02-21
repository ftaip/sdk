import { useCallback, useRef, useState } from "react";
import { extractText } from "../ocr";
import { streamOcr } from "../ocr-stream";
import type { AiParalegalClient } from "../client";
import type {
  OcrExtractOptions,
  OcrResponse,
  SessionContext,
  UseOcrReturn,
} from "../types";

/**
 * React hook for server-side text extraction from documents.
 *
 * Supports PDF, images (via AI vision/OCR), and DOCX files. Pass
 * `{ stream: true }` as the second argument to `extract()` for real-time
 * streaming — the `text` state updates as extraction progresses.
 *
 * ```tsx
 * const { extract, data, text, loading } = useOCR(client, session);
 *
 * // Non-streaming
 * await extract([pdfFile]);
 *
 * // Streaming — text updates per file as tokens arrive
 * await extract([pdfFile], { stream: true });
 * ```
 */
export function useOCR(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseOcrReturn {
  const [data, setData] = useState<OcrResponse | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const extract = useCallback(
    async (files: File[], options?: OcrExtractOptions) => {
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
          await streamOcr(
            client,
            session.sessionToken,
            files,
            {
              onChunk: (_filename, delta) => {
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
          const response = await extractText(
            client,
            session.sessionToken,
            files,
          );
          setData(response);

          const combined = response.data.extractions
            .map((e) => e.text)
            .join("\n\n");
          setText(combined);
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

  return { extract, data, text, loading, error, reset };
}
