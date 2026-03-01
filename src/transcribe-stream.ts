import type { AiParalegalClient } from "./client";
import type {
  TranscribeOptions,
  TranscribeResponse,
  TranscribeStreamCallbacks,
} from "./types";
import { consumeSseStream } from "./sse";

/**
 * Transcribe an audio file with SSE streaming progress events.
 *
 * Emits `transcribing`, `transcribed`, and `complete` events so the UI
 * can show progress during longer transcriptions. When mode is "clean",
 * the server first transcribes verbatim then post-processes to remove
 * filler words — emitting both stages.
 */
export async function streamTranscribe(
  client: AiParalegalClient,
  sessionToken: string,
  file: File,
  options?: TranscribeOptions,
  callbacks?: TranscribeStreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  if (options?.mode) {
    formData.append("mode", options.mode);
  }
  if (options?.provider) {
    formData.append("provider", options.provider);
  }
  if (options?.model) {
    formData.append("model", options.model);
  }
  if (options?.language) {
    formData.append("language", options.language);
  }
  if (options?.diarize !== undefined) {
    formData.append("diarize", options.diarize ? "1" : "0");
  }

  const response = await fetch(client.url("/api/sdk/v1/transcribe/stream"), {
    method: "POST",
    headers: {
      ...client.multipartSessionHeaders(sessionToken),
      Accept: "text/event-stream",
    },
    body: formData,
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Transcription stream failed with status ${response.status}`,
    );
  }

  await consumeSseStream(
    response,
    (event, data) => {
      const payload = data as Record<string, unknown>;

      if (event === "transcribing" && typeof payload.filename === "string") {
        callbacks?.onTranscribing?.(payload.filename);
      } else if (event === "transcribed" && typeof payload.text === "string") {
        callbacks?.onTranscribed?.(payload.text);
      } else if (event === "complete") {
        callbacks?.onComplete?.({
          data: {
            text: (payload.text as string) ?? "",
            mode: (payload.mode as "verbatim" | "clean") ?? "verbatim",
            diarized: (payload.diarized as boolean) ?? false,
          },
        });
      } else if (event === "error") {
        callbacks?.onError?.(
          new Error((payload.message as string) ?? "Transcription error"),
        );
      }
    },
    signal,
  );
}
