import { useEffect, useRef, useState } from "react";
import { getSuggestedPrompts } from "../collections";
import type { AiParalegalClient } from "../client";
import type {
  CollectionSuggestedPrompts,
  SessionContext,
  SuggestedPromptsRequest,
  UseSuggestedPromptsReturn,
} from "../types";

/**
 * React hook that fetches LLM-generated suggested prompts tailored to the
 * documents in a collection. The client app provides the instructions and
 * categories so the endpoint remains domain-agnostic.
 *
 * Results are fetched once and cached on the server, so subsequent renders
 * return instantly.
 *
 * Only fetches when `processedCount >= 1` so we don't call the endpoint
 * before any documents have been processed.
 *
 * ```tsx
 * const { prompts, loading } = useSuggestedPrompts(client, session, collectionId, processedCount, {
 *   instructions: "You are a legal document assistant...",
 *   categories: ["query", "analyze", "search", "table"],
 *   prompts_per_category: 3,
 * });
 * // prompts?.query  => ["What notice period does Acme require?", ...]
 * ```
 */
export function useSuggestedPrompts(
  client: AiParalegalClient | null,
  session: SessionContext | null,
  collectionId: string,
  processedCount: number,
  request?: SuggestedPromptsRequest,
): UseSuggestedPromptsReturn {
  const [prompts, setPrompts] = useState<CollectionSuggestedPrompts | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (
      !client ||
      !session ||
      !request ||
      processedCount < 1 ||
      fetchedRef.current
    ) {
      return;
    }

    fetchedRef.current = true;
    setLoading(true);

    getSuggestedPrompts(client, session.sessionToken, collectionId, request)
      .then((response) => setPrompts(response.data))
      .catch((err) =>
        setError(err instanceof Error ? err : new Error(String(err))),
      )
      .finally(() => setLoading(false));
  }, [client, session, collectionId, processedCount, request]);

  return { prompts, loading, error };
}
