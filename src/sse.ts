/**
 * Parse an SSE (Server-Sent Events) stream from a fetch Response.
 *
 * Calls `onEvent` for each parsed event with the event name and JSON-parsed data.
 * Automatically handles buffering, multi-line data, and stream termination.
 */
export async function consumeSseStream(
  response: Response,
  onEvent: (event: string, data: unknown) => void,
  signal?: AbortSignal,
): Promise<void> {
  const body = response.body;

  if (!body) {
    throw new Error("Response body is null — streaming is not supported");
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      if (signal?.aborted) {
        reader.cancel();
        return;
      }

      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          const payload = line.slice(6).trim();

          if (payload === "</stream>" || !currentEvent) {
            continue;
          }

          try {
            const data: unknown = JSON.parse(payload);
            onEvent(currentEvent, data);
          } catch {
            // skip unparseable payloads
          }

          currentEvent = "";
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
