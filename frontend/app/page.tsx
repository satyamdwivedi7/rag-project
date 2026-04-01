"use client";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const features = [
  {
    icon: "◈",
    title: "Semantic Retrieval",
    desc: "ChromaDB stores your document as vector embeddings, finding the most relevant passages for every question.",
  },
  {
    icon: "◉",
    title: "Grounded Answers",
    desc: "Responses are constrained to your document. No hallucinations — only what is actually on the page.",
  },
  {
    icon: "◐",
    title: "Gemini 2.5 Flash",
    desc: "Google's latest model synthesises retrieved context into clear, structured, markdown-formatted answers.",
  },
];

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState("");
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const uploadPDF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BACKEND}/upload`, { method: "POST", body: form });
      const data = await res.json();
      setUploadedFile(file.name);
      setMessages([{ role: "system", text: data.message }]);
    } catch {
      setMessages([{ role: "system", text: "Upload failed. Is the backend running?" }]);
    } finally {
      setUploading(false);
    }
  };

  const sendMessage = async () => {
    if (!question.trim() || !uploadedFile) return;
    const q = question;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── LEFT PANEL — About ─────────────────────────────────────── */}
      <div
        style={{
          width: "38%",
          minWidth: 320,
          maxWidth: 480,
          flexShrink: 0,
          background: "var(--panel-left)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "2.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Warm glow at top-left */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          width: 280, height: 280, borderRadius: "50%", zIndex: 1, pointerEvents: "none",
          background: "radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)",
        }} />
        {/* Grain overlay */}
        <div className="grain" style={{
          position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", opacity: 0.35,
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 3 }}>
          {/* Eyebrow */}
          <div style={{
            fontSize: "0.65rem", letterSpacing: "0.22em", textTransform: "uppercase",
            color: "rgba(201,168,76,0.5)", fontFamily: "var(--font-body)", marginBottom: "1rem",
          }}>
            Document Intelligence
          </div>

          {/* Wordmark */}
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 600,
            fontSize: "clamp(2.8rem, 5vw, 4rem)", lineHeight: 1,
            letterSpacing: "-0.02em", margin: 0, color: "#EDE6D6",
          }}>
            Doc<span style={{ color: "var(--gold)" }}>Mind</span>
          </h1>

          {/* Tagline */}
          <p style={{
            marginTop: "1rem", fontSize: "0.82rem", lineHeight: 1.7,
            color: "#6A6050", fontFamily: "var(--font-body)",
          }}>
            Upload any PDF. Ask anything. Get precise answers drawn directly from your document.
          </p>

          {/* Divider */}
          <div style={{
            height: 1, margin: "2rem 0",
            background: "linear-gradient(to right, rgba(201,168,76,0.25), transparent)",
          }} />

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
            {features.map((f) => (
              <div key={f.title} style={{ display: "flex", gap: "1rem" }}>
                <div style={{
                  fontSize: "1.1rem", flexShrink: 0, marginTop: 2,
                  color: "var(--gold)", fontFamily: "var(--font-display)",
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.3rem",
                    color: "#D4C9B0", fontFamily: "var(--font-display)",
                    letterSpacing: "0.03em",
                  }}>
                    {f.title}
                  </div>
                  <div style={{
                    fontSize: "0.72rem", lineHeight: 1.65, color: "#4A4438",
                    fontFamily: "var(--font-body)",
                  }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: "relative", zIndex: 3 }}>
          <div style={{
            height: 1, marginBottom: "1.25rem",
            background: "linear-gradient(to right, rgba(201,168,76,0.12), transparent)",
          }} />
          <div style={{
            fontSize: "0.6rem", letterSpacing: "0.15em",
            color: "#302C26", fontFamily: "var(--font-body)", textTransform: "uppercase",
          }}>
            ChromaDB · Gemini 2.5 Flash · FastAPI · Next.js
          </div>
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────────── */}
      <div style={{
        width: 1, flexShrink: 0,
        background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.18) 25%, rgba(201,168,76,0.18) 75%, transparent)",
      }} />

      {/* ── RIGHT PANEL — Chat ─────────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: "var(--panel-right)", overflow: "hidden",
      }}>

        {/* Top bar */}
        <div style={{
          flexShrink: 0, padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{
            fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase",
            color: "#2A2A35", fontFamily: "var(--font-body)",
          }}>
            Chat
          </span>
          {uploadedFile && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "0.3rem 0.75rem", borderRadius: 999, fontSize: "0.7rem",
              background: "var(--gold-dim)", color: "var(--gold)",
              border: "1px solid var(--gold-border)",
              fontFamily: "var(--font-body)", maxWidth: 220,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }} />
              {uploadedFile}
            </div>
          )}
        </div>

        {/* Upload zone */}
        <div style={{ flexShrink: 0, padding: "1rem 1.5rem 0" }}>
          <div
            className="upload-zone"
            onClick={() => fileRef.current?.click()}
            style={{
              borderRadius: 12, padding: "0.75rem 1rem",
              textAlign: "center", cursor: "pointer",
              border: uploadedFile
                ? "1px solid var(--gold-border)"
                : "1px dashed rgba(255,255,255,0.07)",
              background: uploadedFile ? "var(--gold-dim)" : "var(--surface)",
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={uploadPDF} />
            <p style={{
              margin: 0, fontSize: "0.72rem",
              color: uploading ? "var(--gold)" : uploadedFile ? "#9A8E7A" : "#2E2C38",
              fontFamily: "var(--font-body)",
            }}>
              {uploading
                ? "Processing document…"
                : uploadedFile
                ? `↑ Replace · ${uploadedFile}`
                : "Drop a PDF here or click to upload"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div
          className="chat-scroll"
          style={{
            flex: 1, overflowY: "auto",
            padding: "1rem 1.5rem", display: "flex",
            flexDirection: "column", gap: "0.75rem",
          }}
        >
          {messages.length === 0 && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ fontSize: "0.72rem", color: "#1E1E28", fontFamily: "var(--font-body)" }}>
                Upload a document to begin
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : m.role === "system" ? "center" : "flex-start",
            }}>
              <div style={{
                borderRadius: 16,
                padding: m.role === "system" ? "0.3rem 0.75rem" : "0.75rem 1rem",
                maxWidth: m.role === "system" ? "90%" : "82%",
                fontSize: m.role === "system" ? "0.65rem" : "0.82rem",
                lineHeight: 1.6,
                ...(m.role === "user"
                  ? { background: "var(--gold-dim)", color: "#E8D8A0", border: "1px solid var(--gold-border)" }
                  : m.role === "ai"
                  ? { background: "var(--surface)", color: "#C4C0D4", border: "1px solid var(--border)" }
                  : { background: "transparent", color: "#3A3840", border: "none" }),
              }}>
                {m.role === "ai" ? (
                  <div className="prose prose-invert prose-sm max-w-none
                                  prose-p:my-1.5 prose-li:my-0.5
                                  prose-headings:mb-2 prose-headings:mt-3
                                  prose-code:bg-white/10 prose-code:px-1 prose-code:rounded prose-code:text-xs
                                  prose-strong:text-amber-200/80">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                ) : m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                borderRadius: 16, padding: "0.75rem 1rem",
                background: "var(--surface)", border: "1px solid var(--border)",
                display: "flex", gap: 5, alignItems: "center",
              }}>
                <span className="dot-1" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", display: "inline-block" }} />
                <span className="dot-2" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", display: "inline-block" }} />
                <span className="dot-3" style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", display: "inline-block" }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={{
          flexShrink: 0, padding: "0.75rem 1.5rem 1.25rem",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              disabled={!uploadedFile}
              style={{
                flex: 1, borderRadius: 12,
                padding: "0.75rem 1rem", fontSize: "0.82rem",
                outline: "none", fontFamily: "var(--font-body)",
                background: "var(--surface)", color: "#C4C0D4",
                border: uploadedFile ? "1px solid rgba(255,255,255,0.1)" : "1px solid var(--border)",
                opacity: uploadedFile ? 1 : 0.35,
                cursor: uploadedFile ? "text" : "not-allowed",
                transition: "border-color 0.2s ease",
              }}
              placeholder={uploadedFile ? "Ask anything about your document…" : "Upload a document first"}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              disabled={!uploadedFile}
              onClick={sendMessage}
              className="send-btn"
              style={{
                borderRadius: 12, padding: "0.75rem 1.25rem",
                fontSize: "0.78rem", fontWeight: 500,
                fontFamily: "var(--font-body)", cursor: uploadedFile ? "pointer" : "not-allowed",
                background: uploadedFile ? "var(--gold-dim)" : "var(--surface)",
                color: uploadedFile ? "var(--gold)" : "#2A2835",
                border: uploadedFile ? "1px solid var(--gold-border)" : "1px solid var(--border)",
                transition: "background 0.2s ease",
                opacity: uploadedFile ? 1 : 0.5,
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
