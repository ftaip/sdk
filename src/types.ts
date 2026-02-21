export interface AiParalegalClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface AskAiRequest {
  prompt: string;
  firm_id: string;
  matter_id: string;
  load_matter_facts?: boolean;
}

export interface SessionAskAiRequest {
  prompt: string;
  load_matter_facts?: boolean;
}

export interface AskAiReference {
  clientDocumentId: string;
  clientDocumentName: string;
  parentClientDocumentId: string | null;
  parentDocumentName: string | null;
  providerItemPath: string | null;
  matterId: string;
}

export interface AskAiResponseData {
  answer: string;
  references: AskAiReference[];
}

export interface AskAiResponse {
  data: AskAiResponseData;
}

export interface AskAiOptions {
  firmId: string;
  matterId: string;
  loadMatterFacts?: boolean;
}

export interface UseAskMatterAiReturn {
  ask: (prompt: string) => Promise<void>;
  data: AskAiResponse | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export interface TokenExchangeResponse {
  session_token: string;
  firm_id: string;
  matter_id: string;
  parameters: Record<string, unknown>;
  chat_id: string | null;
  conversation_id: string | null;
  expires_at: string;
}

export interface SessionContext {
  sessionToken: string;
  firmId: string;
  matterId: string;
  parameters: Record<string, unknown>;
  chatId: string | null;
  conversationId: string | null;
  expiresAt: string;
}

export interface UseSessionConfig {
  apiKey?: string;
  baseUrl?: string;
}

export interface UseSessionReturn {
  session: SessionContext | null;
  client: import('./client').AiParalegalClient | null;
  loading: boolean;
  error: Error | null;
}

export interface SubmitResultResponse {
  success: boolean;
  message: string;
  result?: Record<string, unknown> | string;
}

export interface UseSubmitResultReturn {
  submit: (result: Record<string, unknown> | string) => Promise<void>;
  loading: boolean;
  error: Error | null;
  submitted: boolean;
  response: SubmitResultResponse | null;
}

// ---------------------------------------------------------------------------
// LLM
// ---------------------------------------------------------------------------

export interface LlmRequestOptions {
  systemInstructions?: string;
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LlmUsage {
  prompt_tokens: number;
  completion_tokens: number;
}

export interface LlmResponseData {
  text: string;
  usage?: LlmUsage;
}

export interface LlmResponse {
  data: LlmResponseData;
}

export interface LlmStreamCallbacks {
  onChunk?: (delta: string) => void;
  onComplete?: (response: LlmResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseLlmReturn {
  generate: (
    prompt: string,
    options?: LlmRequestOptions,
    attachments?: File[],
  ) => Promise<void>;
  data: LlmResponse | null;
  text: string;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// OCR
// ---------------------------------------------------------------------------

export interface OcrExtraction {
  filename: string;
  text: string;
  mime_type: string;
}

export interface OcrResponseData {
  extractions: OcrExtraction[];
}

export interface OcrResponse {
  data: OcrResponseData;
}

export interface OcrStreamCallbacks {
  onChunk?: (filename: string, delta: string) => void;
  onFileComplete?: (extraction: OcrExtraction) => void;
  onComplete?: (response: OcrResponse) => void;
  onError?: (error: Error) => void;
}

export interface OcrExtractOptions {
  stream?: boolean;
}

export interface UseOcrReturn {
  extract: (files: File[], options?: OcrExtractOptions) => Promise<void>;
  data: OcrResponse | null;
  text: string;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

export interface UploadedFile {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
}

export interface FilesResponseData {
  files: UploadedFile[];
}

export interface FilesResponse {
  data: FilesResponseData;
}

export interface UseFilesReturn {
  upload: (files: File[]) => Promise<void>;
  data: FilesResponse | null;
  loading: boolean;
  error: Error | null;
  uploaded: boolean;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Docs (CRUD + Markdown conversion)
// ---------------------------------------------------------------------------

export interface DocMeta {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface DocDetail extends DocMeta {
  content: string | null;
}

export interface DocMarkdown {
  id: string;
  filename: string;
  markdown: string;
  mime_type: string;
}

export interface DocsListResponse {
  data: { documents: DocMeta[] };
}

export interface DocShowResponse {
  data: DocDetail;
}

export interface DocUploadResponse {
  data: { documents: DocMeta[] };
}

export interface DocUpdateResponse {
  data: DocMeta;
}

export interface DocCreateOptions {
  markdown: string;
  filename: string;
  format?: "docx" | "html" | "txt" | "md";
}

export interface DocCreateResponse {
  data: DocMeta;
}

export interface DocMarkdownResponse {
  data: DocMarkdown;
}

export interface UseDocsReturn {
  create: (options: DocCreateOptions) => Promise<void>;
  upload: (files: File[]) => Promise<void>;
  list: () => Promise<void>;
  get: (documentId: string) => Promise<void>;
  update: (documentId: string, fileOrContent: File | string) => Promise<void>;
  remove: (documentId: string) => Promise<void>;
  toMarkdown: (documentId: string) => Promise<void>;
  documents: DocMeta[];
  document: DocDetail | null;
  markdown: DocMarkdown | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// MarkItDown
// ---------------------------------------------------------------------------

export interface MarkItDownConversion {
  filename: string;
  markdown: string;
  mime_type: string;
}

export interface MarkItDownResponseData {
  conversions: MarkItDownConversion[];
}

export interface MarkItDownResponse {
  data: MarkItDownResponseData;
}

export interface UseMarkItDownReturn {
  convert: (files: File[]) => Promise<void>;
  data: MarkItDownResponse | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}
