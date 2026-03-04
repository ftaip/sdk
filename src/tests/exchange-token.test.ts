import { describe, it, expect, vi, beforeEach } from "vitest";
import { exchangeToken } from "../exchange-token";
import { AiParalegalClient } from "../client";
import { ApiError } from "../errors";

const client = new AiParalegalClient({
  baseUrl: "https://example.com",
  apiKey: "sk-test",
});

const mockTokenResponse = {
  session_token: "sess-abc",
  firm_id: "firm-1",
  matter_id: "matter-1",
  parameters: { foo: "bar" },
  chat_id: "chat-1",
  conversation_id: "conv-1",
  expires_at: "2026-12-31T00:00:00Z",
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
});

describe("exchangeToken", () => {
  it("POSTs the exchange token to /api/sdk/v1/token/exchange", async () => {
    mockFetch(200, mockTokenResponse);

    await exchangeToken(client, "exchange-xyz");

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/sdk/v1/token/exchange",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-API-KEY": "sk-test" }),
        body: JSON.stringify({ exchange_token: "exchange-xyz" }),
      }),
    );
  });

  it("returns the parsed token response on success", async () => {
    mockFetch(200, mockTokenResponse);

    const result = await exchangeToken(client, "exchange-xyz");

    expect(result).toEqual(mockTokenResponse);
  });

  it("throws an ApiError with error_code on non-OK response", async () => {
    mockFetch(401, {
      error_code: "token_invalid",
      message: "Invalid exchange token",
    });

    try {
      await exchangeToken(client, "bad-token");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(ApiError.is(err)).toBe(true);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe("token_invalid");
      expect(apiErr.message).toBe("Invalid exchange token");
      expect(apiErr.status).toBe(401);
    }
  });

  it("falls back to unknown code when response body is unparseable", async () => {
    mockFetchJsonFailure(500);

    try {
      await exchangeToken(client, "bad-token");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(ApiError.is(err)).toBe(true);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe("unknown");
      expect(apiErr.message).toBe("Token exchange failed (500)");
      expect(apiErr.status).toBe(500);
    }
  });
});
