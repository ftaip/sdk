export { AiParalegalClient } from "./client";
export { askAi, askAiWithSession } from "./ask-ai";
export { exchangeToken } from "./exchange-token";
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
} from "./docs";
export { convertToMarkdown } from "./markitdown";
export { useAskMatterAI } from "./hooks/use-ask-ai";
export { useSession } from "./hooks/use-session";
export { useSubmitResult } from "./hooks/use-submit-result";
export { useLLM } from "./hooks/use-llm";
export { useOCR } from "./hooks/use-ocr";
export { useFiles } from "./hooks/use-files";
export { useDocs } from "./hooks/use-docs";
export { useMarkItDown } from "./hooks/use-markitdown";
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
} from "./types";
