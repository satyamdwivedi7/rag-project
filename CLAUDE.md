# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DocMind** — a RAG (Retrieval Augmented Generation) app. Upload a PDF, ask questions about it. Next.js 16 frontend + Python FastAPI backend.

---

## Backend (Python / FastAPI)

Files live at the repo root: `main.py` (API layer) and `rag.py` (RAG logic).

```bash
# Run from inside backend/ — paths for uploads/ and chroma_db/ are relative to CWD
cd backend
source venv/bin/activate
uvicorn main:app --reload   # http://localhost:8000
```

Requires `GEMINI_API_KEY` in `.env`. No test suite or linting configured.

### Architecture

**`rag.py`** — all RAG logic:
- `extract_text(pdf_path)` → PyPDF text extraction
- `chunk_text(text, size=400, overlap=50)` → word-based overlapping chunks
- `get_or_create_collection(name="docs")` → ChromaDB collection management
- `ingest_pdf(pdf_path, collection_name="docs")` → full ingestion pipeline; uses MD5 hashes as chunk IDs to skip duplicates
- `ask(question, collection_name="docs")` → retrieves top-3 chunks from ChromaDB, builds prompt, calls Gemini 2.5 Flash

**`main.py`** — FastAPI wiring:
- `POST /upload` — saves PDF to `uploads/`, calls `ingest_pdf`, returns chunk count
- `POST /ask` — expects JSON body `{"question": "..."}`, returns `{"answer": "..."}`
- `GET /` — health check

ChromaDB persists to `./chroma_db/` (survives restarts). CORS is open (`*`).

---

## Frontend (Next.js 16 / React 19)

> ⚠️ **Next.js 16 has breaking changes** from earlier versions. Before editing frontend code, read the relevant guide in `frontend/node_modules/next/dist/docs/`.

```bash
cd frontend
npm run dev      # dev server on http://localhost:3000
npm run build
npm run lint     # eslint
```

### Architecture

Single-page app in `frontend/app/page.tsx` (client component). No routing, no state management library — plain React `useState`.

**Data flow:**
1. User selects PDF → `FormData` POST to `http://localhost:8000/upload`
2. User types question → JSON body POST to `http://localhost:8000/ask` → streams answer into chat UI

Backend URL is hardcoded as `http://localhost:8000` in `page.tsx`. To change it, update those fetch calls directly.

**Styling:** Tailwind CSS v4 (configured via `@tailwindcss/postcss`, not `tailwind.config.js`).
