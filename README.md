# @ftaip/sdk

React SDK for AI Paralegal — lets third-party apps embed inside the AI Paralegal host as an iframe tool.

[![npm version](https://img.shields.io/npm/v/@ftaip/sdk.svg)](https://www.npmjs.com/package/@ftaip/sdk)
[![license](https://img.shields.io/npm/l/@ftaip/sdk.svg)](https://github.com/ftaip/sdk/blob/main/LICENSE)

## Installation

```bash
npm install @ftaip/sdk
```

## Quick Start

When your app is loaded inside the AI Paralegal admin, the host injects `token`, `baseUrl`, and `apiKey` as URL query parameters. The `useSession` hook reads them automatically — zero config needed:

```tsx
import { useSession, useAskMatterAI, useSubmitResult } from "@ftaip/sdk";

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

## API Reference

### `AiParalegalClient`

| Option    | Type     | Required | Description                                              |
| --------- | -------- | -------- | -------------------------------------------------------- |
| `baseUrl` | `string` | Yes      | Base URL of your AI Paralegal instance (must be HTTP/HTTPS) |
| `apiKey`  | `string` | No       | SDK API key (needed for API-key auth and token exchange) |

### `useSession(config)`

Automatically reads `token`, `baseUrl`, and `apiKey` from the URL and exchanges the token for a session.

| Option    | Type     | Required | Description                                           |
| --------- | -------- | -------- | ----------------------------------------------------- |
| `apiKey`  | `string` | No       | Override API key (defaults to URL parameter)          |
| `baseUrl` | `string` | No       | Override base URL (defaults to URL parameter)         |

**Returns:** `{ session, client, loading, error }`

### `useAskMatterAI(client, options)`

React hook for sending prompts to the AI. Accepts either `AskAiOptions` (API key mode) or `SessionContext` (session mode).

**Returns:** `{ ask, data, loading, error, reset }`

### `useSubmitResult(client, session)`

React hook for submitting tool results back to the AI agent.

**Returns:** `{ submit, loading, error, submitted, response }`

### `exchangeToken(client, token)`

Exchange a short-lived token for a session. Returns `TokenExchangeResponse`.

### `askAi(client, request)` / `askAiWithSession(client, sessionToken, request)`

Standalone async functions for direct API calls.

### `submitResult(client, sessionToken, result)`

Submit a result to the host and notify the parent iframe via `postMessage`.

## Available Hooks

| Hook | Description | Key methods |
|------|-------------|-------------|
| `useSession` | Token exchange and session lifecycle | `session`, `client` |
| `useAskMatterAI` | Ask the AI about the current matter | `ask(prompt)` |
| `useSubmitResult` | Submit tool results back to the agent | `submit(result)` |
| `useLLM` | LLM text generation with streaming | `generate(prompt, opts)` |
| `useOCR` | Extract text from images and PDFs | `extract(file, opts)` |
| `useFiles` | Upload files to the host | `upload(files)` |
| `useDocs` | Document CRUD operations | `create`, `list`, `get`, `update`, `delete` |
| `useMarkItDown` | Convert documents to markdown | `convert(file)` |
| `useTranscribe` | Audio transcription with streaming | `transcribe(file, opts)` |
| `useTextToSpeech` | Text-to-speech audio generation | `speak(text, opts)` |
| `useDictation` | Real-time dictation | `start()`, `stop()` |
| `useCollections` | Document collection management | `create`, `list`, `remove` |
| `useCollection` | Single collection operations | `get`, `uploadDocuments`, `search` |
| `useCollectionSearch` | Semantic search within a collection | `search(query)` |
| `useCollectionQuery` | AI-powered collection Q&A with streaming | `query(prompt)` |
| `useCollectionTable` | Generate structured tables from collections | `generate(columns)` |
| `useCollectionAnalyze` | AI analysis of collection documents | `analyze(prompt)` |
| `useSuggestedPrompts` | Get AI-suggested prompts for a collection | `fetch(collectionId)` |
| `useContractReview` | Contract review with staged streaming | `review(docId, opts)` |
| `useStorage` | Persist key-value data via host storage | `get`, `put`, `remove`, `list` |

### Storage Example

```tsx
import { useSession, useStorage } from "@ftaip/sdk";

function Settings({ client, session }) {
  const { get, put, loading } = useStorage(client, session);

  const loadPrefs = async () => {
    const prefs = await get("user-prefs");
    console.log(prefs);
  };

  const savePrefs = async () => {
    await put("user-prefs", { theme: "dark", fontSize: 14 });
  };

  // Scope to current matter
  const saveMatterNotes = async () => {
    await put("notes", "Draft text", { matterId: session.matterId });
  };

  return (
    <div>
      <button onClick={loadPrefs} disabled={loading}>Load</button>
      <button onClick={savePrefs} disabled={loading}>Save</button>
    </div>
  );
}
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
