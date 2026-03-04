export interface SdkApiErrorBody {
  error_code: string;
  message: string;
  details?: Record<string, string[]> | null;
}

/**
 * Structured error thrown when an SDK API request fails.
 *
 * Extends `Error` so existing `catch (err)` patterns continue to work.
 * The `code` property gives machine-readable error classification for
 * programmatic handling (e.g. retry on `rate_limit_exceeded`).
 */
export class ApiError extends Error {
  readonly name = "ApiError";

  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[]> | null,
  ) {
    super(message);
  }

  /**
   * Type-guard to distinguish ApiError from generic Error in catch blocks.
   */
  static is(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}

/**
 * Parse an error response body and throw an ApiError.
 *
 * Shared by all SDK API functions to ensure consistent error handling.
 */
export async function throwApiError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const body = await response.json().catch(() => ({}));
  const parsed = body as Partial<SdkApiErrorBody>;

  throw new ApiError(
    parsed.error_code ?? "unknown",
    parsed.message ?? `${fallbackMessage} (${response.status})`,
    response.status,
    parsed.details,
  );
}
