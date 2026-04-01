# Citations + Document Brief Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add citation-grounded answers and automatic document brief extraction to DocMind, demonstrating structured output engineering and RAG reliability design.

**Architecture:** Two new Gemini `responseSchema` calls — one at upload time (document brief), one per question (grounded answer with citations). Shared TypeScript types flow from a new `types.ts` through the API routes into the UI components. All changes are additive; no existing functionality breaks.

**Tech Stack:** Next.js 16 App Router, `@google/generative-ai` v0.24.1 (`SchemaType`, `responseMimeType`), React 19, TypeScript, Tailwind CSS v4, CSS custom properties for theming.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `frontend/app/types.ts` | Create | `Citation`, `DocumentBrief`, `Message` types |
| `frontend/app/api/ask/route.ts` | Modify | Return `{ answer, citations[] }` via `responseSchema` |
| `frontend/app/api/upload/route.ts` | Modify | Return `{ fileUri, message, brief }` via second Gemini call |
| `frontend/app/page.tsx` | Modify | `brief` state, `handleSend(directQuestion?)`, pass props to `LeftPanel` |
| `frontend/app/components/LeftPanel.tsx` | Modify | Accept `brief` + `onAskQuestion` props, render dynamic brief |
| `frontend/app/components/ChatMessages.tsx` | Modify | Import `Message` from `types.ts`, render collapsible citations |

---

## Task 1: Shared Types

**Files:**
- Create: `frontend/app/types.ts`
- Modify: `frontend/app/components/ChatMessages.tsx` (update `Message` import source)
- Modify: `frontend/app/page.tsx` (update `Message` import source)

- [ ] **Step 1: Create `frontend/app/types.ts`**

```typescript
export type Citation = {
  excerpt: string;
  relevance: string;
};

export type DocumentBrief = {
  summary: string;
  topics: string[];
  questions: string[];
};

export type Message = {
  role: string;
  text: string;
  citations?: Citation[];
};
```

- [ ] **Step 2: Update `ChatMessages.tsx` — replace the local `Message` definition with an import**

Remove line 5 (`export type Message = { role: string; text: string };`) and add an import at the top:

```typescript
"use client";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "../types";
```

Re-export `Message` so `page.tsx`'s existing import still works without changes to `page.tsx` yet:

```typescript
export type { Message };
```

Add this line immediately after the import block (before `type Props`).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/types.ts frontend/app/components/ChatMessages.tsx
git commit -m "Add shared types: Citation, DocumentBrief, Message"
```

---

## Task 2: Update `/api/ask` — Structured Output with Citations

**Files:**
- Modify: `frontend/app/api/ask/route.ts`

- [ ] **Step 1: Replace `frontend/app/api/ask/route.ts` entirely**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const answerSchema = {
  type: SchemaType.OBJECT,
  properties: {
    answer: {
      type: SchemaType.STRING,
      description: "Markdown-formatted answer to the question",
    },
    citations: {
      type: SchemaType.ARRAY,
      description: "1-3 verbatim excerpts from the document supporting the answer",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          excerpt: {
            type: SchemaType.STRING,
            description: "Short verbatim passage from the document",
          },
          relevance: {
            type: SchemaType.STRING,
            description: "One phrase explaining why this excerpt supports the answer",
          },
        },
        required: ["excerpt", "relevance"],
      },
    },
  },
  required: ["answer", "citations"],
};

export async function POST(req: NextRequest) {
  try {
    const { question, fileUri } = await req.json();

    if (!fileUri) {
      return NextResponse.json(
        { answer: "No document uploaded. Please upload a PDF first.", citations: [] },
        { status: 200 }
      );
    }

    const model = genai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: answerSchema,
      },
    });

    const result = await model.generateContent([
      { fileData: { mimeType: "application/pdf", fileUri } },
      {
        text: `You are a helpful assistant answering questions about the uploaded document.
Format your answer in Markdown: use **bold** for key terms, bullet lists for multiple points, headings for structured answers.
Include 1-3 citations: short verbatim excerpts from the document that directly support your answer.
If no relevant excerpts exist, return an empty citations array.
If the answer is not in the document, say so clearly in the answer field.

Question: ${question}`,
      },
    ]);

    const parsed = JSON.parse(result.response.text());
    return NextResponse.json({
      answer: parsed.answer ?? "",
      citations: parsed.citations ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Ask error:", message);
    return NextResponse.json(
      { answer: `Request failed: ${message}`, citations: [] },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and test the route with curl**

```bash
cd frontend && npm run dev
```

In a second terminal — replace `YOUR_FILE_URI` with a real Gemini file URI from a previous upload, or use a dummy value to test the fallback path:

```bash
curl -s -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this document about?", "fileUri": "invalid"}' \
  | jq 'keys'
```

Expected output: `["answer", "citations"]` (both keys present, even on error path).

- [ ] **Step 4: Commit**

```bash
git add frontend/app/api/ask/route.ts
git commit -m "Return structured citations from /api/ask using responseSchema"
```

---

## Task 3: Update `/api/upload` — Document Brief

**Files:**
- Modify: `frontend/app/api/upload/route.ts`

- [ ] **Step 1: Replace `frontend/app/api/upload/route.ts` entirely**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { writeFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const briefSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: {
      type: SchemaType.STRING,
      description: "2-3 sentence overview of the document",
    },
    topics: {
      type: SchemaType.ARRAY,
      description: "4-5 short topic labels (2-4 words each)",
      items: { type: SchemaType.STRING },
    },
    questions: {
      type: SchemaType.ARRAY,
      description: "5 questions a reader might want to ask about this document",
      items: { type: SchemaType.STRING },
    },
  },
  required: ["summary", "topics", "questions"],
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tmpPath = join(tmpdir(), `docmind-${Date.now()}.pdf`);
    writeFileSync(tmpPath, buffer);

    const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);
    const uploaded = await fileManager.uploadFile(tmpPath, {
      mimeType: "application/pdf",
      displayName: file.name,
    });
    unlinkSync(tmpPath);

    const fileUri = uploaded.file.uri;

    let brief = null;
    try {
      const briefModel = genai.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: briefSchema,
        },
      });
      const briefResult = await briefModel.generateContent([
        { fileData: { mimeType: "application/pdf", fileUri } },
        {
          text: `Analyze this document and provide:
- summary: A 2-3 sentence overview of what this document is about
- topics: 4-5 short topic labels (2-4 words each) capturing the main themes
- questions: 5 questions a reader would likely want to ask about this document`,
        },
      ]);
      brief = JSON.parse(briefResult.response.text());
    } catch {
      // Brief is best-effort; upload still succeeds
    }

    return NextResponse.json({
      fileUri,
      message: `${file.name} ready`,
      brief,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", message);
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/api/upload/route.ts
git commit -m "Return DocumentBrief from /api/upload using second Gemini call"
```

---

## Task 4: Update `page.tsx` — Wire Brief State and `handleSend`

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Replace `frontend/app/page.tsx` entirely**

```typescript
"use client";
import { useState } from "react";
import type { Message, DocumentBrief } from "./types";
import LeftPanel from "./components/LeftPanel";
import UploadZone from "./components/UploadZone";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState("");
  const [fileUri, setFileUri] = useState("");
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<DocumentBrief | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setUploadedFile(file.name);
      setFileUri(data.fileUri);
      setBrief(data.brief ?? null);
      setMessages([{ role: "system", text: data.message }]);
    } catch (err) {
      setMessages([{ role: "system", text: `Upload failed: ${err instanceof Error ? err.message : "unknown error"}` }]);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async (directQuestion?: string) => {
    const q = directQuestion ?? question;
    if (!q.trim() || !fileUri) return;
    if (!directQuestion) setQuestion("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, fileUri }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: data.answer ?? data.error, citations: data.citations ?? [] },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <LeftPanel brief={brief} onAskQuestion={handleSend} />
      <div style={{ width: 1, flexShrink: 0, background: "var(--border)" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" }}>
        <div style={{
          flexShrink: 0, padding: "0.9rem 1.25rem",
          borderBottom: "1px solid var(--border-light)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "var(--surface)",
        }}>
          <span style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--fg-muted)", fontFamily: "var(--font-body)" }}>
            Chat
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {uploadedFile && (
              <span style={{
                fontSize: "0.7rem", fontFamily: "var(--font-body)",
                color: "var(--accent)", background: "var(--accent-pale)",
                border: "1px solid var(--accent-rim)", borderRadius: 20,
                padding: "0.2rem 0.65rem", maxWidth: 220,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {uploadedFile}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>

        <UploadZone uploading={uploading} uploadedFile={uploadedFile} onFileChange={handleUpload} />
        <ChatMessages messages={messages} loading={loading} />
        <ChatInput value={question} disabled={!fileUri} onChange={setQuestion} onSend={handleSend} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: errors about `LeftPanel` missing props `brief` and `onAskQuestion` — this is correct, we fix `LeftPanel` in Task 5.

- [ ] **Step 3: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "Wire brief state and directQuestion support to handleSend"
```

---

## Task 5: Update `LeftPanel.tsx` — Dynamic Document Brief

**Files:**
- Modify: `frontend/app/components/LeftPanel.tsx`

- [ ] **Step 1: Replace `frontend/app/components/LeftPanel.tsx` entirely**

```typescript
import type { DocumentBrief } from "../types";

const staticFeatures = [
  {
    label: "01",
    title: "Semantic chunking",
    body: "Your PDF is split into overlapping passages and stored as vector embeddings — not keyword indexes.",
  },
  {
    label: "02",
    title: "Grounded answers",
    body: "Responses are constrained to what is in your document. Nothing is invented.",
  },
  {
    label: "03",
    title: "Structured output",
    body: "Gemini 2.5 Flash formats every answer in Markdown — headings, bullets, and bold exactly where they help.",
  },
];

type Props = {
  brief: DocumentBrief | null;
  onAskQuestion: (q: string) => void;
};

export default function LeftPanel({ brief, onAskQuestion }: Props) {
  return (
    <aside
      style={{
        width: "38%",
        minWidth: 300,
        maxWidth: 460,
        flexShrink: 0,
        background: "var(--bg-left)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "3rem 2.5rem",
        overflow: "hidden",
      }}
    >
      <div>
        <div className="fade-up" style={{ marginBottom: "2.5rem" }}>
          <div
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--accent)",
              fontFamily: "var(--font-body)",
              marginBottom: "0.6rem",
              fontWeight: 500,
            }}
          >
            Document Intelligence
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "clamp(2.4rem, 4vw, 3.2rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "var(--fg)",
            }}
          >
            Doc<span style={{ color: "var(--accent)" }}>Mind</span>
          </h1>
          <p
            style={{
              marginTop: "0.9rem",
              fontSize: "0.85rem",
              lineHeight: 1.7,
              color: "var(--fg-secondary)",
              fontFamily: "var(--font-body)",
              maxWidth: 300,
            }}
          >
            Upload any PDF. Ask anything. Get answers drawn directly from your document — not the internet.
          </p>
        </div>

        <div
          className="fade-up delay-1"
          style={{ height: 1, background: "var(--border)", marginBottom: "2rem" }}
        />

        {brief ? (
          <div className="fade-up delay-2" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <p
              style={{
                fontSize: "0.78rem",
                lineHeight: 1.7,
                color: "var(--fg-secondary)",
                fontFamily: "var(--font-body)",
              }}
            >
              {brief.summary}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {brief.topics.map((topic) => (
                <span
                  key={topic}
                  style={{
                    fontSize: "0.65rem",
                    fontFamily: "var(--font-body)",
                    color: "var(--accent)",
                    background: "var(--accent-pale)",
                    border: "1px solid var(--accent-rim)",
                    borderRadius: 20,
                    padding: "0.15rem 0.55rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <div
                style={{
                  fontSize: "0.6rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--fg-muted)",
                  fontFamily: "var(--font-body)",
                  marginBottom: "0.4rem",
                }}
              >
                Suggested questions
              </div>
              {brief.questions.map((q) => (
                <button
                  key={q}
                  onClick={() => onAskQuestion(q)}
                  style={{
                    textAlign: "left",
                    fontSize: "0.75rem",
                    color: "var(--fg-secondary)",
                    fontFamily: "var(--font-body)",
                    lineHeight: 1.5,
                    cursor: "pointer",
                    padding: "0.35rem 0.5rem",
                    borderRadius: 6,
                    border: "1px solid transparent",
                    background: "transparent",
                    transition: "background 0.15s, border-color 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--accent-pale)";
                    e.currentTarget.style.borderColor = "var(--accent-rim)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {staticFeatures.map((f, i) => (
              <div
                key={f.label}
                className={`fade-up delay-${i + 2}`}
                style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "var(--accent)",
                    marginTop: "0.15rem",
                    flexShrink: 0,
                    letterSpacing: "0.04em",
                  }}
                >
                  {f.label}
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "var(--fg)",
                      marginBottom: "0.25rem",
                      fontFamily: "var(--font-body)",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {f.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      lineHeight: 1.65,
                      color: "var(--fg-muted)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {f.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: "2.5rem" }}>
        <div style={{ height: 1, background: "var(--border-light)", marginBottom: "1rem" }} />
        <div
          style={{
            fontSize: "0.62rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--fg-muted)",
            fontFamily: "var(--font-body)",
          }}
        >
          Gemini 2.5 Flash · Next.js · Vercel
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server and verify the left panel renders static content before upload**

```bash
cd frontend && npm run dev
```

Open `http://localhost:3000` in browser. Left panel should show the wordmark + static 01/02/03 feature list unchanged.

- [ ] **Step 4: Commit**

```bash
git add frontend/app/components/LeftPanel.tsx
git commit -m "Show dynamic document brief in left panel after upload"
```

---

## Task 6: Update `ChatMessages.tsx` — Collapsible Citations

**Files:**
- Modify: `frontend/app/components/ChatMessages.tsx`

- [ ] **Step 1: Replace `frontend/app/components/ChatMessages.tsx` entirely**

```typescript
"use client";
import { useRef, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "../types";

export type { Message };

type Props = {
  messages: Message[];
  loading: boolean;
};

export default function ChatMessages({ messages, loading }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div
      className="chat-scroll"
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      {messages.length === 0 && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
          }}
        >
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--fg-muted)",
              fontFamily: "var(--font-body)",
              textAlign: "center",
            }}
          >
            Upload a document to begin
          </p>
        </div>
      )}

      {messages.map((m, i) => {
        if (m.role === "system") {
          return (
            <div key={i} style={{ display: "flex", justifyContent: "center" }}>
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "var(--fg-muted)",
                  fontFamily: "var(--font-body)",
                  padding: "0.25rem 0.6rem",
                  borderRadius: 20,
                  background: "var(--border-light)",
                  border: "1px solid var(--border)",
                }}
              >
                {m.text}
              </span>
            </div>
          );
        }

        const isUser = m.role === "user";
        const hasCitations = !isUser && m.citations && m.citations.length > 0;
        const isExpanded = expandedIdx === i;

        return (
          <div
            key={i}
            style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
          >
            <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div
                style={{
                  borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding: "0.65rem 0.9rem",
                  fontSize: "0.83rem",
                  lineHeight: 1.6,
                  background: isUser ? "var(--user-bg)" : "var(--ai-bg)",
                  color: isUser ? "var(--user-fg)" : "var(--ai-fg)",
                  border: isUser
                    ? "1px solid var(--accent-rim)"
                    : "1px solid var(--border)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {isUser ? (
                  m.text
                ) : (
                  <div
                    className="prose prose-sm max-w-none
                      prose-p:my-1.5 prose-li:my-0.5
                      prose-headings:font-semibold prose-headings:text-[var(--fg)] prose-headings:mt-3 prose-headings:mb-1.5
                      prose-code:bg-[var(--bg-left)] prose-code:px-1 prose-code:rounded prose-code:text-[0.75rem]
                      prose-strong:text-[var(--fg)] prose-a:text-[var(--accent)]"
                    style={{ color: "var(--ai-fg)" }}
                  >
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>

              {hasCitations && (
                <div>
                  <button
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--fg-muted)",
                      fontFamily: "var(--font-body)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.1rem 0.25rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {isExpanded ? "Sources ↑" : "Sources ↓"}
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                        marginTop: "0.2rem",
                      }}
                    >
                      {m.citations!.map((c, ci) => (
                        <div
                          key={ci}
                          style={{
                            borderRadius: 8,
                            padding: "0.55rem 0.7rem",
                            background: "var(--bg-left)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "0.72rem",
                              fontFamily: "monospace",
                              color: "var(--fg-secondary)",
                              lineHeight: 1.55,
                              marginBottom: "0.3rem",
                            }}
                          >
                            "{c.excerpt}"
                          </p>
                          <p
                            style={{
                              fontSize: "0.65rem",
                              fontFamily: "var(--font-body)",
                              color: "var(--fg-muted)",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {c.relevance}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {loading && (
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <div
            style={{
              borderRadius: "16px 16px 16px 4px",
              padding: "0.65rem 1rem",
              background: "var(--ai-bg)",
              border: "1px solid var(--border)",
              display: "flex",
              gap: 5,
              alignItems: "center",
            }}
          >
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`dot dot-${n}`}
                style={{ width: 5, height: 5, background: "var(--accent)", opacity: 0.6 }}
              />
            ))}
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start dev server, upload a PDF, ask a question, verify citations appear**

```bash
cd frontend && npm run dev
```

Open `http://localhost:3000`. Upload a PDF. Ask any question about it.

Expected:
- After upload: left panel replaces feature list with summary + topic chips + 5 clickable questions
- After asking: AI response bubble appears; below it a small "Sources ↓" button
- Clicking "Sources ↓": expands to show 1–3 citation cards with excerpt + relevance phrase
- Clicking a suggested question in the left panel: sends it to chat directly

- [ ] **Step 4: Final type-check and commit**

```bash
cd frontend && npx tsc --noEmit
git add frontend/app/components/ChatMessages.tsx frontend/app/types.ts
git commit -m "Add collapsible citations to AI messages"
```

---

## Task 7: Push and Deploy

- [ ] **Step 1: Final type-check across the whole frontend**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Push to origin**

```bash
git push origin main
```

Expected: Vercel auto-deploys. Check the Vercel dashboard for build success.

- [ ] **Step 3: Smoke-test on production**

Open the deployed URL. Upload a real PDF (e.g. a research paper or technical doc). Verify:
1. Left panel shows the document brief (summary, topics, questions) after upload
2. Clicking a suggested question works end-to-end
3. AI responses show a "Sources ↓" toggle
4. Citations expand correctly in both light and dark mode
