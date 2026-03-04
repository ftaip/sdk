import type { LlmResponse } from "./types";

// ---------------------------------------------------------------------------
// File downloads
// ---------------------------------------------------------------------------

/**
 * Trigger a browser download from a Blob or string content.
 */
export function downloadBlob(
  content: Blob | string,
  filename: string,
  mimeType = "application/octet-stream",
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Download a string as a text file.
 */
export function downloadText(
  content: string,
  filename: string,
  mimeType = "text/plain;charset=utf-8",
): void {
  downloadBlob(content, filename, mimeType);
}

// ---------------------------------------------------------------------------
// File / Data URL conversions
// ---------------------------------------------------------------------------

/**
 * Convert a File to a data URL (base64).
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a data URL back to a File object.
 */
export async function dataUrlToFile(
  dataUrl: string,
  filename: string,
  mimeType?: string,
): Promise<File> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const type = mimeType ?? (blob.type || "application/octet-stream");
  return new File([blob], filename, { type });
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Format byte count as human-readable file size.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format a date string or Date for display.
 */
export function formatDate(
  date: string | Date,
  locale = "en-AU",
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(
    locale,
    options ?? { day: "2-digit", month: "short", year: "numeric" },
  );
}

/**
 * Format a date in long form (e.g. "04 March 2025") suitable for document headers.
 */
export function formatDateLong(date?: Date, locale = "en-AU"): string {
  return (date ?? new Date()).toLocaleDateString(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a number as currency.
 */
export function formatCurrency(
  amount: number,
  currency = "AUD",
  locale = "en-AU",
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

/**
 * Count words in a string.
 */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Sanitize a string for use as a filename.
 */
export function sanitizeFilename(name: string, maxLength = 100): string {
  return name
    .replace(/[^a-zA-Z0-9_\-. ]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLength);
}

/**
 * Escape HTML entities.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Title-case each word in a string.
 */
export function capitalizeWords(text: string): string {
  return text.replace(
    /\b\w+/g,
    (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  );
}

// ---------------------------------------------------------------------------
// Clipboard
// ---------------------------------------------------------------------------

/**
 * Copy content to the clipboard, optionally as rich HTML + plain text
 * so it preserves formatting when pasted into Word.
 */
export async function copyToClipboard(
  content: string,
  options?: { asHtml?: boolean },
): Promise<void> {
  if (options?.asHtml && typeof ClipboardItem !== "undefined") {
    const html = content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");

    const htmlBlob = new Blob([html], { type: "text/html" });
    const textBlob = new Blob([content], { type: "text/plain" });

    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": htmlBlob,
        "text/plain": textBlob,
      }),
    ]);
  } else {
    await navigator.clipboard.writeText(content);
  }
}

// ---------------------------------------------------------------------------
// LLM response parsing
// ---------------------------------------------------------------------------

/**
 * Strip markdown code fences (` ```json ` / ` ``` `) from LLM text output.
 */
export function stripJsonMarkdown(text: string): string {
  return text.replace(/```(?:json)?\s*\n?/g, "").trim();
}

/**
 * Parse a structured response from an LLM, handling the common cases:
 * 1. `response.data.structured` is already parsed
 * 2. `response.data.text` contains JSON (possibly wrapped in markdown fences)
 *
 * Returns null if parsing fails.
 */
export function parseLlmResponse<T = Record<string, unknown>>(
  response: LlmResponse | null | undefined,
): T | null {
  if (!response) return null;

  const { structured, text } = response.data;

  if (structured && typeof structured === "object") {
    return structured as T;
  }

  if (text) {
    try {
      return JSON.parse(stripJsonMarkdown(text)) as T;
    } catch {
      return null;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

/**
 * Build a CSV string from typed rows.
 */
export function toCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: Array<{ key: keyof T; header: string }>,
  headerRows?: string[],
): string {
  const escapeCell = (val: unknown): string => {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const lines: string[] = [];

  if (headerRows) {
    for (const row of headerRows) {
      lines.push(row);
    }
  }

  lines.push(columns.map((c) => escapeCell(c.header)).join(","));

  for (const row of rows) {
    lines.push(columns.map((c) => escapeCell(row[c.key])).join(","));
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// File validation
// ---------------------------------------------------------------------------

/** Common document extensions supported by the platform. */
export const SUPPORTED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".rtf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tiff",
  ".tif",
  ".msg",
  ".eml",
  ".html",
] as const;

/** Common document MIME types supported by the platform. */
export const SUPPORTED_DOCUMENT_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "text/plain",
  "application/rtf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "application/vnd.ms-outlook",
  "message/rfc822",
  "text/html",
]);

export interface FileValidationOptions {
  maxBytes?: number;
  acceptedExtensions?: readonly string[];
  acceptedMimes?: Set<string>;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Get the lowercase file extension including the dot.
 */
export function getFileExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx >= 0 ? filename.slice(idx).toLowerCase() : "";
}

/**
 * Check if a file is an image (for OCR routing).
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Check if a filename has a supported document extension.
 */
export function isSupportedDocument(filename: string): boolean {
  const ext = getFileExtension(filename);
  return (SUPPORTED_DOCUMENT_EXTENSIONS as readonly string[]).includes(ext);
}

/**
 * Validate a file against size and type constraints.
 */
export function validateFile(
  file: File,
  options?: FileValidationOptions,
): FileValidationResult {
  const maxBytes = options?.maxBytes ?? 20 * 1024 * 1024;
  const extensions =
    options?.acceptedExtensions ?? SUPPORTED_DOCUMENT_EXTENSIONS;
  const mimes = options?.acceptedMimes ?? SUPPORTED_DOCUMENT_MIMES;

  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds maximum size of ${formatFileSize(maxBytes)}.`,
    };
  }

  const ext = getFileExtension(file.name);
  const extOk = (extensions as readonly string[]).includes(ext);
  const mimeOk = mimes.has(file.type);

  if (!extOk && !mimeOk) {
    return {
      valid: false,
      error: `File type "${ext || file.type}" is not supported.`,
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files, returning valid files and any errors.
 */
export function validateFiles(
  files: File[],
  options?: FileValidationOptions & { maxFiles?: number },
): { valid: File[]; errors: string[] } {
  const errors: string[] = [];
  const valid: File[] = [];

  if (options?.maxFiles && files.length > options.maxFiles) {
    errors.push(`Maximum ${options.maxFiles} files allowed.`);
    return { valid: [], errors };
  }

  for (const file of files) {
    const result = validateFile(file, options);
    if (result.valid) {
      valid.push(file);
    } else {
      errors.push(result.error!);
    }
  }

  return { valid, errors };
}
