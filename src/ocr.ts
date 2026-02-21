import type { AiParalegalClient } from "./client";
import type { OcrResponse } from "./types";

/**
 * Upload files for server-side text extraction (OCR for images/PDFs,
 * direct parsing for DOCX).
 */
export async function extractText(
  client: AiParalegalClient,
  sessionToken: string,
  files: File[],
): Promise<OcrResponse> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files[]", file);
  }

  const response = await fetch(client.url("/api/sdk/v1/ocr/extract"), {
    method: "POST",
    headers: client.multipartSessionHeaders(sessionToken),
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `OCR request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<OcrResponse>;
}
