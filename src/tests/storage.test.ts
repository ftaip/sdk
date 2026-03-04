import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getStorageItem,
  putStorageItem,
  deleteStorageItem,
  listStorageItems,
} from "../storage";
import { AiParalegalClient } from "../client";
import { ApiError } from "../errors";

const client = new AiParalegalClient({ baseUrl: "https://example.com" });
const sessionToken = "sess-tok";

const storageItem = {
  key: "theme",
  namespace: "default",
  value: { mode: "dark" },
  updated_at: "2026-03-01T00:00:00Z",
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

describe("getStorageItem", () => {
  it("GETs /api/sdk/v1/storage/:key with session Bearer auth", async () => {
    mockFetch(200, { data: storageItem });

    const result = await getStorageItem(client, sessionToken, "theme");

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/sdk/v1/storage/theme",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer sess-tok",
        }),
      }),
    );
    expect(result).toEqual(storageItem);
  });

  it("returns null when the key is not found (404)", async () => {
    mockFetch(404, { message: "Not found" });

    const result = await getStorageItem(client, sessionToken, "missing");

    expect(result).toBeNull();
  });

  it("appends scope query params when provided", async () => {
    mockFetch(200, { data: storageItem });

    await getStorageItem(client, sessionToken, "theme", {
      matterId: "m-1",
      namespace: "settings",
    });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("matter_id=m-1");
    expect(url).toContain("namespace=settings");
  });

  it("throws with server message on non-OK response", async () => {
    mockFetch(500, { message: "Internal error" });

    await expect(
      getStorageItem(client, sessionToken, "theme"),
    ).rejects.toThrow("Internal error");
  });

  it("falls back to unknown code when response body is unparseable", async () => {
    mockFetchJsonFailure(500);

    try {
      await getStorageItem(client, sessionToken, "theme");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(ApiError.is(err)).toBe(true);
      const apiErr = err as ApiError;
      expect(apiErr.code).toBe("unknown");
      expect(apiErr.status).toBe(500);
    }
  });

  it("encodes special characters in the key", async () => {
    mockFetch(200, { data: storageItem });

    await getStorageItem(client, sessionToken, "my key/value");

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("my%20key%2Fvalue");
  });
});

describe("putStorageItem", () => {
  it("PUTs to /api/sdk/v1/storage with the correct body", async () => {
    mockFetch(200, { data: storageItem });

    const result = await putStorageItem(
      client,
      sessionToken,
      "theme",
      { mode: "dark" },
    );

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/sdk/v1/storage",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer sess-tok",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          key: "theme",
          value: { mode: "dark" },
          namespace: undefined,
          matter_id: undefined,
        }),
      }),
    );
    expect(result).toEqual(storageItem);
  });

  it("includes scope fields in the request body", async () => {
    mockFetch(200, { data: storageItem });

    await putStorageItem(client, sessionToken, "theme", "dark", {
      matterId: "m-1",
      namespace: "prefs",
    });

    const body = JSON.parse(
      (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body.matter_id).toBe("m-1");
    expect(body.namespace).toBe("prefs");
  });

  it("throws with server message on non-OK response", async () => {
    mockFetch(422, { message: "Validation failed" });

    await expect(
      putStorageItem(client, sessionToken, "theme", "dark"),
    ).rejects.toThrow("Validation failed");
  });
});

describe("deleteStorageItem", () => {
  it("DELETEs /api/sdk/v1/storage/:key", async () => {
    mockFetch(204, {});

    await deleteStorageItem(client, sessionToken, "theme");

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/sdk/v1/storage/theme",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({
          Authorization: "Bearer sess-tok",
        }),
      }),
    );
  });

  it("succeeds silently when the key is not found (404)", async () => {
    mockFetch(404, { message: "Not found" });

    await expect(
      deleteStorageItem(client, sessionToken, "missing"),
    ).resolves.toBeUndefined();
  });

  it("appends scope query params when provided", async () => {
    mockFetch(204, {});

    await deleteStorageItem(client, sessionToken, "theme", {
      namespace: "settings",
    });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("namespace=settings");
  });

  it("throws with server message on non-OK response", async () => {
    mockFetch(500, { message: "Server error" });

    await expect(
      deleteStorageItem(client, sessionToken, "theme"),
    ).rejects.toThrow("Server error");
  });
});

describe("listStorageItems", () => {
  it("GETs /api/sdk/v1/storage and returns the data array", async () => {
    mockFetch(200, { data: [storageItem] });

    const result = await listStorageItems(client, sessionToken);

    expect(fetch).toHaveBeenCalledWith(
      "https://example.com/api/sdk/v1/storage",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer sess-tok",
        }),
      }),
    );
    expect(result).toEqual([storageItem]);
  });

  it("appends scope query params when provided", async () => {
    mockFetch(200, { data: [] });

    await listStorageItems(client, sessionToken, {
      matterId: "m-1",
      namespace: "prefs",
    });

    const url = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("matter_id=m-1");
    expect(url).toContain("namespace=prefs");
  });

  it("throws with server message on non-OK response", async () => {
    mockFetch(403, { message: "Forbidden" });

    await expect(listStorageItems(client, sessionToken)).rejects.toThrow(
      "Forbidden",
    );
  });
});
