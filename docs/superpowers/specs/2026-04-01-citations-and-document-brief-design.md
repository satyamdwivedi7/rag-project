# DocMind: Citation-Grounded Answers + Document Brief

**Date:** 2026-04-01
**Status:** Approved
**Scope:** Two features added to the existing Next.js + Gemini Files API app

---

## Goal

Make DocMind stand out as a resume/portfolio project for Applied AI engineering roles by demonstrating:

1. **Structured output / schema-constrained generation** — not just "call the API and get text back"
2. **RAG reliability engineering** — grounded, verifiable answers with source citations
3. **Pipeline orchestration** — proactive document intelligence at upload time, not just reactive Q&A

---

## Features

### Feature A — Citation-Grounded Answers

Every AI response includes 1–3 verbatim excerpts from the document that directly support the answer. Citations are rendered as a collapsible `Sources` section below each AI message bubble.

**What this signals in interviews:** Understanding that RAG hallucination is a reliability problem, and that structured output is the right tool to enforce answer grounding.

### Feature B — Document Brief

On PDF upload, a second Gemini call extracts a summary, key topics, and 5 suggested starter questions from the document. The left panel switches from static marketing copy to this live document intelligence. Clicking a suggested question sends it directly to chat.

**What this signals in interviews:** Pipeline design thinking — proactively extracting value from a document, not just waiting for the user to ask.

---

## Data Schemas

Both features use Gemini's `responseMimeType: "application/json"` with a `responseSchema`. No regex parsing or post-processing hacks.

### DocumentBrief
```typescript
type DocumentBrief = {
  summary: string;      // 2-3 sentence overview of the document
  topics: string[];     // 4-5 short topic labels
  questions: string[];  // 5 suggested starter questions
}
```

### GroundedAnswer
```typescript
type Citation = {
  excerpt: string;     // verbatim short passage from the document
  relevance: string;   // one phrase: why this passage supports the answer
}

type GroundedAnswer = {
  answer: string;      // markdown-formatted prose answer (same as before)
  citations: Citation[]; // 0-3 citations; empty array if none found
}
```

---

## API Layer

### `POST /api/upload`

**Current behavior:** Uploads PDF to Gemini Files API, returns `{ fileUri, message }`.

**New behavior:** After uploading, fires a second `generateContent` call against the same `fileUri` requesting a `DocumentBrief` in JSON mode. Returns `{ fileUri, message, brief: DocumentBrief }`.

- The frontend makes one HTTP call — unchanged interface except for the added `brief` field.
- If the brief generation call fails, the response still includes `fileUri` and `message`; `brief` is `null`. Upload never fails due to brief failure.
- Gemini model: `gemini-2.5-flash` (same as existing).

**Gemini call config:**
```typescript
generationConfig: {
  responseMimeType: "application/json",
  responseSchema: { /* DocumentBrief schema */ }
}
```

### `POST /api/ask`

**Current behavior:** Takes `{ question, fileUri }`, returns `{ answer: string }`.

**New behavior:** Returns `{ answer: string, citations: Citation[] }`. The prompt instructs the model to answer in JSON matching `GroundedAnswer`. The `answer` field remains markdown-formatted — no change to rendering.

- If the model returns empty `citations`, the UI simply doesn't show the Sources section — not an error.
- If JSON parsing fails (shouldn't with `responseMimeType`), the route falls back to returning `{ answer: rawText, citations: [] }`.

---

## Frontend Layer

### `page.tsx`

New state: `brief: DocumentBrief | null`, initialized to `null`.

Changes:
1. `handleUpload` stores `data.brief` in state after successful upload.
2. `handleSend` is refactored to accept an optional `question: string` parameter so it can be called from `LeftPanel`'s suggested questions directly, bypassing the `ChatInput`.
3. `LeftPanel` receives `brief` and `onAskQuestion` as new props.

### `LeftPanel.tsx`

New props: `brief: DocumentBrief | null`, `onAskQuestion: (q: string) => void`.

**Before upload (`brief === null`):** Renders existing static content (wordmark, feature list 01/02/03) — unchanged.

**After upload (`brief !== null`):** Replaces static content with:
- Summary paragraph (styled with `--fg-secondary`, body font)
- Topic chips row (same style as the existing filename badge in the top bar)
- "Ask a question" label + 5 question items as clickable rows (hover uses `--accent-pale`, font matches existing muted style)

Footer (Gemini 2.5 Flash · Next.js · Vercel) remains.

### `ChatMessages.tsx`

The `Message` type gains `citations?: Citation[]`.

For AI messages with `citations.length > 0`:
- Below the answer bubble, render a small `Sources ↓` toggle button
- Clicking it expands to show citation cards inline
- Each card: verbatim excerpt in muted monospace (`--bg-left` background, `--fg-muted` text), relevance phrase beneath in smaller text
- Collapsed by default

No changes to user or system message rendering.

### Types

A shared `types.ts` file (new) exports `DocumentBrief`, `Citation`, and `Message` to avoid duplicating type definitions across components.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Brief generation fails on upload | `brief: null` returned; left panel stays static; no error shown to user |
| Ask returns malformed JSON | Fallback to `{ answer: rawText, citations: [] }`; no citations shown |
| Ask returns empty citations | Sources toggle not rendered; no visual noise |
| Upload itself fails | Existing error handling unchanged |

---

## What This Demonstrates (Resume/Interview)

- **Structured output engineering:** Schema-constrained JSON generation with `responseMimeType` + `responseSchema` — shows production-grade LLM output handling
- **RAG reliability:** Citations make answers auditable; demonstrates awareness of hallucination as an engineering problem
- **Pipeline design:** Two-stage upload (store + analyze) shows multi-step LLM orchestration thinking
- **Full-stack delivery:** Schema defined once in TypeScript, used in both API routes and frontend rendering
