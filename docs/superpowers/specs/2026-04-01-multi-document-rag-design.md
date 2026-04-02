# DocMind: Multi-Document RAG + Compare

**Date:** 2026-04-01
**Status:** Approved
**Scope:** Multi-document session library with cross-document comparison mode

---

## Goal

Extend DocMind from a single-document Q&A tool into a multi-document research tool. Users can upload several PDFs into a session library, select which ones are active for a query, and optionally trigger a structured cross-document comparison that surfaces shared themes, conflicts, and unique insights.

---

## Features

### Feature A — Document Library

A session-scoped list of uploaded PDFs replaces the single-document upload state. Users can:
- Upload multiple PDFs (each triggers the existing two-stage upload + brief pipeline)
- Select one or more documents as "active" for the next query
- View each document's brief inline (summary + topics)
- See suggested starter questions from the selected document's brief (when exactly one is selected)

All state is in-memory; the library resets on page refresh.

### Feature B — Compare Mode

A "Compare" toggle in the chat input area triggers cross-document reasoning. When active and 2+ docs are selected, the query goes to `/api/compare` instead of `/api/ask`. Gemini receives all selected documents as file inputs in a single call and returns a structured comparison.

---

## Data Schemas

### `UploadedDoc`
```typescript
type UploadedDoc = {
  fileUri: string;    // Gemini Files API URI — used as stable ID
  fileName: string;  // original filename for display
  brief: DocumentBrief | null;
};
```

### `DocComparison`
```typescript
type DocComparison = {
  sharedThemes: string[];         // themes all/most docs address
  conflicts: string[];            // points where docs disagree
  uniqueInsights: {               // insights only one doc provides
    fileName: string;
    insight: string;
  }[];
  synthesis: string;              // markdown prose summary of the full comparison
};
```

`Message` gains an optional field:
```typescript
type Message = {
  role: string;
  text: string;
  citations?: Citation[];
  comparison?: DocComparison;  // present only on compare-mode AI messages
};
```

---

## State Changes in `page.tsx`

**Removed:**
- `fileUri: string`
- `uploadedFile: string`
- `brief: DocumentBrief | null`

**Added:**
- `docs: UploadedDoc[]` — session library
- `selectedUris: Set<string>` — `fileUri`s of currently active documents
- `compareMode: boolean` — whether the compare toggle is active

**Derived:**
- A query is sendable when `selectedUris.size >= 1` (normal) or `selectedUris.size >= 2` (compare mode)
- `handleSend` routes to `/api/ask` with `{ question, fileUri: [...selectedUris][0] }` when `compareMode === false`
- `handleSend` routes to `/api/compare` with `{ question, fileUris: [...selectedUris] }` when `compareMode === true`

---

## API Layer

### `POST /api/ask` — unchanged

No modifications. Signature: `{ question: string, fileUri: string }` → `{ answer: string, citations: Citation[] }`.

### `POST /api/compare` — new

**Request:** `{ question: string, fileUris: string[] }`

**Response:** `{ comparison: DocComparison }`

All `fileUris` are passed as separate `fileData` parts in a single `generateContent` call. Gemini 2.5 Flash supports multiple file inputs in one request.

**Gemini call config:**
```typescript
generationConfig: {
  responseMimeType: "application/json",
  responseSchema: compareSchema,  // DocComparison schema using SchemaType
}
```

**Prompt:** Instructs the model to reason across all documents simultaneously, identify what they agree on, where they diverge, what each uniquely covers, and produce a markdown synthesis.

**Error handling:**
- `fileUris.length < 2` → `400` with `{ error: "Compare requires at least 2 documents" }`
- Gemini call fails → `500` with `{ error: message }`
- No partial fallback — compare either works or fails cleanly

---

## Frontend Layer

### `app/types.ts`
Add `UploadedDoc` and `DocComparison`. Add `comparison?: DocComparison` to `Message`.

### `app/page.tsx`
- Replace single-doc state with `docs`, `selectedUris`, `compareMode`
- `handleUpload` appends to `docs` array (multiple uploads supported)
- `handleSend(directQuestion?)` routes to ask or compare based on `compareMode`
- Pass `docs`, `selectedUris`, `onToggleDoc`, `onUpload`, `compareMode` to relevant components

### `app/components/LeftPanel.tsx`
**Before any upload:** existing static feature list — unchanged.

**After first upload:** renders document library:
- "Upload another PDF" button (triggers hidden file input)
- Scrollable list of `UploadedDoc` items, each with:
  - Checkbox for selection (checked = in `selectedUris`)
  - Filename display
  - Expand arrow → reveals brief summary + topic chips inline
- If exactly one doc is selected: suggested questions from its brief appear below the list as clickable rows (calls `onAskQuestion`)
- If 0 or 2+ docs selected: suggested questions section hidden

Footer unchanged.

### `app/components/ChatInput.tsx`
- Add `compareMode: boolean` and `onToggleCompare: () => void` props
- "Compare" toggle button left of send button; disabled when `selectedUris.size < 2`
- When `compareMode` active: send button shows "Compare", placeholder changes to "Ask a question across selected documents…"
- When `compareMode` active and `selectedUris.size < 2`: send button is disabled (does not fall back to single-doc ask)

### `app/components/ChatMessages.tsx`
- For AI messages with `comparison` field: render a structured card with four sections:
  1. **Shared Themes** — bulleted list
  2. **Conflicts** — bulleted list
  3. **Unique Insights** — per-document chips (filename label + insight text)
  4. **Synthesis** — existing `ReactMarkdown` prose rendering
- Regular messages (no `comparison`) render exactly as today — no change

### `app/components/UploadZone.tsx`
- Delete this file. Upload is now triggered by a button inside `LeftPanel`; `UploadZone` is no longer used anywhere.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Compare called with < 2 fileUris | 400 returned; UI disables Compare toggle when < 2 docs selected |
| Compare Gemini call fails | 500 with error message; displayed as system message in chat |
| Upload brief fails (existing behavior) | `brief: null`; doc still added to library |
| All uploads fail | Existing error handling; doc not added to library |
| Ask with 0 selected docs | Send button disabled; no request made |

---

## What This Demonstrates (Resume/Interview)

- **Multi-document RAG:** A single Gemini call reasoning across multiple file inputs — demonstrates understanding of how production document intelligence pipelines handle collections, not just single files
- **Structured comparison output:** `sharedThemes`, `conflicts`, `uniqueInsights` schema shows ability to design output contracts for complex analytical tasks
- **Session state management:** Document library with selection state, per-doc briefs, and routing logic shows full-stack thinking beyond basic CRUD
- **Graceful degradation:** Compare mode is additive — single-doc mode works exactly as before
