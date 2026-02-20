import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSession } from "../../hooks/use-session";
import * as exchangeTokenModule from "../../exchange-token";

const mockTokenResponse = {
  session_token: "sess-abc",
  firm_id: "firm-1",
  matter_id: "matter-1",
  parameters: { foo: "bar" },
  chat_id: "chat-1",
  conversation_id: "conv-1",
  expires_at: "2026-12-31T00:00:00Z",
};

function setSearchParams(params: Record<string, string>): void {
  const search = new URLSearchParams(params).toString();
  Object.defineProperty(window, "location", {
    writable: true,
    value: { search: search ? `?${search}` : "" },
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
  setSearchParams({});
});

describe("useSession", () => {
  it("returns null client and session when no baseUrl is available", () => {
    const { result } = renderHook(() => useSession({}));

    expect(result.current.client).toBeNull();
    expect(result.current.session).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("builds client from config.baseUrl override", async () => {
    setSearchParams({ token: "tok-1" });
    vi.spyOn(exchangeTokenModule, "exchangeToken").mockResolvedValueOnce(
      mockTokenResponse,
    );

    const { result } = renderHook(() =>
      useSession({ baseUrl: "https://override.com", apiKey: "sk-key" }),
    );

    expect(result.current.client?.baseUrl).toBe("https://override.com");

    await waitFor(() => expect(result.current.session).not.toBeNull());
  });

  it("builds client from URL params when no config is given", async () => {
    setSearchParams({
      baseUrl: "https://host.com",
      apiKey: "sk-url-key",
      token: "tok-1",
    });
    vi.spyOn(exchangeTokenModule, "exchangeToken").mockResolvedValueOnce(
      mockTokenResponse,
    );

    const { result } = renderHook(() => useSession({}));

    expect(result.current.client?.baseUrl).toBe("https://host.com");

    await waitFor(() => expect(result.current.session).not.toBeNull());
  });

  it("does not exchange token when no token param is present", async () => {
    setSearchParams({ baseUrl: "https://host.com", apiKey: "sk-key" });
    const spy = vi.spyOn(exchangeTokenModule, "exchangeToken");

    renderHook(() => useSession({}));

    await new Promise((r) => setTimeout(r, 50));
    expect(spy).not.toHaveBeenCalled();
  });

  it("exchanges token and populates session on success", async () => {
    setSearchParams({
      baseUrl: "https://host.com",
      apiKey: "sk-key",
      token: "exchange-tok",
    });
    vi.spyOn(exchangeTokenModule, "exchangeToken").mockResolvedValueOnce(
      mockTokenResponse,
    );

    const { result } = renderHook(() => useSession({}));

    await waitFor(() => expect(result.current.session).not.toBeNull());

    expect(result.current.session).toEqual({
      sessionToken: "sess-abc",
      firmId: "firm-1",
      matterId: "matter-1",
      parameters: { foo: "bar" },
      chatId: "chat-1",
      conversationId: "conv-1",
      expiresAt: "2026-12-31T00:00:00Z",
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles null chat_id and conversation_id", async () => {
    setSearchParams({
      baseUrl: "https://host.com",
      apiKey: "sk-key",
      token: "tok",
    });
    vi.spyOn(exchangeTokenModule, "exchangeToken").mockResolvedValueOnce({
      ...mockTokenResponse,
      chat_id: null,
      conversation_id: null,
    });

    const { result } = renderHook(() => useSession({}));

    await waitFor(() => expect(result.current.session).not.toBeNull());

    expect(result.current.session?.chatId).toBeNull();
    expect(result.current.session?.conversationId).toBeNull();
  });

  it("handles missing parameters by defaulting to empty object", async () => {
    setSearchParams({
      baseUrl: "https://host.com",
      apiKey: "sk-key",
      token: "tok",
    });
    const responseWithoutParams = {
      ...mockTokenResponse,
      parameters: undefined as unknown as Record<string, unknown>,
    };
    vi.spyOn(exchangeTokenModule, "exchangeToken").mockResolvedValueOnce(
      responseWithoutParams,
    );

    const { result } = renderHook(() => useSession({}));

    await waitFor(() => expect(result.current.session).not.toBeNull());

    expect(result.current.session?.parameters).toEqual({});
  });

  it("sets error and clears loading on exchange failure", async () => {
    setSearchParams({
      baseUrl: "https://host.com",
      apiKey: "sk-key",
      token: "bad-tok",
    });
    vi.spyOn(exchangeTokenModule, "exchangeToken").mockRejectedValueOnce(
      new Error("Invalid exchange token"),
    );

    const { result } = renderHook(() => useSession({}));

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe("Invalid exchange token");
    expect(result.current.loading).toBe(false);
    expect(result.current.session).toBeNull();
  });

  it("wraps non-Error thrown values in an Error", async () => {
    setSearchParams({
      baseUrl: "https://host.com",
      apiKey: "sk-key",
      token: "bad-tok",
    });
    vi.spyOn(exchangeTokenModule, "exchangeToken").mockRejectedValueOnce(
      "string error",
    );

    const { result } = renderHook(() => useSession({}));

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("string error");
  });

  it("only exchanges the token once even if re-rendered", async () => {
    setSearchParams({
      baseUrl: "https://host.com",
      apiKey: "sk-key",
      token: "tok",
    });
    const spy = vi
      .spyOn(exchangeTokenModule, "exchangeToken")
      .mockResolvedValue(mockTokenResponse);

    const { rerender } = renderHook(() => useSession({}));
    rerender();
    rerender();

    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
  });
});
