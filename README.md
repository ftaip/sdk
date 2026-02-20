# @aiparalegal/sdk

React SDK for AI Paralegal — AI-powered legal assistant integration.

## Installation

```bash
npm install @aiparalegal/sdk
```

## Authentication Modes

The SDK supports two authentication modes:

### 1. Token Exchange (recommended for iframe / preview)

When your app is loaded inside the AI Paralegal admin preview, it receives a short-lived exchange token and the host's base URL as query parameters (`?token=xxx&baseUrl=https://...`). The `useSession` hook reads both automatically and returns a ready-to-use client.

```tsx
import { useSession, useAskAI } from "@aiparalegal/sdk";
import type { AiParalegalClient, SessionContext } from "@aiparalegal/sdk";

function App() {
  const { session, client, loading, error } = useSession({
    apiKey: process.env.AI_PARALEGAL_API_KEY!,
  });

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
  const { ask, data, loading, error } = useAskAI(client, session);

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

### 2. API Key + Explicit IDs (server-side / direct)

For server-side usage or when you manage firm/matter context yourself:

```tsx
import { AiParalegalClient, useAskAI } from "@aiparalegal/sdk";

const client = new AiParalegalClient({
  baseUrl: "https://your-aiparalegal-instance.com",
  apiKey: process.env.AI_PARALEGAL_API_KEY!,
});

function AskAI() {
  const { ask, data, loading, error, reset } = useAskAI(client, {
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

## Standalone Functions

### Token Exchange

```typescript
import { AiParalegalClient, exchangeToken } from "@aiparalegal/sdk";

const client = new AiParalegalClient({
  baseUrl: "https://your-aiparalegal-instance.com",
  apiKey: process.env.AI_PARALEGAL_API_KEY!,
});

const session = await exchangeToken(client, "exchange-token-from-url");
// session.session_token, session.firm_id, session.matter_id, session.expires_at
```

### Ask AI (with API key)

```typescript
import { AiParalegalClient, askAi } from "@aiparalegal/sdk";

const response = await askAi(client, {
  prompt: "Summarise the key facts of this matter",
  firm_id: "firm-uuid",
  matter_id: "matter-uuid",
  load_matter_facts: true,
});
```

### Ask AI (with session token)

```typescript
import { AiParalegalClient, askAiWithSession } from "@aiparalegal/sdk";

const response = await askAiWithSession(client, session.session_token, {
  prompt: "Summarise the key facts of this matter",
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
| `baseUrl` | `string` | Yes      | Base URL of your AI Paralegal instance                   |
| `apiKey`  | `string` | No       | SDK API key (needed for API-key auth and token exchange) |

### `useSession(config)`

Automatically reads `token` and `baseUrl` from the URL and exchanges the token for a session. Creates an `AiParalegalClient` internally using the resolved base URL.

| Option    | Type     | Required | Description                                           |
| --------- | -------- | -------- | ----------------------------------------------------- |
| `apiKey`  | `string` | Yes      | Your SDK API key                                      |
| `baseUrl` | `string` | No       | Override for the base URL (defaults to URL parameter) |

**Returns:** `{ session: SessionContext | null, client: AiParalegalClient | null, loading: boolean, error: Error | null }`

### `useAskAI(client, options)`

React hook that returns `{ ask, data, loading, error, reset }`.

Accepts either `AskAiOptions` (API key mode) or `SessionContext` (session mode).

### `exchangeToken(client, token)`

Exchange a short-lived token for a session. Returns `TokenExchangeResponse`.

### `askAi(client, request)` / `askAiWithSession(client, sessionToken, request)`

Standalone async functions for direct API calls.

## Security

- **Exchange tokens** are single-use and expire in 5 minutes
- **Session tokens** are scoped to one firm/matter and expire in 1 hour
- The API key should be kept server-side or injected securely at build time
- Session tokens are the recommended auth method for browser-based apps

## Requirements

- React 18+ (peer dependency)
- A running AI Paralegal instance with an SDK application configured in the admin panel
