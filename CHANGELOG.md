# Changelog

All notable changes to this project will be documented in this file.

## [0.8.0] - 2026-03-04

### Added

- **Structured error handling** — `ApiError` class with typed `code`, `status`, and `details` properties; `throwApiError` helper for consistent error parsing across all API functions
- **Health check** — `checkHealth()` function and `useHealth()` hook for monitoring API availability and capability status
- **Host events** — `useHostEvents()` hook for listening to `postMessage` events from the parent host window
- **DevTools panel** — `DevToolsProvider` and `DevToolsPanel` components for in-browser debugging with Session, Network, and Info tabs (development mode only)
- **CLI scaffolding** — `@ftaip/create-app` package (`npx @ftaip/create-app`) to scaffold new SDK tool projects with interactive prompts, capability selection, and pre-wired hooks
- **TypeScript generics** — `SessionContext<TParams>` and `UseSessionReturn<TParams>` now accept a generic parameter for typed session parameters; `HookState<T>` discriminated union for standardised hook state handling
- **SessionGate improvements** — `theme` prop for custom styling, `retry` callback on error states, `onSessionReady` lifecycle callback
- **Test coverage** — 140 tests across 14 test files covering all hooks and API functions (up from 79 tests)

### Changed

- All API functions now throw `ApiError` instead of plain `Error` for non-OK responses, providing `code`, `status`, and `details` from the structured error response
- `SessionGate` default loading and error UIs improved with better styling and a retry button

## [0.7.0] - 2026-03-02

### Added

- Storage hooks and API functions (released as 0.7.0 without changelog entry)

## [0.6.0] - 2026-03-02

### Added

- `useStorage` hook for persisting key-value data via the host storage API
- `getStorageItem`, `putStorageItem`, `deleteStorageItem`, `listStorageItems` plain functions
- `StorageItem`, `StorageListResponse`, `StorageShowResponse`, `StoragePutRequest`, `StorageScope`, `UseStorageReturn` types
- Scoping support — storage items can be scoped by `matterId` and `namespace`
- Test suite for `storage.ts` (16 tests) and `use-storage.ts` (18 tests)

### Fixed

- `storage.ts` now uses `import type` for `AiParalegalClient` (consistency with all other modules)
- `StoragePutRequest` type now includes `matter_id` field to match the actual API payload
- `UseStorageReturn` now includes `reset()` method for consistency with all other hooks

## [0.5.0] - 2026-03-01

### Added

- Document collections API — create, list, search, query, and analyze document collections
- Contract review with streaming stage-by-stage analysis
- Suggested prompts for collections
- Collection table generation and analysis streaming
- `useCollections`, `useCollection`, `useCollectionSearch`, `useCollectionQuery`, `useCollectionTable`, `useCollectionAnalyze`, `useSuggestedPrompts`, `useContractReview` hooks

## [0.4.0] - 2026-02-28

### Added

- Audio capabilities — `transcribeAudio`, `textToSpeech`, `startDictation`
- Streaming transcription via SSE
- `useTranscribe`, `useTextToSpeech`, `useDictation` hooks

## [0.3.0] - 2026-02-27

### Added

- `useLLM`, `useOCR`, `useFiles`, `useDocs`, `useMarkItDown` hooks
- LLM streaming support via SSE
- OCR text extraction with streaming
- File upload and document management
- MarkItDown document conversion

## [0.2.3] - 2026-02-26

### Fixed

- Upgraded npm to 11.5.1+ for trusted publishing OIDC support

## [0.2.2] - 2026-02-26

### Changed

- Switched to npm trusted publishing (OIDC)

## [0.2.1] - 2026-02-25

### Added

- npm OIDC trusted publishing workflow

## [0.2.0] - 2026-02-24

### Added

- Security hardening — scoped `postMessage`, validated `baseUrl`, privatised `apiKey`
- Git config, test suite, and vitest infrastructure
- Initial test coverage for `AiParalegalClient`, `exchangeToken`, `askAi`, `submitResult`, `useSession`, `useAskMatterAI`, `useSubmitResult`
