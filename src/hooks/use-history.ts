import { useCallback, useState } from "react";

export interface HistoryEntry<T = unknown> {
  id: number;
  prompt: string;
  data: T;
}

/**
 * Maintain an in-memory history of prompt → result pairs.
 * Useful for query, search, and analysis panels where users
 * want to review previous results.
 *
 * @example
 * ```tsx
 * const { history, pushCurrent, lastPrompt, setLastPrompt } = useHistory<QueryResult>();
 *
 * setLastPrompt(input);
 * const result = await query(input);
 * pushCurrent(input, result);
 * ```
 */
export function useHistory<T = unknown>(): {
  history: HistoryEntry<T>[];
  lastPrompt: string;
  pushCurrent: (prompt: string, data: T) => void;
  setLastPrompt: (prompt: string) => void;
  clear: () => void;
} {
  const [history, setHistory] = useState<HistoryEntry<T>[]>([]);
  const [lastPrompt, setLastPrompt] = useState("");

  const pushCurrent = useCallback((prompt: string, data: T) => {
    setHistory((prev) => [
      { id: Date.now(), prompt, data },
      ...prev,
    ]);
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    setLastPrompt("");
  }, []);

  return { history, lastPrompt, pushCurrent, setLastPrompt, clear };
}
