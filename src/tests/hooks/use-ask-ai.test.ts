import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAskAI } from "../../hooks/use-ask-ai";
import * as askAiModule from "../../ask-ai";
import { AiParalegalClient } from "../../client";
import type { SessionContext } from "../../types";

const client = new AiParalegalClient({
  baseUrl: "https://example.com",
  apiKey: "sk-test",
});

const sessionContext: SessionContext = {
  sessionToken: "sess-tok",
  firmId: "firm-1",
  matterId: "matter-1",
  parameters: {},
  chatId: null,
  conversationId: null,
  expiresAt: "2026-12-31T00:00:00Z",
};

const mockResponse = {
  data: {
    answer: "The answer is 42.",
    references: [],
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useAskAI", () => {
  describe("initial state", () => {
    it("starts with null data, false loading, null error", () => {
      const { result } = renderHook(() =>
        useAskAI(client, { firmId: "f", matterId: "m" }),
      );

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("API key mode (AskAiOptions)", () => {
    it("calls askAi with the correct arguments", async () => {
      const spy = vi
        .spyOn(askAiModule, "askAi")
        .mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useAskAI(client, { firmId: "firm-1", matterId: "matter-1" }),
      );

      await act(async () => {
        await result.current.ask("What is stamp duty?");
      });

      expect(spy).toHaveBeenCalledWith(client, {
        prompt: "What is stamp duty?",
        firm_id: "firm-1",
        matter_id: "matter-1",
        load_matter_facts: undefined,
      });
    });

    it("passes loadMatterFacts to askAi", async () => {
      const spy = vi
        .spyOn(askAiModule, "askAi")
        .mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useAskAI(client, {
          firmId: "firm-1",
          matterId: "matter-1",
          loadMatterFacts: true,
        }),
      );

      await act(async () => {
        await result.current.ask("Summarise");
      });

      expect(spy).toHaveBeenCalledWith(
        client,
        expect.objectContaining({ load_matter_facts: true }),
      );
    });

    it("sets data and clears loading on success", async () => {
      vi.spyOn(askAiModule, "askAi").mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useAskAI(client, { firmId: "f", matterId: "m" }),
      );

      await act(async () => {
        await result.current.ask("Q?");
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
    });

    it("sets error on failure", async () => {
      vi.spyOn(askAiModule, "askAi").mockRejectedValueOnce(
        new Error("AI error"),
      );

      const { result } = renderHook(() =>
        useAskAI(client, { firmId: "f", matterId: "m" }),
      );

      await act(async () => {
        await result.current.ask("Q?");
      });

      expect(result.current.error?.message).toBe("AI error");
      expect(result.current.loading).toBe(false);
    });

    it("wraps non-Error thrown values", async () => {
      vi.spyOn(askAiModule, "askAi").mockRejectedValueOnce("bad string");

      const { result } = renderHook(() =>
        useAskAI(client, { firmId: "f", matterId: "m" }),
      );

      await act(async () => {
        await result.current.ask("Q?");
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("bad string");
    });
  });

  describe("session mode (SessionContext)", () => {
    it("calls askAiWithSession with the session token", async () => {
      const spy = vi
        .spyOn(askAiModule, "askAiWithSession")
        .mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useAskAI(client, sessionContext),
      );

      await act(async () => {
        await result.current.ask("Tell me about the matter.");
      });

      expect(spy).toHaveBeenCalledWith(client, "sess-tok", {
        prompt: "Tell me about the matter.",
        load_matter_facts: undefined,
      });
    });

    it("sets data on success", async () => {
      vi.spyOn(askAiModule, "askAiWithSession").mockResolvedValueOnce(
        mockResponse,
      );

      const { result } = renderHook(() => useAskAI(client, sessionContext));

      await act(async () => {
        await result.current.ask("Q?");
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("sets error on failure", async () => {
      vi.spyOn(askAiModule, "askAiWithSession").mockRejectedValueOnce(
        new Error("Session expired"),
      );

      const { result } = renderHook(() => useAskAI(client, sessionContext));

      await act(async () => {
        await result.current.ask("Q?");
      });

      expect(result.current.error?.message).toBe("Session expired");
    });
  });

  describe("reset()", () => {
    it("clears data, loading, and error", async () => {
      vi.spyOn(askAiModule, "askAi").mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useAskAI(client, { firmId: "f", matterId: "m" }),
      );

      await act(async () => {
        await result.current.ask("Q?");
      });

      expect(result.current.data).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("abort handling", () => {
    it("silently ignores AbortError", async () => {
      const abortError = new DOMException("Aborted", "AbortError");
      vi.spyOn(askAiModule, "askAi").mockRejectedValueOnce(abortError);

      const { result } = renderHook(() =>
        useAskAI(client, { firmId: "f", matterId: "m" }),
      );

      await act(async () => {
        await result.current.ask("Q?");
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it("aborts any in-flight request when ask is called again", async () => {
      let resolveFirst!: (value: typeof mockResponse) => void;
      const firstPromise = new Promise<typeof mockResponse>((r) => {
        resolveFirst = r;
      });

      vi.spyOn(askAiModule, "askAi")
        .mockReturnValueOnce(firstPromise)
        .mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() =>
        useAskAI(client, { firmId: "f", matterId: "m" }),
      );

      act(() => {
        result.current.ask("First question");
      });

      await act(async () => {
        await result.current.ask("Second question");
      });

      resolveFirst(mockResponse);

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.data).toEqual(mockResponse);
    });
  });
});
