import { createElement, useCallback, useState } from "react";
import type { AiParalegalClient } from "../client";
import type { SessionContext } from "../types";
import { useDevToolsContext } from "./dev-tools-provider";

const SDK_VERSION = "0.7.0";

export interface DevToolsPanelProps {
  session?: SessionContext | null;
  client?: AiParalegalClient | null;
  show?: boolean;
}

const WRAPPER_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: "12px",
  right: "12px",
  zIndex: 99999,
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const TOGGLE_BTN_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: 500,
  color: "#334155",
  backgroundColor: "#f1f5f9",
  border: "1px solid #cbd5e1",
  borderRadius: "6px",
  cursor: "pointer",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

const PANEL_STYLE: React.CSSProperties = {
  position: "absolute",
  bottom: "40px",
  right: "0",
  width: "360px",
  maxHeight: "420px",
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const TABS_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  borderBottom: "1px solid #e2e8f0",
  backgroundColor: "#f8fafc",
};

const TAB_STYLE: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: "12px",
  fontWeight: 500,
  color: "#64748b",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
};

const TAB_ACTIVE_STYLE: React.CSSProperties = {
  ...TAB_STYLE,
  color: "#0f172a",
  backgroundColor: "#fff",
  borderBottom: "2px solid #3b82f6",
};

const CONTENT_STYLE: React.CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: "12px",
  fontSize: "12px",
  color: "#334155",
  lineHeight: 1.5,
};

const ROW_STYLE: React.CSSProperties = {
  marginBottom: "8px",
  wordBreak: "break-all",
};

const LABEL_STYLE: React.CSSProperties = {
  fontWeight: 600,
  color: "#64748b",
  marginRight: "6px",
};

const LOG_ITEM_STYLE: React.CSSProperties = {
  padding: "8px",
  marginBottom: "6px",
  backgroundColor: "#f8fafc",
  borderRadius: "4px",
  fontSize: "11px",
  fontFamily: "ui-monospace, monospace",
  borderLeft: "3px solid #94a3b8",
};

const LOG_ITEM_REQUEST_STYLE: React.CSSProperties = {
  ...LOG_ITEM_STYLE,
  borderLeftColor: "#3b82f6",
};

const LOG_ITEM_POST_STYLE: React.CSSProperties = {
  ...LOG_ITEM_STYLE,
  borderLeftColor: "#10b981",
};

function formatExpiryCountdown(expiresAt: string): string {
  try {
    const exp = new Date(expiresAt).getTime();
    const now = Date.now();
    const ms = exp - now;
    if (ms <= 0) return "expired";
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}s`;
    return `${s}s`;
  } catch {
    return "—";
  }
}

function truncateToken(token: string, len = 12): string {
  if (token.length <= len) return token;
  return `${token.slice(0, len)}…`;
}

export function DevToolsPanel({
  session,
  client,
  show = false,
}: DevToolsPanelProps): React.ReactElement | null {
  const g = globalThis as { process?: { env?: { NODE_ENV?: string } } };
  const isDev = g.process?.env?.NODE_ENV === "development";
  const shouldShow = show || isDev;

  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"session" | "network" | "info">("session");
  const devTools = useDevToolsContext();

  const toggleOpen = useCallback(() => setOpen((o) => !o), []);

  if (!shouldShow) {
    return null;
  }

  return createElement(
    "div",
    { style: WRAPPER_STYLE },
    createElement(
      "button",
      {
        type: "button",
        style: TOGGLE_BTN_STYLE,
        onClick: toggleOpen,
        "aria-label": "Toggle SDK DevTools",
      },
      createElement(
        "svg",
        {
          width: 14,
          height: 14,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        },
        createElement("circle", { cx: 12, cy: 12, r: 3 }),
        createElement("path", { d: "M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" }),
      ),
      "SDK DevTools",
    ),
    open &&
      createElement(
        "div",
        { style: PANEL_STYLE },
        createElement(
          "div",
          { style: TABS_ROW_STYLE },
          createElement(
            "button",
            {
              type: "button",
              style: activeTab === "session" ? TAB_ACTIVE_STYLE : TAB_STYLE,
              onClick: () => setActiveTab("session"),
            },
            "Session",
          ),
          createElement(
            "button",
            {
              type: "button",
              style: activeTab === "network" ? TAB_ACTIVE_STYLE : TAB_STYLE,
              onClick: () => setActiveTab("network"),
            },
            "Network",
          ),
          createElement(
            "button",
            {
              type: "button",
              style: activeTab === "info" ? TAB_ACTIVE_STYLE : TAB_STYLE,
              onClick: () => setActiveTab("info"),
            },
            "Info",
          ),
        ),
        activeTab === "session" &&
          createElement(
            "div",
            { style: CONTENT_STYLE },
            session
              ? [
                  createElement("div", { key: "token", style: ROW_STYLE }, createElement("span", { style: LABEL_STYLE }, "Token:"), truncateToken(session.sessionToken)),
                  createElement("div", { key: "expiry", style: ROW_STYLE }, createElement("span", { style: LABEL_STYLE }, "Expires:"), formatExpiryCountdown(session.expiresAt)),
                  createElement("div", { key: "firm", style: ROW_STYLE }, createElement("span", { style: LABEL_STYLE }, "Firm ID:"), session.firmId),
                  createElement("div", { key: "matter", style: ROW_STYLE }, createElement("span", { style: LABEL_STYLE }, "Matter ID:"), session.matterId),
                  createElement("div", { key: "params", style: ROW_STYLE }, createElement("span", { style: LABEL_STYLE }, "Parameters:"), JSON.stringify(session.parameters)),
                ]
              : createElement("div", null, "No session."),
          ),
        activeTab === "network" &&
          createElement(
            "div",
            { style: CONTENT_STYLE },
            devTools ? (
              (() => {
                const items = devTools.logs.map((log) =>
                  createElement(
                    "div",
                    {
                      key: log.id,
                      style: log.type === "postMessage" ? LOG_ITEM_POST_STYLE : LOG_ITEM_REQUEST_STYLE,
                    },
                    createElement("div", null, `${log.timestamp} — ${log.type}`),
                    log.method && createElement("div", null, `${log.method} ${log.url ?? ""}`),
                    log.status != null && createElement("div", null, `Status: ${log.status}`),
                    log.duration != null && createElement("div", null, `Duration: ${log.duration}ms`),
                    log.data != null && createElement("div", { style: { marginTop: "4px", fontSize: "10px" } }, JSON.stringify(log.data)),
                  ),
                );
                return createElement(
                  "div",
                  null,
                  createElement(
                    "button",
                    {
                      type: "button",
                      style: { ...TOGGLE_BTN_STYLE, marginBottom: "8px" },
                      onClick: devTools.clearLogs,
                    },
                    "Clear",
                  ),
                  items.length ? items : createElement("div", null, "No requests logged."),
                );
              })()
            ) : (
              createElement("div", null, "Wrap your app with DevToolsProvider to track API requests.")
            ),
          ),
        activeTab === "info" &&
          createElement(
            "div",
            { style: CONTENT_STYLE },
            createElement("div", { style: ROW_STYLE }, createElement("span", { style: LABEL_STYLE }, "SDK version:"), SDK_VERSION),
            createElement("div", { style: ROW_STYLE }, createElement("span", { style: LABEL_STYLE }, "Base URL:"), client?.baseUrl ?? "—"),
          ),
      ),
  );
}
