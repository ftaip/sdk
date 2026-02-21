import type { AiParalegalClient } from "./client";
import type { MarkItDownResponse } from "./types";

/**
 * Convert files to Markdown using Microsoft MarkItDown on the host.
 *
 * Supports PDF, Word, Excel, PowerPoint, images, HTML, CSV, JSON, XML, and more.
 *
 * @see https://github.com/microsoft/markitdown
 */
export async function convertToMarkdown(
  client: AiParalegalClient,
  sessionToken: string,
  files: File[],
): Promise<MarkItDownResponse> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files[]", file);
  }

  const response = await fetch(client.url("/api/sdk/v1/markitdown/convert"), {
    method: "POST",
    headers: client.multipartSessionHeaders(sessionToken),
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `MarkItDown conversion failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<MarkItDownResponse>;
}
