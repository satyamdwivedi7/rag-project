# DocMind — Document Intelligence

Upload any PDF and have intelligent conversations about its content. Answers are grounded in your document using Retrieval-Augmented Generation (RAG).

## How It Works

1. Upload a PDF → text is extracted, chunked, and stored as vector embeddings in ChromaDB
2. Ask a question → the top matching chunks are retrieved and sent to Gemini 2.5 Flash as context
3. Gemini returns a structured, markdown-formatted answer — no hallucinations, only what's in the document

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Backend | FastAPI, Python 3.14 |
| Vector DB | ChromaDB (persistent) |
| LLM | Google Gemini 2.5 Flash |
| PDF Parsing | PyPDF |

## Running Locally

**Backend**
```bash
cd backend
source venv/bin/activate       # or: python -m venv venv && pip install -r requirements.txt
cp .env.example .env            # add your GEMINI_API_KEY
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env.local      # set NEXT_PUBLIC_BACKEND_URL if needed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| File | Variable | Description |
|---|---|---|
| `backend/.env` | `GEMINI_API_KEY` | Google AI Studio API key |
| `frontend/.env.local` | `NEXT_PUBLIC_BACKEND_URL` | Backend base URL (default: `http://localhost:8000`) |
