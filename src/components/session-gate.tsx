import type { ReactNode } from "react";
import { createElement, useEffect } from "react";
import { useSession } from "../hooks/use-session";
import type { AiParalegalClient } from "../client";
import type { SessionContext, UseSessionConfig } from "../types";

export interface SessionGateTheme {
  loadingColor?: string;
  errorColor?: string;
  noSessionColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

export interface SessionGateProps {
  config?: UseSessionConfig;
  theme?: SessionGateTheme;
  loading?: ReactNode;
  error?: (error: Error, retry: () => void) => ReactNode;
  noSession?: ReactNode;
  onSessionReady?: (session: SessionContext, client: AiParalegalClient) => void;
  children: (session: SessionContext, client: AiParalegalClient) => ReactNode;
}

function defaultRetry(): void {
  window.location.reload();
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
  theme,
  loading: loadingNode,
  error: errorFn,
  noSession: noSessionNode,
  onSessionReady,
  children,
}: SessionGateProps): ReactNode {
  const { session, client, loading, error } = useSession(config ?? {});

  useEffect(() => {
    if (onSessionReady && session && client && !loading && !error) {
      onSessionReady(session, client);
    }
  }, [onSessionReady, session, client, loading, error]);

  if (loading) {
    return loadingNode ?? defaultLoading(theme);
  }

  if (error) {
    return errorFn ? errorFn(error, defaultRetry) : defaultError(error, defaultRetry, theme);
  }

  if (!session || !client) {
    return noSessionNode ?? defaultNoSession(theme);
  }

  return children(session, client);
}

function defaultLoading(theme?: SessionGateTheme): ReactNode {
  const color = theme?.loadingColor ?? "#64748b";
  const bg = theme?.backgroundColor ?? "#f8fafc";
  const font = theme?.fontFamily;
  const baseStyle: Record<string, string | number> = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    minHeight: "200px",
    padding: "32px",
    color,
    backgroundColor: bg,
    fontFamily: font ?? "system-ui, -apple-system, sans-serif",
  };

  return createElement(
    "div",
    { style: baseStyle },
    createElement("style", {
      dangerouslySetInnerHTML: {
        __html: `@keyframes session-gate-pulse{0%,100%{opacity:0.5}50%{opacity:1}}`,
      },
    }),
    createElement("span", {
      style: {
        animation: "session-gate-pulse 1.5s ease-in-out infinite",
        fontSize: "15px",
      },
    }, "Connecting..."),
  );
}

function defaultError(error: Error, retry: () => void, theme?: SessionGateTheme): ReactNode {
  const color = theme?.errorColor ?? "#b91c1c";
  const bg = theme?.backgroundColor ?? "#fef2f2";
  const font = theme?.fontFamily;
  const baseStyle: Record<string, string | number> = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    minHeight: "200px",
    padding: "24px",
    color,
    backgroundColor: bg,
    textAlign: "center",
    fontFamily: font ?? "system-ui, -apple-system, sans-serif",
  };

  const buttonStyle: Record<string, string | number> = {
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#fff",
    backgroundColor: color,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  };

  return createElement(
    "div",
    { style: baseStyle },
    createElement("p", { style: { margin: 0, fontSize: "15px" } }, `Connection error: ${error.message}`),
    createElement(
      "button",
      {
        type: "button",
        style: buttonStyle,
        onClick: retry,
      },
      "Retry",
    ),
  );
}

function defaultNoSession(theme?: SessionGateTheme): ReactNode {
  const color = theme?.noSessionColor ?? "#64748b";
  const bg = theme?.backgroundColor ?? "#f1f5f9";
  const font = theme?.fontFamily;
  const baseStyle: Record<string, string | number> = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "200px",
    padding: "32px",
    color,
    backgroundColor: bg,
    textAlign: "center",
    fontSize: "14px",
    fontFamily: font ?? "system-ui, -apple-system, sans-serif",
  };

  return createElement("div", { style: baseStyle }, "No session available.");
}
