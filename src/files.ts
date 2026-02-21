import type { AiParalegalClient } from "./client";
import type { FilesResponse } from "./types";

/**
 * Upload files to the host, scoped to the current SDK session.
 * Returns file references that can be used with other capabilities.
 */
export async function uploadFiles(
  client: AiParalegalClient,
  sessionToken: string,
  files: File[],
): Promise<FilesResponse> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files[]", file);
  }

  const response = await fetch(client.url("/api/sdk/v1/files/upload"), {
    method: "POST",
    headers: client.multipartSessionHeaders(sessionToken),
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `File upload failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<FilesResponse>;
}
