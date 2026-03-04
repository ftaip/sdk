import { useEffect, useRef } from "react";
import type { UseLlmReturn } from "../types";

/**
 * React to LLM completion — fires `onSuccess` when `useLLM` finishes
 * generating, or `onError` if it fails. Prevents duplicate calls on
 * re-renders by tracking the last-seen data reference.
 *
 * @example
 * ```tsx
 * const llm = useLLM(client, session);
 * useLlmEffect(llm, (text, structured) => {
 *   console.log('LLM done:', text, structured);
 * });
 * ```
 */
export function useLlmEffect(
  llm: UseLlmReturn,
  onSuccess: (text: string, structured: Record<string, unknown> | null) => void,
  onError?: (error: Error) => void,
): void {
  const lastDataRef = useRef<unknown>(null);
  const lastErrorRef = useRef<Error | null>(null);

  useEffect(() => {
    if (llm.loading) return;

    if (llm.error && llm.error !== lastErrorRef.current) {
      lastErrorRef.current = llm.error;
      onError?.(llm.error);
      return;
    }

    if (llm.data && llm.data !== lastDataRef.current) {
      lastDataRef.current = llm.data;
      lastErrorRef.current = null;
      onSuccess(llm.text, llm.structured);
    }
  }, [llm.loading, llm.data, llm.error, llm.text, llm.structured, onSuccess, onError]);
}
