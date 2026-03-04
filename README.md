# @ftaip/sdk

React SDK for AI Paralegal — lets third-party apps embed inside the AI Paralegal host as an iframe tool.

[![npm version](https://img.shields.io/npm/v/@ftaip/sdk.svg)](https://www.npmjs.com/package/@ftaip/sdk)
[![license](https://img.shields.io/npm/l/@ftaip/sdk.svg)](https://github.com/ftaip/sdk/blob/main/LICENSE)

## Installation

```bash
npm install @ftaip/sdk
```

## Quick Start

When your app is loaded inside the AI Paralegal admin, the host injects `token`, `baseUrl`, and `apiKey` as URL query parameters. The `SessionGate` component handles everything:

```tsx
import { SessionGate, useSubmitResult, useAskMatterAI } from "@ftaip/sdk";

function App() {
  return (
    <SessionGate>
      {(session, client) => <ToolPanel session={session} client={client} />}
    </SessionGate>
  );
}
```

Or use `useSession` directly for more control:

```tsx
import { useSession } from "@ftaip/sdk";

function App() {
  const { session, client, loading, error } = useSession({});

  if (loading) return <p>Authenticating...</p>;
  if (error) return <p>Authentication failed: {error.message}</p>;
  if (!session || !client) return <p>No exchange token provided.</p>;

  return <ToolPanel session={session} client={client} />;
}
```

## Authentication Modes

### 1. Token Exchange (recommended for iframe apps)

The host loads your app in an iframe with `?token=<exchange_token>&baseUrl=<host_origin>&apiKey=<sdk_api_key>`. The `useSession` hook handles everything:

```tsx
import { useSession, useAskMatterAI } from "@ftaip/sdk";
import type { AiParalegalClient, SessionContext } from "@ftaip/sdk";

function App() {
  const { session, client, loading, error } = useSession({});

  if (loading) return <p>Authenticating...</p>;
  if (error) return <p>Authentication failed: {error.message}</p>;
  if (!session || !client) return <p>No exchange token provided.</p>;

  return <AskPanel session={session} client={client} />;
}

function AskPanel({
  session,
  client,
}: {
  session: SessionContext;
  client: AiParalegalClient;
}) {
  const { ask, data, loading, error } = useAskMatterAI(client, session);

  return (
    <div>
      <button onClick={() => ask("Summarise this matter")} disabled={loading}>
        {loading ? "Asking..." : "Ask AI"}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

For local development you can override the URL params:

```tsx
const { session, client } = useSession({
  apiKey: "your-api-key",
  baseUrl: "http://localhost:8000",
});
```

### 2. API Key + Explicit IDs (server-side / direct)

For server-side usage or when you manage firm/matter context yourself:

```tsx
import { AiParalegalClient, useAskMatterAI } from "@ftaip/sdk";

const client = new AiParalegalClient({
  baseUrl: "https://your-aiparalegal-instance.com",
  apiKey: process.env.AI_PARALEGAL_API_KEY!,
});

function AskAI() {
  const { ask, data, loading, error, reset } = useAskMatterAI(client, {
    firmId: "firm-uuid",
    matterId: "matter-uuid",
    loadMatterFacts: true,
  });

  return (
    <div>
      <button
        onClick={() => ask("What is the status of this matter?")}
        disabled={loading}
      >
        {loading ? "Asking..." : "Ask AI"}
      </button>
      {error && <p>Error: {error.message}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## Submitting Results

Use `useSubmitResult` to send tool results back to the AI agent:

```tsx
import { useSubmitResult } from "@ftaip/sdk";

function ResultPanel({ client, session }) {
  const { submit, loading, submitted, error } = useSubmitResult(client, session);

  const handleSubmit = () => {
    submit({ stamp_duty: 5000, jurisdiction: "NSW" });
  };

  if (submitted) return <p>Result submitted successfully.</p>;

  return (
    <button onClick={handleSubmit} disabled={loading}>
      {loading ? "Submitting..." : "Submit Result"}
    </button>
  );
}
```

## Available Hooks

### Core

| Hook | Description | Key methods |
|------|-------------|-------------|
| `useSession` | Token exchange and session lifecycle | `session`, `client` |
| `useAskMatterAI` | Ask the AI about the current matter | `ask(prompt)` |
| `useSubmitResult` | Submit tool results back to the agent | `submit(result)` |
| `useLLM` | LLM text generation with streaming and structured output | `generate(prompt, opts)` |

### Documents & Files

| Hook | Description | Key methods |
|------|-------------|-------------|
| `useDocs` | Document CRUD, markdown-to-doc, download | `create`, `createAndDownload`, `list`, `get`, `update`, `delete` |
| `useOCR` | Extract text from images and PDFs | `extract(file, opts)` |
| `useFiles` | Upload files to the host | `upload(files)` |
| `useMarkItDown` | Convert documents to markdown | `convert(file)` |
| `useTemplate` | Template placeholder extraction, merge, value suggestion | `extractPlaceholders`, `merge`, `suggestValues` |

### Audio & Speech

| Hook | Description | Key methods |
|------|-------------|-------------|
| `useTranscribe` | Audio transcription with streaming | `transcribe(file, opts)` |
| `useTextToSpeech` | Text-to-speech audio generation | `speak(text, opts)` |
| `useDictation` | Real-time dictation | `start()`, `stop()` |

### Document Collections

| Hook | Description | Key methods |
|------|-------------|-------------|
| `useCollections` | Document collection management | `create`, `list`, `remove` |
| `useCollection` | Single collection operations | `get`, `uploadDocuments`, `search` |
| `useCollectionSearch` | Semantic search within a collection | `search(query)` |
| `useCollectionQuery` | AI-powered collection Q&A with streaming | `query(prompt)` |
| `useCollectionTable` | Generate structured tables from collections | `generate(columns)` |
| `useCollectionAnalyze` | AI analysis of collection documents | `analyze(prompt)` |
| `useSuggestedPrompts` | Get AI-suggested prompts for a collection | `fetch(collectionId)` |

### Review & Storage

| Hook | Description | Key methods |
|------|-------------|-------------|
| `useContractReview` | Contract review with staged streaming | `review(docId, opts)` |
| `useStorage` | Persist key-value data via host storage | `get`, `put`, `remove`, `list` |

### Developer Experience

| Hook / Component | Description | Key methods |
|------|-------------|-------------|
| `SessionGate` | Component that handles session loading/error/no-session states | `children(session, client)` |
| `useLlmEffect` | React to LLM completion with callbacks | `onSuccess(text, structured)` |
| `useLoadingMessages` | Rotating status messages during long operations | Returns current message string |
| `useEditableList` | Generic editable list state (add/update/remove) | `items`, `addItem`, `updateItem`, `removeItem` |
| `useHistory` | In-memory prompt/result history | `history`, `pushCurrent`, `lastPrompt` |

## Utility Functions

All utilities are imported directly from `@ftaip/sdk`:

```tsx
import { downloadBlob, formatFileSize, parseLlmResponse } from "@ftaip/sdk";
```

### File Operations

| Function | Description |
|----------|-------------|
| `downloadBlob(content, filename, mimeType?)` | Trigger browser download from Blob or string |
| `downloadText(content, filename, mimeType?)` | Download string as text file |
| `fileToDataUrl(file)` | Convert File to base64 data URL |
| `dataUrlToFile(dataUrl, filename, mimeType?)` | Convert data URL back to File |

### Formatting

| Function | Description |
|----------|-------------|
| `formatFileSize(bytes)` | `1.2 MB`, `340 KB`, etc. |
| `formatDate(date, locale?, options?)` | Locale-aware date formatting |
| `formatDateLong(date?, locale?)` | `04 March 2025` for document headers |
| `formatCurrency(amount, currency?, locale?)` | `$1,234.56` (defaults to AUD) |
| `wordCount(text)` | Count words in a string |
| `sanitizeFilename(name, maxLength?)` | Filesystem-safe filename |
| `escapeHtml(text)` | Escape HTML entities |
| `capitalizeWords(text)` | Title Case each word |

### LLM Response Parsing

| Function | Description |
|----------|-------------|
| `parseLlmResponse<T>(response)` | Extract structured data from LLM responses (handles `structured`, text JSON, markdown fences) |
| `stripJsonMarkdown(text)` | Remove ` ```json ` / ` ``` ` fences from LLM text |

### Clipboard & Export

| Function | Description |
|----------|-------------|
| `copyToClipboard(content, { asHtml? })` | Copy with optional rich HTML (preserves formatting in Word) |
| `toCsv(rows, columns, headerRows?)` | Build CSV string from typed data |

### File Validation

| Function / Constant | Description |
|----------|-------------|
| `validateFile(file, options?)` | Validate file size and type |
| `validateFiles(files, options?)` | Validate multiple files, returns `{ valid, errors }` |
| `isImageFile(file)` | Check if file is an image |
| `isSupportedDocument(filename)` | Check against platform-supported extensions |
| `getFileExtension(filename)` | Get lowercase extension with dot |
| `SUPPORTED_DOCUMENT_EXTENSIONS` | All supported extensions |
| `SUPPORTED_DOCUMENT_MIMES` | All supported MIME types |

## Standalone Functions

### Token Exchange

```typescript
import { AiParalegalClient, exchangeToken } from "@ftaip/sdk";

const client = new AiParalegalClient({
  baseUrl: "https://your-aiparalegal-instance.com",
  apiKey: process.env.AI_PARALEGAL_API_KEY!,
});

const session = await exchangeToken(client, "exchange-token-from-url");
// session.session_token, session.firm_id, session.matter_id, session.expires_at
```

### Ask AI (with API key)

```typescript
import { AiParalegalClient, askAi } from "@ftaip/sdk";

const response = await askAi(client, {
  prompt: "Summarise the key facts of this matter",
  firm_id: "firm-uuid",
  matter_id: "matter-uuid",
  load_matter_facts: true,
});
```

### Ask AI (with session token)

```typescript
import { askAiWithSession } from "@ftaip/sdk";

const response = await askAiWithSession(client, session.session_token, {
  prompt: "Summarise the key facts of this matter",
});
```

### Submit Result

```typescript
import { submitResult } from "@ftaip/sdk";

const response = await submitResult(client, session.session_token, {
  stamp_duty: 5000,
});
```

## Token Exchange Flow

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│  Admin Panel     │     │  AI Paralegal API     │     │  Your App        │
└────────┬────────┘     └──────────┬───────────┘     └────────┬─────────┘
         │                         │                           │
         │  Generate exchange token│                           │
         │────────────────────────>│                           │
         │  { exchange_token }     │                           │
         │<────────────────────────│                           │
         │                         │                           │
         │  Load iframe ?token=xxx │                           │
         │─────────────────────────────────────────────────────>
         │                         │                           │
         │                         │  POST /token/exchange     │
         │                         │  X-API-KEY + token        │
         │                         │<──────────────────────────│
         │                         │  { session_token, ... }   │
         │                         │──────────────────────────>│
         │                         │                           │
         │                         │  POST /ai/ask             │
         │                         │  Bearer {session_token}   │
         │                         │<──────────────────────────│
         │                         │  { data: ... }            │
         │                         │──────────────────────────>│
```

## Security

- **Exchange tokens** are single-use and expire in 5 minutes
- **Session tokens** are scoped to one firm/matter and expire in 1 hour
- The API key is stored as a private field and never exposed publicly on the client instance
- `postMessage` is scoped to the host origin — never uses wildcard (`*`)
- `baseUrl` is validated to be a proper HTTP/HTTPS URL
- Session tokens are the recommended auth method for browser-based apps

## Requirements

- React 18+ (peer dependency)
- A running AI Paralegal instance with an SDK application configured in the admin panel

## License

[MIT](./LICENSE)
