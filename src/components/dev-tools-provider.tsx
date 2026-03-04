import { createContext, createElement, useCallback, useContext, useReducer } from "react";

const MAX_LOGS = 100;

export interface DevToolsEntry {
  id: string;
  timestamp: string;
  type: "request" | "postMessage";
  url?: string;
  method?: string;
  status?: number;
  duration?: number;
  data?: unknown;
}

export interface DevToolsContextValue {
  logs: DevToolsEntry[];
  addLog: (entry: Omit<DevToolsEntry, "id" | "timestamp">) => void;
  clearLogs: () => void;
}

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

type LogAction =
  | { type: "add"; payload: Omit<DevToolsEntry, "id" | "timestamp"> }
  | { type: "clear" };

function reducer(state: DevToolsEntry[], action: LogAction): DevToolsEntry[] {
  if (action.type === "add") {
    const entry: DevToolsEntry = {
      ...action.payload,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    const next = [entry, ...state];
    return next.slice(0, MAX_LOGS);
  }
  if (action.type === "clear") {
    return [];
  }
  return state;
}

export function DevToolsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [logs, dispatch] = useReducer(reducer, []);

  const addLog = useCallback((entry: Omit<DevToolsEntry, "id" | "timestamp">) => {
    dispatch({ type: "add", payload: entry });
  }, []);

  const clearLogs = useCallback(() => {
    dispatch({ type: "clear" });
  }, []);

  const value: DevToolsContextValue = { logs, addLog, clearLogs };

  return createElement(
    DevToolsContext.Provider,
    { value },
    children,
  );
}

export function useDevToolsContext(): DevToolsContextValue | null {
  return useContext(DevToolsContext);
}
