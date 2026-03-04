import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOCR } from "../../hooks/use-ocr";
import * as ocrModule from "../../ocr";
import { AiParalegalClient } from "../../client";
import type { OcrResponse, SessionContext } from "../../types";

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

const mockOcrResponse: OcrResponse = {
  data: {
    extractions: [
      {
        filename: "doc.pdf",
        text: "Extracted text from PDF",
        mime_type: "application/pdf",
      },
      {
        filename: "image.png",
        text: "Extracted text from image",
        mime_type: "image/png",
      },
    ],
  },
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("useOCR", () => {
  describe("initial state", () => {
    it("starts with null data, empty text, false loading, null error", () => {
      const { result } = renderHook(() => useOCR(client, session));

      expect(result.current.data).toBeNull();
      expect(result.current.text).toBe("");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("extract()", () => {
    it("calls extractText with correct arguments", async () => {
      const spy = vi
        .spyOn(ocrModule, "extractText")
        .mockResolvedValueOnce(mockOcrResponse);

      const { result } = renderHook(() => useOCR(client, session));
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });

      await act(async () => {
        await result.current.extract([file]);
      });

      expect(spy).toHaveBeenCalledWith(client, "sess-tok", [file]);
    });

    it("sets data and combined text on success", async () => {
      vi.spyOn(ocrModule, "extractText").mockResolvedValueOnce(mockOcrResponse);

      const { result } = renderHook(() => useOCR(client, session));
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });

      await act(async () => {
        await result.current.extract([file]);
      });

      expect(result.current.data).toEqual(mockOcrResponse);
      expect(result.current.text).toBe(
        "Extracted text from PDF\n\nExtracted text from image",
      );
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets error on failure", async () => {
      vi.spyOn(ocrModule, "extractText").mockRejectedValueOnce(
        new Error("OCR extraction failed"),
      );

      const { result } = renderHook(() => useOCR(client, session));
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });

      await act(async () => {
        await result.current.extract([file]);
      });

      expect(result.current.error?.message).toBe("OCR extraction failed");
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
    });

    it("silently ignores AbortError", async () => {
      const abortError = new DOMException("Aborted", "AbortError");
      vi.spyOn(ocrModule, "extractText").mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useOCR(client, session));
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });

      await act(async () => {
        await result.current.extract([file]);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toBeNull();
    });

    it("sets error when client is null", async () => {
      const { result } = renderHook(() => useOCR(null, session));
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });

      await act(async () => {
        await result.current.extract([file]);
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });

    it("sets error when session is null", async () => {
      const { result } = renderHook(() => useOCR(client, null));
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });

      await act(async () => {
        await result.current.extract([file]);
      });

      expect(result.current.error?.message).toBe(
        "Client and session are required",
      );
    });
  });

  describe("reset()", () => {
    it("clears data, text, loading, and error", async () => {
      vi.spyOn(ocrModule, "extractText").mockResolvedValueOnce(mockOcrResponse);

      const { result } = renderHook(() => useOCR(client, session));
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });

      await act(async () => {
        await result.current.extract([file]);
      });

      expect(result.current.data).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.data).toBeNull();
      expect(result.current.text).toBe("");
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
