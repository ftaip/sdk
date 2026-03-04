import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLLM } from "../../hooks/use-llm";
import * as llmModule from "../../llm";
import { AiParalegalClient } from "../../client";
import type { LlmResponse, SessionContext } from "../../types";

const client = new AiParalegalClient({
  baseUrl: "https://example.com",
  apiKey: "sk-test",
});

const session: SessionContext = {
  sessionToken: "sess-tok",
  firmId: "firm-1",
  matterId: "matter-1",
  parameters: {},
  chatId: null,
  conversationId: null,
  expiresAt: "2026-12-31T00:00:00Z",
};

const mockLlmResponse: LlmResponse = {
  data: {
    text: "Generated summary of the document.",
    structured: undefined,
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useLLM", () => {
  describe("initial state", () => {
    it("starts with null data, empty text, false loading, null error", () => {
      const { result } = renderHook(() => useLLM(client, session));

      expect(result.current.data).toBeNull();
      expect(result.current.text).toBe("");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("generate()", () => {
    it("calls askLlm with correct arguments on non-streaming", async () => {
      const spy = vi
        .spyOn(llmModule, "askLlm")
        .mockResolvedValueOnce(mockLlmResponse);

      const { result } = renderHook(() => useLLM(client, session));

      await act(async () => {
        await result.current.generate("Summarise this document");
      });

      expect(spy).toHaveBeenCalledWith(
        client,
        "sess-tok",
        "Summarise this document",
        undefined,
        undefined,
      );
    });

    it("sets data and text on success", async () => {
      vi.spyOn(llmModule, "askLlm").mockResolvedValueOnce(mockLlmResponse);

      const { result } = renderHook(() => useLLM(client, session));

      await act(async () => {
        await result.current.generate("Prompt");
      });

      expect(result.current.data).toEqual(mockLlmResponse);
      expect(result.current.text).toBe("Generated summary of the document.");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets structured when response includes structured data", async () => {
      const responseWithStructured: LlmResponse = {
        data: {
          text: "Done",
          structured: { key: "value" },
        },
      };
      vi.spyOn(llmModule, "askLlm").mockResolvedValueOnce(responseWithStructured);

      const { result } = renderHook(() => useLLM(client, session));

      await act(async () => {
        await result.current.generate("Extract");
      });

      expect(result.current.structured).toEqual({ key: "value" });
    });

    it("sets error on failure", async () => {
      vi.spyOn(llmModule, "askLlm").mockRejectedValueOnce(
        new Error("LLM request failed"),
      );

      const { result } = renderHook(() => useLLM(client, session));

      await act(async () => {
        await result.current.generate("Prompt");
      });

      expect(result.current.error?.message).toBe("LLM request failed");
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
    });

    it("silently ignores AbortError", async () => {
      const abortError = new DOMException("Aborted", "AbortError");
      vi.spyOn(llmModule, "askLlm").mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useLLM(client, session));

      await act(async () => {
        await result.current.generate("Prompt");
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it("sets error when client is null", async () => {
      const { result } = renderHook(() => useLLM(null, session));

      await act(async () => {
        await result.current.generate("Prompt");
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });

    it("sets error when session is null", async () => {
      const { result } = renderHook(() => useLLM(client, null));

      await act(async () => {
        await result.current.generate("Prompt");
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });
  });

  describe("reset()", () => {
    it("clears data, text, structured, loading, and error", async () => {
      vi.spyOn(llmModule, "askLlm").mockResolvedValueOnce(mockLlmResponse);

      const { result } = renderHook(() => useLLM(client, session));

      await act(async () => {
        await result.current.generate("Prompt");
      });

      expect(result.current.data).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.text).toBe("");
      expect(result.current.structured).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
