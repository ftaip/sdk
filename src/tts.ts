import type { AiParalegalClient } from "./client";
import type { TtsOptions } from "./types";

/**
 * Convert text to speech audio via the host's TTS endpoint.
 *
 * Returns the audio as a Blob that can be played in the browser
 * or converted to a URL via `URL.createObjectURL()`.
 */
export async function textToSpeech(
  client: AiParalegalClient,
  sessionToken: string,
  text: string,
  options?: TtsOptions,
): Promise<Blob> {
  const response = await fetch(client.url("/api/sdk/v1/tts"), {
    method: "POST",
    headers: client.sessionHeaders(sessionToken),
    body: JSON.stringify({
      text,
      provider: options?.provider,
      model: options?.model,
      voice: options?.voice,
      instructions: options?.instructions,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `Text-to-speech failed with status ${response.status}`,
    );
  }

  return response.blob();
}
