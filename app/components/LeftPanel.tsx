"use client";
import { useRef, useState } from "react";
import type { UploadedDoc } from "../types";

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
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const selectedDoc =
    selectedUris.size === 1
      ? docs.find((d) => selectedUris.has(d.fileUri)) ?? null
      : null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files)
      .filter(
        (f) =>
          f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      )
      .forEach((f) => onUpload(f));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const nudgeText =
    selectedUris.size === 0
      ? "Select documents above, then ask in the chat →"
      : selectedUris.size === 1
      ? "Ready — ask anything in the chat →"
      : `${selectedUris.size} docs selected — ask or compare in the chat →`;

  return (
    <aside
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        width: "38%",
        minWidth: 300,
        maxWidth: 460,
        flexShrink: 0,
        background: "var(--bg-left)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--accent-pale)",
            border: "2px dashed var(--accent)",
            borderRadius: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>
            <polyline points="16 8 12 4 8 8"/>
            <line x1="12" y1="4" x2="12" y2="16"/>
          </svg>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent)", fontFamily: "var(--font-body)" }}>
            Drop PDFs to upload
          </span>
          <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontFamily: "var(--font-body)", opacity: 0.7 }}>
            Multiple files supported
          </span>
        </div>
      )}

      {/* Hidden file input — always present */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Brand header */}
      <div style={{ padding: "1.5rem 1.75rem 1rem", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "0.58rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
            fontFamily: "var(--font-body)",
            marginBottom: "0.35rem",
            fontWeight: 500,
          }}
        >
          Document Intelligence
        </div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "clamp(1.9rem, 3vw, 2.5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            color: "var(--fg)",
          }}
        >
          Doc<span style={{ color: "var(--accent)" }}>Mind</span>
        </h1>
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "0 1.75rem 1.25rem",
        }}
      >
        {docs.length === 0 ? (
          /* ─── Empty state ─── */
          <div
            className="fade-up delay-1"
            style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
          >
            {/* Step 1 */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                1
              </div>
              <span
                style={{
                  fontSize: "0.73rem",
                  fontWeight: 600,
                  color: "var(--fg)",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "-0.01em",
                }}
              >
                Upload your PDFs here
              </span>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => !uploading && fileRef.current?.click()}
              style={{
                border: "2px dashed var(--border)",
                borderRadius: 10,
                padding: "1.75rem 1rem",
                background: "transparent",
                cursor: uploading ? "not-allowed" : "pointer",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.55rem",
                transition: "background 0.15s, border-color 0.15s",
              }}
              className="upload-zone"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--fg-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="12" x2="12" y2="18"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: uploading ? "var(--fg-muted)" : "var(--fg-secondary)",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                }}
              >
                {uploading ? "Uploading…" : "Click to browse, or drag PDFs here"}
              </div>
              <div
                style={{
                  fontSize: "0.66rem",
                  color: "var(--fg-muted)",
                  fontFamily: "var(--font-body)",
                }}
              >
                Multiple files supported — PDF only
              </div>
            </div>

            {/* Divider + Step 2 */}
            <div style={{ height: 1, background: "var(--border-light)" }} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                opacity: 0.35,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  border: "1.5px solid var(--fg-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  color: "var(--fg-muted)",
                  flexShrink: 0,
                }}
              >
                2
              </div>
              <span
                style={{
                  fontSize: "0.73rem",
                  fontWeight: 600,
                  color: "var(--fg-muted)",
                  fontFamily: "var(--font-body)",
                  letterSpacing: "-0.01em",
                }}
              >
                Ask questions in the chat →
              </span>
            </div>

            {/* Feature bullets */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.8rem",
                marginTop: "0.25rem",
              }}
            >
              {[
                {
                  title: "Direct context window",
                  body: "Your PDF goes straight into Gemini — no chunking or retrieval step.",
                },
                {
                  title: "Citation-grounded answers",
                  body: "Every response includes verbatim excerpts from the source.",
                },
                {
                  title: "Cross-document compare",
                  body: "Upload 2+ PDFs to find shared themes, conflicts, and unique insights.",
                },
              ].map((f) => (
                <div key={f.title} style={{ display: "flex", gap: "0.7rem" }}>
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flexShrink: 0,
                      marginTop: "0.45rem",
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        color: "var(--fg)",
                        fontFamily: "var(--font-body)",
                        marginBottom: "0.15rem",
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.69rem",
                        lineHeight: 1.55,
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
          </div>
        ) : (
          /* ─── Populated state ─── */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}
          >
            {/* Documents header row */}
            <div
              className="fade-up"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0,
                marginBottom: "0.5rem",
                paddingBottom: "0.6rem",
                borderBottom: "1px solid var(--border-light)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <span
                  style={{
                    fontSize: "0.62rem",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                    color: "var(--fg-muted)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                  }}
                >
                  Documents
                </span>
                <span
                  style={{
                    fontSize: "0.6rem",
                    fontFamily: "var(--font-body)",
                    color: "var(--accent)",
                    background: "var(--accent-pale)",
                    border: "1px solid var(--accent-rim)",
                    borderRadius: 20,
                    padding: "0.05rem 0.4rem",
                    fontWeight: 600,
                  }}
                >
                  {docs.length}
                </span>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  fontSize: "0.65rem",
                  color: uploading ? "var(--fg-muted)" : "var(--accent)",
                  fontFamily: "var(--font-body)",
                  cursor: uploading ? "not-allowed" : "pointer",
                  padding: "0.22rem 0.55rem",
                  borderRadius: 6,
                  border: "1px dashed var(--accent-rim)",
                  background: "transparent",
                  letterSpacing: "0.03em",
                  transition: "background 0.15s",
                }}
              >
                {uploading ? "Uploading…" : "+ Add more"}
              </button>
            </div>

            {/* Doc list */}
            <div
              className="chat-scroll"
              style={{
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.2rem",
                flex: 1,
                minHeight: 0,
              }}
            >
              {docs.map((doc) => (
                <div key={doc.fileUri}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.35rem 0.5rem",
                      borderRadius: 7,
                      border: `1px solid ${
                        selectedUris.has(doc.fileUri)
                          ? "var(--accent-rim)"
                          : "transparent"
                      }`,
                      background: selectedUris.has(doc.fileUri)
                        ? "var(--accent-pale)"
                        : "transparent",
                      cursor: "pointer",
                      transition: "background 0.12s, border-color 0.12s",
                    }}
                    onClick={() => onToggleDoc(doc.fileUri)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUris.has(doc.fileUri)}
                      onChange={() => onToggleDoc(doc.fileUri)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ cursor: "pointer", accentColor: "var(--accent)", flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: "0.74rem",
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
                          fontSize: "0.71rem",
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

            {/* Suggested questions */}
            {selectedDoc?.brief && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.2rem",
                  marginTop: "0.4rem",
                  paddingTop: "0.4rem",
                  borderTop: "1px solid var(--border-light)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "0.58rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--fg-muted)",
                    fontFamily: "var(--font-body)",
                    marginBottom: "0.2rem",
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
                      fontSize: "0.73rem",
                      color: "var(--fg-secondary)",
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                      cursor: "pointer",
                      padding: "0.3rem 0.5rem",
                      borderRadius: 6,
                      border: "1px solid transparent",
                      background: "transparent",
                      transition: "background 0.12s, border-color 0.12s",
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

            {/* Nudge to chat */}
            <div
              style={{
                flexShrink: 0,
                marginTop: "0.75rem",
                padding: "0.5rem 0.75rem",
                background: "var(--accent-pale)",
                border: "1px solid var(--accent-rim)",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.67rem",
                  color: "var(--accent)",
                  fontFamily: "var(--font-body)",
                  lineHeight: 1.45,
                }}
              >
                {nudgeText}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          padding: "0.65rem 1.75rem",
          borderTop: "1px solid var(--border-light)",
        }}
      >
        <div
          style={{
            fontSize: "0.6rem",
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
