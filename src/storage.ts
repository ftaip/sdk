import type { AiParalegalClient } from "./client";
import { throwApiError } from "./errors";
import type {
  StorageItem,
  StorageListResponse,
  StorageScope,
  StorageShowResponse,
} from "./types";

function buildQuery(scope?: StorageScope): string {
  const params = new URLSearchParams();
  if (scope?.matterId) params.set("matter_id", scope.matterId);
  if (scope?.namespace) params.set("namespace", scope.namespace);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function throwOnError(
  response: Response,
  action: string,
): Promise<void> {
  if (!response.ok) {
    await throwApiError(response, action);
  }
}

export async function getStorageItem(
  client: AiParalegalClient,
  sessionToken: string,
  key: string,
  scope?: StorageScope,
): Promise<StorageItem | null> {
  const response = await fetch(
    client.url(`/api/sdk/v1/storage/${encodeURIComponent(key)}${buildQuery(scope)}`),
    {
      method: "GET",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  if (response.status === 404) return null;
  await throwOnError(response, "Storage get");
  const json = (await response.json()) as StorageShowResponse;
  return json.data;
}

export async function putStorageItem(
  client: AiParalegalClient,
  sessionToken: string,
  key: string,
  value: unknown,
  scope?: StorageScope,
): Promise<StorageItem> {
  const response = await fetch(
    client.url("/api/sdk/v1/storage"),
    {
      method: "PUT",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify({
        key,
        value,
        namespace: scope?.namespace,
        matter_id: scope?.matterId,
      }),
    },
  );

  await throwOnError(response, "Storage put");
  const json = (await response.json()) as StorageShowResponse;
  return json.data;
}

export async function deleteStorageItem(
  client: AiParalegalClient,
  sessionToken: string,
  key: string,
  scope?: StorageScope,
): Promise<void> {
  const response = await fetch(
    client.url(`/api/sdk/v1/storage/${encodeURIComponent(key)}${buildQuery(scope)}`),
    {
      method: "DELETE",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  if (response.status === 404) return;
  await throwOnError(response, "Storage delete");
}

export async function listStorageItems(
  client: AiParalegalClient,
  sessionToken: string,
  scope?: StorageScope,
): Promise<StorageItem[]> {
  const response = await fetch(
    client.url(`/api/sdk/v1/storage${buildQuery(scope)}`),
    {
      method: "GET",
      headers: client.sessionHeaders(sessionToken),
    },
  );

  await throwOnError(response, "Storage list");
  const json = (await response.json()) as StorageListResponse;
  return json.data;
}
