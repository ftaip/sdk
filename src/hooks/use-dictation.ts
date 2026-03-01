import { useCallback, useRef, useState } from "react";
import { startDictation } from "../dictation";
import type { AiParalegalClient } from "../client";
import type {
  DictationCallbacks,
  DictationOptions,
  SessionContext,
  UseDictationReturn,
} from "../types";

/**
 * React hook for real-time voice dictation via server-side transcription.
 *
 * Captures microphone audio using MediaRecorder, sends chunks to the
 * host for transcription, and accumulates text progressively. This
 * replaces the Web Speech API with cross-browser support and
 * higher-quality AI transcription.
 *
 * ```tsx
 * const { start, stop, transcript, isRecording } = useDictation(client, session);
 *
 * // Start recording with clean mode
 * await start({ mode: 'clean' }, {
 *   onTranscript: (chunk, full) => console.log(full),
 * });
 *
 * // Stop when done
 * stop();
 * ```
 */
export function useDictation(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseDictationReturn {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const start = useCallback(
    async (options?: DictationOptions, callbacks?: DictationCallbacks) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }

      if (stopRef.current) {
        stopRef.current();
      }

      setError(null);
      setLoading(true);

      try {
        const { stop: stopFn } = await startDictation(
          client,
          session.sessionToken,
          options,
          {
            onChunkSent: () => {
              setLoading(true);
              callbacks?.onChunkSent?.();
            },
            onTranscript: (chunk, accumulated) => {
              setTranscript(accumulated);
              setLoading(false);
              callbacks?.onTranscript?.(chunk, accumulated);
            },
            onError: (err) => {
              setError(err);
              setLoading(false);
              callbacks?.onError?.(err);
            },
          },
        );

        stopRef.current = stopFn;
        setIsRecording(true);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      }
    },
    [client, session],
  );

  const stop = useCallback(() => {
    if (stopRef.current) {
      stopRef.current();
      stopRef.current = null;
    }
    setIsRecording(false);
    setLoading(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTranscript("");
    setError(null);
  }, [stop]);

  return { start, stop, transcript, isRecording, loading, error, reset };
}
