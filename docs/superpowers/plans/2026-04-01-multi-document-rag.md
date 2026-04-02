# Multi-Document RAG + Compare Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend DocMind from single-document Q&A into a multi-document research tool with a session library and structured cross-document comparison mode.

**Architecture:** A session-scoped document library (`UploadedDoc[]`) replaces the single `fileUri` state. The existing `/api/ask` route is unchanged; a new `/api/compare` route accepts multiple file URIs and returns a `DocComparison` schema via a single multi-file Gemini call. `LeftPanel` becomes the document library UI; `ChatInput` gains an optional Compare toggle; `ChatMessages` gains a new comparison card renderer.

**Tech Stack:** Next.js 16 App Router, TypeScript, `@google/generative-ai` (SchemaType + Schema), React hooks, Tailwind CSS v4, CSS custom properties.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `app/types.ts` | Modify | Add `UploadedDoc`, `DocComparison`; add `comparison?` to `Message` |
| `app/api/compare/route.ts` | Create | New POST endpoint: multi-file Gemini call, returns `DocComparison` |
| `app/components/ChatMessages.tsx` | Modify | Add comparison card renderer for messages with `comparison` field |
| `app/components/ChatInput.tsx` | Modify | Add optional `compareMode`, `onToggleCompare`, `selectedCount` props |
| `app/components/LeftPanel.tsx` | Modify | Rebuild as document library (upload button, doc list, brief accordion, suggested questions) |
| `app/page.tsx` | Modify | Replace single-doc state with `docs[]`/`selectedUris`/`compareMode`; wire all new props |
| `app/components/UploadZone.tsx` | Delete | Upload responsibility moves to LeftPanel |

---

## Task 1: Extend Shared Types

**Files:**
- Modify: `app/types.ts`

- [ ] **Step 1: Add `UploadedDoc` and `DocComparison` types and extend `Message`**

Replace the contents of `app/types.ts` with:

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

export type UploadedDoc = {
  fileUri: string;
  fileName: string;
  brief: DocumentBrief | null;
};

export type DocComparison = {
  sharedThemes: string[];
  conflicts: string[];
  uniqueInsights: {
    fileName: string;
    insight: string;
  }[];
  synthesis: string;
};

export type Message = {
  id: string;
  role: "user" | "ai" | "system";
  text: string;
  citations?: Citation[];
  comparison?: DocComparison;
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add app/types.ts
git commit -m "feat: add UploadedDoc, DocComparison types; add comparison field to Message"
```

---

## Task 2: Create `/api/compare` Route

**Files:**
- Create: `app/api/compare/route.ts`

**Context:** The route receives `{ question, docs: { fileUri, fileName }[] }`. It passes all `fileUri`s as separate `fileData` parts in a single Gemini call. File names are included in the prompt so the model can attribute `uniqueInsights` by document name. The response schema matches `DocComparison`.

> **Note:** The spec shows `fileUris: string[]` as the request body. This plan uses `docs: { fileUri, fileName }[]` instead — the file names are needed so the model can populate `uniqueInsights.fileName` with meaningful labels rather than opaque URIs.

- [ ] **Step 1: Create `app/api/compare/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const compareSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    sharedThemes: {
      type: SchemaType.ARRAY,
      description: "Themes or topics addressed by most or all documents",
      items: { type: SchemaType.STRING },
    },
    conflicts: {
      type: SchemaType.ARRAY,
      description: "Points where documents disagree or present contradictory information",
      items: { type: SchemaType.STRING },
    },
    uniqueInsights: {
      type: SchemaType.ARRAY,
      description: "Insights found in only one document",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          fileName: {
            type: SchemaType.STRING,
            description: "Name of the document providing this insight (use exact names from the document list)",
          },
          insight: {
            type: SchemaType.STRING,
            description: "What this document uniquely contributes",
          },
        },
        required: ["fileName", "insight"],
      },
    },
    synthesis: {
      type: SchemaType.STRING,
      description: "Markdown-formatted prose answer synthesizing across all documents in relation to the question",
    },
  },
  required: ["sharedThemes", "conflicts", "uniqueInsights", "synthesis"],
};

type DocRef = { fileUri: string; fileName: string };

export async function POST(req: NextRequest) {
  try {
    const { question, docs }: { question: string; docs: DocRef[] } = await req.json();

    if (!Array.isArray(docs) || docs.length < 2) {
      return NextResponse.json(
        { error: "Compare requires at least 2 documents" },
        { status: 400 }
      );
    }

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "No question provided." },
        { status: 400 }
      );
    }

    const model = genai.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: compareSchema,
      },
    });

    const fileParts = docs.map((doc) => ({
      fileData: { mimeType: "application/pdf" as const, fileUri: doc.fileUri },
    }));

    const docList = docs.map((d, i) => `${i + 1}. ${d.fileName}`).join("\n");

    const result = await model.generateContent([
      ...fileParts,
      {
        text: `You are analyzing ${docs.length} documents listed below. Answer the question by comparing them across all documents simultaneously.

Documents:
${docList}

For the response:
- sharedThemes: list themes or topics that most or all documents address
- conflicts: list specific points where documents disagree or contradict each other
- uniqueInsights: for each document, note what it covers that the others do not (use exact document names from the list above)
- synthesis: a markdown-formatted prose answer to the question drawing on all documents

Question: ${question}`,
      },
    ]);

    const parsed = JSON.parse(result.response.text());
    return NextResponse.json({ comparison: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Compare error:", message);
    return NextResponse.json({ error: `Compare failed: ${message}` }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add app/api/compare/route.ts
git commit -m "feat: add /api/compare route for multi-document structured comparison"
```

---

## Task 3: Add Comparison Card Renderer to `ChatMessages`

**Files:**
- Modify: `app/components/ChatMessages.tsx`

**Context:** Messages with a `comparison` field (compare-mode AI responses) need a distinct card layout. Regular messages are untouched. The `comparison` field on `Message` is optional, so no existing rendering breaks.

- [ ] **Step 1: Add comparison card render branch**

In `app/components/ChatMessages.tsx`, locate the `messages.map((m, i) => {` block. The current structure is:

```typescript
{messages.map((m, i) => {
  if (m.role === "system") { ... }
  const isUser = m.role === "user";
  ...
  return ( <div key={m.id} ... > ... </div> );
})}
```

Add a new branch **between** the `system` check and the `isUser` declaration:

```typescript
{messages.map((m, i) => {
  if (m.role === "system") {
    return (
      <div key={m.id} style={{ display: "flex", justifyContent: "center" }}>
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

  // NEW: comparison card for compare-mode AI responses
  if (m.comparison) {
    return (
      <div key={m.id} style={{ display: "flex", justifyContent: "flex-start" }}>
        <div style={{ maxWidth: "90%", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          <div
            style={{
              borderRadius: "16px 16px 16px 4px",
              padding: "1rem 1.1rem",
              background: "var(--ai-bg)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {m.comparison.sharedThemes.length > 0 && (
              <div>
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
                  Shared Themes
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  {m.comparison.sharedThemes.map((t, ti) => (
                    <li
                      key={ti}
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--fg-secondary)",
                        fontFamily: "var(--font-body)",
                        lineHeight: 1.5,
                      }}
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {m.comparison.conflicts.length > 0 && (
              <div>
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
                  Conflicts
                </div>
                <ul style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  {m.comparison.conflicts.map((c, ci) => (
                    <li
                      key={ci}
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--fg-secondary)",
                        fontFamily: "var(--font-body)",
                        lineHeight: 1.5,
                      }}
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {m.comparison.uniqueInsights.length > 0 && (
              <div>
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
                  Unique Insights
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {m.comparison.uniqueInsights.map((u, ui) => (
                    <div
                      key={ui}
                      style={{
                        borderRadius: 6,
                        padding: "0.35rem 0.55rem",
                        background: "var(--bg-left)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.6rem",
                          color: "var(--accent)",
                          fontFamily: "var(--font-body)",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          marginRight: "0.5rem",
                        }}
                      >
                        {u.fileName}
                      </span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--fg-secondary)",
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        {u.insight}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
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
                Synthesis
              </div>
              <div
                className="prose prose-sm max-w-none
                  prose-p:my-1.5 prose-li:my-0.5
                  prose-headings:font-semibold prose-headings:text-[var(--fg)] prose-headings:mt-3 prose-headings:mb-1.5
                  prose-code:bg-[var(--bg-left)] prose-code:px-1 prose-code:rounded prose-code:text-[0.75rem]
                  prose-strong:text-[var(--fg)] prose-a:text-[var(--accent)]"
                style={{ color: "var(--ai-fg)" }}
              >
                <ReactMarkdown>{m.comparison.synthesis}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // existing user/ai rendering below (unchanged)
  const isUser = m.role === "user";
  // ... rest of existing code unchanged
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add app/components/ChatMessages.tsx
git commit -m "feat: add comparison card renderer to ChatMessages"
```

---

## Task 4: Add Compare Toggle to `ChatInput`

**Files:**
- Modify: `app/components/ChatInput.tsx`

**Context:** Three new props are added, all optional with defaults so `page.tsx` still compiles unchanged. The Compare button is disabled when `selectedCount < 2`. When `compareMode` is active, the send button label changes to "Compare" and the placeholder text updates.

- [ ] **Step 1: Replace `app/components/ChatInput.tsx` with**

```typescript
"use client";

type Props = {
  value: string;
  disabled: boolean;
  onChange: (v: string) => void;
  onSend: (directQuestion?: string) => void;
  compareMode?: boolean;
  onToggleCompare?: () => void;
  selectedCount?: number;
};

export default function ChatInput({
  value,
  disabled,
  onChange,
  onSend,
  compareMode = false,
  onToggleCompare,
  selectedCount = 0,
}: Props) {
  const canCompare = selectedCount >= 2;

  return (
    <div
      style={{
        flexShrink: 0,
        padding: "0.75rem 1.25rem 1.25rem",
        borderTop: "1px solid var(--border-light)",
        background: "var(--bg)",
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        {onToggleCompare && (
          <button
            disabled={!canCompare}
            onClick={onToggleCompare}
            title={
              canCompare
                ? compareMode
                  ? "Switch to single-doc mode"
                  : "Switch to compare mode"
                : "Select 2+ documents to compare"
            }
            style={{
              borderRadius: 10,
              padding: "0.65rem 0.8rem",
              fontSize: "0.75rem",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              cursor: canCompare ? "pointer" : "not-allowed",
              background:
                compareMode && canCompare ? "var(--accent-pale)" : "var(--border-light)",
              color:
                compareMode && canCompare ? "var(--accent)" : "var(--fg-muted)",
              border: "1.5px solid",
              borderColor:
                compareMode && canCompare ? "var(--accent-rim)" : "var(--border)",
              opacity: canCompare ? 1 : 0.45,
              letterSpacing: "0.01em",
              flexShrink: 0,
            }}
          >
            Compare
          </button>
        )}
        <input
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) onSend();
          }}
          placeholder={
            disabled
              ? compareMode
                ? "Select 2+ documents to compare"
                : "Upload a document first"
              : compareMode
              ? "Ask a question across selected documents…"
              : "Ask anything about your document…"
          }
          style={{
            flex: 1,
            borderRadius: 10,
            padding: "0.65rem 0.9rem",
            fontSize: "0.83rem",
            outline: "none",
            fontFamily: "var(--font-body)",
            background: "var(--surface)",
            color: "var(--fg)",
            border: "1.5px solid var(--border)",
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? "not-allowed" : "text",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => {
            if (!disabled) e.currentTarget.style.borderColor = "var(--accent-rim)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        />
        <button
          disabled={disabled || !value.trim()}
          onClick={() => onSend()}
          className="send-btn"
          style={{
            borderRadius: 10,
            padding: "0.65rem 1.1rem",
            fontSize: "0.8rem",
            fontWeight: 500,
            fontFamily: "var(--font-body)",
            cursor: disabled || !value.trim() ? "not-allowed" : "pointer",
            background:
              disabled || !value.trim() ? "var(--border-light)" : "var(--accent-pale)",
            color:
              disabled || !value.trim() ? "var(--fg-muted)" : "var(--accent)",
            border: "1.5px solid",
            borderColor:
              disabled || !value.trim() ? "var(--border)" : "var(--accent-rim)",
            opacity: disabled ? 0.45 : 1,
            letterSpacing: "0.01em",
          }}
        >
          {compareMode ? "Compare" : "Send"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (clean). `page.tsx` still compiles because all new props are optional.

- [ ] **Step 3: Commit**

```bash
git add app/components/ChatInput.tsx
git commit -m "feat: add compare toggle to ChatInput (optional props, backward compatible)"
```

---

## Task 5: Rebuild `LeftPanel` + Refactor `page.tsx`

**Files:**
- Modify: `app/components/LeftPanel.tsx`
- Modify: `app/page.tsx`

**Context:** LeftPanel and page.tsx are refactored together in one task because changing LeftPanel's Props type breaks page.tsx until page.tsx is updated. After this task, TypeScript is clean again.

The new LeftPanel shows the static feature list when `docs.length === 0`, and the document library when docs exist. It manages its own `<input type="file">` and `expandedUri` state for the per-doc brief accordion.

### Step 1: Replace `app/components/LeftPanel.tsx`

- [ ] **Step 1: Write the new LeftPanel**

```typescript
"use client";
import { useRef, useState } from "react";
import type { UploadedDoc } from "../types";

const staticFeatures = [
  {
    label: "01",
    title: "Document-native reasoning",
    body: "Your PDF is sent directly to Gemini's context window — no chunking, no retrieval step, no lost nuance.",
  },
  {
    label: "02",
    title: "Citation-grounded answers",
    body: "Every response is paired with verbatim excerpts from your document so you can verify the source.",
  },
  {
    label: "03",
    title: "Structured output",
    body: "Answers are schema-constrained JSON — not free-form text. Hallucination is an engineering problem, not just a prompt one.",
  },
];

type Props = {
  docs: UploadedDoc[];
  selectedUris: Set<string>;
  onToggleDoc: (fileUri: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  onAskQuestion: (q: string) => void;
};

export default function LeftPanel({
  docs,
  selectedUris,
  onToggleDoc,
  onUpload,
  uploading,
  onAskQuestion,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [expandedUri, setExpandedUri] = useState<string | null>(null);

  const selectedDoc =
    selectedUris.size === 1
      ? docs.find((d) => selectedUris.has(d.fileUri)) ?? null
      : null;

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
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
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
            Upload any PDF. Ask anything. Get answers drawn directly from your
            document — not the internet.
          </p>
        </div>

        <div
          className="fade-up delay-1"
          style={{ height: 1, background: "var(--border)", marginBottom: "2rem", flexShrink: 0 }}
        />

        {docs.length > 0 ? (
          <div
            className="fade-up delay-2"
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minHeight: 0 }}
          >
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                textAlign: "left",
                fontSize: "0.7rem",
                color: uploading ? "var(--fg-muted)" : "var(--accent)",
                fontFamily: "var(--font-body)",
                cursor: uploading ? "not-allowed" : "pointer",
                padding: "0.3rem 0.5rem",
                borderRadius: 6,
                border: "1px dashed var(--accent-rim)",
                background: "transparent",
                marginBottom: "0.25rem",
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              {uploading ? "Uploading…" : "+ Upload another PDF"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  onUpload(f);
                  e.target.value = "";
                }
              }}
            />

            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {docs.map((doc) => (
                <div key={doc.fileUri}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.35rem 0.5rem",
                      borderRadius: 6,
                      border: `1px solid ${selectedUris.has(doc.fileUri) ? "var(--accent-rim)" : "transparent"}`,
                      background: selectedUris.has(doc.fileUri)
                        ? "var(--accent-pale)"
                        : "transparent",
                      cursor: "pointer",
                    }}
                    onClick={() => onToggleDoc(doc.fileUri)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUris.has(doc.fileUri)}
                      onChange={() => onToggleDoc(doc.fileUri)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        cursor: "pointer",
                        accentColor: "var(--accent)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--fg-secondary)",
                        fontFamily: "var(--font-body)",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.fileName}
                    </span>
                    {doc.brief && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedUri(
                            expandedUri === doc.fileUri ? null : doc.fileUri
                          );
                        }}
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--fg-muted)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.1rem 0.2rem",
                          flexShrink: 0,
                        }}
                      >
                        {expandedUri === doc.fileUri ? "↑" : "↓"}
                      </button>
                    )}
                  </div>

                  {expandedUri === doc.fileUri && doc.brief && (
                    <div
                      style={{
                        marginLeft: "1.5rem",
                        marginTop: "0.2rem",
                        marginBottom: "0.2rem",
                        padding: "0.5rem 0.6rem",
                        borderRadius: 6,
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "0.72rem",
                          lineHeight: 1.6,
                          color: "var(--fg-muted)",
                          fontFamily: "var(--font-body)",
                          margin: "0 0 0.4rem 0",
                        }}
                      >
                        {doc.brief.summary}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                        {doc.brief.topics.map((topic) => (
                          <span
                            key={topic}
                            style={{
                              fontSize: "0.6rem",
                              fontFamily: "var(--font-body)",
                              color: "var(--accent)",
                              background: "var(--accent-pale)",
                              border: "1px solid var(--accent-rim)",
                              borderRadius: 20,
                              padding: "0.1rem 0.45rem",
                            }}
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {selectedDoc?.brief && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginTop: "0.5rem" }}>
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
                {selectedDoc.brief.questions.map((q) => (
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
            )}
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

### Step 2: Replace `app/page.tsx`

- [ ] **Step 2: Write the new page.tsx**

```typescript
"use client";
import { useState } from "react";
import type { Message, UploadedDoc } from "./types";
import LeftPanel from "./components/LeftPanel";
import ChatMessages from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [selectedUris, setSelectedUris] = useState<Set<string>>(new Set());
  const [compareMode, setCompareMode] = useState(false);

  const handleUpload = async (file: File) => {
    if (loading) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const newDoc: UploadedDoc = {
        fileUri: data.fileUri,
        fileName: file.name,
        brief: data.brief ?? null,
      };
      setDocs((prev) => [...prev, newDoc]);
      setSelectedUris((prev) => new Set([...prev, data.fileUri]));
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "system", text: data.message },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          text: `Upload failed: ${err instanceof Error ? err.message : "unknown error"}`,
        },
      ]);
    } finally {
      setUploading(false);
    }
  };

  const handleToggleDoc = (fileUri: string) => {
    setSelectedUris((prev) => {
      const next = new Set(prev);
      if (next.has(fileUri)) next.delete(fileUri);
      else next.add(fileUri);
      return next;
    });
  };

  const handleSend = async (directQuestion?: string) => {
    const q = directQuestion ?? question;
    if (!q.trim() || selectedUris.size === 0) return;
    if (compareMode && selectedUris.size < 2) return;
    if (!directQuestion) setQuestion("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: q },
    ]);
    setLoading(true);
    try {
      if (compareMode) {
        const selectedDocs = docs
          .filter((d) => selectedUris.has(d.fileUri))
          .map((d) => ({ fileUri: d.fileUri, fileName: d.fileName }));
        const res = await fetch("/api/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, docs: selectedDocs }),
        });
        const data = await res.json();
        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "system", text: data.error },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "ai", text: "", comparison: data.comparison },
          ]);
        }
      } else {
        const fileUri = [...selectedUris][0];
        const res = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: q, fileUri }),
        });
        const data = await res.json();
        if (data.error) {
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "system", text: data.error },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "ai",
              text: data.answer,
              citations: data.citations ?? [],
            },
          ]);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "system",
          text: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const topBarLabel =
    selectedUris.size === 0
      ? null
      : selectedUris.size === 1
      ? docs.find((d) => selectedUris.has(d.fileUri))?.fileName ?? null
      : `${selectedUris.size} documents`;

  const canSend =
    selectedUris.size >= 1 && (!compareMode || selectedUris.size >= 2);

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      <LeftPanel
        docs={docs}
        selectedUris={selectedUris}
        onToggleDoc={handleToggleDoc}
        onUpload={handleUpload}
        uploading={uploading}
        onAskQuestion={handleSend}
      />
      <div style={{ width: 1, flexShrink: 0, background: "var(--border)" }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: "0.9rem 1.25rem",
            borderBottom: "1px solid var(--border-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--surface)",
          }}
        >
          <span
            style={{
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--fg-muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            Chat
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {topBarLabel && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontFamily: "var(--font-body)",
                  color: "var(--accent)",
                  background: "var(--accent-pale)",
                  border: "1px solid var(--accent-rim)",
                  borderRadius: 20,
                  padding: "0.2rem 0.65rem",
                  maxWidth: 220,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {topBarLabel}
              </span>
            )}
            <ThemeToggle />
          </div>
        </div>

        <ChatMessages messages={messages} loading={loading} />
        <ChatInput
          value={question}
          disabled={!canSend}
          onChange={setQuestion}
          onSend={handleSend}
          compareMode={compareMode}
          onToggleCompare={() => setCompareMode((m) => !m)}
          selectedCount={selectedUris.size}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no output (clean).

- [ ] **Step 4: Smoke test in browser**

```bash
npm run dev
```

Open `http://localhost:3000`. Verify:
1. Left panel shows static features (01/02/03) — no docs yet
2. Upload one PDF via UploadZone... wait, UploadZone is still rendered. This is expected — Task 6 removes it. The LeftPanel upload button is also present at this point. Both work, both call the new `handleUpload(file: File)`.

Actually wait — the current `page.tsx` **no longer renders `<UploadZone>`** (it was removed in this task's new page.tsx). Left panel's "Upload PDF" button is the only upload path now. Verify:

1. Left panel shows static features
2. Click "Upload another PDF" button in left panel — should open file picker
3. After upload: left panel shows doc list with checkbox, doc is selected by default, suggested questions appear
4. Ask a question — regular AI response with citations
5. Upload second PDF — left panel shows 2 docs, both checked
6. "Compare" button in chat input becomes active — click it to enable compare mode
7. Type a question, click "Compare" — response shows Shared Themes / Conflicts / Unique Insights / Synthesis

- [ ] **Step 5: Commit**

```bash
git add app/components/LeftPanel.tsx app/page.tsx
git commit -m "feat: rebuild LeftPanel as document library, refactor page.tsx to multi-doc state"
```

---

## Task 6: Delete `UploadZone` and Final Build Verification

**Files:**
- Delete: `app/components/UploadZone.tsx`

- [ ] **Step 1: Delete the file**

```bash
git rm app/components/UploadZone.tsx
```

- [ ] **Step 2: Verify no remaining imports**

```bash
grep -r "UploadZone" app/
```

Expected: no output.

- [ ] **Step 3: Run full build**

```bash
npm run build
```

Expected: build succeeds with no errors. Next.js may print bundle sizes — that's fine. Any TypeScript error here is a bug introduced in a previous task.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: complete multi-document RAG — delete UploadZone, verify build clean"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| `UploadedDoc` type | Task 1 |
| `DocComparison` type | Task 1 |
| `comparison?` field on `Message` | Task 1 |
| `POST /api/compare` route | Task 2 |
| Input validation (< 2 docs, empty question) | Task 2 |
| Comparison card in ChatMessages (4 sections) | Task 3 |
| Compare toggle in ChatInput | Task 4 |
| Toggle disabled when < 2 docs selected | Task 4 |
| Send button label changes to "Compare" | Task 4 |
| Placeholder changes in compare mode | Task 4 |
| LeftPanel document library (upload, checklist, accordion brief) | Task 5 |
| Static features when no docs | Task 5 |
| Suggested questions when exactly 1 doc selected | Task 5 |
| page.tsx multi-doc state | Task 5 |
| handleUpload appends to library, auto-selects | Task 5 |
| handleSend routes to ask or compare based on mode | Task 5 |
| Top bar shows filename (1 doc) or count (N docs) | Task 5 |
| UploadZone deleted | Task 6 |
| Build clean | Task 6 |

All spec requirements covered. No gaps.

### Type Consistency Check

- `UploadedDoc` defined in Task 1, used in Tasks 5 (LeftPanel props, page.tsx state)
- `DocComparison` defined in Task 1, used in Tasks 3 (ChatMessages), 5 (page.tsx handleSend)
- `Message.comparison?: DocComparison` defined in Task 1, populated in Task 5, rendered in Task 3
- `handleUpload(file: File)` defined in Task 5 (page.tsx), called from Task 5 (LeftPanel `onUpload` prop)
- `/api/compare` request body: `{ question, docs: { fileUri, fileName }[] }` — defined in Task 2, sent from Task 5
- `onToggleDoc(fileUri: string)` defined in Task 5 (LeftPanel Props), implemented in Task 5 (page.tsx `handleToggleDoc`)

All consistent. ✓
