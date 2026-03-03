export { AiParalegalClient } from "./client";
export { askAi, askAiWithSession } from "./ask-ai";
export { exchangeToken } from "./exchange-token";
export { verifyToken } from "./verify-token";
export { submitResult } from "./submit-result";
export { askLlm } from "./llm";
export { streamLlm } from "./llm-stream";
export { extractText } from "./ocr";
export { streamOcr } from "./ocr-stream";
export { uploadFiles } from "./files";
export {
  createDoc,
  uploadDocs,
  listDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  docToMarkdown,
  downloadDoc,
} from "./docs";
export { convertToMarkdown } from "./markitdown";
export {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  uploadCollectionDocuments,
  listCollectionDocuments,
  getCollectionDocument,
  deleteCollectionDocument,
  reprocessCollectionDocument,
  searchCollection,
  queryCollection,
  generateCollectionTable,
  analyzeCollection,
  getSuggestedPrompts,
} from "./collections";
export {
  streamCollectionQuery,
  streamCollectionAnalysis,
} from "./collection-stream";
export { reviewContract, streamContractReview } from "./contract-review";
export {
  getStorageItem,
  putStorageItem,
  deleteStorageItem,
  listStorageItems,
} from "./storage";
export { transcribeAudio } from "./transcribe";
export { streamTranscribe } from "./transcribe-stream";
export { textToSpeech } from "./tts";
export { startDictation } from "./dictation";
export { useAskMatterAI } from "./hooks/use-ask-ai";
export { useSession } from "./hooks/use-session";
export { useSubmitResult } from "./hooks/use-submit-result";
export { useLLM } from "./hooks/use-llm";
export { useOCR } from "./hooks/use-ocr";
export { useFiles } from "./hooks/use-files";
export { useDocs } from "./hooks/use-docs";
export { useMarkItDown } from "./hooks/use-markitdown";
export { useTranscribe } from "./hooks/use-transcribe";
export { useTextToSpeech } from "./hooks/use-tts";
export { useDictation } from "./hooks/use-dictation";
export { useCollections } from "./hooks/use-collections";
export { useCollection } from "./hooks/use-collection";
export { useCollectionSearch } from "./hooks/use-collection-search";
export { useCollectionQuery } from "./hooks/use-collection-query";
export { useCollectionTable } from "./hooks/use-collection-table";
export { useCollectionAnalyze } from "./hooks/use-collection-analyze";
export { useSuggestedPrompts } from "./hooks/use-suggested-prompts";
export { useContractReview } from "./hooks/use-contract-review";
export { useStorage } from "./hooks/use-storage";
export type {
  AiParalegalClientConfig,
  AskAiOptions,
  AskAiReference,
  AskAiRequest,
  AskAiResponse,
  AskAiResponseData,
  DocCreateOptions,
  DocCreateResponse,
  DocDetail,
  DocMarkdown,
  DocMarkdownResponse,
  DocMeta,
  DocShowResponse,
  DocUpdateResponse,
  DocUploadResponse,
  DocsListResponse,
  FilesResponse,
  FilesResponseData,
  LlmRequestOptions,
  LlmResponse,
  LlmStreamCallbacks,
  MarkItDownConversion,
  MarkItDownResponse,
  MarkItDownResponseData,
  LlmResponseData,
  LlmUsage,
  OcrExtraction,
  OcrExtractOptions,
  OcrResponse,
  OcrResponseData,
  OcrStreamCallbacks,
  SessionAskAiRequest,
  SessionContext,
  SubmitResultResponse,
  TokenExchangeResponse,
  UploadedFile,
  UseAskMatterAiReturn,
  UseDocsReturn,
  UseFilesReturn,
  UseMarkItDownReturn,
  UseLlmReturn,
  UseOcrReturn,
  UseSessionConfig,
  UseSessionReturn,
  UseSubmitResultReturn,
  TranscribeMode,
  TranscribeOptions,
  TranscribeResponse,
  TranscribeResponseData,
  TranscribeStreamCallbacks,
  UseTranscribeReturn,
  TtsOptions,
  UseTtsReturn,
  DictationOptions,
  DictationCallbacks,
  DictateChunkResponse,
  UseDictationReturn,
  CollectionMeta,
  CollectionDocument,
  DocumentExtraction,
  CollectionListResponse,
  CollectionShowResponse,
  CollectionDocumentUploadResponse,
  CollectionSearchResult,
  CollectionSearchResponse,
  CollectionQueryCitation,
  CollectionQueryResponse,
  CollectionQueryStreamCallbacks,
  CollectionTableRow,
  CollectionTableResponse,
  CollectionAnalyzeResponse,
  CollectionAnalyzeStreamCallbacks,
  UseCollectionsReturn,
  UseCollectionReturn,
  UseCollectionSearchReturn,
  UseCollectionQueryReturn,
  UseCollectionTableReturn,
  UseCollectionAnalyzeReturn,
  CollectionSuggestedPrompts,
  CollectionSuggestedPromptsResponse,
  SuggestedPromptsRequest,
  UseSuggestedPromptsReturn,
  CollectionTableCell,
  ContractReviewResult,
  ContractReviewResponse,
  ContractReviewStage,
  ContractReviewStreamCallbacks,
  UseContractReviewReturn,
  StorageItem,
  StorageListResponse,
  StorageShowResponse,
  StoragePutRequest,
  StorageScope,
  UseStorageReturn,
} from "./types";
