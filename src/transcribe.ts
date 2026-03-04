import type { AiParalegalClient } from "./client";
import { throwApiError } from "./errors";
import type { TranscribeOptions, TranscribeResponse } from "./types";

/**
 * Transcribe an audio file using the host's transcription endpoint.
 *
 * Supports provider/model selection, verbatim vs clean mode, and
 * optional diarization for speaker identification.
 */
export async function transcribeAudio(
  client: AiParalegalClient,
  sessionToken: string,
  file: File,
  options?: TranscribeOptions,
): Promise<TranscribeResponse> {
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

  const response = await fetch(client.url("/api/sdk/v1/transcribe"), {
    method: "POST",
    headers: client.multipartSessionHeaders(sessionToken),
    body: formData,
  });

  if (!response.ok) {
    await throwApiError(response, "Transcription failed");
  }

  return response.json() as Promise<TranscribeResponse>;
}
