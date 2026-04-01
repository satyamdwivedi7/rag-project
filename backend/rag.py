import os
from pypdf import PdfReader
import chromadb
from google import genai                        # ← changed
from dotenv import load_dotenv

load_dotenv()
client_ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))  # ← changed

# ── Vector DB setup ──────────────────────────────────────────────────────────
chroma_client = chromadb.PersistentClient(path="./chroma_db")

def get_or_create_collection(name="docs"):
    try:
        return chroma_client.get_collection(name)
    except:
        return chroma_client.create_collection(name)

# ── PDF processing ───────────────────────────────────────────────────────────
def extract_text(pdf_path):
    reader = PdfReader(pdf_path)
    return " ".join(page.extract_text() for page in reader.pages)

def chunk_text(text, size=400, overlap=50):
    words = text.split()
    chunks = []
    for i in range(0, len(words), size - overlap):
        chunk = " ".join(words[i:i + size])
        if chunk:
            chunks.append(chunk)
    return chunks

def ingest_pdf(pdf_path, collection_name="docs"):
    collection = get_or_create_collection(collection_name)
    text = extract_text(pdf_path)
    chunks = chunk_text(text)

    import hashlib
    ids = [hashlib.md5(chunk.encode()).hexdigest() for chunk in chunks]
    existing = set(collection.get(ids=ids)["ids"])
    new_chunks = [(c, i) for c, i in zip(chunks, ids) if i not in existing]
    if new_chunks:
        docs, new_ids = zip(*new_chunks)
        collection.add(documents=list(docs), ids=list(new_ids))
    return len(chunks)

# ── RAG query ────────────────────────────────────────────────────────────────
def ask(question, collection_name="docs"):
    collection = get_or_create_collection(collection_name)

    # 1. Find relevant chunks
    n = min(3, collection.count())
    if n == 0:
        return "No documents have been ingested yet. Please upload a PDF first."
    results = collection.query(query_texts=[question], n_results=n)
    context = "\n\n".join(results["documents"][0])

    # 2. Build prompt with context
    prompt = f"""You are a helpful assistant. Answer the question using \
only the context below. If the answer isn't in the context, say so.

Always format your response using Markdown:
- Use **bold** for key terms or important values
- Use bullet lists (- item) or numbered lists for multiple points
- Use headings (## or ###) when the answer has distinct sections
- Use `inline code` for variable names, formulas, or technical identifiers

Context:
{context}

Question: {question}
"""

    # 3. Ask Gemini
    response = client_ai.models.generate_content(
    model="gemini-2.5-flash",
    contents=prompt
)
    return response.text