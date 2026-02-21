import type { AiParalegalClient } from "./client";
import type { OcrExtraction, OcrStreamCallbacks } from "./types";
import { consumeSseStream } from "./sse";

/**
 * Stream OCR text extraction via SSE from the host.
 *
 * Emits per-file extraction_start, text_delta, extraction_complete events,
 * and a final complete event with all extractions.
 */
export async function streamOcr(
  client: AiParalegalClient,
  sessionToken: string,
  files: File[],
  callbacks?: OcrStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files[]", file);
  }

  const response = await fetch(client.url("/api/sdk/v1/ocr/stream"), {
    method: "POST",
    headers: {
      ...client.multipartSessionHeaders(sessionToken),
      Accept: "text/event-stream",
    },
    body: formData,
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `OCR stream failed with status ${response.status}`,
    );
  }

  await consumeSseStream(
    response,
    (event, data) => {
      const payload = data as Record<string, unknown>;

      if (
        event === "text_delta" &&
        typeof payload.filename === "string" &&
        typeof payload.delta === "string"
      ) {
        callbacks?.onChunk?.(payload.filename, payload.delta);
      } else if (event === "extraction_complete") {
        callbacks?.onFileComplete?.(payload as unknown as OcrExtraction);
      } else if (event === "complete") {
        const extractions =
          (payload.extractions as OcrExtraction[]) ?? [];
        callbacks?.onComplete?.({ data: { extractions } });
      } else if (event === "error") {
        callbacks?.onError?.(
          new Error((payload.message as string) ?? "Stream error"),
        );
      }
    },
    signal,
  );
}
