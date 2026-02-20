import { describe, it, expect } from "vitest";
import { AiParalegalClient } from "../client";

describe("AiParalegalClient", () => {
  describe("constructor", () => {
    it("throws when baseUrl is missing", () => {
      expect(() => new AiParalegalClient({ baseUrl: "" })).toThrow(
        "AiParalegalClient: baseUrl is required",
      );
    });

    it("stores the baseUrl stripping trailing slashes", () => {
      const client = new AiParalegalClient({ baseUrl: "https://example.com//" });
      expect(client.baseUrl).toBe("https://example.com");
    });

    it("stores baseUrl without trailing slash unchanged", () => {
      const client = new AiParalegalClient({ baseUrl: "https://example.com" });
      expect(client.baseUrl).toBe("https://example.com");
    });

    it("does not expose apiKey as a public property", () => {
      const client = new AiParalegalClient({
        baseUrl: "https://example.com",
        apiKey: "sk-test",
      });
      expect((client as Record<string, unknown>).apiKey).toBeUndefined();
    });

    it("rejects an invalid baseUrl", () => {
      expect(
        () => new AiParalegalClient({ baseUrl: "not-a-url" }),
      ).toThrow("AiParalegalClient: baseUrl must be a valid HTTP or HTTPS URL");
    });

    it("rejects a non-HTTP protocol", () => {
      expect(
        () => new AiParalegalClient({ baseUrl: "ftp://example.com" }),
      ).toThrow("AiParalegalClient: baseUrl must be a valid HTTP or HTTPS URL");
    });

    it("accepts an http baseUrl", () => {
      const client = new AiParalegalClient({ baseUrl: "http://localhost:8000" });
      expect(client.baseUrl).toBe("http://localhost:8000");
    });
  });

  describe("url()", () => {
    it("appends a path to the baseUrl", () => {
      const client = new AiParalegalClient({ baseUrl: "https://example.com" });
      expect(client.url("/api/sdk/v1/ai/ask")).toBe(
        "https://example.com/api/sdk/v1/ai/ask",
      );
    });

    it("handles empty path", () => {
      const client = new AiParalegalClient({ baseUrl: "https://example.com" });
      expect(client.url("")).toBe("https://example.com");
    });
  });

  describe("headers()", () => {
    it("throws when apiKey is not set", () => {
      const client = new AiParalegalClient({ baseUrl: "https://example.com" });
      expect(() => client.headers()).toThrow(
        "AiParalegalClient: apiKey is required for API-key authenticated requests",
      );
    });

    it("returns correct headers with apiKey set", () => {
      const client = new AiParalegalClient({
        baseUrl: "https://example.com",
        apiKey: "sk-test",
      });
      expect(client.headers()).toEqual({
        "X-API-KEY": "sk-test",
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });
  });

  describe("sessionHeaders()", () => {
    it("returns Bearer auth headers", () => {
      const client = new AiParalegalClient({ baseUrl: "https://example.com" });
      expect(client.sessionHeaders("my-token")).toEqual({
        Authorization: "Bearer my-token",
        "Content-Type": "application/json",
        Accept: "application/json",
      });
    });

    it("works without an apiKey configured", () => {
      const client = new AiParalegalClient({ baseUrl: "https://example.com" });
      const headers = client.sessionHeaders("tok");
      expect(headers["Authorization"]).toBe("Bearer tok");
    });
  });
});
