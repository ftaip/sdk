import type { AiParalegalClient } from "./client";
import type {
  DocCreateOptions,
  DocCreateResponse,
  DocMarkdownResponse,
  DocShowResponse,
  DocUpdateResponse,
  DocUploadResponse,
  DocsListResponse,
} from "./types";

async function handleResponse<T>(response: Response, action: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `${action} failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function createDoc(
  client: AiParalegalClient,
  sessionToken: string,
  options: DocCreateOptions,
): Promise<DocCreateResponse> {
  const response = await fetch(client.url("/api/sdk/v1/docs/create"), {
    method: "POST",
    headers: client.sessionHeaders(sessionToken),
    body: JSON.stringify(options),
  });

  return handleResponse<DocCreateResponse>(response, "Document create");
}

export async function uploadDocs(
  client: AiParalegalClient,
  sessionToken: string,
  files: File[],
): Promise<DocUploadResponse> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files[]", file);
  }

  const response = await fetch(client.url("/api/sdk/v1/docs/upload"), {
    method: "POST",
    headers: client.multipartSessionHeaders(sessionToken),
    body: formData,
  });

  return handleResponse<DocUploadResponse>(response, "Document upload");
}

export async function listDocs(
  client: AiParalegalClient,
  sessionToken: string,
): Promise<DocsListResponse> {
  const response = await fetch(client.url("/api/sdk/v1/docs"), {
    method: "GET",
    headers: client.sessionHeaders(sessionToken),
  });

  return handleResponse<DocsListResponse>(response, "Document list");
}

export async function getDoc(
  client: AiParalegalClient,
  sessionToken: string,
  documentId: string,
): Promise<DocShowResponse> {
  const response = await fetch(client.url(`/api/sdk/v1/docs/${documentId}`), {
    method: "GET",
    headers: client.sessionHeaders(sessionToken),
  });

  return handleResponse<DocShowResponse>(response, "Document read");
}

export async function updateDoc(
  client: AiParalegalClient,
  sessionToken: string,
  documentId: string,
  fileOrContent: File | string,
): Promise<DocUpdateResponse> {
  let response: Response;

  if (typeof fileOrContent === "string") {
    response = await fetch(client.url(`/api/sdk/v1/docs/${documentId}`), {
      method: "POST",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify({ content: fileOrContent }),
    });
  } else {
    const formData = new FormData();
    formData.append("file", fileOrContent);

    response = await fetch(client.url(`/api/sdk/v1/docs/${documentId}`), {
      method: "POST",
      headers: client.multipartSessionHeaders(sessionToken),
      body: formData,
    });
  }

  return handleResponse<DocUpdateResponse>(response, "Document update");
}

export async function deleteDoc(
  client: AiParalegalClient,
  sessionToken: string,
  documentId: string,
): Promise<void> {
  const response = await fetch(client.url(`/api/sdk/v1/docs/${documentId}`), {
    method: "DELETE",
    headers: client.sessionHeaders(sessionToken),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Document delete failed with status ${response.status}`,
    );
  }
}

export async function docToMarkdown(
  client: AiParalegalClient,
  sessionToken: string,
  documentId: string,
): Promise<DocMarkdownResponse> {
  const response = await fetch(
    client.url(`/api/sdk/v1/docs/${documentId}/markdown`),
    {
      method: "GET",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  return handleResponse<DocMarkdownResponse>(response, "Document to Markdown");
}
