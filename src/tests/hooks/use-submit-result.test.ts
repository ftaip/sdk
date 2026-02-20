import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSubmitResult } from "../../hooks/use-submit-result";
import * as submitResultModule from "../../submit-result";
import { AiParalegalClient } from "../../client";
import type { SessionContext } from "../../types";

const client = new AiParalegalClient({ baseUrl: "https://example.com" });

const session: SessionContext = {
  sessionToken: "sess-tok",
  firmId: "firm-1",
  matterId: "matter-1",
  parameters: {},
  chatId: null,
  conversationId: null,
  expiresAt: "2026-12-31T00:00:00Z",
};

const mockApiResponse = {
  success: true,
  message: "Result submitted",
  result: { stamp_duty: 5000 },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useSubmitResult", () => {
  describe("initial state", () => {
    it("starts with false loading, null error, false submitted, null response", () => {
      const { result } = renderHook(() => useSubmitResult(client, session));

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.submitted).toBe(false);
      expect(result.current.response).toBeNull();
    });
  });

  describe("submit()", () => {
    it("calls submitResult with client, session token, and result", async () => {
      const spy = vi
        .spyOn(submitResultModule, "submitResult")
        .mockResolvedValueOnce(mockApiResponse);

      const { result } = renderHook(() => useSubmitResult(client, session));

      await act(async () => {
        await result.current.submit({ stamp_duty: 5000 });
      });

      expect(spy).toHaveBeenCalledWith(client, "sess-tok", { stamp_duty: 5000 });
    });

    it("accepts a string result", async () => {
      const spy = vi
        .spyOn(submitResultModule, "submitResult")
        .mockResolvedValueOnce({ ...mockApiResponse, result: "done" });

      const { result } = renderHook(() => useSubmitResult(client, session));

      await act(async () => {
        await result.current.submit("done");
      });

      expect(spy).toHaveBeenCalledWith(client, "sess-tok", "done");
    });

    it("sets submitted and response on success", async () => {
      vi.spyOn(submitResultModule, "submitResult").mockResolvedValueOnce(
        mockApiResponse,
      );

      const { result } = renderHook(() => useSubmitResult(client, session));

      await act(async () => {
        await result.current.submit({ stamp_duty: 5000 });
      });

      expect(result.current.submitted).toBe(true);
      expect(result.current.response).toEqual(mockApiResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets error on failure", async () => {
      vi.spyOn(submitResultModule, "submitResult").mockRejectedValueOnce(
        new Error("Forbidden"),
      );

      const { result } = renderHook(() => useSubmitResult(client, session));

      await act(async () => {
        await result.current.submit({ stamp_duty: 5000 });
      });

      expect(result.current.error?.message).toBe("Forbidden");
      expect(result.current.submitted).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it("wraps non-Error thrown values in an Error", async () => {
      vi.spyOn(submitResultModule, "submitResult").mockRejectedValueOnce(
        "something went wrong",
      );

      const { result } = renderHook(() => useSubmitResult(client, session));

      await act(async () => {
        await result.current.submit({ value: 1 });
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe("Failed to submit result");
    });

    it("sets error when client is null", async () => {
      const { result } = renderHook(() => useSubmitResult(null, session));

      await act(async () => {
        await result.current.submit({ value: 1 });
      });

      expect(result.current.error?.message).toBe(
        "Client or session not available",
      );
      expect(result.current.loading).toBe(false);
    });

    it("sets error when session is null", async () => {
      const { result } = renderHook(() => useSubmitResult(client, null));

      await act(async () => {
        await result.current.submit({ value: 1 });
      });

      expect(result.current.error?.message).toBe(
        "Client or session not available",
      );
    });

    it("sets error when both client and session are null", async () => {
      const { result } = renderHook(() => useSubmitResult(null, null));

      await act(async () => {
        await result.current.submit({ value: 1 });
      });

      expect(result.current.error?.message).toBe(
        "Client or session not available",
      );
    });
  });
});
