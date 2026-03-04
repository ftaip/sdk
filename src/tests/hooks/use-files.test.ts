import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFiles } from "../../hooks/use-files";
import * as filesModule from "../../files";
import { AiParalegalClient } from "../../client";
import type { FilesResponse, SessionContext } from "../../types";

const client = new AiParalegalClient({
  baseUrl: "https://example.com",
  apiKey: "sk-test",
});

const session: SessionContext = {
  sessionToken: "sess-tok",
  firmId: "firm-1",
  matterId: "matter-1",
  parameters: {},
  chatId: null,
  conversationId: null,
  expiresAt: "2026-12-31T00:00:00Z",
};

const mockFilesResponse: FilesResponse = {
  data: {
    files: [
      {
        id: "file-1",
        filename: "document.pdf",
        mime_type: "application/pdf",
        size: 1024,
      },
    ],
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useFiles", () => {
  describe("initial state", () => {
    it("starts with null data, false loading, null error, false uploaded", () => {
      const { result } = renderHook(() => useFiles(client, session));

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.uploaded).toBe(false);
    });
  });

  describe("upload()", () => {
    it("calls uploadFiles with correct arguments", async () => {
      const spy = vi
        .spyOn(filesModule, "uploadFiles")
        .mockResolvedValueOnce(mockFilesResponse);

      const { result } = renderHook(() => useFiles(client, session));
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await act(async () => {
        await result.current.upload([file]);
      });

      expect(spy).toHaveBeenCalledWith(client, "sess-tok", [file]);
    });

    it("sets data and uploaded on success", async () => {
      vi.spyOn(filesModule, "uploadFiles").mockResolvedValueOnce(
        mockFilesResponse,
      );

      const { result } = renderHook(() => useFiles(client, session));
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await act(async () => {
        await result.current.upload([file]);
      });

      expect(result.current.data).toEqual(mockFilesResponse);
      expect(result.current.uploaded).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets error on failure", async () => {
      vi.spyOn(filesModule, "uploadFiles").mockRejectedValueOnce(
        new Error("Upload failed"),
      );

      const { result } = renderHook(() => useFiles(client, session));
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await act(async () => {
        await result.current.upload([file]);
      });

      expect(result.current.error?.message).toBe("Upload failed");
      expect(result.current.uploaded).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
    });

    it("sets error when client is null", async () => {
      const { result } = renderHook(() => useFiles(null, session));
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await act(async () => {
        await result.current.upload([file]);
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });

    it("sets error when session is null", async () => {
      const { result } = renderHook(() => useFiles(client, null));
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await act(async () => {
        await result.current.upload([file]);
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });
  });

  describe("reset()", () => {
    it("clears data, loading, error, and uploaded", async () => {
      vi.spyOn(filesModule, "uploadFiles").mockResolvedValueOnce(
        mockFilesResponse,
      );

      const { result } = renderHook(() => useFiles(client, session));
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });

      await act(async () => {
        await result.current.upload([file]);
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.uploaded).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.uploaded).toBe(false);
    });
  });
});
