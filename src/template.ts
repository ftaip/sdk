import type { AiParalegalClient } from "./client";
import type {
  TemplateExtractPlaceholdersResponse,
  TemplateMergeResponse,
  TemplateSuggestValuesResponse,
} from "./types";

async function throwOnError(
  response: Response,
  action: string,
): Promise<void> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ??
        `${action} failed with status ${response.status}`,
    );
  }
}

/**
 * Extract placeholders from a template file.
 *
 * Detects [Bracket Placeholders] in any text-based file, plus DOCX bookmark
 * and form field placeholders for .docx files. Also returns the extracted
 * text content of the template.
 */
export async function extractPlaceholders(
  client: AiParalegalClient,
  sessionToken: string,
  file: File,
): Promise<TemplateExtractPlaceholdersResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    client.url("/api/sdk/v1/template/extract-placeholders"),
    {
      method: "POST",
      headers: client.multipartSessionHeaders(sessionToken),
      body: formData,
    },
  );

  await throwOnError(response, "Extract placeholders");
  return response.json() as Promise<TemplateExtractPlaceholdersResponse>;
}

/**
 * Merge placeholder values into a template file, preserving formatting.
 *
 * For DOCX files, performs XML-level replacement to preserve fonts, styles,
 * headers, footers, and images. For text/markdown files, performs string
 * replacement. Returns a stored document that can be downloaded.
 *
 * Pass `originals` (placeholder name → exact text as it appears in the template)
 * to handle non-deterministic placeholders detected by LLM analysis. This is
 * optional — deterministic delimited placeholders are matched automatically.
 */
export async function mergeTemplate(
  client: AiParalegalClient,
  sessionToken: string,
  file: File,
  values: Record<string, string>,
  originals?: Record<string, string>,
): Promise<TemplateMergeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  for (const [key, value] of Object.entries(values)) {
    formData.append(`values[${key}]`, value);
  }

  if (originals) {
    for (const [key, original] of Object.entries(originals)) {
      formData.append(`originals[${key}]`, original);
    }
  }

  const response = await fetch(
    client.url("/api/sdk/v1/template/merge"),
    {
      method: "POST",
      headers: client.multipartSessionHeaders(sessionToken),
      body: formData,
    },
  );

  await throwOnError(response, "Merge template");
  return response.json() as Promise<TemplateMergeResponse>;
}

/**
 * Suggest values for template placeholders based on context.
 *
 * Uses AI to analyze the provided context (extracted text, matter details,
 * etc.) and propose the best value for each placeholder with a confidence
 * score and source references.
 */
export async function suggestPlaceholderValues(
  client: AiParalegalClient,
  sessionToken: string,
  placeholders: string[],
  context: string,
): Promise<TemplateSuggestValuesResponse> {
  const response = await fetch(
    client.url("/api/sdk/v1/template/suggest-values"),
    {
      method: "POST",
      headers: client.sessionHeaders(sessionToken),
      body: JSON.stringify({ placeholders, context }),
    },
  );

  await throwOnError(response, "Suggest placeholder values");
  return response.json() as Promise<TemplateSuggestValuesResponse>;
}
