import { useCallback, useRef, useState } from "react";
import { textToSpeech } from "../tts";
import type { AiParalegalClient } from "../client";
import type { SessionContext, TtsOptions, UseTtsReturn } from "../types";

/**
 * React hook for text-to-speech via the host.
 *
 * Generates audio from text using the configured AI provider and
 * plays it in the browser. Provides `audioUrl` for custom playback,
 * and `stop` / `reset` for control.
 *
 * ```tsx
 * const { speak, playing, loading, stop } = useTextToSpeech(client, session);
 *
 * await speak('Hello world', { voice: 'female' });
 * ```
 */
export function useTextToSpeech(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseTtsReturn {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  const speak = useCallback(
    async (text: string, options?: TtsOptions) => {
      if (!client || !session) {
        setError(new Error("Client and session are required"));
        return;
      }

      cleanup();
      setLoading(true);
      setError(null);
      setPlaying(false);
      setAudioUrl(null);

      try {
        const blob = await textToSpeech(
          client,
          session.sessionToken,
          text,
          options,
        );

        const url = URL.createObjectURL(blob);
        urlRef.current = url;
        setAudioUrl(url);

        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => setPlaying(false);
        audio.onerror = () => {
          setPlaying(false);
          setError(new Error("Audio playback failed"));
        };

        setPlaying(true);
        await audio.play();
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    },
    [client, session, cleanup],
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setAudioUrl(null);
    setPlaying(false);
    setLoading(false);
    setError(null);
  }, [cleanup]);

  return { speak, audioUrl, playing, loading, error, stop, reset };
}
