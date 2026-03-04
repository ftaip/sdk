import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHealth } from "../../hooks/use-health";
import * as healthModule from "../../health";
import { AiParalegalClient } from "../../client";
import type { HealthCheckResponse } from "../../health";

const client = new AiParalegalClient({
  baseUrl: "https://example.com",
  apiKey: "sk-test",
});

const mockHealthResponse: HealthCheckResponse = {
  status: "ok",
  app: {
    id: "ai-paralegal",
    name: "AI Paralegal",
    active: true,
  },
  capabilities: {
    llm: "gpt-4",
    ocr: "tesseract",
  },
  server_time: "2026-03-04T12:00:00Z",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useHealth", () => {
  describe("initial state", () => {
    it("starts with null health, false loading, null error", () => {
      const { result } = renderHook(() => useHealth(client));

      expect(result.current.health).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("check()", () => {
    it("calls checkHealth with client only when no session token", async () => {
      const spy = vi
        .spyOn(healthModule, "checkHealth")
        .mockResolvedValueOnce(mockHealthResponse);

      const { result } = renderHook(() => useHealth(client));

      await act(async () => {
        await result.current.check();
      });

      expect(spy).toHaveBeenCalledWith(client, undefined);
    });

    it("calls checkHealth with client and session token when provided", async () => {
      const spy = vi
        .spyOn(healthModule, "checkHealth")
        .mockResolvedValueOnce(mockHealthResponse);

      const { result } = renderHook(() =>
        useHealth(client, "sess-token-123"),
      );

      await act(async () => {
        await result.current.check();
      });

      expect(spy).toHaveBeenCalledWith(client, "sess-token-123");
    });

    it("sets health on success", async () => {
      vi.spyOn(healthModule, "checkHealth").mockResolvedValueOnce(
        mockHealthResponse,
      );

      const { result } = renderHook(() => useHealth(client));

      await act(async () => {
        await result.current.check();
      });

      expect(result.current.health).toEqual(mockHealthResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets error on failure", async () => {
      vi.spyOn(healthModule, "checkHealth").mockRejectedValueOnce(
        new Error("Health check failed"),
      );

      const { result } = renderHook(() => useHealth(client));

      await act(async () => {
        await result.current.check();
      });

      expect(result.current.error?.message).toBe("Health check failed");
      expect(result.current.health).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("sets error when client is null", async () => {
      const { result } = renderHook(() => useHealth(null));

      await act(async () => {
        await result.current.check();
      });

      expect(result.current.error?.message).toBe("Client not initialised");
      expect(result.current.loading).toBe(false);
    });
  });
});
