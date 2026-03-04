import type { ReactNode } from "react";
import { useSession } from "../hooks/use-session";
import type { AiParalegalClient } from "../client";
import type { SessionContext, UseSessionConfig } from "../types";

export interface SessionGateProps {
  config?: UseSessionConfig;
  loading?: ReactNode;
  error?: (error: Error) => ReactNode;
  noSession?: ReactNode;
  children: (session: SessionContext, client: AiParalegalClient) => ReactNode;
}

/**
 * Handles session loading, error, and missing-session states so apps
 * don't have to reimplement the same gate pattern.
 *
 * @example
 * ```tsx
 * <SessionGate>
 *   {(session, client) => <MyApp session={session} client={client} />}
 * </SessionGate>
 * ```
 */
export function SessionGate({
  config,
  loading: loadingNode,
  error: errorFn,
  noSession: noSessionNode,
  children,
}: SessionGateProps): ReactNode {
  const { session, client, loading, error } = useSession(config ?? {});

  if (loading) {
    return loadingNode ?? defaultLoading();
  }

  if (error) {
    return errorFn ? errorFn(error) : defaultError(error);
  }

  if (!session || !client) {
    return noSessionNode ?? defaultNoSession();
  }

  return children(session, client);
}

function defaultLoading(): ReactNode {
  return createElement("div", {
    style: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px", color: "#666" },
  }, "Connecting...");
}

function defaultError(error: Error): ReactNode {
  return createElement("div", {
    style: { padding: "16px", color: "#dc2626", textAlign: "center" as const },
  }, `Connection error: ${error.message}`);
}

function defaultNoSession(): ReactNode {
  return createElement("div", {
    style: { padding: "16px", color: "#666", textAlign: "center" as const },
  }, "No session available.");
}

// Use createElement to avoid requiring JSX transform in SDK consumers
import { createElement } from "react";
