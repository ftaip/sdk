import { useEffect, useRef, useState } from "react";

const DEFAULT_MESSAGES = [
  "Processing your request...",
  "Analysing content...",
  "Almost there...",
  "Finalising results...",
];

/**
 * Cycle through a list of loading messages while `active` is true.
 * Useful for long-running LLM, OCR, or analysis operations.
 *
 * @example
 * ```tsx
 * const message = useLoadingMessages(llm.loading);
 * // message rotates every 4 seconds while loading
 * ```
 */
export function useLoadingMessages(
  active: boolean,
  options?: { messages?: string[]; intervalMs?: number },
): string {
  const messages = options?.messages ?? DEFAULT_MESSAGES;
  const intervalMs = options?.intervalMs ?? 4000;
  const [index, setIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active) {
      setIndex(0);
      intervalRef.current = setInterval(() => {
        setIndex((prev) => (prev + 1) % messages.length);
      }, intervalMs);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [active, messages.length, intervalMs]);

  return messages[index] ?? messages[0];
}
