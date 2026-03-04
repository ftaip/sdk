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

export interface SessionContext<TParams = Record<string, unknown>> {
  sessionToken: string;
  firmId: string;
  matterId: string;
  parameters: TParams;
  chatId: string | null;
  conversationId: string | null;
  expiresAt: string;
}

export interface UseSessionConfig {
  apiKey?: string;
  baseUrl?: string;
  /**
   * A long-lived session token for local development.
   *
   * When provided, the hook skips the normal exchange-token flow
   * and verifies the token directly with the host to obtain
   * firm_id, matter_id, and other session context.
   *
   * Generate one from the Admin > SDK Applications > App Preview tab.
   */
  devToken?: string;
}

export interface UseSessionReturn<TParams = Record<string, unknown>> {
  session: SessionContext<TParams> | null;
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
  schema?: Record<string, unknown>;
}

export interface LlmUsage {
  prompt_tokens: number;
  completion_tokens: number;
}

export interface LlmResponseData {
  text: string;
  structured?: Record<string, unknown>;
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
  structured: Record<string, unknown> | null;
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
  download_url: string;
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
  format?: "docx" | "html" | "txt" | "md" | "xlsx";
}

export interface DocCreateResponse {
  data: DocMeta;
}

export interface DocMarkdownResponse {
  data: DocMarkdown;
}

export interface UseDocsReturn {
  create: (options: DocCreateOptions) => Promise<DocMeta | undefined>;
  createAndDownload: (options: DocCreateOptions) => Promise<DocMeta | undefined>;
  upload: (files: File[]) => Promise<void>;
  list: () => Promise<void>;
  get: (documentId: string) => Promise<void>;
  update: (documentId: string, fileOrContent: File | string) => Promise<void>;
  remove: (documentId: string) => Promise<void>;
  toMarkdown: (documentId: string) => Promise<void>;
  download: (documentId: string) => Promise<void>;
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

// ---------------------------------------------------------------------------
// Transcription (Speech-to-Text)
// ---------------------------------------------------------------------------

export type TranscribeMode = "verbatim" | "clean";

export interface TranscribeOptions {
  mode?: TranscribeMode;
  provider?: string;
  model?: string;
  language?: string;
  diarize?: boolean;
}

export interface TranscribeResponseData {
  text: string;
  mode: TranscribeMode;
  diarized: boolean;
}

export interface TranscribeResponse {
  data: TranscribeResponseData;
}

export interface TranscribeStreamCallbacks {
  onTranscribing?: (filename: string) => void;
  onTranscribed?: (text: string) => void;
  onComplete?: (response: TranscribeResponse) => void;
  onError?: (error: Error) => void;
}

export interface UseTranscribeReturn {
  transcribe: (file: File, options?: TranscribeOptions) => Promise<void>;
  data: TranscribeResponse | null;
  text: string;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Text-to-Speech (TTS)
// ---------------------------------------------------------------------------

export interface TtsOptions {
  provider?: string;
  model?: string;
  voice?: string;
  instructions?: string;
}

export interface UseTtsReturn {
  speak: (text: string, options?: TtsOptions) => Promise<void>;
  audioUrl: string | null;
  playing: boolean;
  loading: boolean;
  error: Error | null;
  stop: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Dictation (real-time microphone -> text via server)
// ---------------------------------------------------------------------------

export interface DictationOptions {
  mode?: TranscribeMode;
  provider?: string;
  model?: string;
  language?: string;
  chunkIntervalMs?: number;
}

export interface DictationCallbacks {
  onChunkSent?: () => void;
  onTranscript?: (text: string, accumulated: string) => void;
  onError?: (error: Error) => void;
}

export interface DictateChunkResponse {
  data: {
    text: string;
    mode: TranscribeMode;
    is_final: boolean;
  };
}

export interface UseDictationReturn {
  start: (options?: DictationOptions, callbacks?: DictationCallbacks) => Promise<void>;
  stop: () => void;
  transcript: string;
  isRecording: boolean;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export interface CollectionMeta {
  id: string;
  name: string;
  description: string | null;
  document_count: number;
  processed_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionDocument {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  status: "pending" | "processing" | "processed" | "failed";
  error?: string | null;
  created_at: string;
  extracted_at?: string | null;
  extraction?: DocumentExtraction | null;
}

export interface DocumentExtraction {
  parties: string[];
  effective_date: string | null;
  expiration_date: string | null;
  governing_law: string | null;
  term_months: number | null;
  monetary_amounts: Array<{
    amount: number;
    currency: string;
    context: string;
  }>;
  risk_flags: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  document_type: string | null;
  summary: string;
  key_clauses: Array<{ name: string; text: string }>;
  confidence_score: number;
}

export interface CollectionListResponse {
  data: { collections: CollectionMeta[] };
}

export interface CollectionShowResponse {
  data: CollectionMeta & { documents: CollectionDocument[] };
}

export interface CollectionDocumentUploadResponse {
  data: CollectionDocument[];
}

// ---------------------------------------------------------------------------
// Collection Search & Query
// ---------------------------------------------------------------------------

export interface CollectionSearchResult {
  document_id: string;
  filename: string;
  score: number;
  excerpt: string;
  extraction: Partial<DocumentExtraction> | null;
}

export interface CollectionSearchResponse {
  data: {
    query: string;
    total: number;
    results: CollectionSearchResult[];
  };
}

export interface CollectionQueryCitation {
  document_id: string;
  filename: string;
  excerpt: string;
}

export interface CollectionQueryResponse {
  data: {
    answer: string;
    citations: CollectionQueryCitation[];
    documents_searched: number;
    documents_cited: number;
  };
}

export interface CollectionQueryStreamCallbacks {
  onChunk?: (delta: string) => void;
  onStage?: (stage: string, message: string) => void;
  onComplete?: (response: CollectionQueryResponse) => void;
  onError?: (error: Error) => void;
}

// ---------------------------------------------------------------------------
// Collection Table
// ---------------------------------------------------------------------------

export interface CollectionTableCell {
  value: string;
  confidence: number;
  is_missing: boolean;
}

export interface CollectionTableRow {
  document_id: string;
  filename: string;
  cells: Record<string, CollectionTableCell>;
}

export interface CollectionTableResponse {
  data: {
    columns: string[];
    rows: CollectionTableRow[];
    csv: string;
    markdown: string;
    generated_at: string;
    document_count: number;
  };
}

// ---------------------------------------------------------------------------
// Collection Analyze
// ---------------------------------------------------------------------------

export interface CollectionAnalyzeResponse {
  data: {
    analysis: string;
    statistics: Record<string, unknown>;
  };
}

export interface CollectionAnalyzeStreamCallbacks {
  onChunk?: (delta: string) => void;
  onStage?: (stage: string, message: string) => void;
  onComplete?: (response: CollectionAnalyzeResponse) => void;
  onError?: (error: Error) => void;
}

// ---------------------------------------------------------------------------
// Collection Hook Returns
// ---------------------------------------------------------------------------

export interface UseCollectionsReturn {
  collections: CollectionMeta[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (name: string, description?: string) => Promise<CollectionMeta | undefined>;
  remove: (collectionId: string) => Promise<void>;
  updateOne: (id: string, patch: Partial<CollectionMeta>) => void;
}

export interface UseCollectionReturn {
  collection: (CollectionMeta & { documents: CollectionDocument[] }) | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  uploadDocuments: (files: File[]) => Promise<CollectionDocument[] | undefined>;
  removeDocument: (documentId: string) => Promise<void>;
  reprocessDocument: (documentId: string) => Promise<void>;
}

export interface UseCollectionSearchReturn {
  search: (query: string, filters?: Record<string, string>) => Promise<void>;
  results: CollectionSearchResult[];
  total: number;
  loading: boolean;
  error: Error | null;
}

export interface UseCollectionQueryReturn {
  query: (
    prompt: string,
    opts?: { maxDocuments?: number; stream?: boolean; instructions?: string },
  ) => Promise<void>;
  answer: string;
  citations: CollectionQueryCitation[];
  loading: boolean;
  streaming: boolean;
  error: Error | null;
  reset: () => void;
}

export interface UseCollectionTableReturn {
  generate: (
    prompt: string,
    opts?: {
      format?: "json" | "csv" | "markdown";
      documentIds?: string[];
      instructions?: string;
    },
  ) => Promise<void>;
  table: CollectionTableResponse["data"] | null;
  loading: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// Contract Review
// ---------------------------------------------------------------------------

export interface ContractReviewResult {
  summary: {
    document_type: string;
    governing_law: string;
    term: string;
    effective_date: string | null;
    expiration_date: string | null;
  };
  parties: Array<{ name: string; role: string }>;
  key_dates: Array<{ date: string; description: string }>;
  obligations: Array<{
    party: string;
    obligation: string;
    clause_ref: string;
  }>;
  risk_flags: Array<{
    severity: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    clause_ref: string;
  }>;
  missing_clauses: Array<{
    clause_name: string;
    importance: "required" | "recommended" | "optional";
    description: string;
  }>;
  deviations: Array<{
    clause: string;
    standard_position: string;
    actual_position: string;
    risk: "low" | "medium" | "high";
  }>;
  overall_risk_rating: "low" | "medium" | "high" | "critical";
  recommended_actions: Array<{
    action: string;
    priority: "immediate" | "before_signing" | "post_execution";
  }>;
  filename: string;
  contract_type: string;
  reviewed_at: string;
}

export interface ContractReviewResponse {
  data: ContractReviewResult;
}

export type ContractReviewStage =
  | "idle"
  | "extracting"
  | "reviewing"
  | "complete"
  | "error";

export interface ContractReviewStreamCallbacks {
  onStage?: (stage: ContractReviewStage, message: string) => void;
  onComplete?: (result: ContractReviewResult) => void;
  onError?: (error: Error) => void;
}

export interface UseContractReviewReturn {
  review: (
    file: File,
    opts?: {
      contractType?: string;
      ourPartyName?: string;
      jurisdiction?: string;
      playbook?: string;
      instructions?: string;
      stream?: boolean;
    },
  ) => Promise<void>;
  stage: ContractReviewStage;
  result: ContractReviewResult | null;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Collection Suggested Prompts
// ---------------------------------------------------------------------------

export type CollectionSuggestedPrompts = Record<string, string[]>;

export interface SuggestedPromptsRequest {
  instructions: string;
  categories: string[];
  prompts_per_category?: number;
}

export interface CollectionSuggestedPromptsResponse {
  data: CollectionSuggestedPrompts;
}

export interface UseSuggestedPromptsReturn {
  prompts: CollectionSuggestedPrompts | null;
  loading: boolean;
  error: Error | null;
}

export interface UseCollectionAnalyzeReturn {
  analyze: (
    prompt: string,
    opts?: { stream?: boolean; instructions?: string },
  ) => Promise<void>;
  analysis: string;
  statistics: Record<string, unknown> | null;
  loading: boolean;
  streaming: boolean;
  error: Error | null;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export interface TemplatePlaceholder {
  name: string;
  original: string;
  type: "bracket" | "curly" | "double_curly" | "angle" | "underscore" | "bookmark" | "form_field" | "llm_detected";
  occurrences: number;
}

export interface TemplateExtractPlaceholdersResponse {
  data: {
    placeholders: TemplatePlaceholder[];
    filename: string;
    content: string;
  };
}

export interface TemplateMergeResponse {
  data: DocMeta;
}

export interface TemplateSuggestion {
  placeholder: string;
  value: string;
  confidence: "high" | "medium" | "low";
  sources: string[];
}

export interface TemplateSuggestValuesResponse {
  data: {
    suggestions: TemplateSuggestion[];
  };
}

export interface UseTemplateReturn {
  extractPlaceholders: (file: File) => Promise<TemplateExtractPlaceholdersResponse | undefined>;
  merge: (file: File, values: Record<string, string>, originals?: Record<string, string>) => Promise<DocMeta | undefined>;
  suggestValues: (placeholders: string[], context: string) => Promise<TemplateSuggestion[] | undefined>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export interface StorageItem {
  key: string;
  namespace: string;
  value: unknown;
  updated_at: string;
}

export interface StorageListResponse {
  data: StorageItem[];
}

export interface StorageShowResponse {
  data: StorageItem;
}

export interface StoragePutRequest {
  key: string;
  value: unknown;
  namespace?: string;
  matter_id?: string;
}

export interface StorageScope {
  matterId?: string | null;
  namespace?: string;
}

export interface UseStorageReturn {
  get: (key: string, scope?: StorageScope) => Promise<unknown | null>;
  put: (key: string, value: unknown, scope?: StorageScope) => Promise<void>;
  remove: (key: string, scope?: StorageScope) => Promise<void>;
  list: (scope?: StorageScope) => Promise<StorageItem[]>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

export type HookState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
