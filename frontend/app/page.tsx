"use client";
import { useState } from "react";
import LeftPanel from "./components/LeftPanel";
import UploadZone from "./components/UploadZone";
import ChatMessages, { type Message } from "./components/ChatMessages";
import ChatInput from "./components/ChatInput";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState("");
  const [fileUri, setFileUri] = useState("");
  const [loading, setLoading] = useState(false);

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
      setMessages([{ role: "system", text: data.message }]);
    } catch (err) {
      setMessages([{ role: "system", text: `Upload failed: ${err instanceof Error ? err.message : "unknown error"}` }]);
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if (!question.trim() || !fileUri) return;
    const q = question;
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setQuestion("");
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, fileUri }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", text: data.answer ?? data.error }]);
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
      <LeftPanel />
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
