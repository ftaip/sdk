import { useEffect, useMemo, useRef, useState } from 'react';
import { AiParalegalClient } from '../client';
import { exchangeToken } from '../exchange-token';
import type {
  SessionContext,
  UseSessionConfig,
  UseSessionReturn,
} from '../types';

/**
 * React hook that automatically exchanges a URL token for a session.
 *
 * Reads `token` and `baseUrl` query parameters from `window.location.search`.
 * The host application (AI Paralegal admin) provides both when loading your
 * app in the preview iframe.
 *
 * @param config - Optional API key and baseUrl overrides.
 *                 Both can be omitted when the host injects them as
 *                 `apiKey` and `baseUrl` URL query parameters.
 *
 * @example
 * ```tsx
 * // When the host injects apiKey and baseUrl via URL params (recommended):
 * const { session, client, loading, error } = useSession({});
 *
 * // Or provide them explicitly (e.g. for local development):
 * const { session, client, loading, error } = useSession({
 *   apiKey: 'your-api-key',
 *   baseUrl: 'https://your-host.com',
 * });
 *
 * if (loading) return <p>Authenticating...</p>;
 * if (!session || !client) return <p>No token provided.</p>;
 *
 * // session.firmId, session.matterId, session.sessionToken are available
 * // client is configured with the host's baseUrl
 * ```
 */
export function useSession(config: UseSessionConfig): UseSessionReturn {
  const params = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const resolvedBaseUrl = config.baseUrl ?? params.get('baseUrl');
  const resolvedApiKey = config.apiKey ?? params.get('apiKey') ?? undefined;

  const client = useMemo(() => {
    if (!resolvedBaseUrl) {
      return null;
    }
    return new AiParalegalClient({
      baseUrl: resolvedBaseUrl,
      apiKey: resolvedApiKey,
    });
  }, [resolvedBaseUrl, resolvedApiKey]);

  const [session, setSession] = useState<SessionContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const exchangedRef = useRef(false);

  useEffect(() => {
    if (exchangedRef.current || !client) {
      return;
    }

    const token = params.get('token');

    if (!token) {
      return;
    }

    exchangedRef.current = true;
    setLoading(true);

    exchangeToken(client, token)
      .then((response) => {
        setSession({
          sessionToken: response.session_token,
          firmId: response.firm_id,
          matterId: response.matter_id,
          parameters: response.parameters ?? {},
          chatId: response.chat_id ?? null,
          conversationId: response.conversation_id ?? null,
          expiresAt: response.expires_at,
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [client, params]);

  return { session, client, loading, error };
}
