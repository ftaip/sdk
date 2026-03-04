import { useEffect, useRef } from "react";

export interface SdkHostEvent {
  type: "sdk_event";
  event: string;
  data: unknown;
}

export type HostEventHandler = (event: string, data: unknown) => void;

/**
 * Hook that listens for postMessage events from the parent (host) window.
 * Filters for messages with type === 'sdk_event' and invokes the handler
 * with the event name and data.
 *
 * @param handler - Callback invoked when an sdk_event message is received
 *
 * @example
 * ```tsx
 * useHostEvents((event, data) => {
 *   if (event === 'matter.updated') {
 *     console.log('Matter updated:', data);
 *   }
 * });
 * ```
 */
export function useHostEvents(handler: HostEventHandler): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const handleMessage = (e: MessageEvent): void => {
      const message = e.data;
      if (message?.type === "sdk_event" && typeof message.event === "string") {
        handlerRef.current(message.event, message.data);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);
}
