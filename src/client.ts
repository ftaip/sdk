import type { AiParalegalClientConfig } from "./types";

export class AiParalegalClient {
  readonly baseUrl: string;
  readonly apiKey?: string;

  constructor(config: AiParalegalClientConfig) {
    if (!config.baseUrl) {
      throw new Error("AiParalegalClient: baseUrl is required");
    }

    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  /**
   * Build a full URL for the given API path.
   */
  url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /**
   * Return headers for API-key authenticated requests.
   */
  headers(): Record<string, string> {
    if (!this.apiKey) {
      throw new Error(
        "AiParalegalClient: apiKey is required for API-key authenticated requests",
      );
    }

    return {
      "X-API-KEY": this.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Return headers for session-token authenticated requests.
   */
  sessionHeaders(sessionToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${sessionToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }
}
