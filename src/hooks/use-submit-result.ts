import { useCallback, useState } from "react";
import type { AiParalegalClient } from "../client";
import { submitResult } from "../submit-result";
import type {
  SessionContext,
  SubmitResultResponse,
  UseSubmitResultReturn,
} from "../types";

export function useSubmitResult(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseSubmitResultReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [response, setResponse] = useState<SubmitResultResponse | null>(null);

  const submit = useCallback(
    async (result: Record<string, unknown> | string) => {
      if (!client || !session) {
        setError(new Error("Client or session not available"));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await submitResult(client, session.sessionToken, result);
        setResponse(res);
        setSubmitted(true);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to submit result"),
        );
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  return { submit, loading, error, submitted, response };
}
