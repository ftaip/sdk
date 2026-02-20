import type { AiParalegalClientConfig } from "./types";

function isValidBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export class AiParalegalClient {
  readonly baseUrl: string;
  #apiKey?: string;

  constructor(config: AiParalegalClientConfig) {
    if (!config.baseUrl) {
      throw new Error("AiParalegalClient: baseUrl is required");
    }

    if (!isValidBaseUrl(config.baseUrl)) {
      throw new Error(
        "AiParalegalClient: baseUrl must be a valid HTTP or HTTPS URL",
      );
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.#apiKey = config.apiKey;
  }

  url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  headers(): Record<string, string> {
    if (!this.#apiKey) {
      throw new Error(
        "AiParalegalClient: apiKey is required for API-key authenticated requests",
      );
    }

    return {
      "X-API-KEY": this.#apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  sessionHeaders(sessionToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }
}
