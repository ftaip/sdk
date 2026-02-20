import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitResult } from "../submit-result";
import { AiParalegalClient } from "../client";

const client = new AiParalegalClient({ baseUrl: "https://example.com" });

const mockApiResponse = {
  success: true,
  message: "Result submitted",
  result: { stamp_duty: 5000 },
};

function mockFetch(status: number, body: unknown): void {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValueOnce(body),
  });
}

function mockFetchJsonFailure(status: number): void {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: false,
    status,
    json: vi.fn().mockRejectedValueOnce(new Error("not json")),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();

  // Reset window.parent to the same window (no iframe) by default
  Object.defineProperty(window, "parent", {
    writable: true,
    value: window,
  });
});

describe("submitResult", () => {
  it("POSTs to /api/sdk/v1/result with session Bearer auth", async () => {
    mockFetch(200, mockApiResponse);

    await submitResult(client, "sess-tok", { stamp_duty: 5000 });

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/sdk/v1/result",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sess-tok",
        }),
        body: JSON.stringify({ result: { stamp_duty: 5000 } }),
      }),
    );
  });

  it("accepts a string result", async () => {
    mockFetch(200, { ...mockApiResponse, result: "done" });

    await submitResult(client, "sess-tok", "done");

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.result).toBe("done");
  });

  it("returns the parsed API response", async () => {
    mockFetch(200, mockApiResponse);

    const result = await submitResult(client, "sess-tok", { stamp_duty: 5000 });

    expect(result).toEqual(mockApiResponse);
  });

  it("postMessages to window.parent when inside an iframe", async () => {
    const postMessage = vi.fn();
    Object.defineProperty(window, "parent", {
      writable: true,
      value: { postMessage },
    });

    mockFetch(200, mockApiResponse);

    await submitResult(client, "sess-tok", { stamp_duty: 5000 });

    expect(postMessage).toHaveBeenCalledWith(
      { type: "sdk_app_result", result: mockApiResponse.result },
      "*",
    );
  });

  it("postMessages the original result when API response has no result field", async () => {
    const postMessage = vi.fn();
    Object.defineProperty(window, "parent", {
      writable: true,
      value: { postMessage },
    });

    const responseWithoutResult = { success: true, message: "OK" };
    mockFetch(200, responseWithoutResult);

    const payload = { stamp_duty: 5000 };
    await submitResult(client, "sess-tok", payload);

    expect(postMessage).toHaveBeenCalledWith(
      { type: "sdk_app_result", result: payload },
      "*",
    );
  });

  it("does not postMessage when window.parent === window", async () => {
    const postMessage = vi.fn();
    window.postMessage = postMessage;

    mockFetch(200, mockApiResponse);

    await submitResult(client, "sess-tok", { stamp_duty: 5000 });

    expect(postMessage).not.toHaveBeenCalled();
  });

  it("throws with the server message on non-OK response", async () => {
    mockFetch(403, { message: "Forbidden" });

    await expect(
      submitResult(client, "bad-tok", { stamp_duty: 5000 }),
    ).rejects.toThrow("Forbidden");
  });

  it("falls back to status text when response body has no message", async () => {
    mockFetchJsonFailure(500);

    await expect(
      submitResult(client, "tok", { stamp_duty: 5000 }),
    ).rejects.toThrow("Failed to submit result (500)");
  });
});
