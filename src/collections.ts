import type { AiParalegalClient } from "./client";
import { throwApiError } from "./errors";
import type {
  CollectionAnalyzeResponse,
  CollectionDocumentUploadResponse,
  CollectionListResponse,
  CollectionQueryResponse,
  CollectionSearchResponse,
  CollectionShowResponse,
  CollectionSuggestedPromptsResponse,
  CollectionTableResponse,
  SuggestedPromptsRequest,
} from "./types";

async function throwOnError(
  response: Response,
  action: string,
): Promise<void> {
  if (!response.ok) {
    await throwApiError(response, action);
  }
}

async function handleResponse<T>(
  response: Response,
  action: string,
): Promise<T> {
  await throwOnError(response, action);
  return response.json() as Promise<T>;
}

export async function createCollection(
  client: AiParalegalClient,
  sessionToken: string,
  name: string,
  description?: string,
): Promise<CollectionShowResponse> {
  const response = await fetch(
    client.url("/api/sdk/v1/collections"),
    {
      method: "POST",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify({ name, description }),
    },
  );

  return handleResponse<CollectionShowResponse>(response, "Collection create");
}

export async function listCollections(
  client: AiParalegalClient,
  sessionToken: string,
): Promise<CollectionListResponse> {
  const response = await fetch(
    client.url("/api/sdk/v1/collections"),
    {
      method: "GET",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  return handleResponse<CollectionListResponse>(response, "Collection list");
}

export async function getCollection(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
): Promise<CollectionShowResponse> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}`),
    {
      method: "GET",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  return handleResponse<CollectionShowResponse>(response, "Collection read");
}

export async function updateCollection(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  data: { name?: string; description?: string },
): Promise<CollectionShowResponse> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}`),
    {
      method: "PATCH",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify(data),
    },
  );

  return handleResponse<CollectionShowResponse>(response, "Collection update");
}

export async function deleteCollection(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
): Promise<void> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}`),
    {
      method: "DELETE",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  await throwOnError(response, "Collection delete");
}

export async function uploadCollectionDocuments(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  files: File[],
): Promise<CollectionDocumentUploadResponse> {
  const formData = new FormData();

  for (const file of files) {
    formData.append("files[]", file);
  }

  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}/documents`),
    {
      method: "POST",
      headers: client.multipartSessionHeaders(sessionToken),
      body: formData,
    },
  );

  return handleResponse<CollectionDocumentUploadResponse>(
    response,
    "Collection document upload",
  );
}

export async function listCollectionDocuments(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
): Promise<{ data: import("./types").CollectionDocument[] }> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}/documents`),
    {
      method: "GET",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  return handleResponse(response, "Collection documents list");
}

export async function getCollectionDocument(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  documentId: string,
): Promise<{ data: import("./types").CollectionDocument }> {
  const response = await fetch(
    client.url(
      `/api/sdk/v1/collections/${collectionId}/documents/${documentId}`,
    ),
    {
      method: "GET",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  return handleResponse(response, "Collection document read");
}

export async function deleteCollectionDocument(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  documentId: string,
): Promise<void> {
  const response = await fetch(
    client.url(
      `/api/sdk/v1/collections/${collectionId}/documents/${documentId}`,
    ),
    {
      method: "DELETE",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  await throwOnError(response, "Collection document delete");
}

export async function reprocessCollectionDocument(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  documentId: string,
): Promise<{ data: import("./types").CollectionDocument }> {
  const response = await fetch(
    client.url(
      `/api/sdk/v1/collections/${collectionId}/documents/${documentId}/reprocess`,
    ),
    {
      method: "POST",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  return handleResponse(response, "Collection document reprocess");
}

export async function searchCollection(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  query: string,
  filters?: Record<string, string>,
  page?: number,
  perPage?: number,
): Promise<CollectionSearchResponse> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}/search`),
    {
      method: "POST",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify({ query, filters, page, per_page: perPage }),
    },
  );

  return handleResponse<CollectionSearchResponse>(
    response,
    "Collection search",
  );
}

export async function queryCollection(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  prompt: string,
  maxDocuments?: number,
  instructions?: string,
): Promise<CollectionQueryResponse> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}/query`),
    {
      method: "POST",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify({
        prompt,
        max_documents: maxDocuments,
        stream: false,
        instructions,
      }),
    },
  );

  return handleResponse<CollectionQueryResponse>(
    response,
    "Collection query",
  );
}

export async function generateCollectionTable(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  prompt: string,
  format?: "json" | "csv" | "markdown",
  documentIds?: string[],
  instructions?: string,
): Promise<CollectionTableResponse> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}/table`),
    {
      method: "POST",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify({
        prompt,
        format,
        document_ids: documentIds,
        instructions,
      }),
    },
  );

  return handleResponse<CollectionTableResponse>(
    response,
    "Collection table",
  );
}

export async function getSuggestedPrompts(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  request: SuggestedPromptsRequest,
): Promise<CollectionSuggestedPromptsResponse> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}/suggested-prompts`),
    {
      method: "POST",
      headers: {
        ...client.sessionHeaders(sessionToken),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  return handleResponse<CollectionSuggestedPromptsResponse>(
    response,
    "Collection suggested prompts",
  );
}

export async function analyzeCollection(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  prompt: string,
  instructions?: string,
): Promise<CollectionAnalyzeResponse> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}/analyze`),
    {
      method: "POST",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify({ prompt, stream: false, instructions }),
    },
  );

  return handleResponse<CollectionAnalyzeResponse>(
    response,
    "Collection analyze",
  );
}
