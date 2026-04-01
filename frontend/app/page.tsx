"use client";
import { useState } from "react";
import LeftPanel from "./components/LeftPanel";
import UploadZone from "./components/UploadZone";
import ChatMessages, { type Message } from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setMessages([{ role: "system", text: "Upload failed — is the backend running?" }]);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
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
      {/* Left: branding + feature list */}
      <LeftPanel />

      {/* Divider */}
      <div style={{ width: 1, flexShrink: 0, background: "var(--border)" }} />

      {/* Right: chat interface */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
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
          {uploadedFile && (
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
              {uploadedFile}
            </span>
          )}
        </div>

        {/* Upload zone */}
        <UploadZone
          uploading={uploading}
          uploadedFile={uploadedFile}
          onFileChange={handleUpload}
        />

        {/* Messages */}
        <ChatMessages messages={messages} loading={loading} />

        {/* Input */}
        <ChatInput
          value={question}
          disabled={!uploadedFile}
          onChange={setQuestion}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
