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
        onAskQuestion={(q) => {
          setCompareMode(false);
          handleSend(q);
        }}
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
