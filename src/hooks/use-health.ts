import { useCallback, useState } from "react";
import type { AiParalegalClient } from "../client";
import type { HealthCheckResponse } from "../health";
import { checkHealth } from "../health";

export interface UseHealthReturn {
  check: () => Promise<void>;
  health: HealthCheckResponse | null;
  loading: boolean;
  error: Error | null;
}

export function useHealth(
  client: AiParalegalClient | null,
  sessionToken?: string,
): UseHealthReturn {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const check = useCallback(async () => {
    if (!client) {
      setError(new Error("Client not initialised"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await checkHealth(client, sessionToken);
      setHealth(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [client, sessionToken]);

  return { check, health, loading, error };
}
