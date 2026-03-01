import { useCallback, useRef, useState } from "react";
import { transcribeAudio } from "../transcribe";
import { streamTranscribe } from "../transcribe-stream";
import type { AiParalegalClient } from "../client";
import type {
  SessionContext,
  TranscribeOptions,
  TranscribeResponse,
  UseTranscribeReturn,
} from "../types";

/**
 * React hook for transcribing audio files via the host.
 *
 * Supports verbatim and clean modes, provider/model selection,
 * and optional diarization. Pass `stream: true` in options to
 * receive SSE progress events during transcription.
 *
 * ```tsx
 * const { transcribe, text, loading } = useTranscribe(client, session);
 *
 * await transcribe(audioFile, { mode: 'clean' });
 * ```
 */
export function useTranscribe(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseTranscribeReturn {
  const [data, setData] = useState<TranscribeResponse | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const transcribe = useCallback(
    async (file: File, options?: TranscribeOptions & { stream?: boolean }) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);
      setText("");
      setData(null);

      try {
        if (options?.stream) {
          await streamTranscribe(
            client,
            session.sessionToken,
            file,
            options,
            {
              onTranscribed: (rawText) => {
                setText(rawText);
              },
              onComplete: (response) => {
                setData(response);
                setText(response.data.text);
              },
              onError: (err) => {
                setError(err);
              },
            },
            abortRef.current.signal,
          );
        } else {
          const response = await transcribeAudio(
            client,
            session.sessionToken,
            file,
            options,
          );
          setData(response);
          setText(response.data.text);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setData(null);
    setText("");
    setLoading(false);
    setError(null);
  }, []);

  return { transcribe, data, text, loading, error, reset };
}
