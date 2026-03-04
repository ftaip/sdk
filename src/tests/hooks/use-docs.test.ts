import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDocs } from "../../hooks/use-docs";
import * as docsModule from "../../docs";
import { AiParalegalClient } from "../../client";
import type {
  DocMeta,
  DocDetail,
  DocMarkdown,
  SessionContext,
} from "../../types";

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

const mockDocMeta: DocMeta = {
  id: "doc-1",
  filename: "letter.docx",
  mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  size: 2048,
  download_url: "https://example.com/docs/doc-1/download",
  created_at: "2026-03-01T00:00:00Z",
  updated_at: "2026-03-01T00:00:00Z",
};

const mockDocDetail: DocDetail = {
  ...mockDocMeta,
  content: "Document content here",
};

const mockDocMarkdown: DocMarkdown = {
  id: "doc-1",
  filename: "letter.docx",
  markdown: "# Hello World",
  mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useDocs", () => {
  describe("initial state", () => {
    it("starts with empty documents, null document, null markdown, false loading, null error", () => {
      const { result } = renderHook(() => useDocs(client, session));

      expect(result.current.documents).toEqual([]);
      expect(result.current.document).toBeNull();
      expect(result.current.markdown).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("create()", () => {
    it("calls createDoc and adds document to documents on success", async () => {
      const spy = vi
        .spyOn(docsModule, "createDoc")
        .mockResolvedValueOnce({ data: mockDocMeta });

      const { result } = renderHook(() => useDocs(client, session));

      let meta: DocMeta | undefined;
      await act(async () => {
        meta = await result.current.create({
          markdown: "# Hello",
          filename: "letter",
          format: "docx",
        });
      });

      expect(spy).toHaveBeenCalledWith(
        client,
        "sess-tok",
        expect.objectContaining({
          markdown: "# Hello",
          filename: "letter",
          format: "docx",
        }),
      );
      expect(meta).toEqual(mockDocMeta);
      expect(result.current.documents).toContainEqual(mockDocMeta);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets error on failure", async () => {
      vi.spyOn(docsModule, "createDoc").mockRejectedValueOnce(
        new Error("Create failed"),
      );

      const { result } = renderHook(() => useDocs(client, session));

      await act(async () => {
        await result.current.create({
          markdown: "# Hello",
          filename: "letter",
        });
      });

      expect(result.current.error?.message).toBe("Create failed");
      expect(result.current.loading).toBe(false);
    });
  });

  describe("list()", () => {
    it("calls listDocs and sets documents on success", async () => {
      vi.spyOn(docsModule, "listDocs").mockResolvedValueOnce({
        data: { documents: [mockDocMeta] },
      });

      const { result } = renderHook(() => useDocs(client, session));

      await act(async () => {
        await result.current.list();
      });

      expect(docsModule.listDocs).toHaveBeenCalledWith(client, "sess-tok");
      expect(result.current.documents).toEqual([mockDocMeta]);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("get()", () => {
    it("calls getDoc and sets document on success", async () => {
      vi.spyOn(docsModule, "getDoc").mockResolvedValueOnce({
        data: mockDocDetail,
      });

      const { result } = renderHook(() => useDocs(client, session));

      await act(async () => {
        await result.current.get("doc-1");
      });

      expect(docsModule.getDoc).toHaveBeenCalledWith(
        client,
        "sess-tok",
        "doc-1",
      );
      expect(result.current.document).toEqual(mockDocDetail);
      expect(result.current.loading).toBe(false);
    });

    it("sets error on failure", async () => {
      vi.spyOn(docsModule, "getDoc").mockRejectedValueOnce(
        new Error("Document not found"),
      );

      const { result } = renderHook(() => useDocs(client, session));

      await act(async () => {
        await result.current.get("missing");
      });

      expect(result.current.error?.message).toBe("Document not found");
    });
  });

  describe("toMarkdown()", () => {
    it("calls docToMarkdown and sets markdown on success", async () => {
      vi.spyOn(docsModule, "docToMarkdown").mockResolvedValueOnce({
        data: mockDocMarkdown,
      });

      const { result } = renderHook(() => useDocs(client, session));

      await act(async () => {
        await result.current.toMarkdown("doc-1");
      });

      expect(docsModule.docToMarkdown).toHaveBeenCalledWith(
        client,
        "sess-tok",
        "doc-1",
      );
      expect(result.current.markdown).toEqual(mockDocMarkdown);
      expect(result.current.loading).toBe(false);
    });
  });

  describe("client/session validation", () => {
    it("throws when create is called with null client", async () => {
      const { result } = renderHook(() => useDocs(null, session));

      await expect(
        act(async () => {
          await result.current.create({
            markdown: "# Hello",
            filename: "letter",
          });
        }),
      ).rejects.toThrow("Client and session are required");
    });

    it("throws when list is called with null session", async () => {
      const { result } = renderHook(() => useDocs(client, null));

      await expect(
        act(async () => {
          await result.current.list();
        }),
      ).rejects.toThrow("Client and session are required");
    });
  });

  describe("reset()", () => {
    it("clears documents, document, markdown, loading, and error", async () => {
      vi.spyOn(docsModule, "listDocs").mockResolvedValueOnce({
        data: { documents: [mockDocMeta] },
      });

      const { result } = renderHook(() => useDocs(client, session));

      await act(async () => {
        await result.current.list();
      });

      expect(result.current.documents).toHaveLength(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.documents).toEqual([]);
      expect(result.current.document).toBeNull();
      expect(result.current.markdown).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
