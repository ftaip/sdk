import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStorage } from "../../hooks/use-storage";
import * as storageModule from "../../storage";
import { AiParalegalClient } from "../../client";
import type { SessionContext, StorageItem } from "../../types";

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

const storageItem: StorageItem = {
  key: "theme",
  namespace: "default",
  value: { mode: "dark" },
  updated_at: "2026-03-01T00:00:00Z",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useStorage", () => {
  describe("initial state", () => {
    it("starts with false loading and null error", () => {
      const { result } = renderHook(() => useStorage(client, session));

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("get()", () => {
    it("calls getStorageItem and returns the value", async () => {
      vi.spyOn(storageModule, "getStorageItem").mockResolvedValueOnce(
        storageItem,
      );

      const { result } = renderHook(() => useStorage(client, session));

      let value: unknown;
      await act(async () => {
        value = await result.current.get("theme");
      });

      expect(storageModule.getStorageItem).toHaveBeenCalledWith(
        client,
        "sess-tok",
        "theme",
        undefined,
      );
      expect(value).toEqual({ mode: "dark" });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("returns null when the item is not found", async () => {
      vi.spyOn(storageModule, "getStorageItem").mockResolvedValueOnce(null);

      const { result } = renderHook(() => useStorage(client, session));

      let value: unknown;
      await act(async () => {
        value = await result.current.get("missing");
      });

      expect(value).toBeNull();
    });

    it("passes scope through to the plain function", async () => {
      vi.spyOn(storageModule, "getStorageItem").mockResolvedValueOnce(
        storageItem,
      );

      const { result } = renderHook(() => useStorage(client, session));

      await act(async () => {
        await result.current.get("theme", { matterId: "m-1" });
      });

      expect(storageModule.getStorageItem).toHaveBeenCalledWith(
        client,
        "sess-tok",
        "theme",
        { matterId: "m-1" },
      );
    });

    it("sets error on failure", async () => {
      vi.spyOn(storageModule, "getStorageItem").mockRejectedValueOnce(
        new Error("Server error"),
      );

      const { result } = renderHook(() => useStorage(client, session));

      await act(async () => {
        await result.current.get("theme");
      });

      expect(result.current.error?.message).toBe("Server error");
      expect(result.current.loading).toBe(false);
    });

    it("sets error when client is null", async () => {
      const { result } = renderHook(() => useStorage(null, session));

      await act(async () => {
        await result.current.get("theme");
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });

    it("sets error when session is null", async () => {
      const { result } = renderHook(() => useStorage(client, null));

      await act(async () => {
        await result.current.get("theme");
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });
  });

  describe("put()", () => {
    it("calls putStorageItem with the correct arguments", async () => {
      vi.spyOn(storageModule, "putStorageItem").mockResolvedValueOnce(
        storageItem,
      );

      const { result } = renderHook(() => useStorage(client, session));

      await act(async () => {
        await result.current.put("theme", { mode: "dark" });
      });

      expect(storageModule.putStorageItem).toHaveBeenCalledWith(
        client,
        "sess-tok",
        "theme",
        { mode: "dark" },
        undefined,
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("passes scope through to the plain function", async () => {
      vi.spyOn(storageModule, "putStorageItem").mockResolvedValueOnce(
        storageItem,
      );

      const { result } = renderHook(() => useStorage(client, session));

      await act(async () => {
        await result.current.put("theme", "dark", { namespace: "prefs" });
      });

      expect(storageModule.putStorageItem).toHaveBeenCalledWith(
        client,
        "sess-tok",
        "theme",
        "dark",
        { namespace: "prefs" },
      );
    });

    it("sets error on failure", async () => {
      vi.spyOn(storageModule, "putStorageItem").mockRejectedValueOnce(
        new Error("Validation failed"),
      );

      const { result } = renderHook(() => useStorage(client, session));

      await act(async () => {
        await result.current.put("theme", "dark");
      });

      expect(result.current.error?.message).toBe("Validation failed");
    });

    it("sets error when client is null", async () => {
      const { result } = renderHook(() => useStorage(null, session));

      await act(async () => {
        await result.current.put("theme", "dark");
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });
  });

  describe("remove()", () => {
    it("calls deleteStorageItem with the correct arguments", async () => {
      vi.spyOn(storageModule, "deleteStorageItem").mockResolvedValueOnce(
        undefined,
      );

      const { result } = renderHook(() => useStorage(client, session));

      await act(async () => {
        await result.current.remove("theme");
      });

      expect(storageModule.deleteStorageItem).toHaveBeenCalledWith(
        client,
        "sess-tok",
        "theme",
        undefined,
      );
    });

    it("sets error on failure", async () => {
      vi.spyOn(storageModule, "deleteStorageItem").mockRejectedValueOnce(
        new Error("Server error"),
      );

      const { result } = renderHook(() => useStorage(client, session));

      await act(async () => {
        await result.current.remove("theme");
      });

      expect(result.current.error?.message).toBe("Server error");
    });

    it("sets error when session is null", async () => {
      const { result } = renderHook(() => useStorage(client, null));

      await act(async () => {
        await result.current.remove("theme");
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });
  });

  describe("list()", () => {
    it("calls listStorageItems and returns the items", async () => {
      vi.spyOn(storageModule, "listStorageItems").mockResolvedValueOnce([
        storageItem,
      ]);

      const { result } = renderHook(() => useStorage(client, session));

      let items: unknown;
      await act(async () => {
        items = await result.current.list();
      });

      expect(storageModule.listStorageItems).toHaveBeenCalledWith(
        client,
        "sess-tok",
        undefined,
      );
      expect(items).toEqual([storageItem]);
    });

    it("returns empty array on failure", async () => {
      vi.spyOn(storageModule, "listStorageItems").mockRejectedValueOnce(
        new Error("Forbidden"),
      );

      const { result } = renderHook(() => useStorage(client, session));

      let items: unknown;
      await act(async () => {
        items = await result.current.list();
      });

      expect(items).toEqual([]);
      expect(result.current.error?.message).toBe("Forbidden");
    });

    it("returns empty array when session is null", async () => {
      const { result } = renderHook(() => useStorage(client, null));

      let items: unknown;
      await act(async () => {
        items = await result.current.list();
      });

      expect(items).toEqual([]);
    });
  });

  describe("reset()", () => {
    it("clears loading and error state", async () => {
      vi.spyOn(storageModule, "getStorageItem").mockRejectedValueOnce(
        new Error("Failed"),
      );

      const { result } = renderHook(() => useStorage(client, session));

      await act(async () => {
        await result.current.get("theme");
      });

      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
