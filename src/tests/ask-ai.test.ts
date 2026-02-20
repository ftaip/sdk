import { describe, it, expect, vi, beforeEach } from "vitest";
import { askAi, askAiWithSession } from "../ask-ai";
import { AiParalegalClient } from "../client";

const client = new AiParalegalClient({
  baseUrl: "https://example.com",
  apiKey: "sk-test",
});

const mockResponse = {
  data: {
    answer: "The stamp duty is $5,000.",
    references: [
      {
        clientDocumentId: "doc-1",
        clientDocumentName: "Contract.pdf",
        parentClientDocumentId: null,
        parentDocumentName: null,
        providerItemPath: null,
        matterId: "matter-1",
      },
    ],
  },
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

describe("askAi", () => {
  it("POSTs to /api/sdk/v1/ai/ask with API key headers", async () => {
    mockFetch(200, mockResponse);

    await askAi(client, {
      prompt: "What is stamp duty?",
      firm_id: "firm-1",
      matter_id: "matter-1",
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/sdk/v1/ai/ask",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-API-KEY": "sk-test" }),
        body: JSON.stringify({
          prompt: "What is stamp duty?",
          firm_id: "firm-1",
          matter_id: "matter-1",
        }),
      }),
    );
  });

  it("returns the parsed response on success", async () => {
    mockFetch(200, mockResponse);

    const result = await askAi(client, {
      prompt: "What is stamp duty?",
      firm_id: "firm-1",
      matter_id: "matter-1",
    });

    expect(result).toEqual(mockResponse);
  });

  it("includes load_matter_facts when provided", async () => {
    mockFetch(200, mockResponse);

    await askAi(client, {
      prompt: "Summarise",
      firm_id: "firm-1",
      matter_id: "matter-1",
      load_matter_facts: true,
    });

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.load_matter_facts).toBe(true);
  });

  it("throws with the server message on non-OK response", async () => {
    mockFetch(422, { message: "Invalid prompt" });

    await expect(
      askAi(client, { prompt: "bad", firm_id: "f", matter_id: "m" }),
    ).rejects.toThrow("Invalid prompt");
  });

  it("falls back to status text when response body has no message", async () => {
    mockFetchJsonFailure(500);

    await expect(
      askAi(client, { prompt: "bad", firm_id: "f", matter_id: "m" }),
    ).rejects.toThrow("Request failed with status 500");
  });
});

describe("askAiWithSession", () => {
  it("POSTs to /api/sdk/v1/ai/ask with Bearer auth", async () => {
    mockFetch(200, mockResponse);

    await askAiWithSession(client, "session-tok", { prompt: "Question?" });

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/sdk/v1/ai/ask",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer session-tok",
        }),
        body: JSON.stringify({ prompt: "Question?" }),
      }),
    );
  });

  it("returns the parsed response on success", async () => {
    mockFetch(200, mockResponse);

    const result = await askAiWithSession(client, "session-tok", {
      prompt: "Question?",
    });

    expect(result).toEqual(mockResponse);
  });

  it("includes load_matter_facts when provided", async () => {
    mockFetch(200, mockResponse);

    await askAiWithSession(client, "tok", {
      prompt: "Summarise",
      load_matter_facts: true,
    });

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.load_matter_facts).toBe(true);
  });

  it("throws with the server message on non-OK response", async () => {
    mockFetch(401, { message: "Unauthorised" });

    await expect(
      askAiWithSession(client, "bad-tok", { prompt: "Q" }),
    ).rejects.toThrow("Unauthorised");
  });

  it("falls back to status text when response body has no message", async () => {
    mockFetchJsonFailure(503);

    await expect(
      askAiWithSession(client, "tok", { prompt: "Q" }),
    ).rejects.toThrow("Request failed with status 503");
  });
});
