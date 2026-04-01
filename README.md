# DocMind — Document Intelligence

Upload PDFs and ask questions. Get citation-grounded answers and cross-document comparisons powered by Gemini 2.5 Flash.

## How It Works

1. **Upload** a PDF → Gemini Files API stores it; a second Gemini call generates a document brief (summary, topics, suggested questions)
2. **Ask** a question → Gemini reasons over the full document and returns a structured response with verbatim citation excerpts
3. **Compare** (multi-doc mode) → upload several PDFs, select 2+, and get a structured comparison: shared themes, conflicts, unique insights, and a synthesis — all from a single Gemini call across all documents

## Key Engineering Decisions

| Decision | What / Why |
|---|---|
| Schema-constrained output | `responseMimeType: "application/json"` + `responseSchema` (SchemaType) on every Gemini call — structured output, not prompt parsing |
| Citation enforcement | `/api/ask` schema requires `citations[]` alongside every answer — model cannot answer without pointing to source text |
| Multi-file Gemini call | `/api/compare` passes all selected PDFs as separate `fileData` parts in one `generateContent` call — true cross-document reasoning, not fan-out |
| Two-stage upload pipeline | Upload triggers a second Gemini call to extract `DocumentBrief`; failure is silently swallowed so upload always succeeds |
| Document-native retrieval | Full PDF sent to Gemini context window — no chunking, no embedding model, no vector store |

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 App Router |
| Frontend | React 19, Tailwind CSS v4 |
| AI | Google Gemini 2.5 Flash (via `@google/generative-ai`) |
| File storage | Gemini Files API (stateless, session-scoped) |
| Deployment | Vercel (serverless functions) |

## API Routes

| Route | Input | Output |
|---|---|---|
| `POST /api/upload` | `FormData { file: PDF }` | `{ fileUri, message, brief: DocumentBrief \| null }` |
| `POST /api/ask` | `{ question, fileUri }` | `{ answer, citations: Citation[] }` |
| `POST /api/compare` | `{ question, docs: { fileUri, fileName }[] }` | `{ comparison: DocComparison }` |

## Running Locally

```bash
# Install dependencies
npm install

# Set up environment
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Get a Gemini API key at [aistudio.google.com](https://aistudio.google.com).

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key (required) |
