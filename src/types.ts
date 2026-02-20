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

export interface UseAskAiReturn {
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
