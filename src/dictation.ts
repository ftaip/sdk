import type { AiParalegalClient } from "./client";
import { throwApiError } from "./errors";
import type {
  DictateChunkResponse,
  DictationCallbacks,
  DictationOptions,
} from "./types";

/**
 * Encode raw PCM float32 samples as a WAV file Blob.
 *
 * WAV is used because it's a simple container where every file is
 * self-contained — unlike WebM where only the first chunk carries
 * the initialization segment / header.
 */
function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function writeString(offset: number, str: string): void {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(
      offset,
      clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff,
      true,
    );
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function combinePcmChunks(chunks: Float32Array[]): Float32Array {
  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.length;
  }
  const combined = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  return combined;
}

/**
 * Start a live dictation session using the browser's microphone.
 *
 * Captures audio via the Web Audio API, encodes each interval as a
 * self-contained WAV file, and sends it to the host for server-side
 * transcription.
 *
 * Each chunk includes ~1.5 seconds of overlap from the previous chunk
 * to prevent words spoken at interval boundaries from being dropped.
 */
export async function startDictation(
  client: AiParalegalClient,
  sessionToken: string,
  options?: DictationOptions,
  callbacks?: DictationCallbacks,
): Promise<{ stop: () => void }> {
  const chunkInterval = options?.chunkIntervalMs ?? 8000;
  const overlapSeconds = 1.5;
  let accumulated = "";
  let stopped = false;

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const sampleRate = audioCtx.sampleRate;
  const overlapSamples = Math.floor(sampleRate * overlapSeconds);

  const bufferSize = 4096;
  const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);

  let pcmChunks: Float32Array[] = [];
  let overlapBuffer: Float32Array | null = null;

  processor.onaudioprocess = (e) => {
    if (stopped) return;
    const input = e.inputBuffer.getChannelData(0);
    pcmChunks.push(new Float32Array(input));
  };

  source.connect(processor);
  processor.connect(audioCtx.destination);

  async function flushAndSend(): Promise<void> {
    if (pcmChunks.length === 0 && !overlapBuffer) return;

    const newAudio = combinePcmChunks(pcmChunks);
    pcmChunks = [];

    const parts: Float32Array[] = [];
    if (overlapBuffer) {
      parts.push(overlapBuffer);
    }
    parts.push(newAudio);
    const combined = combinePcmChunks(parts);

    if (combined.length < sampleRate * 0.3) {
      return;
    }

    if (combined.length > overlapSamples) {
      overlapBuffer = combined.slice(combined.length - overlapSamples);
    } else {
      overlapBuffer = new Float32Array(combined);
    }

    let maxAmplitude = 0;
    for (let i = 0; i < combined.length; i++) {
      const abs = Math.abs(combined[i]);
      if (abs > maxAmplitude) maxAmplitude = abs;
    }
    if (maxAmplitude < 0.005) {
      return;
    }

    const wav = encodeWav(combined, sampleRate);

    const formData = new FormData();
    formData.append("audio", wav, "chunk.wav");

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

    callbacks?.onChunkSent?.();

    try {
      const response = await fetch(client.url("/api/sdk/v1/dictate"), {
        method: "POST",
        headers: client.multipartSessionHeaders(sessionToken),
        body: formData,
      });

      if (!response.ok) {
        await throwApiError(response, "Dictation chunk failed");
      }

      const result = (await response.json()) as DictateChunkResponse;
      const text = result.data.text.trim();

      if (text) {
        accumulated = accumulated ? accumulated + " " + text : text;
        callbacks?.onTranscript?.(text, accumulated);
      }
    } catch (err) {
      callbacks?.onError?.(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  const intervalId = setInterval(() => {
    if (!stopped) {
      flushAndSend();
    }
  }, chunkInterval);

  function stop(): void {
    stopped = true;
    clearInterval(intervalId);
    overlapBuffer = null;
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((track) => track.stop());
    audioCtx.close();
    flushAndSend();
  }

  return { stop };
}
