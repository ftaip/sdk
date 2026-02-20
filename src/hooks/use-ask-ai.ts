import { useCallback, useRef, useState } from "react";
import { askAi, askAiWithSession } from "../ask-ai";
import type { AiParalegalClient } from "../client";
import type {
  AskAiOptions,
  AskAiResponse,
  SessionContext,
  UseAskAiReturn,
} from "../types";

/**
 * React hook for interacting with the AI Paralegal API.
 *
 * Supports two authentication modes:
 *
 * 1. **API key + explicit firm/matter** (original):
 *    ```tsx
 *    const { ask } = useAskAI(client, { firmId: '...', matterId: '...' });
 *    ```
 *
 * 2. **Session token** (from token exchange):
 *    ```tsx
 *    const { session } = useSession(client);
 *    const { ask } = useAskAI(client, session);
 *    ```
 */
export function useAskAI(
  client: AiParalegalClient,
  options: AskAiOptions | SessionContext,
): UseAskAiReturn {
  const [data, setData] = useState<AskAiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isSession = "sessionToken" in options;

  const ask = useCallback(
    async (prompt: string) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        let response: AskAiResponse;

        if (isSession) {
          const session = options as SessionContext;
          response = await askAiWithSession(client, session.sessionToken, {
            prompt,
            load_matter_facts: (options as SessionContext).firmId
              ? undefined
              : undefined,
          });
        } else {
          const opts = options as AskAiOptions;
          response = await askAi(client, {
            prompt,
            firm_id: opts.firmId,
            matter_id: opts.matterId,
            load_matter_facts: opts.loadMatterFacts,
          });
        }

        setData(response);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
      } finally {
        setLoading(false);
      }
    },
    [client, options, isSession],
  );

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { ask, data, loading, error, reset };
}
