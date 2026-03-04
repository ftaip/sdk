import { useCallback, useState } from "react";
import {
  extractPlaceholders,
  mergeTemplate,
  suggestPlaceholderValues,
} from "../template";
import type { AiParalegalClient } from "../client";
import type {
  DocMeta,
  SessionContext,
  TemplateExtractPlaceholdersResponse,
  TemplateSuggestion,
  UseTemplateReturn,
} from "../types";

/**
 * React hook for template operations: placeholder extraction, merging, and
 * AI-powered value suggestion.
 *
 * @example
 * ```tsx
 * const { extractPlaceholders, merge, suggestValues, loading } = useTemplate(client, session);
 *
 * // Extract placeholders from a DOCX template
 * const result = await extractPlaceholders(file);
 * console.log(result.data.placeholders);
 *
 * // Suggest values based on context
 * const suggestions = await suggestValues(
 *   ['Client Name', 'Matter Number'],
 *   'The client John Smith, matter FAM-2024-001...'
 * );
 *
 * // Merge values into the template
 * const doc = await merge(file, { 'Client Name': 'John Smith' });
 * ```
 */
export function useTemplate(
  client: AiParalegalClient | null,
  session: SessionContext | null,
): UseTemplateReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  const extractPlaceholdersAction = useCallback(
    async (
      file: File,
    ): Promise<TemplateExtractPlaceholdersResponse | undefined> => {
      const c = client;
      const s = session;
      if (!c || !s) return undefined;

      setLoading(true);
      setError(null);

      try {
        const result = await extractPlaceholders(c, s.sessionToken, file);
        return result;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const mergeAction = useCallback(
    async (
      file: File,
      values: Record<string, string>,
      originals?: Record<string, string>,
    ): Promise<DocMeta | undefined> => {
      const c = client;
      const s = session;
      if (!c || !s) return undefined;

      setLoading(true);
      setError(null);

      try {
        const result = await mergeTemplate(c, s.sessionToken, file, values, originals);
        return result.data;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  const suggestValuesAction = useCallback(
    async (
      placeholders: string[],
      context: string,
    ): Promise<TemplateSuggestion[] | undefined> => {
      const c = client;
      const s = session;
      if (!c || !s) return undefined;

      setLoading(true);
      setError(null);

      try {
        const result = await suggestPlaceholderValues(
          c,
          s.sessionToken,
          placeholders,
          context,
        );
        return result.data.suggestions;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [client, session],
  );

  return {
    extractPlaceholders: extractPlaceholdersAction,
    merge: mergeAction,
    suggestValues: suggestValuesAction,
    loading,
    error,
    reset,
  };
}
