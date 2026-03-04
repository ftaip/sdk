import type { AiParalegalClient } from "./client";
import { throwApiError } from "./errors";
import type {
  CollectionAnalyzeStreamCallbacks,
  CollectionQueryStreamCallbacks,
} from "./types";
import { consumeSseStream } from "./sse";

/**
 * Stream a collection NL query response via SSE.
 *
 * Emits text_delta events as the AI generates tokens and a complete event
 * with the full answer, citations, and document counts.
 */
export async function streamCollectionQuery(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  prompt: string,
  maxDocuments?: number,
  callbacks?: CollectionQueryStreamCallbacks,
  signal?: AbortSignal,
  instructions?: string,
): Promise<void> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}/query`),
    {
      method: "POST",
      headers: {
        ...client.sessionHeaders(sessionToken),
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        prompt,
        max_documents: maxDocuments,
        stream: true,
        instructions,
      }),
      signal,
    },
  );

  if (!response.ok) {
    await throwApiError(response, "Collection query stream failed");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = await response.json();
    callbacks?.onChunk?.(json.data?.answer ?? "");
    callbacks?.onComplete?.({ data: json.data });
    return;
  }

  await consumeSseStream(
    response,
    (event, data) => {
      const payload = data as Record<string, unknown>;

      if (event === "stage") {
        callbacks?.onStage?.(
          (payload.stage as string) ?? "",
          (payload.message as string) ?? "",
        );
      } else if (event === "text_delta" && typeof payload.delta === "string") {
        callbacks?.onChunk?.(payload.delta);
      } else if (event === "complete") {
        callbacks?.onComplete?.({
          data: {
            answer: (payload.answer as string) ?? "",
            citations: (payload.citations as Array<{
              document_id: string;
              filename: string;
              excerpt: string;
            }>) ?? [],
            documents_searched: (payload.documents_searched as number) ?? 0,
            documents_cited: (payload.documents_cited as number) ?? 0,
          },
        });
      } else if (event === "error") {
        callbacks?.onError?.(
          new Error((payload.message as string) ?? "Stream error"),
        );
      }
    },
    signal,
  );
}

/**
 * Stream a collection analysis response via SSE.
 *
 * Emits text_delta events as the AI generates the analysis and a complete
 * event with the full analysis and statistics.
 */
export async function streamCollectionAnalysis(
  client: AiParalegalClient,
  sessionToken: string,
  collectionId: string,
  prompt: string,
  callbacks?: CollectionAnalyzeStreamCallbacks,
  signal?: AbortSignal,
  instructions?: string,
): Promise<void> {
  const response = await fetch(
    client.url(`/api/sdk/v1/collections/${collectionId}/analyze`),
    {
      method: "POST",
      headers: {
        ...client.sessionHeaders(sessionToken),
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ prompt, stream: true, instructions }),
      signal,
    },
  );

  if (!response.ok) {
    await throwApiError(response, "Collection analyze stream failed");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const json = await response.json();
    callbacks?.onChunk?.(json.data?.analysis ?? "");
    callbacks?.onComplete?.({ data: json.data });
    return;
  }

  await consumeSseStream(
    response,
    (event, data) => {
      const payload = data as Record<string, unknown>;

      if (event === "stage") {
        callbacks?.onStage?.(
          (payload.stage as string) ?? "",
          (payload.message as string) ?? "",
        );
      } else if (event === "text_delta" && typeof payload.delta === "string") {
        callbacks?.onChunk?.(payload.delta);
      } else if (event === "complete") {
        callbacks?.onComplete?.({
          data: {
            analysis: (payload.analysis as string) ?? "",
            statistics: (payload.statistics as Record<string, unknown>) ?? {},
          },
        });
      } else if (event === "error") {
        callbacks?.onError?.(
          new Error((payload.message as string) ?? "Stream error"),
        );
      }
    },
    signal,
  );
}
