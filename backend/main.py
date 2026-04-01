from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil, os
from rag import ingest_pdf, ask

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
def upload_pdf(file: UploadFile = File(...)):
    path = f"uploads/{file.filename}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    chunks = ingest_pdf(path)
    return {"message": f"Ingested {chunks} chunks from {file.filename}"}

class QuestionRequest(BaseModel):
    question: str

@app.post("/ask")
def ask_question(body: QuestionRequest):
    answer = ask(body.question)
    return {"answer": answer}

@app.get("/")
def root():
    return {"status": "RAG backend running"}