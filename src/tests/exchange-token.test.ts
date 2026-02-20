import { describe, it, expect, vi, beforeEach } from "vitest";
import { exchangeToken } from "../exchange-token";
import { AiParalegalClient } from "../client";

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

  it("throws with the server message on non-OK response", async () => {
    mockFetch(401, { message: "Invalid exchange token" });

    await expect(exchangeToken(client, "bad-token")).rejects.toThrow(
      "Invalid exchange token",
    );
  });

  it("falls back to status text when response body has no message", async () => {
    mockFetchJsonFailure(500);

    await expect(exchangeToken(client, "bad-token")).rejects.toThrow(
      "Token exchange failed with status 500",
    );
  });
});
